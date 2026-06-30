export type MonthlyPlanItemType =
  | 'income'
  | 'fixed_expense';

export type MonthlyPlanItem = {
  id: string;

  userId: string;

  month: number;

  year: number;

  title: string;

  type: MonthlyPlanItemType;

  amount: number;

  dueDate: string | null;

  paid: boolean;

  transactionId: number | null;

  createdAt: string;

  updatedAt: string;
};

export type MonthlyPlanItemInput = {
  month: number;

  year: number;

  title: string;

  type: MonthlyPlanItemType;

  amount: number;

  dueDate?: string | null;

  paid?: boolean;

  transactionId?: number | null;
};

export type MonthlyPlanSummary = {
  expectedIncome: number;

  receivedIncome: number;

  pendingIncome: number;

  fixedExpenses: number;

  paidFixedExpenses: number;

  pendingFixedExpenses: number;

  variableExpenses: number;

  projectedBalance: number;

  committedAmount: number;

  committedPercentage: number;
};

export type MonthlyPlanFilters = {
  month: number;

  year: number;
};
