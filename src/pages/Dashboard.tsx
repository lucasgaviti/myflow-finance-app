import { useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageLoader from '../components/PageLoader';
import Topbar from '../components/Topbar';
import TransactionModal from '../components/TransactionModal';

import { useGoals } from '../hook/useGoals';
import { useTransactions } from '../hook/useTransactions';

import { formatMoney } from '../utils/format';

import type { Transaction, TransactionType } from '../types/transaction';

const CATEGORY_OPTIONS = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Moradia',
  'Salário',
  'Investimentos',
  'Outros',
];

const PERIOD_OPTIONS = [
  { label: 'Todos os períodos', value: 'all' },
  { label: 'Hoje', value: 'today' },
  { label: 'Últimos 7 dias', value: '7days' },
  { label: 'Últimos 30 dias', value: '30days' },
  { label: 'Este mês', value: 'month' },
] as const;

const MONTHS = [
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

const CATEGORY_COLOR_MAP: Record<string, string> = {
  Alimentação: '#22c55e',
  Transporte: '#6366f1',
  Lazer: '#facc15',
  Saúde: '#ef4444',
  Moradia: '#a855f7',
  Salário: '#06b6d4',
  Investimentos: '#14b8a6',
  Outros: '#64748b',
};

const FALLBACK_COLORS = [
  '#6366f1',
  '#22c55e',
  '#facc15',
  '#ef4444',
  '#a855f7',
  '#06b6d4',
  '#f97316',
  '#94a3b8',
];

type PeriodFilter = (typeof PERIOD_OPTIONS)[number]['value'];

type CategoryData = {
  category: string;
  value: number;
  color: string;
};

type MonthlyFinanceData = {
  month: string;
  income: number;
  expense: number;
};

type MetricTone = 'balance' | 'income' | 'expense' | 'saving';

type ChartMonthFilter = 'all' | number;

function getTodayInputValue() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrencyInput(input: string) {
  const numericValue = Number(input.replace(/\D/g, '')) / 100;

  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatCompactMoney(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }

  return formatMoney(value);
}

function getCategoryColor(category: string, index: number) {
  return CATEGORY_COLOR_MAP[category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function parseInputDate(value: string, time: 'start' | 'end') {
  if (!value) {
    return null;
  }

  return new Date(`${value}T${time === 'start' ? '00:00:00' : '23:59:59'}`);
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return firstDate.toDateString() === secondDate.toDateString();
}

function isSameMonth(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
}

function filterTransactionsByPeriod(
  transactions: Transaction[],
  periodFilter: PeriodFilter,
  startDate: string,
  endDate: string,
) {
  const now = new Date();
  const hasCustomDateFilter = Boolean(startDate || endDate);
  const start = parseInputDate(startDate, 'start');
  const end = parseInputDate(endDate, 'end');

  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    if (hasCustomDateFilter) {
      if (start && transactionDate < start) {
        return false;
      }

      if (end && transactionDate > end) {
        return false;
      }

      return true;
    }

    if (periodFilter === 'all') {
      return true;
    }

    if (periodFilter === 'today') {
      return isSameDay(transactionDate, now);
    }

    if (periodFilter === 'month') {
      return isSameMonth(transactionDate, now);
    }

    const diffInDays =
      (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);

    if (periodFilter === '7days') {
      return diffInDays <= 7;
    }

    if (periodFilter === '30days') {
      return diffInDays <= 30;
    }

    return true;
  });
}

function getTotalByType(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.value, 0);
}

function getMonthlyFinanceData(
  transactions: Transaction[],
  year: number,
): MonthlyFinanceData[] {
  const monthlyTotals = MONTHS.map((month) => ({
    month,
    income: 0,
    expense: 0,
  }));

  transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      return transactionDate.getFullYear() === year;
    })
    .forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthIndex = transactionDate.getMonth();

      if (transaction.type === 'income') {
        monthlyTotals[monthIndex].income += transaction.value;
      } else {
        monthlyTotals[monthIndex].expense += transaction.value;
      }
    });

  return monthlyTotals;
}

