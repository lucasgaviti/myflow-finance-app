import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notifyError, notifySuccess } from '../lib/toast';

import type { Transaction } from '../types/transaction';
import type { NormalizedImportedTransaction } from '../utils/imports/transactionNormalizer';

type SupabaseTransaction = {
  id: number;
  title: string;
  amount: number;
  type: Transaction['type'];
  category: string;
  date: string;
  created_at: string;
  user_id: string;
  source: TransactionSource;
  external_id: string | null;
  import_batch_id: string | null;
};

type TransactionSource = 'manual' | 'csv' | 'pdf' | 'ofx';

export type ImportTransactionsResult = {
  total: number;
  imported: number;
  duplicated: number;
};

const MIN_LOADING_TIME = 350;

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getDateOnly(date: string) {
  return date.split('T')[0];
}

function normalizeTransactionDate(date: string) {
  return new Date(`${getDateOnly(date)}T12:00:00`).toISOString();
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((first, second) => {
    const dateDiff = new Date(second.date).getTime() - new Date(first.date).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return second.id - first.id;
  });
}

function mapFromSupabase(transaction: SupabaseTransaction): Transaction {
  return {
    id: transaction.id,
    title: transaction.title,
    value: Number(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: normalizeTransactionDate(transaction.date),
  };
}

function mapToSupabase(transaction: Transaction, userId: string) {
  return {
    title: transaction.title,
    amount: transaction.value,
    type: transaction.type,
    category: transaction.category,
    date: getDateOnly(transaction.date),
    user_id: userId,
    source: 'manual' satisfies TransactionSource,
    external_id: null,
    import_batch_id: null,
  };
}

function mapImportedTransactionToSupabase({
  transaction,
  userId,
  importBatchId,
  source,
}: {
  transaction: NormalizedImportedTransaction;
  userId: string;
  importBatchId: string;
  source: Exclude<TransactionSource, 'manual'>;
}) {
  return {
    title: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    user_id: userId,
    source,
    external_id: transaction.externalId,
    import_batch_id: importBatchId,
  };
}

function getImportedTransactionKey(transaction: NormalizedImportedTransaction) {
  return (
    transaction.externalId ||
    `${transaction.date}-${transaction.amount}-${transaction.type}-${transaction.description}`
  );
}

function getUniqueImportedTransactions(transactions: NormalizedImportedTransaction[]) {
  const transactionMap = new Map<string, NormalizedImportedTransaction>();

  transactions.forEach((transaction) => {
    transactionMap.set(getImportedTransactionKey(transaction), transaction);
  });

  return Array.from(transactionMap.values());
}

function getTotalByType(transactions: Transaction[], type: Transaction['type']) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.value, 0);
}

