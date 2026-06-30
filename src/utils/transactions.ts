import type {
  Transaction,
} from '../types/transaction';

interface FilterParams {
  transactions: Transaction[];

  search: string;

  filterType: string;
}

export function filterTransactions({
  transactions,
  search,
  filterType,
}: FilterParams) {
  return transactions.filter(
    (item) => {
      const matchesSearch =
        item.title
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          ) ||
        item.category
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          );

      const matchesType =
        filterType === 'all'
          ? true
          : item.type ===
            filterType;

      return (
        matchesSearch &&
        matchesType
      );
    },
  );
}

export function getMonthlyData(
  transactions: Transaction[],
) {
  const monthlyMap = new Map<
    string,
    {
      income: number;
      expense: number;
    }
  >();

  transactions.forEach(
    (transaction) => {
      const date =
        new Date(
          transaction.date,
        );

      const monthKey =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, '0')}`;

      const current =
        monthlyMap.get(
          monthKey,
        ) || {
          income: 0,
          expense: 0,
        };

      if (
        transaction.type ===
        'income'
      ) {
        current.income +=
          transaction.value;
      } else {
        current.expense +=
          transaction.value;
      }

      monthlyMap.set(
        monthKey,
        current,
      );
    },
  );

  return Array.from(
    monthlyMap.entries(),
  )
    .sort(
      ([a], [b]) =>
        a.localeCompare(b),
    )
    .map(
      ([
        monthKey,
        values,
      ]) => {
        const [
          year,
          month,
        ] = monthKey
          .split('-')
          .map(Number);

        const date =
          new Date(
            year,
            month - 1,
          );

        return {
          month:
            date
              .toLocaleDateString(
                'pt-BR',
                {
                  month: 'short',
                },
              )
              .replace('.', '')
              .replace(
                /^./,
                (char) =>
                  char.toUpperCase(),
              ),

          income:
            values.income,

          expense:
            values.expense,
        };
      },
    );
}