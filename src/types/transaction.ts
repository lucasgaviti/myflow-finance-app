export type TransactionType =
  | 'income'
  | 'expense';

export interface Transaction {
  id: number;

  title: string;

  value: number;

  type: TransactionType;

  category: string;

  date: string;
}
