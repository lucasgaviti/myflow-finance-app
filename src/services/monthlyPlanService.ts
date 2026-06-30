import { supabase } from '../lib/supabase';

import type {
  MonthlyPlanFilters,
  MonthlyPlanItem,
  MonthlyPlanItemInput,
} from '../types/monthlyPlan';

type MonthlyPlanItemRow = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  title: string;
  type: 'income' | 'fixed_expense';
  amount: number | string;
  due_date: string | null;
  paid: boolean;
  transaction_id: number | null;
  created_at: string;
  updated_at: string;
};

function mapMonthlyPlanItem(
  row: MonthlyPlanItemRow,
): MonthlyPlanItem {
  return {
    id: row.id,

    userId: row.user_id,

    month: row.month,

    year: row.year,

    title: row.title,

    type: row.type,

    amount: Number(row.amount),

    dueDate: row.due_date,

    paid: row.paid,

    transactionId: row.transaction_id,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

async function getCurrentUserId() {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(
      'Usuário não autenticado.',
    );
  }

  return data.user.id;
}

export async function listMonthlyPlanItems({
  month,
  year,
}: MonthlyPlanFilters) {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from('monthly_plan_items')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .order('due_date', {
      ascending: true,
      nullsFirst: false,
    })
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapMonthlyPlanItem(
      row as MonthlyPlanItemRow,
    ),
  );
}

export async function createMonthlyPlanItem(
  input: MonthlyPlanItemInput,
) {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from('monthly_plan_items')
    .insert({
      user_id: userId,
      month: input.month,
      year: input.year,
      title: input.title.trim(),
      type: input.type,
      amount: input.amount,
      due_date: input.dueDate ?? null,
      paid: input.paid ?? false,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapMonthlyPlanItem(
    data as MonthlyPlanItemRow,
  );
}

export async function updateMonthlyPlanItem(
  id: string,
  input: Partial<MonthlyPlanItemInput>,
) {
  const payload: Record<string, unknown> = {};

  if (input.month !== undefined) {
    payload.month = input.month;
  }

  if (input.year !== undefined) {
    payload.year = input.year;
  }

  if (input.title !== undefined) {
    payload.title = input.title.trim();
  }

  if (input.type !== undefined) {
    payload.type = input.type;
  }

  if (input.amount !== undefined) {
    payload.amount = input.amount;
  }

  if (input.dueDate !== undefined) {
    payload.due_date = input.dueDate;
  }

  if (input.paid !== undefined) {
    payload.paid = input.paid;
  }

  if (input.transactionId !== undefined) {
    payload.transaction_id = input.transactionId;
  }

  const {
    data,
    error,
  } = await supabase
    .from('monthly_plan_items')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapMonthlyPlanItem(
    data as MonthlyPlanItemRow,
  );
}

export async function toggleMonthlyPlanItemPaid({
  id,
  paid,
  transactionId,
}: {
  id: string;
  paid: boolean;
  transactionId?: number | null;
}) {
  return updateMonthlyPlanItem(id, {
    paid,
    transactionId:
      transactionId ?? null,
  });
}

export async function deleteMonthlyPlanItem(
  id: string,
) {
  const {
    error,
  } = await supabase
    .from('monthly_plan_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}
