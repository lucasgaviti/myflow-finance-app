export type RecurringFrequency =
  | 'monthly'
  | 'weekly'
  | 'unknown';

export type RecurringConfidence =
  | 'high'
  | 'medium'
  | 'low';

export type RecurringTransaction = {
  merchant: string;

  category: string;

  type: 'income' | 'expense';

  averageAmount: number;

  totalAmount: number;

  occurrences: number;

  frequency: RecurringFrequency;

  confidence: RecurringConfidence;

  firstDate: string;

  lastDate: string;

  transactionIds: number[];
};