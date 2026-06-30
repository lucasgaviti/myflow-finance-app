import Card from '../components/Card';
import KPICard from '../components/KPICard';
import FinanceChart from '../components/FinanceChart';
import CategoryChart from '../components/CategoryChart';

import { useTransactions } from '../hook/useTransactions';

import { formatMoney } from '../utils/format';
import { exportToCSV } from '../utils/export';

export default function Reports() {
  const {
    transactions,
    totalIncome,
    totalExpense,
    balance,
  } = useTransactions();

  const monthlyMap = new Map<
    string,
    {
      income: number;
      expense: number;
    }
  >();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;

    const current =
      monthlyMap.get(monthKey) || {
        income: 0,
        expense: 0,
      };

    if (transaction.type === 'income') {
      current.income += transaction.value;
    } else {
      current.expense += transaction.value;
    }

    monthlyMap.set(monthKey, current);
  });

  const monthlyData = Array.from(
    monthlyMap.entries(),
  )
    .sort(([a], [b]) =>
      a.localeCompare(b),
    )
    .map(([monthKey, values]) => {
      const [year, month] =
        monthKey
          .split('-')
          .map(Number);

      const date = new Date(
        year,
        month - 1,
      );

      return {
        month: date
          .toLocaleDateString('pt-BR', {
            month: 'short',
          })
          .replace('.', '')
          .replace(/^./, (char) =>
            char.toUpperCase(),
          ),

        income: values.income,

        expense: values.expense,
      };
    });

  const expenseTransactions =
    transactions.filter(
      (transaction) =>
        transaction.type === 'expense',
    );

  const biggestExpense =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce(
          (biggest, current) =>
            current.value > biggest.value
              ? current
              : biggest,
        )
      : null;

  const categoryMap = new Map<
    string,
    number
  >();

  expenseTransactions.forEach(
    (transaction) => {
      const current =
        categoryMap.get(
          transaction.category,
        ) || 0;

      categoryMap.set(
        transaction.category,
        current + transaction.value,
      );
    },
  );

  const categoryData =
    Array.from(
      categoryMap.entries(),
    )
      .map(([category, value]) => ({
        category,
        value,
        percentage:
          totalExpense > 0
            ? (value / totalExpense) *
              100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.value - a.value,
      );

  const biggestCategory =
    categoryData.length > 0
      ? categoryData[0]
      : null;

  const averageTransaction =
    transactions.length > 0
      ? (totalIncome +
          totalExpense) /
        transactions.length
      : 0;

  const averageExpense =
    expenseTransactions.length > 0
      ? totalExpense /
        expenseTransactions.length
      : 0;

  const expenseRatio =
    totalIncome > 0
      ? (totalExpense /
          totalIncome) *
        100
      : 0;

  const savingsRate =
    totalIncome > 0
      ? (balance / totalIncome) *
        100
      : 0;

  let financialScore = 100;

  financialScore -=
    expenseRatio * 0.6;

  if (balance < 0) {
    financialScore -= 25;
  }

  financialScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(financialScore),
    ),
  );

  let financialLevel =
    'Saudável';

  let financialSeverity:
    | 'positive'
    | 'warning'
    | 'negative' =
    'positive';

  if (financialScore < 70) {
    financialLevel = 'Atenção';
    financialSeverity = 'warning';
  }

  if (financialScore < 45) {
    financialLevel = 'Crítico';
    financialSeverity = 'negative';
  }

  const financialStatus =
    balance >= 0
      ? 'Saldo positivo'
      : 'Saldo negativo';

  const financialMessage =
    balance >= 0
      ? `Suas receitas superaram as despesas e ${savingsRate.toFixed(
          1,
        )}% da receita permaneceu como saldo.`
      : `As despesas ultrapassaram as receitas em ${formatMoney(
          Math.abs(balance),
        )}, exigindo atenção ao controle de gastos.`;

  function handleExportCSV() {
    const rows = [
      {
        Indicador: 'Receitas',
        Valor: totalIncome,
      },
      {
        Indicador: 'Despesas',
        Valor: totalExpense,
      },
      {
        Indicador: 'Saldo',
        Valor: balance,
      },
      {
        Indicador: 'Transações',
        Valor: transactions.length,
      },
      {
        Indicador:
          'Saúde financeira',
        Valor: `${financialScore}/100`,
      },
      {
        Indicador:
          'Taxa de economia',
        Valor: `${savingsRate.toFixed(
          1,
        )}%`,
      },
      {
        Indicador:
          'Ticket médio',
        Valor: averageTransaction,
      },
      {
        Indicador:
          'Média de despesa',
        Valor: averageExpense,
      },
      {
        Indicador:
          'Comprometimento da receita',
        Valor: `${expenseRatio.toFixed(
          1,
        )}%`,
      },
      {
        Indicador:
          'Maior despesa',
        Valor: biggestExpense
          ? biggestExpense.value
          : 0,
      },
      {
        Indicador:
          'Categoria dominante',
        Valor: biggestCategory
          ? biggestCategory.category
          : 'Nenhuma',
      },
    ];

    exportToCSV(
      'relatorios',
      rows,
    );
  }

  const kpis = [
    {
      label: 'Receitas',
      value: formatMoney(
        totalIncome,
      ),
    },
    {
      label: 'Despesas',
      value: formatMoney(
        totalExpense,
      ),
    },
    {
      label: 'Saldo',
      value: formatMoney(
        balance,
      ),
    },
    {
      label: 'Transações',
      value: String(
        transactions.length,
      ),
    },
  ];

  const insights = [
    {
      label: 'Saúde financeira',
      value: `${financialScore}/100`,
      description:
        savingsRate >= 0
          ? `${savingsRate.toFixed(
              1,
            )}% da receita permaneceu em saldo.`
          : 'As despesas consumiram toda a receita do período.',
      severity:
        financialSeverity,
    },
    {
      label:
        'Maior despesa registrada',
      value: biggestExpense
        ? formatMoney(
            biggestExpense.value,
          )
        : formatMoney(0),
      description: biggestExpense
        ? biggestExpense.title
        : 'Nenhuma despesa registrada.',
      severity: 'negative',
    },
    {
      label:
        'Categoria dominante',
      value: biggestCategory
        ? biggestCategory.category
        : 'Nenhuma',
      description: biggestCategory
        ? `${biggestCategory.percentage.toFixed(
            1,
          )}% dos gastos totais estão concentrados nesta categoria.`
        : 'Sem dados suficientes.',
      severity:
        biggestCategory &&
        biggestCategory.percentage >
          50
          ? 'warning'
          : 'neutral',
    },
    {
      label:
        'Média de despesa',
      value: formatMoney(
        averageExpense,
      ),
      description:
        'Média por transação de saída registrada no período.',
      severity: 'neutral',
    },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Relatórios
        </h1>

        <p className="dashboard-subtitle">
          Análise executiva das suas movimentações, categorias e comportamento financeiro.
        </p>
      </div>

      <div
        className={`reports-hero ${financialSeverity}`}
      >
        <div>
          <span
            className={`reports-hero-badge ${financialSeverity}`}
          >
            {financialLevel}
          </span>

          <h2>{financialStatus}</h2>

          <p>{financialMessage}</p>
        </div>

        <div className="reports-hero-value">
          {formatMoney(balance)}
        </div>
      </div>

      <div className="filters-wrapper">
        <button
          className="secondary-btn"
          onClick={handleExportCSV}
        >
          Exportar CSV
        </button>
      </div>

      <div className="kpi-grid">
        {kpis.map((item) => (
          <KPICard
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>

      <div className="reports-insights-grid">
        {insights.map((item) => (
          <div
            key={item.label}
            className={`reports-insight-card ${item.severity}`}
          >
            <span>{item.label}</span>

            <strong>{item.value}</strong>

            <p>{item.description}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card
          title="Evolução Financeira"
          subtitle="Comparativo mensal entre receitas e despesas."
        >
          <FinanceChart
            monthlyData={
              monthlyData
            }
          />
        </Card>

        <Card
          title="Distribuição por Categoria"
          subtitle="Participação das categorias no total de despesas."
        >
          <CategoryChart
            data={categoryData}
          />
        </Card>

        <Card
          title="Leitura Executiva"
          subtitle="Resumo dos principais sinais financeiros."
        >
          <div className="summary-list">
            <div className="summary-item">
              <span className="summary-label">
                Score financeiro
              </span>

              <span
                className={`summary-value ${financialSeverity}`}
              >
                {financialScore}/100
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Comprometimento da receita
              </span>

              <span
                className={`summary-value ${
                  expenseRatio > 80
                    ? 'negative'
                    : expenseRatio > 60
                      ? 'warning'
                      : 'positive'
                }`}
              >
                {expenseRatio.toFixed(
                  1,
                )}
                %
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Taxa de economia
              </span>

              <span
                className={`summary-value ${
                  savingsRate >= 0
                    ? 'positive'
                    : 'negative'
                }`}
              >
                {savingsRate.toFixed(
                  1,
                )}
                %
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Categoria mais relevante
              </span>

              <span className="summary-value">
                {biggestCategory
                  ? biggestCategory.category
                  : 'Nenhuma'}
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Volume analisado
              </span>

              <span className="summary-value">
                {transactions.length}{' '}
                transações
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}