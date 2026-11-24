import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notifyError, notifySuccess } from '../lib/toast';

import type {
  MonthlyPlanItem,
  MonthlyPlanItemInput,
  MonthlyPlanSummary,
} from '../types/monthlyPlan';

type SupabaseMonthlyPlanItem = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  title: string;
  type: MonthlyPlanItem['type'];
  amount: number | string;
  category: string | null;
  due_date: string | null;
  paid: boolean;
  paid_at: string | null;
  transaction_id: number | null;
  created_at: string;
  updated_at: string;
};

const MIN_LOADING_TIME = 300;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function mapFromSupabase(item: SupabaseMonthlyPlanItem): MonthlyPlanItem {
  return {
    id: item.id,
    userId: item.user_id,
    month: item.month,
    year: item.year,
    title: item.title,
    type: item.type,
    amount: Number(item.amount),
    category: item.category ?? 'Outros',
    dueDate: item.due_date,
    paid: item.paid,
    paidAt: item.paid_at,
    transactionId: item.transaction_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapToSupabase(input: MonthlyPlanItemInput, userId: string) {
  return {
    user_id: userId,
    month: input.month,
    year: input.year,
    title: input.title.trim(),
    type: input.type,
    amount: input.amount,
    category: input.category.trim() || 'Outros',
    due_date: input.dueDate || null,
    paid: input.paid ?? false,
    paid_at: input.paidAt ?? null,
    transaction_id: input.transactionId ?? null,
  };
}

function getTodayDateKey() {
  return new Date().toISOString().split('T')[0];
}

function isOverdue(item: MonthlyPlanItem) {
  if (item.paid || !item.dueDate) {
    return false;
  }

  return item.dueDate < getTodayDateKey();
}

function getSummary(items: MonthlyPlanItem[]): MonthlyPlanSummary {
  const expectedIncome = items
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0);

  const receivedIncome = items
    .filter((item) => item.type === 'income' && item.paid)
    .reduce((total, item) => total + item.amount, 0);

  const fixedExpenses = items
    .filter((item) => item.type === 'fixed_expense')
    .reduce((total, item) => total + item.amount, 0);

  const paidFixedExpenses = items
    .filter((item) => item.type === 'fixed_expense' && item.paid)
    .reduce((total, item) => total + item.amount, 0);

  return {
    expectedIncome,
    receivedIncome,
    pendingIncome: expectedIncome - receivedIncome,
    fixedExpenses,
    paidFixedExpenses,
    pendingFixedExpenses: fixedExpenses - paidFixedExpenses,
    projectedBalance: expectedIncome - fixedExpenses,
    confirmedBalance: receivedIncome - paidFixedExpenses,
    committedPercentage:
      expectedIncome > 0 ? (fixedExpenses / expectedIncome) * 100 : 0,
    pendingItems: items.filter((item) => !item.paid).length,
    completedItems: items.filter((item) => item.paid).length,
    overdueItems: items.filter(isOverdue).length,
  };
}

export function useMonthlyPlan(month: number, year: number) {
  const { user } = useAuth();
  const [items, setItems] = useState<MonthlyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => getSummary(items), [items]);

  function handleError(message: string) {
    setError(message);
    notifyError(message);
  }

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadingStart = Date.now();

    const { data, error } = await supabase
      .from('monthly_plan_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .order('type', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    const elapsed = Date.now() - loadingStart;

    if (elapsed < MIN_LOADING_TIME) {
      await wait(MIN_LOADING_TIME - elapsed);
    }

    if (error) {
      handleError(error.message);
      setItems([]);
      setIsLoading(false);
      return;
    }

    setItems(((data ?? []) as SupabaseMonthlyPlanItem[]).map(mapFromSupabase));
    setIsLoading(false);
  }, [month, user, year]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function addItem(input: MonthlyPlanItemInput) {
    if (!user) {
      handleError('Usuário não autenticado.');
      return null;
    }

    const { data, error } = await supabase
      .from('monthly_plan_items')
      .insert(mapToSupabase(input, user.id))
      .select()
      .single();

    if (error) {
      handleError(error.message);
      return null;
    }

    const createdItem = mapFromSupabase(data as SupabaseMonthlyPlanItem);

    setItems((currentItems) => [...currentItems, createdItem]);
    notifySuccess('Item adicionado ao planejamento.');

    return createdItem;
  }

  async function updateItem(id: string, input: Partial<MonthlyPlanItemInput>) {
    if (!user) {
      handleError('Usuário não autenticado.');
      return null;
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.month !== undefined) payload.month = input.month;
    if (input.year !== undefined) payload.year = input.year;
    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.type !== undefined) payload.type = input.type;
    if (input.amount !== undefined) payload.amount = input.amount;
    if (input.category !== undefined) payload.category = input.category.trim() || 'Outros';
    if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
    if (input.paid !== undefined) payload.paid = input.paid;
    if (input.paidAt !== undefined) payload.paid_at = input.paidAt || null;
    if (input.transactionId !== undefined) payload.transaction_id = input.transactionId;

    const { data, error } = await supabase
      .from('monthly_plan_items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      handleError(error.message);
      return null;
    }

    const updatedItem = mapFromSupabase(data as SupabaseMonthlyPlanItem);

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );

    return updatedItem;
  }

  async function removeItem(id: string) {
    if (!user) {
      handleError('Usuário não autenticado.');
      return false;
    }

    const { error } = await supabase
      .from('monthly_plan_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      handleError(error.message);
      return false;
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    notifySuccess('Item removido do planejamento.');

    return true;
  }

  return {
    items,
    summary,
    isLoading,
    error,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
  };
}
