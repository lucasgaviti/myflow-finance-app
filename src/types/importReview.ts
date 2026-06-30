export type ImportReviewConfidence =
  | 'high'
  | 'medium'
  | 'low';

export type ImportReviewItem = {
  externalId: string;

  date: string;

  description: string;

  amount: number;

  type: 'income' | 'expense';

  suggestedCategory: string;

  selectedCategory: string;

  confidence: ImportReviewConfidence;

  matchedKeyword?: string;

  ignored?: boolean;

  shouldCreateRule?: boolean;

  ruleKeyword?: string;
};

export type ImportReviewSummary = {
  totalTransactions: number;

  incomeTransactions: number;

  expenseTransactions: number;

  highConfidenceCount: number;

  mediumConfidenceCount: number;

  lowConfidenceCount: number;

  autoRuleCount: number;
};

export function createImportReviewSummary(
  items: ImportReviewItem[],
): ImportReviewSummary {
  return {
    totalTransactions:
      items.length,

    incomeTransactions:
      items.filter(
        (item) =>
          item.type === 'income',
      ).length,

    expenseTransactions:
      items.filter(
        (item) =>
          item.type === 'expense',
      ).length,

    highConfidenceCount:
      items.filter(
        (item) =>
          item.confidence === 'high',
      ).length,

    mediumConfidenceCount:
      items.filter(
        (item) =>
          item.confidence === 'medium',
      ).length,

    lowConfidenceCount:
      items.filter(
        (item) =>
          item.confidence === 'low',
      ).length,

    autoRuleCount:
      items.filter(
        (item) =>
          item.shouldCreateRule,
      ).length,
  };
}