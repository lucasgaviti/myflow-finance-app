import type { Transaction }
  from '../types/transaction';

interface MonthlyData {
  month: string;

  income: number;

  expense: number;
}

const months = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function groupTransactionsByMonth(
  transactions: Transaction[],
): MonthlyData[] {
  const grouped =
    months.map((month) => ({
      month,
      income: 0,
      expense: 0,
    }));

  transactions.forEach(
    (transaction) => {
      const currentMonth =
        new Date()
          .getMonth();

      if (
        transaction.type ===
        'income'
      ) {
        grouped[
          currentMonth
        ].income +=
          transaction.value;
      } else {
        grouped[
          currentMonth
        ].expense +=
          transaction.value;
      }
    },
  );

  return grouped;
}