function getExpenseByCategory(
  transactions: Transaction[],
  limit = 7,
): CategoryData[] {
  const categoryMap = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const currentValue = categoryMap.get(transaction.category) ?? 0;

      categoryMap.set(transaction.category, currentValue + transaction.value);
    });

  return Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      color: getCategoryColor(item.category, index),
    }));
}

function getTransactionsFromYear(transactions: Transaction[], year: number) {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return transactionDate.getFullYear() === year;
  });
}

function getRecentTransactions(transactions: Transaction[], limit = 5) {
  return [...transactions]
    .sort(
      (firstTransaction, secondTransaction) =>
        new Date(secondTransaction.date).getTime() -
        new Date(firstTransaction.date).getTime(),
    )
    .slice(0, limit);
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
}

function getGoalProgress(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.min((currentAmount / targetAmount) * 100, 100);
}

function getAvailableYears(transactions: Transaction[]) {
  const currentYear = new Date().getFullYear();
  const years = new Set<number>([currentYear]);

  transactions.forEach((transaction) => {
    years.add(new Date(transaction.date).getFullYear());
  });

  return Array.from(years).sort((firstYear, secondYear) => secondYear - firstYear);
}

const tooltipStyle: CSSProperties = {
  border: '1px solid var(--finance-border)',
  borderRadius: 14,
  background: 'var(--finance-tooltip)',
  color: 'var(--finance-text)',
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.18)',
};

