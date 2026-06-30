export type GoalPriority =
  | 'high'
  | 'medium'
  | 'low';

export type Goal = {
  id: number;

  title: string;

  targetAmount: number;

  currentAmount: number;

  deadline?: string | null;

  priority: GoalPriority;

  isPrimary: boolean;
};