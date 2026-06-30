import {
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

import {
  notifySuccess,
  notifyError,
} from '../lib/toast';

import {
  useAuth,
} from '../contexts/AuthContext';

import type {
  Transaction,
} from '../types/transaction';

import type {
  NormalizedImportedTransaction,
} from '../utils/imports/transactionNormalizer';

type SupabaseTransaction = {
  id: number;
  title: string;
  amount: number;
  type: Transaction['type'];
  category: string;
  date: string;
  created_at: string;
  user_id: string;
  source: string;
  external_id: string | null;
  import_batch_id: string | null;
};

export type ImportTransactionsResult = {
  total: number;

  imported: number;

  duplicated: number;
};

const MIN_LOADING_TIME = 350;

function wait(
  milliseconds: number,
) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}

function mapFromSupabase(
  transaction: SupabaseTransaction,
): Transaction {
  return {
    id: transaction.id,

    title: transaction.title,

    value: Number(transaction.amount),

    type: transaction.type,

    category: transaction.category,

    date: new Date(
      `${transaction.date}T12:00:00`,
    ).toISOString(),
  };
}

function mapToSupabase(
  transaction: Transaction,
  userId: string,
) {
  return {
    title: transaction.title,

    amount: transaction.value,

    type: transaction.type,

    category: transaction.category,

    date: transaction.date.split('T')[0],

    user_id: userId,

    source: 'manual',

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
  source: 'csv' | 'pdf' | 'ofx';
}) {
  return {
    title: transaction.description,

    amount: transaction.amount,

    type: transaction.type,

    category: transaction.category,

    date: transaction.date,

    user_id: userId,

    source,

    external_id:
      transaction.externalId,

    import_batch_id:
      importBatchId,
  };
}

function getUniqueImportedTransactions(
  transactions: NormalizedImportedTransaction[],
) {
  return Array.from(
    new Map(
      transactions.map((transaction) => [
        transaction.externalId,
        transaction,
      ]),
    ).values(),
  );
}