export function useTransactions() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((message: string) => {
    setError(message);
    notifyError(message);
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadingStart = Date.now();

    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('id', { ascending: false });

    const elapsed = Date.now() - loadingStart;

    if (elapsed < MIN_LOADING_TIME) {
      await wait(MIN_LOADING_TIME - elapsed);
    }

    if (fetchError) {
      handleError(fetchError.message);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const mappedTransactions = (data ?? []).map((transaction) =>
      mapFromSupabase(transaction as SupabaseTransaction),
    );

    setTransactions(sortTransactions(mappedTransactions));
    setIsLoading(false);
  }, [userId, handleError]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(
    async (transaction: Transaction): Promise<Transaction | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert(mapToSupabase(transaction, userId))
        .select()
        .single();

      if (insertError) {
        handleError(insertError.message);
        return null;
      }

      const createdTransaction = mapFromSupabase(data as SupabaseTransaction);

      setTransactions((currentTransactions) =>
        sortTransactions([createdTransaction, ...currentTransactions]),
      );

      notifySuccess('Transação adicionada com sucesso!');

      return createdTransaction;
    },
    [userId, handleError],
  );

  const importTransactions = useCallback(
    async ({
      parsedTransactions,
      importBatchId,
      source,
    }: {
      parsedTransactions: NormalizedImportedTransaction[];
      importBatchId: string;
      source: Exclude<TransactionSource, 'manual'>;
    }): Promise<ImportTransactionsResult | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      if (parsedTransactions.length === 0) {
        return {
          total: 0,
          imported: 0,
          duplicated: 0,
        };
      }

      const uniqueParsedTransactions = getUniqueImportedTransactions(parsedTransactions);

      const internalDuplicatedCount =
        parsedTransactions.length - uniqueParsedTransactions.length;

      const externalIds = uniqueParsedTransactions
        .map((transaction) => transaction.externalId)
        .filter((externalId): externalId is string => Boolean(externalId));

      let existingExternalIds = new Set<string>();

      if (externalIds.length > 0) {
        const { data: existingTransactions, error: existingError } = await supabase
          .from('transactions')
          .select('external_id')
          .eq('user_id', userId)
          .eq('source', source)
          .in('external_id', externalIds);

        if (existingError) {
          handleError(existingError.message);
          return null;
        }

        existingExternalIds = new Set(
          (existingTransactions ?? [])
            .map((item) => item.external_id)
            .filter((externalId): externalId is string => Boolean(externalId)),
        );
      }

      const transactionsToImport = uniqueParsedTransactions.filter(
        (transaction) =>
          !transaction.externalId || !existingExternalIds.has(transaction.externalId),
      );

      const duplicated =
        internalDuplicatedCount + uniqueParsedTransactions.length - transactionsToImport.length;

      if (transactionsToImport.length === 0) {
        notifyError('Todas as transações desse arquivo já foram importadas.');

        return {
          total: parsedTransactions.length,
          imported: 0,
          duplicated: parsedTransactions.length,
        };
      }

      const payload = transactionsToImport.map((transaction) =>
        mapImportedTransactionToSupabase({
          transaction,
          userId,
          importBatchId,
          source,
        }),
      );

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert(payload)
        .select();

      if (insertError) {
        handleError(insertError.message);
        return null;
      }

      const importedTransactions = (data ?? []).map((transaction) =>
        mapFromSupabase(transaction as SupabaseTransaction),
      );

      setTransactions((currentTransactions) =>
        sortTransactions([...importedTransactions, ...currentTransactions]),
      );

      const result: ImportTransactionsResult = {
        total: parsedTransactions.length,
        imported: transactionsToImport.length,
        duplicated,
      };

      notifySuccess(`${result.imported} transações importadas com sucesso!`);

      return result;
    },
    [userId, handleError],
  );

  const removeTransaction = useCallback(
    async (id: number) => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return;
      }

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        handleError(deleteError.message);
        return;
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter((transaction) => transaction.id !== id),
      );

      notifySuccess('Transação removida.');
    },
    [userId, handleError],
  );

  const removeTransactions = useCallback(
    async (ids: number[]) => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return;
      }

      if (ids.length === 0) {
        return;
      }

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .in('id', ids);

      if (deleteError) {
        handleError(deleteError.message);
        return;
      }

      const idsToRemove = new Set(ids);

      setTransactions((currentTransactions) =>
        currentTransactions.filter((transaction) => !idsToRemove.has(transaction.id)),
      );

      notifySuccess(`${ids.length} transação(ões) removida(s).`);
    },
    [userId, handleError],
  );

  const updateTransaction = useCallback(
    async (updatedTransaction: Transaction): Promise<Transaction | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      const { data, error: updateError } = await supabase
        .from('transactions')
        .update(mapToSupabase(updatedTransaction, userId))
        .eq('id', updatedTransaction.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        handleError(updateError.message);
        return null;
      }

      const mappedTransaction = mapFromSupabase(data as SupabaseTransaction);

      setTransactions((currentTransactions) =>
        sortTransactions(
          currentTransactions.map((transaction) =>
            transaction.id === updatedTransaction.id ? mappedTransaction : transaction,
          ),
        ),
      );

      notifySuccess('Transação atualizada.');

      return mappedTransaction;
    },
    [userId, handleError],
  );

  const totalIncome = useMemo(
    () => getTotalByType(transactions, 'income'),
    [transactions],
  );

  const totalExpense = useMemo(
    () => getTotalByType(transactions, 'expense'),
    [transactions],
  );

  const balance = totalIncome - totalExpense;

  return {
    transactions,
    totalIncome,
    totalExpense,
    balance,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    importTransactions,
    removeTransaction,
    removeTransactions,
    updateTransaction,
  };
}