const tooltipLabelStyle: CSSProperties = {
  color: 'var(--finance-text)',
  fontWeight: 800,
};

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    transactions,
    isLoading,
    addTransaction: addTransactionHook,
  } = useTransactions();

  const { goals, isLoading: isGoalsLoading } = useGoals();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Outros');
  const [date, setDate] = useState(getTodayInputValue());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [chartMonth, setChartMonth] = useState<ChartMonthFilter>('all');
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const hasCustomDateFilter = Boolean(startDate || endDate);

  const availableYears = useMemo(
    () => getAvailableYears(transactions),
    [transactions],
  );

  const currentYearTransactions = useMemo(
    () => getTransactionsFromYear(transactions, currentYear),
    [transactions, currentYear],
  );

  const filteredTransactions = useMemo(
    () =>
      filterTransactionsByPeriod(
        transactions,
        periodFilter,
        startDate,
        endDate,
      ),
    [transactions, periodFilter, startDate, endDate],
  );

  const filteredIncome = useMemo(
    () => getTotalByType(filteredTransactions, 'income'),
    [filteredTransactions],
  );

  const filteredExpense = useMemo(
    () => getTotalByType(filteredTransactions, 'expense'),
    [filteredTransactions],
  );

  const filteredBalance = filteredIncome - filteredExpense;
  const savedAmount = Math.max(filteredBalance, 0);

  const savingsRate =
    filteredIncome > 0 ? (savedAmount / filteredIncome) * 100 : 0;

  const monthlyData = useMemo(
    () => getMonthlyFinanceData(transactions, chartYear),
    [transactions, chartYear],
  );

  const chartData = useMemo(() => {
    if (chartMonth === 'all') {
      return monthlyData;
    }

    return [monthlyData[chartMonth]];
  }, [monthlyData, chartMonth]);

  const currentYearMonthlyData = useMemo(
    () => getMonthlyFinanceData(transactions, currentYear),
    [transactions, currentYear],
  );

  const categoryData = useMemo(
    () => getExpenseByCategory(filteredTransactions),
    [filteredTransactions],
  );

  const annualCategoryData = useMemo(
    () => getExpenseByCategory(currentYearTransactions, 6),
    [currentYearTransactions],
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(filteredTransactions),
    [filteredTransactions],
  );

  const chartIncomeTotal = monthlyData.reduce(
    (total, item) => total + item.income,
    0,
  );

  const chartExpenseTotal = monthlyData.reduce(
    (total, item) => total + item.expense,
    0,
  );

  const currentYearExpenseTotal = currentYearMonthlyData.reduce(
    (total, item) => total + item.expense,
    0,
  );

  const mainGoal = useMemo(() => {
    const primaryGoal = goals.find((goal) => goal.isPrimary);

    if (primaryGoal) {
      return primaryGoal;
    }

    if (goals.length === 0) {
      return null;
    }

    return [...goals].sort((firstGoal, secondGoal) => {
      const firstProgress = getGoalProgress(
        firstGoal.currentAmount,
        firstGoal.targetAmount,
      );

      const secondProgress = getGoalProgress(
        secondGoal.currentAmount,
        secondGoal.targetAmount,
      );

      return secondProgress - firstProgress;
    })[0];
  }, [goals]);

  const mainGoalProgress = mainGoal
    ? getGoalProgress(mainGoal.currentAmount, mainGoal.targetAmount)
    : 0;

  const remainingGoalAmount = mainGoal
    ? Math.max(mainGoal.targetAmount - mainGoal.currentAmount, 0)
    : 0;

  const metricCards = [
    {
      title: 'Saldo do período',
      value: formatMoney(filteredBalance),
      description:
        filteredBalance >= 0
          ? 'Resultado positivo no filtro atual.'
          : 'Despesas acima das entradas.',
      tone: 'balance' as const,
      icon: Wallet,
    },
    {
      title: 'Entradas',
      value: formatMoney(filteredIncome),
      description: 'Total recebido no período.',
      tone: 'income' as const,
      icon: TrendingUp,
    },
    {
      title: 'Saídas',
      value: formatMoney(filteredExpense),
      description: 'Total gasto no período.',
      tone: 'expense' as const,
      icon: TrendingDown,
    },
    {
      title: 'Economia',
      value: formatMoney(savedAmount),
      description:
        filteredIncome > 0
          ? `${savingsRate.toFixed(1)}% da renda preservada.`
          : 'Cadastre receitas para calcular.',
      tone: 'saving' as const,
      icon: PiggyBank,
    },
  ];

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;

    setValue(String(numericValue));
    setFormattedValue(formatCurrencyInput(rawValue));
  }

  function handlePeriodChange(event: ChangeEvent<HTMLSelectElement>) {
    setPeriodFilter(event.target.value as PeriodFilter);
    clearDateRange();
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    setPeriodFilter('all');
  }

  function handleEndDateChange(value: string) {
    setEndDate(value);
    setPeriodFilter('all');
  }

  function clearDateRange() {
    setStartDate('');
    setEndDate('');
  }

  function resetForm() {
    setTitle('');
    setValue('');
    setFormattedValue('');
    setType('expense');
    setCategory('Outros');
    setDate(getTodayInputValue());
  }

  function openNewTransactionModal() {
    resetForm();
    setShowModal(true);
  }

  function closeTransactionModal() {
    if (!isSaving) {
      setShowModal(false);
    }
  }

  async function addTransaction() {
    const normalizedTitle = title.trim();
    const numericValue = Number(value);

    if (!normalizedTitle || numericValue <= 0) {
      return;
    }

    setIsSaving(true);

    try {
      const newTransaction: Transaction = {
        id: Date.now(),
        title: normalizedTitle,
        value: numericValue,
        type,
        category,
        date: new Date(`${date}T12:00:00`).toISOString(),
      };

      await addTransactionHook(newTransaction);

      resetForm();
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isGoalsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="finance-dashboard-page">
      <Topbar onNewTransaction={openNewTransactionModal} />

      <section className="finance-filter-bar">
        <select
          className="period-select finance-period-select"
          value={periodFilter}
          onChange={handlePeriodChange}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="finance-date-range">
          <input
            type="date"
            value={startDate}
            onChange={(event) => handleStartDateChange(event.target.value)}
            aria-label="Data inicial"
          />

          <span>até</span>

          <input
            type="date"
            value={endDate}
            onChange={(event) => handleEndDateChange(event.target.value)}
            aria-label="Data final"
          />

          {hasCustomDateFilter && (
            <button
              type="button"
              className="clear-date-filter"
              onClick={clearDateRange}
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      <section className="finance-metric-grid">
        {metricCards.map((item) => (
          <FinanceMetricCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
            tone={item.tone}
            icon={item.icon}
          />
        ))}
      </section>

      <section className="finance-main-grid">
        <article className="finance-panel finance-panel-large">
          <PanelHeader
            title="Entradas x saídas"
            description="Comparativo mensal entre dinheiro recebido e despesas pagas."
            actions={
              <div className="finance-chart-controls">
                <label className="finance-chart-control">
                  <span>Mês</span>

                  <select
                    value={chartMonth}
                    onChange={(event) => {
                      const selectedValue = event.target.value;

                      setChartMonth(
                        selectedValue === 'all'
                          ? 'all'
                          : Number(selectedValue),
                      );
                    }}
                  >
                    <option value="all">Todos</option>

                    {MONTHS.map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="finance-chart-control">
                  <span>Ano</span>

                  <select
                    value={chartYear}
                    onChange={(event) => {
                      setChartYear(Number(event.target.value));
                      setChartMonth('all');
                    }}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            }
          />

          {chartExpenseTotal === 0 && chartIncomeTotal === 0 ? (
            <FinanceEmptyState
              title="Sem dados suficientes"
              description="Cadastre receitas e despesas para visualizar a análise mensal."
            />
          ) : (
            <div className="finance-chart finance-chart-large">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={6} barCategoryGap={18}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--finance-grid)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--finance-muted)',
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--finance-muted)',
                      fontSize: 12,
                    }}
                    tickFormatter={(chartValue) =>
                      formatCompactMoney(Number(chartValue))
                    }
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    formatter={(chartValue, name) => [
                      formatMoney(Number(chartValue)),
                      name === 'income' ? 'Entradas' : 'Saídas',
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />

                  <Bar
                    dataKey="income"
                    name="income"
                    fill="#22c55e"
                    radius={[8, 8, 0, 0]}
                  />

                  <Bar
                    dataKey="expense"
                    name="expense"
                    fill="#ef4444"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="finance-panel">
          <PanelHeader
            title="Despesas por categoria"
            description="Distribuição dos gastos dentro do período selecionado."
          />

          {categoryData.length === 0 ? (
            <FinanceEmptyState
              title="Sem despesas no período"
              description="As categorias aparecem aqui quando houver gastos cadastrados."
            />
          ) : (
            <div className="finance-category-layout">
              <div className="finance-donut-wrapper finance-donut-wrapper-main">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={102}
                      paddingAngle={4}
                      stroke="var(--finance-card)"
                      strokeWidth={5}
                    >
                      {categoryData.map((item) => (
                        <Cell key={item.category} fill={item.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      formatter={(chartValue) => [
                        formatMoney(Number(chartValue)),
                        'Total',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="finance-donut-center">
                  <span>Total</span>
                  <strong>{formatMoney(filteredExpense)}</strong>
                </div>
              </div>

              <div className="finance-category-list">
                {categoryData.map((item) => {
                  const percentage =
                    filteredExpense > 0
                      ? (item.value / filteredExpense) * 100
                      : 0;

                  return (
                    <div key={item.category} className="finance-category-item">
                      <div className="finance-category-info">
                        <div>
                          <span
                            className="finance-category-dot"
                            style={{ backgroundColor: item.color }}
                          />

                          <strong>{item.category}</strong>
                        </div>

                        <div className="finance-category-progress">
                          <span
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>

                      <p>
                        {formatMoney(item.value)}
                        <span>{percentage.toFixed(1)}%</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="finance-secondary-grid">
        <article className="finance-panel">
          <PanelHeader
            title="Meta principal"
            description="Acompanhamento do objetivo financeiro em destaque."
          />

          {mainGoal ? (
            <div className="finance-goal-card">
              <div>
                <span>Objetivo em destaque</span>
                <strong>{mainGoal.title}</strong>
                <p>
                  {formatMoney(mainGoal.currentAmount)} de{' '}
                  {formatMoney(mainGoal.targetAmount)}
                </p>
              </div>

              <div className="finance-goal-progress-header">
                <span>Progresso</span>
                <strong>{mainGoalProgress.toFixed(1)}%</strong>
              </div>

              <div className="finance-goal-track">
                <div
                  className="finance-goal-fill"
                  style={{ width: `${mainGoalProgress}%` }}
                />
              </div>

              <div className="finance-goal-metrics">
                <FinanceSmallStat
                  label="Acumulado"
                  value={formatMoney(mainGoal.currentAmount)}
                />

                <FinanceSmallStat
                  label="Falta"
                  value={formatMoney(remainingGoalAmount)}
                />
              </div>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate('/goals')}
              >
                Ver metas
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="finance-goal-empty">
              <div>
                <span>Próximo passo</span>
                <strong>Crie sua primeira meta</strong>
                <p>
                  Uma meta ajuda a transformar sobra financeira em objetivo real.
                </p>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate('/goals')}
              >
                <Target size={18} />
                Criar meta
              </button>
            </div>
          )}
        </article>

        <article className="finance-panel">
          <PanelHeader
            title="Participação na base anual"
            description={`Participação das principais categorias nos gastos de ${currentYear}.`}
          />

          {annualCategoryData.length === 0 ? (
            <FinanceEmptyState
              title="Sem base anual"
              description="Cadastre despesas para acompanhar a participação anual por categoria."
            />
          ) : (
            <div className="finance-year-share-grid">
              {annualCategoryData.map((item) => (
                <YearShareCard
                  key={item.category}
                  category={item.category}
                  value={item.value}
                  total={currentYearExpenseTotal}
                  color={item.color}
                />
              ))}
            </div>
          )}
        </article>
      </section>

      <article className="finance-panel">
        <PanelHeader
          title="Últimas transações"
          description="Movimentações mais recentes dentro do período selecionado."
        />

        {recentTransactions.length === 0 ? (
          <FinanceEmptyState
            title="Nenhuma transação no período"
            description="Cadastre uma receita ou despesa para acompanhar seu extrato."
          />
        ) : (
          <div className="finance-transaction-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="finance-transaction-row">
                <div>
                  <strong>{transaction.title}</strong>

                  <p>
                    <span>{transaction.category}</span>
                    {formatShortDate(transaction.date)}
                  </p>
                </div>

                <strong
                  className={`finance-transaction-value ${transaction.type}`}
                >
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatMoney(transaction.value)}
                </strong>
              </div>
            ))}
          </div>
        )}

        {recentTransactions.length > 0 && (
          <div className="finance-panel-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/transactions')}
            >
              Ver todas as transações
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </article>

      <TransactionModal
        showModal={showModal}
        editId={null}
        title={title}
        value={formattedValue}
        type={type}
        category={category}
        date={date}
        categories={CATEGORY_OPTIONS}
        isSaving={isSaving}
        onClose={closeTransactionModal}
        onTitleChange={setTitle}
        onValueChange={handleValueChange}
        onTypeChange={setType}
        onCategoryChange={setCategory}
        onDateChange={setDate}
        onSave={addTransaction}
      />
    </div>
  );
}

type FinanceMetricCardProps = {
  title: string;
  value: string;
  description: string;
  tone: MetricTone;
  icon: LucideIcon;
};

function FinanceMetricCard({
  title,
  value,
  description,
  tone,
  icon: Icon,
}: FinanceMetricCardProps) {
  return (
    <article className={`finance-metric-card ${tone}`}>
      <div className="finance-metric-top">
        <span>
          <Icon size={18} />
        </span>
      </div>

      <p>{title}</p>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

type PanelHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

function PanelHeader({ title, description, actions }: PanelHeaderProps) {
  return (
    <header className="finance-panel-header">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {actions && <div className="finance-panel-actions">{actions}</div>}
    </header>
  );
}

type FinanceSmallStatProps = {
  label: string;
  value: string;
};

function FinanceSmallStat({ label, value }: FinanceSmallStatProps) {
  return (
    <div className="finance-small-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type YearShareCardProps = {
  category: string;
  value: number;
  total: number;
  color: string;
};

function YearShareCard({
  category,
  value,
  total,
  color,
}: YearShareCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="finance-year-share-card">
      <div className="finance-year-share-top">
        <span>{category}</span>
        <strong>{percentage.toFixed(0)}%</strong>
      </div>

      <div>
        <p>{formatMoney(value)}</p>

        <div className="finance-year-share-progress">
          <i
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

type FinanceEmptyStateProps = {
  title: string;
  description: string;
};

function FinanceEmptyState({ title, description }: FinanceEmptyStateProps) {
  return (
    <div className="finance-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