export function useTransactions() {
  const { user } = useAuth();

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  function handleError(
    message: string,
  ) {
    setError(message);

    notifyError(message);
  }

  async function fetchTransactions() {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadingStart =
      Date.now();

    const { data, error } =
      await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', {
          ascending: false,
        })
        .order('id', {
          ascending: false,
        });

    const elapsed =
      Date.now() - loadingStart;

    if (elapsed < MIN_LOADING_TIME) {
      await wait(
        MIN_LOADING_TIME - elapsed,
      );
    }

    if (error) {
      handleError(error.message);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setTransactions(
      (data ?? []).map(
        mapFromSupabase,
      ),
    );

    setIsLoading(false);
  }

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  async function addTransaction(
    transaction: Transaction,
  ): Promise<Transaction | null> {
    if (!user) {
      handleError(
        'Usuário não autenticado.',
      );
      return null;
    }

    const { data, error } =
      await supabase
        .from('transactions')
        .insert(
          mapToSupabase(
            transaction,
            user.id,
          ),
        )
        .select()
        .single();

    if (error) {
      handleError(error.message);
      return null;
    }

    const createdTransaction =
      mapFromSupabase(data);

    setTransactions(
      (prev) => [
        createdTransaction,
        ...prev,
      ],
    );

    notifySuccess(
      'Transação adicionada com sucesso!',
    );

    return createdTransaction;
  }

  async function importTransactions({
    parsedTransactions,
    importBatchId,
    source,
  }: {
    parsedTransactions: NormalizedImportedTransaction[];
    importBatchId: string;
    source: 'csv' | 'pdf' | 'ofx';
  }): Promise<ImportTransactionsResult | null> {
    if (!user) {
      handleError(
        'Usuário não autenticado.',
      );
      return null;
    }

    if (parsedTransactions.length === 0) {
      return {
        total: 0,
        imported: 0,
        duplicated: 0,
      };
    }

    const uniqueParsedTransactions =
      getUniqueImportedTransactions(
        parsedTransactions,
      );

    const internalDuplicatedCount =
      parsedTransactions.length -
      uniqueParsedTransactions.length;

    const externalIds =
      uniqueParsedTransactions.map(
        (transaction) =>
          transaction.externalId,
      );

    const {
      data: existingTransactions,
      error: existingError,
    } = await supabase
      .from('transactions')
      .select('external_id')
      .eq('user_id', user.id)
      .eq('source', source)
      .in('external_id', externalIds);

    if (existingError) {
      handleError(
        existingError.message,
      );

      return null;
    }

    const existingExternalIds =
      new Set(
        (existingTransactions ?? [])
          .map((item) => item.external_id)
          .filter(Boolean),
      );

    const transactionsToImport =
      uniqueParsedTransactions.filter(
        (transaction) =>
          !existingExternalIds.has(
            transaction.externalId,
          ),
      );

    if (transactionsToImport.length === 0) {
      notifyError(
        'Todas as transações desse arquivo já foram importadas.',
      );

      return {
        total:
          parsedTransactions.length,

        imported: 0,

        duplicated:
          parsedTransactions.length,
      };
    }

    const payload =
      transactionsToImport.map(
        (transaction) =>
          mapImportedTransactionToSupabase({
            transaction,

            userId: user.id,

            importBatchId,

            source,
          }),
      );

    const { data, error } =
      await supabase
        .from('transactions')
        .insert(payload)
        .select();

    if (error) {
      handleError(error.message);
      return null;
    }

    setTransactions((prev) => [
      ...(data ?? []).map(
        mapFromSupabase,
      ),
      ...prev,
    ]);

    const duplicated =
      internalDuplicatedCount +
      uniqueParsedTransactions.length -
      transactionsToImport.length;

    const result = {
      total:
        parsedTransactions.length,

      imported:
        transactionsToImport.length,

      duplicated,
    };

    notifySuccess(
      `${result.imported} transações importadas com sucesso!`,
    );

    return result;
  }

  async function removeTransaction(
    id: number,
  ) {
    if (!user) {
      handleError(
        'Usuário não autenticado.',
      );
      return;
    }

    const { error } =
      await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
      handleError(error.message);
      return;
    }

    setTransactions(
      (prev) =>
        prev.filter(
          (item) =>
            item.id !== id,
        ),
    );

    notifySuccess(
      'Transação removida.',
    );
  }

  async function removeTransactions(
    ids: number[],
  ) {
    if (!user) {
      handleError(
        'Usuário não autenticado.',
      );
      return;
    }

    if (ids.length === 0) {
      return;
    }

    const { error } =
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .in('id', ids);

    if (error) {
      handleError(error.message);
      return;
    }

    const idsSet =
      new Set(ids);

    setTransactions(
      (prev) =>
        prev.filter(
          (item) =>
            !idsSet.has(item.id),
        ),
    );

    notifySuccess(
      `${ids.length} transação(ões) removida(s).`,
    );
  }

  async function updateTransaction(
    updatedTransaction: Transaction,
  ) {
    if (!user) {
      handleError(
        'Usuário não autenticado.',
      );
      return;
    }

    const { data, error } =
      await supabase
        .from('transactions')
        .update(
          mapToSupabase(
            updatedTransaction,
            user.id,
          ),
        )
        .eq(
          'id',
          updatedTransaction.id,
        )
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
      handleError(error.message);
      return;
    }

    setTransactions(
      (prev) =>
        prev.map((item) =>
          item.id ===
          updatedTransaction.id
            ? mapFromSupabase(data)
            : item,
        ),
    );

    notifySuccess(
      'Transação atualizada.',
    );
  }

  const totalIncome =
    transactions
      .filter(
        (item) =>
          item.type ===
          'income',
      )
      .reduce(
        (acc, item) =>
          acc + item.value,
        0,
      );

  const totalExpense =
    transactions
      .filter(
        (item) =>
          item.type ===
          'expense',
      )
      .reduce(
        (acc, item) =>
          acc + item.value,
        0,
      );

  const balance =
    totalIncome -
    totalExpense;

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