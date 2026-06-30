export type TransactionImportSource =
  | 'csv'
  | 'ofx'
  | 'pdf';

export type TransactionImportStatus =
  | 'completed'
  | 'failed'
  | 'processing';

export type TransactionImport = {
  id: string;

  user_id: string;

  file_name: string;

  source: TransactionImportSource;

  total_transactions: number;

  imported_transactions: number;

  status: TransactionImportStatus;

  created_at: string;
};

export type CreateTransactionImportData = {
  file_name: string;

  source: TransactionImportSource;

  total_transactions: number;

  imported_transactions: number;

  status: TransactionImportStatus;
};