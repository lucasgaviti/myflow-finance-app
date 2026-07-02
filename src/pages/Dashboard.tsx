import { useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  balance: number;
};

type ChartMonthFilter = 'all' | number;

type SparkTone = 'balance' | 'income' | 'expense' | 'saving';

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function getTodayInputValue() {
  const today = new Date();

  return `${today.getFullYear()}-${padDatePart(today.getMonth() + 1)}-${padDatePart(
    today.getDate(),
  )}`;
}

function parseDateParts(date: string) {
  const [dateOnly] = date.split('T');
  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function parseTransactionDate(date: string) {
  const parts = parseDateParts(date);

  if (!parts) {
    return new Date(date);
  }

  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
}

function toStoredTransactionDate(date: string) {
  const parts = parseDateParts(date);

  if (!parts) {
    return new Date().toISOString();
  }

  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0).toISOString();
}

function formatCurrencyInput(input: string) {
  const numericValue = Number(input.replace(/\D/g, '')) / 100;

  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatCompactMoney(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }

  return formatMoney(value);
}

function getCategoryColor(category: string, index: number) {
  return CATEGORY_COLOR_MAP[category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function parseInputDate(value: string, time: 'start' | 'end') {
  const parts = parseDateParts(value);

  if (!parts) {
    return null;
  }

  const hour = time === 'start' ? 0 : 23;
  const minute = time === 'start' ? 0 : 59;
  const second = time === 'start' ? 0 : 59;

  return new Date(parts.year, parts.month - 1, parts.day, hour, minute, second);
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
    const transactionDate = parseTransactionDate(transaction.date);

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
    balance: 0,
  }));

  transactions
    .filter((transaction) => parseTransactionDate(transaction.date).getFullYear() === year)
    .forEach((transaction) => {
      const transactionDate = parseTransactionDate(transaction.date);
      const monthIndex = transactionDate.getMonth();

      if (transaction.type === 'income') {
        monthlyTotals[monthIndex].income += transaction.value;
      } else {
        monthlyTotals[monthIndex].expense += transaction.value;
      }

      monthlyTotals[monthIndex].balance =
        monthlyTotals[monthIndex].income - monthlyTotals[monthIndex].expense;
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
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      color: getCategoryColor(item.category, index),
    }));
}

function getTransactionsFromYear(transactions: Transaction[], year: number) {
  return transactions.filter((transaction) => {
    const transactionDate = parseTransactionDate(transaction.date);

    return transactionDate.getFullYear() === year;
  });
}

function getTransactionsFromMonth(
  transactions: Transaction[],
  year: number,
  monthIndex: number,
) {
  return transactions.filter((transaction) => {
    const transactionDate = parseTransactionDate(transaction.date);

    return (
      transactionDate.getFullYear() === year &&
      transactionDate.getMonth() === monthIndex
    );
  });
}

function getRecentTransactions(transactions: Transaction[], limit = 5) {
  return [...transactions]
    .sort(
      (firstTransaction, secondTransaction) =>
        parseTransactionDate(secondTransaction.date).getTime() -
        parseTransactionDate(firstTransaction.date).getTime(),
    )
    .slice(0, limit);
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(parseTransactionDate(date));
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
    years.add(parseTransactionDate(transaction.date).getFullYear());
  });

  return Array.from(years).sort((firstYear, secondYear) => secondYear - firstYear);
}

function getLargestMonthlyAmount(monthlyData: MonthlyFinanceData[]) {
  return monthlyData.reduce(
    (largest, item) => Math.max(largest, item.income, item.expense),
    0,
  );
}

function getParticipationPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min((value / total) * 100, 100);
}


type CategoryTooltipPayload = {
  name?: string;
  value?: number;
  payload?: CategoryData;
};

type CategoryDonutTooltipProps = {
  active?: boolean;
  payload?: CategoryTooltipPayload[];
  total: number;
};

