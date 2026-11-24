export type MonthlyPlanItemType = 'income' | 'fixed_expense';

export type MonthlyPlanItem = {
  id: string;
  userId: string;
  month: number;
  year: number;
  title: string;
  type: MonthlyPlanItemType;
  amount: number;
  category: string;
  dueDate: string | null;
  paid: boolean;
  paidAt: string | null;
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
  category: string;
  dueDate?: string | null;
  paid?: boolean;
  paidAt?: string | null;
  transactionId?: number | null;
};

export type MonthlyPlanSummary = {
  expectedIncome: number;
  receivedIncome: number;
  pendingIncome: number;
  fixedExpenses: number;
  paidFixedExpenses: number;
  pendingFixedExpenses: number;
  projectedBalance: number;
  confirmedBalance: number;
  committedPercentage: number;
  pendingItems: number;
  completedItems: number;
  overdueItems: number;
};
