import type {
    Transaction,
  } from '../../types/transaction';
  
  import type {
    RecurringTransaction,
    RecurringConfidence,
    RecurringFrequency,
  } from '../../types/recurringTransaction';
  
  const EXCLUDED_CATEGORIES = [
    'Mercado',
    'Alimentação',
    'Compras',
    'Investimentos',
    'Receitas',
    'Cartão',
  ];
  
  const EXCLUDED_KEYWORDS = [
    'pix',
    'transferencia',
    'transferência',
    'ted',
    'doc',
    'poupanca',
    'poupança',
    'aplicacao',
    'aplicação',
    'resgate',
  ];
  
  function normalizeMerchant(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function shouldIgnoreTransaction(
    transaction: Transaction,
  ) {
    const normalizedTitle =
      normalizeMerchant(transaction.title);
  
    const normalizedCategory =
      normalizeMerchant(transaction.category);
  
    const ignoredByCategory =
      EXCLUDED_CATEGORIES.some(
        (category) =>
          normalizeMerchant(category) ===
          normalizedCategory,
      );
  
    const ignoredByKeyword =
      EXCLUDED_KEYWORDS.some((keyword) =>
        normalizedTitle.includes(
          normalizeMerchant(keyword),
        ),
      );
  
    return (
      ignoredByCategory ||
      ignoredByKeyword
    );
  }
  
  function getMonthKey(date: string) {
    const parsedDate =
      new Date(date);
  
    return `${parsedDate.getFullYear()}-${String(
      parsedDate.getMonth() + 1,
    ).padStart(2, '0')}`;
  }
  
  function getDaysBetween(
    firstDate: string,
    lastDate: string,
  ) {
    const first =
      new Date(firstDate).getTime();
  
    const last =
      new Date(lastDate).getTime();
  
    return Math.abs(
      Math.round(
        (last - first) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }
  
  function getAverageAmount(
    transactions: Transaction[],
  ) {
    if (transactions.length === 0) {
      return 0;
    }
  
    return (
      transactions.reduce(
        (acc, transaction) =>
          acc + transaction.value,
        0,
      ) / transactions.length
    );
  }
  
  function getAmountVariationRatio(
    transactions: Transaction[],
  ) {
    if (transactions.length <= 1) {
      return 0;
    }
  
    const average =
      getAverageAmount(transactions);
  
    if (average === 0) {
      return 0;
    }
  
    const max =
      Math.max(
        ...transactions.map(
          (transaction) =>
            transaction.value,
        ),
      );
  
    const min =
      Math.min(
        ...transactions.map(
          (transaction) =>
            transaction.value,
        ),
      );
  
    return (max - min) / average;
  }
  
  function detectFrequency({
    transactions,
    monthsCount,
  }: {
    transactions: Transaction[];
    monthsCount: number;
  }): RecurringFrequency {
    const daysBetween =
      getDaysBetween(
        transactions[0].date,
        transactions[
          transactions.length - 1
        ].date,
      );
  
    if (
      transactions.length >= 2 &&
      monthsCount >= 2 &&
      daysBetween >= 25
    ) {
      return 'monthly';
    }
  
    if (
      transactions.length >= 3 &&
      daysBetween <= 45
    ) {
      return 'weekly';
    }
  
    return 'unknown';
  }
  
  function detectConfidence({
    transactions,
    monthsCount,
    variationRatio,
  }: {
    transactions: Transaction[];
    monthsCount: number;
    variationRatio: number;
  }): RecurringConfidence {
    if (
      transactions.length >= 6 &&
      variationRatio <= 0.5
    ) {
      return 'high';
    }
  
    if (
      transactions.length >= 3 &&
      monthsCount >= 2 &&
      variationRatio <= 0.6
    ) {
      return 'high';
    }
  
    if (
      transactions.length >= 3 &&
      variationRatio <= 0.9
    ) {
      return 'medium';
    }
  
    if (
      transactions.length >= 2 &&
      monthsCount >= 2 &&
      variationRatio <= 0.75
    ) {
      return 'medium';
    }
  
    return 'low';
  }
  
  function shouldIncludeGroup({
    transactions,
    monthsCount,
    confidence,
  }: {
    transactions: Transaction[];
    monthsCount: number;
    confidence: RecurringConfidence;
  }) {
    if (
      transactions.length >= 2 &&
      monthsCount >= 2 &&
      confidence !== 'low'
    ) {
      return true;
    }
  
    if (
      transactions.length >= 4 &&
      monthsCount === 1 &&
      confidence !== 'low'
    ) {
      return true;
    }
  
    return false;
  }
  
  export function detectRecurringTransactions(
    transactions: Transaction[],
  ): RecurringTransaction[] {
    const expenseTransactions =
      transactions
        .filter(
          (transaction) =>
            transaction.type === 'expense',
        )
        .filter(
          (transaction) =>
            !shouldIgnoreTransaction(
              transaction,
            ),
        )
        .sort(
          (a, b) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime(),
        );
  
    const groups = new Map<
      string,
      Transaction[]
    >();
  
    expenseTransactions.forEach(
      (transaction) => {
        const key =
          normalizeMerchant(
            transaction.title,
          );
  
        if (!key) {
          return;
        }
  
        const current =
          groups.get(key) ?? [];
  
        current.push(transaction);
  
        groups.set(key, current);
      },
    );
  
    const recurring =
      Array.from(groups.entries())
        .map(([merchantKey, group]) => {
          const uniqueMonths =
            new Set(
              group.map((transaction) =>
                getMonthKey(
                  transaction.date,
                ),
              ),
            );
  
          const monthsCount =
            uniqueMonths.size;
  
          const variationRatio =
            getAmountVariationRatio(
              group,
            );
  
          const frequency =
            detectFrequency({
              transactions:
                group,
  
              monthsCount,
            });
  
          const confidence =
            detectConfidence({
              transactions:
                group,
  
              monthsCount,
  
              variationRatio,
            });
  
          const averageAmount =
            getAverageAmount(group);
  
          return {
            merchant:
              group[0].title,
  
            category:
              group[0].category,
  
            type:
              'expense' as const,
  
            averageAmount,
  
            totalAmount:
              group.reduce(
                (acc, transaction) =>
                  acc + transaction.value,
                0,
              ),
  
            occurrences:
              group.length,
  
            frequency,
  
            confidence,
  
            firstDate:
              group[0].date,
  
            lastDate:
              group[
                group.length - 1
              ].date,
  
            transactionIds:
              group.map(
                (transaction) =>
                  transaction.id,
              ),
  
            _score:
              confidence === 'high'
                ? 3
                : confidence === 'medium'
                  ? 2
                  : 1,
  
            _monthsCount:
              monthsCount,
  
            _merchantKey:
              merchantKey,
          };
        })
        .filter((item) =>
          shouldIncludeGroup({
            transactions:
              groups.get(item._merchantKey) ??
              [],
  
            monthsCount:
              item._monthsCount,
  
            confidence:
              item.confidence,
          }),
        )
        .sort(
          (a, b) =>
            b._score - a._score ||
            b.occurrences -
              a.occurrences ||
            b.averageAmount -
              a.averageAmount,
        )
        .map(
          ({
            _score,
            _monthsCount,
            _merchantKey,
            ...item
          }) => item,
        );
  
    return recurring;
  }