function CategoryDonutTooltip({
  active,
  payload,
  total,
}: CategoryDonutTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  const value = Number(payload[0].value ?? 0);
  const percentage = getParticipationPercentage(value, total);
  const category = item?.category ?? payload[0].name ?? 'Categoria';
  const color = item?.color ?? 'var(--primary)';

  return (
    <div className="finance-donut-tooltip">
      <div className="finance-donut-tooltip-header">
        <span style={{ backgroundColor: color }} />
        <strong>{category}</strong>
      </div>

      <div className="finance-donut-tooltip-value">
        {formatMoney(value)}
        <small>{percentage.toFixed(1)}% do total</small>
      </div>
    </div>
  );
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

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const hasCustomDateFilter = Boolean(startDate || endDate);

  const availableYears = useMemo(
    () => getAvailableYears(transactions),
    [transactions],
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

  const currentYearTransactions = useMemo(
    () => getTransactionsFromYear(transactions, currentYear),
    [transactions, currentYear],
  );

  const currentMonthTransactions = useMemo(
    () => getTransactionsFromMonth(transactions, currentYear, currentMonth),
    [transactions, currentYear, currentMonth],
  );

  const monthlyData = useMemo(
    () => getMonthlyFinanceData(transactions, chartYear),
    [transactions, chartYear],
  );

  const visibleMonthlyData = useMemo(() => {
    if (chartMonth === 'all') {
      return monthlyData;
    }

    return [monthlyData[chartMonth]];
  }, [monthlyData, chartMonth]);

  const filteredExpense = useMemo(
    () => getTotalByType(filteredTransactions, 'expense'),
    [filteredTransactions],
  );

  const currentMonthIncome = useMemo(
    () => getTotalByType(currentMonthTransactions, 'income'),
    [currentMonthTransactions],
  );

  const currentMonthExpense = useMemo(
    () => getTotalByType(currentMonthTransactions, 'expense'),
    [currentMonthTransactions],
  );

  const currentMonthBalance = currentMonthIncome - currentMonthExpense;

  const categoryData = useMemo(
    () => getExpenseByCategory(filteredTransactions, 6),
    [filteredTransactions],
  );

  const annualCategoryData = useMemo(
    () => getExpenseByCategory(currentYearTransactions, 6),
    [currentYearTransactions],
  );

  const detailCategoryData = categoryData.length > 0 ? categoryData : annualCategoryData;

  const recentTransactions = useMemo(
    () => getRecentTransactions(filteredTransactions),
    [filteredTransactions],
  );

  const chartIncomeTotal = visibleMonthlyData.reduce(
    (total, item) => total + item.income,
    0,
  );

  const chartExpenseTotal = visibleMonthlyData.reduce(
    (total, item) => total + item.expense,
    0,
  );

  const chartBalanceTotal = chartIncomeTotal - chartExpenseTotal;
  const chartExpenseRatio =
    chartIncomeTotal > 0 ? (chartExpenseTotal / chartIncomeTotal) * 100 : 0;


  const largestCategoryExpense = detailCategoryData.reduce(
    (largest, item) => Math.max(largest, item.value),
    0,
  );

  const largestMonthlyAmount = getLargestMonthlyAmount(visibleMonthlyData);

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

  const activePeriodLabel =
    chartMonth === 'all'
      ? `Ano ${chartYear}`
      : `${MONTHS[chartMonth]} · ${chartYear}`;

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
        date: toStoredTransactionDate(date),
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
    <div className="finance-dashboard-page finance-dashboard-studio">
      <Topbar onNewTransaction={openNewTransactionModal} />

      <section className="finance-studio-control-strip">
        <div>
          <span>Visão financeira</span>
          <strong>{activePeriodLabel}</strong>
        </div>

        <div className="finance-studio-filter-group">
          <select
            className="period-select finance-period-select"
            value={periodFilter}
            onChange={handlePeriodChange}
            aria-label="Filtro de período"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="finance-date-range finance-studio-date-range">
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
        </div>
      </section>

      <section className="finance-studio-hero-grid">
        <div className="finance-studio-main-column">
          <div className="finance-studio-kpis">
            <StudioKpiCard
              title="Saldo do mês"
              value={formatMoney(currentMonthBalance)}
              description="Resultado entre receitas e despesas no mês atual."
              tone="balance"
              icon={Wallet}
              data={monthlyData}
              dataKey="balance"
            />

            <StudioKpiCard
              title="Despesas do mês"
              value={formatMoney(currentMonthExpense)}
              description="Total de saídas registradas no mês atual."
              tone="expense"
              icon={TrendingDown}
              data={monthlyData}
              dataKey="expense"
            />
          </div>

          <article className="finance-panel finance-studio-analysis-panel">
            <PanelHeader
              title="Análise mensal"
              description="Comparativo entre entradas, saídas e saldo do período."
              actions={
                <div className="finance-chart-controls finance-studio-chart-controls">
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

            {largestMonthlyAmount === 0 ? (
              <FinanceEmptyState
                title="Sem dados suficientes"
                description="Cadastre receitas e despesas para visualizar a análise mensal."
              />
            ) : (
              <>
                <div className="finance-studio-analysis-summary">
                  <MetricPill
                    label="Saldo"
                    value={formatMoney(chartBalanceTotal)}
                    tone="balance"
                  />

                  <MetricPill
                    label="Entradas"
                    value={formatMoney(chartIncomeTotal)}
                    tone="income"
                  />

                  <MetricPill
                    label="Saídas"
                    value={formatMoney(chartExpenseTotal)}
                    tone="expense"
                  />

                  <MetricPill
                    label="Comprometimento"
                    value={`${chartExpenseRatio.toFixed(1)}%`}
                    tone="saving"
                  />
                </div>

                <div className="finance-chart finance-studio-bar-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visibleMonthlyData}
                      barGap={8}
                      barCategoryGap={chartMonth === 'all' ? 16 : 92}
                      margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--finance-grid)"
                        strokeDasharray="4 6"
                      />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: 'var(--finance-muted)',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={54}
                        tick={{
                          fill: 'var(--finance-muted)',
                          fontSize: 11,
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
                        fill="url(#incomeGradient)"
                        radius={[10, 10, 4, 4]}
                        maxBarSize={38}
                      />

                      <Bar
                        dataKey="expense"
                        name="expense"
                        fill="url(#expenseGradient)"
                        radius={[10, 10, 4, 4]}
                        maxBarSize={38}
                      />

                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c7cff" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>

                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </article>

          <article className="finance-panel finance-expense-detail-panel">
            <PanelHeader
              title="Detalhamento de despesas"
              description="Ranking das categorias com maior peso no filtro atual."
            />

            {detailCategoryData.length === 0 ? (
              <FinanceEmptyState
                title="Sem despesas no período"
                description="As categorias aparecem aqui quando houver gastos cadastrados."
              />
            ) : (
              <div className="finance-expense-detail-list">
                {detailCategoryData.map((item) => {
                  const width = getParticipationPercentage(
                    item.value,
                    largestCategoryExpense,
                  );

                  return (
                    <div key={item.category} className="finance-expense-detail-row">
                      <span>{item.category}</span>

                      <div className="finance-expense-detail-track">
                        <i
                          style={{
                            width: `${width}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>

                      <strong>{formatMoney(item.value)}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </div>

        <aside className="finance-studio-category-column">
          <article className="finance-panel finance-category-panel finance-compact-panel">
            <PanelHeader
              title="Despesas por categoria"
              description="Distribuição dos gastos dentro do período selecionado."
            />

            {categoryData.length === 0 ? (
              <FinanceEmptyState
                title="Sem despesas"
                description="Cadastre gastos para visualizar a distribuição por categoria."
              />
            ) : (
              <div className="finance-category-donut-grid finance-category-donut-grid-premium">
                <div className="finance-donut-wrapper finance-premium-donut">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={5}
                        startAngle={90}
                        endAngle={-270}
                        stroke="var(--finance-donut-stroke)"
                        strokeWidth={7}
                      >
                        {categoryData.map((item) => (
                          <Cell key={item.category} fill={item.color} />
                        ))}
                      </Pie>

                      <Tooltip
                        content={<CategoryDonutTooltip total={filteredExpense} />}
                        cursor={false}
                        position={{ x: 18, y: 18 }}
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{
                          zIndex: 30,
                          outline: 'none',
                          pointerEvents: 'none',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="finance-donut-center finance-premium-donut-center">
                    <span>Total</span>
                    <strong>{formatMoney(filteredExpense)}</strong>
                    <small>despesas</small>
                  </div>
                </div>

                <div className="finance-premium-category-list">
                  {categoryData.slice(0, 5).map((item) => {
                    const percentage = getParticipationPercentage(
                      item.value,
                      filteredExpense,
                    );

                    return (
                      <div key={item.category} className="finance-premium-category-item">
                        <div className="finance-premium-category-head">
                          <span style={{ backgroundColor: item.color }} />
                          <strong>{item.category}</strong>
                        </div>

                        <div className="finance-premium-category-values">
                          <strong>{formatMoney(item.value)}</strong>
                          <small>{percentage.toFixed(1)}%</small>
                        </div>

                        <div className="finance-premium-category-track">
                          <i
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        </aside>
      </section>

      <section className="finance-studio-mid-grid">
        <article className="finance-panel finance-flow-panel finance-compact-panel">
          <PanelHeader
            title="Receitas e despesas"
            description="Tendência mensal do fluxo financeiro."
          />

          {largestMonthlyAmount === 0 ? (
            <FinanceEmptyState
              title="Sem tendência"
              description="Cadastre movimentações para acompanhar a curva mensal."
            />
          ) : (
            <div className="finance-chart finance-flow-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--finance-grid)"
                    strokeDasharray="4 6"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--finance-muted)',
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tick={{
                      fill: 'var(--finance-muted)',
                      fontSize: 10,
                    }}
                    tickFormatter={(chartValue) => formatCompactMoney(Number(chartValue))}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    formatter={(chartValue, name) => [
                      formatMoney(Number(chartValue)),
                      name === 'income' ? 'Receitas' : 'Despesas',
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="income"
                    name="income"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="expense"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="finance-panel finance-goal-panel">
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
      </section>

      <section className="finance-studio-latest-grid">
        <article className="finance-panel finance-latest-panel">
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
      </section>

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

type StudioKpiCardProps = {
  title: string;
  value: string;
  description: string;
  tone: SparkTone;
  icon: LucideIcon;
  data: MonthlyFinanceData[];
  dataKey: keyof Pick<MonthlyFinanceData, 'income' | 'expense' | 'balance'>;
};

function StudioKpiCard({
  title,
  value,
  description,
  tone,
  icon: Icon,
  data,
  dataKey,
}: StudioKpiCardProps) {
  return (
    <article className={`finance-studio-kpi ${tone}`}>
      <div className="finance-studio-kpi-content">
        <span>
          <Icon size={17} />
          {title}
        </span>
        <strong>{value}</strong>
        <p>{description}</p>
      </div>

      <div className="finance-studio-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.75" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="currentColor"
              strokeWidth={2.5}
              fill={`url(#spark-${tone})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

type MetricPillProps = {
  label: string;
  value: string;
  tone: SparkTone;
};

function MetricPill({ label, value, tone }: MetricPillProps) {
  return (
    <div className={`finance-studio-pill ${tone}`}>
      <span />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
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
