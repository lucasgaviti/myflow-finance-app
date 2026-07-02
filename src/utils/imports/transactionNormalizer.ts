import type { TransactionType } from '../../types/transaction';

export type NormalizedImportedTransaction = {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  externalId?: string | null;
};
