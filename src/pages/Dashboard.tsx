import { useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Target,
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
  { label: 'Este ano', value: 'year' },
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
  Alimentação: '#2a9d8f',
  Transporte: '#5279ce',
  Lazer: '#d39a39',
  Saúde: '#c96b83',
  Moradia: '#a855f7',
  Salário: '#06b6d4',
  Investimentos: '#14b8a6',
  Outros: '#64748b',
};

const FALLBACK_COLORS = [
  '#6366f1',
  '#22c55e',
  '#d39a39',
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

    if (periodFilter === 'year') return transactionDate.getFullYear() === now.getFullYear();

    if (periodFilter === 'month') {
      return isSameMonth(transactionDate, now);
    }

    const diffInDays =
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate())) / 86400000;

    if (periodFilter === '7days') {
      return diffInDays >= 0 && diffInDays < 7;
    }

    if (periodFilter === '30days') {
      return diffInDays >= 0 && diffInDays < 30;
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
    .map((item, index) => ({
      ...item,
      color: getCategoryColor(item.category, index),
    }));
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


type CategoryExpenseTooltipPayload = {
  value?: number;
  name?: string;
  payload?: CategoryData & {
    percentage: number;
  };
};

type CategoryExpenseTooltipProps = {
  active?: boolean;
  payload?: CategoryExpenseTooltipPayload[];
};

function CategoryExpenseTooltip({ active, payload }: CategoryExpenseTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  const value = Number(payload[0].value ?? item?.value ?? 0);
  const category = item?.category ?? payload[0].name ?? 'Categoria';
  const percentage = item?.percentage ?? 0;
  const color = item?.color ?? 'var(--primary)';

  return (
    <div className="category-tooltip" role="status" aria-live="polite">
      <div className="category-tooltip-title">
        <span style={{ backgroundColor: color }} />
        <strong>{category}</strong>
      </div>
      <span>{formatMoney(value)}</span>
      <span>{percentage.toFixed(1)}% do total</span>
    </div>
  );
}

type CategoryExpenseChartProps = {
  data: CategoryData[];
  total: number;
};

function CategoryExpenseChart({ data, total }: CategoryExpenseChartProps) {
  const safeTotal = total > 0 ? total : data.reduce((sum, item) => sum + item.value, 0);

  const normalizedData = data.map((item) => ({
    ...item,
    percentage: getParticipationPercentage(item.value, safeTotal),
  }));

  return (
    <article className="category-card" aria-label="Despesas por categoria">
      <header className="category-card-header">
        <div>
          <h3 className="category-card-title">Despesas por categoria</h3>
          <p className="category-card-subtitle">
            Distribuição dos gastos dentro do período selecionado.
          </p>
        </div>

        <div className="category-card-total-chip" aria-label={`Total de despesas ${formatMoney(safeTotal)}`}>
          <span>Total</span>
          <strong>{formatMoney(safeTotal)}</strong>
        </div>
      </header>

      <div className="category-card-body">
        <div className="category-chart-wrap">
          <ResponsiveContainer width="100%" height={232}>
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={normalizedData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="96%"
                paddingAngle={2}
                cornerRadius={3}
                stroke="var(--category-ring-gap)"
                strokeWidth={1}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {normalizedData.map((item) => (
                  <Cell key={item.category} fill={item.color} />
                ))}
              </Pie>

              <Tooltip
                cursor={false}
                content={<CategoryExpenseTooltip />}
                wrapperStyle={{ zIndex: 40, outline: 'none', pointerEvents: 'none' }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="category-center-label" aria-label={`Total de despesas ${formatMoney(safeTotal)}`}>
            <span>Total</span>
            <strong>{formatMoney(safeTotal)}</strong>
            <small>despesas</small>
          </div>
        </div>

        <div className="category-legend" aria-label="Lista de despesas por categoria">
          {normalizedData.map((item) => (
            <div key={item.category} className="category-legend-item">
              <div className="category-legend-top">
                <div className="category-legend-left">
                  <span
                    className="category-dot"
                    style={{ color: item.color, backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="category-name">{item.category}</span>
                </div>

                <div className="category-values">
                  <span className="category-value">{formatMoney(item.value)}</span>
                  <span className="category-percent">{item.percentage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="category-progress" aria-hidden="true">
                <div
                  className="category-progress-bar"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
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
  const [customOpen, setCustomOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [chartMonth, setChartMonth] = useState<ChartMonthFilter>('all');
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

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

  const filteredIncome = getTotalByType(filteredTransactions, 'income');
  const periodBalance = filteredIncome - filteredExpense;
  const periodRatio = filteredIncome > 0 ? `${(filteredExpense / filteredIncome * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';

  const categoryData = useMemo(
    () => getExpenseByCategory(filteredTransactions),
    [filteredTransactions],
  );

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
    chartIncomeTotal > 0 ? `${(chartExpenseTotal / chartIncomeTotal * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';


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

  const activePeriodLabel = hasCustomDateFilter
    ? 'Intervalo personalizado'
    : PERIOD_OPTIONS.find((option) => option.value === periodFilter)?.label ?? 'Todos os períodos';

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;

    setValue(String(numericValue));
    setFormattedValue(formatCurrencyInput(rawValue));
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

      const created = await addTransactionHook(newTransaction);
      if (!created) return;

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

      <section className="overview-heading"><div><h1>Visão financeira</h1><p>Receitas, despesas e evolução do seu dinheiro.</p></div></section>
      <section className="overview-filters" aria-label="Período do resumo">
        <div className="period-chips">{PERIOD_OPTIONS.map(option => <button type="button" key={option.value}
          aria-pressed={!customOpen && periodFilter === option.value} className={!customOpen && periodFilter === option.value ? 'active' : ''}
          onClick={() => {setPeriodFilter(option.value); clearDateRange(); setCustomOpen(false);}}>{option.label}</button>)}
          <button type="button" className={customOpen ? 'active' : ''} aria-pressed={customOpen} onClick={() => {setCustomOpen(true);setPeriodFilter('all');}}>Personalizado</button>
        </div>
        {customOpen && <div className="finance-date-range"><label>De<input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} /></label><label>Até<input type="date" value={endDate} onChange={e => handleEndDateChange(e.target.value)} min={startDate || undefined}/></label><button type="button" className="secondary-btn" onClick={clearDateRange}>Limpar</button></div>}
      </section>
      {customOpen && startDate && endDate && startDate > endDate && <p role="alert" className="negative">A data inicial deve ser anterior ou igual à data final.</p>}
      <section className="overview-balance"><div><span>Saldo do período</span><strong className={periodBalance < 0 ? 'negative' : ''}>{formatMoney(periodBalance)}</strong><p>{activePeriodLabel} · receitas menos despesas</p></div><div className="overview-balance-caption">Resultado das movimentações registradas, não saldo bancário.</div></section>
      <section className="overview-metrics" aria-label="Resumo financeiro">
        <div><span>Receitas</span><strong className="positive">{formatMoney(filteredIncome)}</strong></div>
        <div><span>Despesas</span><strong className="negative">{formatMoney(filteredExpense)}</strong></div>
        <div><span>Comprometimento</span><strong>{periodRatio}</strong><div className="overview-ratio"><i style={{width: `${filteredIncome > 0 ? Math.min(100, filteredExpense / filteredIncome * 100) : 0}%`}}/></div></div>
      </section>

      <section className="finance-studio-hero-grid">
        <div className="finance-studio-main-column">
          <article className="finance-panel finance-studio-analysis-panel">
            <PanelHeader
              title="Receitas e despesas por mês"
              description="Histórico independente do filtro de resumo, por mês e ano."
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
                    value={chartExpenseRatio}
                    tone="saving"
                  />
                </div>

                <div className="chart-key"><span><i/> Receitas</span><span><i/> Despesas</span></div>
                <div className="finance-chart finance-studio-bar-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visibleMonthlyData}
                      barGap={3}
                      barCategoryGap={chartMonth === 'all' ? '20%' : '45%'}
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
                        fill="var(--chart-income)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />

                      <Bar
                        dataKey="expense"
                        name="expense"
                        fill="var(--chart-expense-muted)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />


                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </article>

        </div>

        <aside className="finance-studio-category-column">
          {categoryData.length === 0 ? (
            <article className="category-card">
              <header className="category-card-header">
                <div>
                  <h3 className="category-card-title">Despesas por categoria</h3>
                  <p className="category-card-subtitle">
                    Distribuição dos gastos dentro do período selecionado.
                  </p>
                </div>
              </header>

              <FinanceEmptyState
                title="Sem despesas"
                description="Cadastre gastos para visualizar a distribuição por categoria."
              />
            </article>
          ) : (
            <CategoryExpenseChart data={categoryData} total={filteredExpense} />
          )}
        </aside>
      </section>

      <section className="finance-studio-mid-grid">
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
                {mainGoal.deadline && mainGoalProgress < 100 && mainGoal.deadline.slice(0,10) < getTodayInputValue() && <span className="overdue-label">Prazo vencido</span>}
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
