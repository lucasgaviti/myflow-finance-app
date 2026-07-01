import { useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react';

import Card from '../components/Card';
import CategoryChart from '../components/CategoryChart';
import EmptyState from '../components/EmptyState';
import KPICard from '../components/KPICard';
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

type PeriodFilter = (typeof PERIOD_OPTIONS)[number]['value'];
type HealthStatus = 'healthy' | 'attention' | 'critical';

type CategoryData = {
  category: string;
  value: number;
};

type DashboardInsight = {
  icon: 'shield' | 'lightbulb' | 'target';
  title: string;
  description: string;
};

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

function getCategoryData(transactions: Transaction[]): CategoryData[] {
  const categoryMap = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const currentValue = categoryMap.get(transaction.category) ?? 0;

      categoryMap.set(transaction.category, currentValue + transaction.value);
    });

  return Array.from(categoryMap.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}

function getHealthStatus(financialScore: number): HealthStatus {
  if (financialScore >= 80) {
    return 'healthy';
  }

  if (financialScore >= 55) {
    return 'attention';
  }

  return 'critical';
}

function getHealthTitle(status: HealthStatus) {
  const titles: Record<HealthStatus, string> = {
    healthy: 'Saúde financeira boa',
    attention: 'Atenção ao orçamento',
    critical: 'Risco financeiro',
  };

  return titles[status];
}

function getHealthDescription(status: HealthStatus) {
  const descriptions: Record<HealthStatus, string> = {
    healthy: 'Seu fluxo está positivo e as despesas estão sob controle.',
    attention: 'Você ainda tem controle, mas a margem de economia está apertada.',
    critical: 'As despesas estão comprometendo sua capacidade de guardar dinheiro.',
  };

  return descriptions[status];
}

function calculateFinancialScore({
  savingsRate,
  expenseRate,
  goalsCount,
  goalsProgress,
  transactionCount,
}: {
  savingsRate: number;
  expenseRate: number;
  goalsCount: number;
  goalsProgress: number;
  transactionCount: number;
}) {
  const savingsScore =
    savingsRate >= 20 ? 40 : savingsRate >= 10 ? 32 : savingsRate >= 0 ? 22 : 8;

  const expenseScore =
    expenseRate <= 70 ? 30 : expenseRate <= 85 ? 22 : expenseRate <= 100 ? 12 : 4;

  const goalsScore = goalsCount > 0 ? 12 : 0;
  const progressScore = goalsProgress >= 50 ? 12 : goalsProgress > 0 ? 8 : 0;
  const activityScore = transactionCount > 0 ? 6 : 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        savingsScore + expenseScore + goalsScore + progressScore + activityScore,
      ),
    ),
  );
}

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

  const hasCustomDateFilter = Boolean(startDate || endDate);

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, periodFilter, startDate, endDate),
    [transactions, periodFilter, startDate, endDate],
  );

  const categoryData = useMemo(
    () => getCategoryData(filteredTransactions),
    [filteredTransactions],
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

  const totalGoalsCurrent = useMemo(
    () => goals.reduce((total, goal) => total + goal.currentAmount, 0),
    [goals],
  );

  const totalGoalsTarget = useMemo(
    () => goals.reduce((total, goal) => total + goal.targetAmount, 0),
    [goals],
  );

  const goalsProgress =
    totalGoalsTarget > 0
      ? Math.min((totalGoalsCurrent / totalGoalsTarget) * 100, 100)
      : 0;

  const mostAdvancedGoal = useMemo(() => {
    if (goals.length === 0) {
      return null;
    }

    return [...goals].sort((firstGoal, secondGoal) => {
      const firstProgress =
        firstGoal.targetAmount > 0
          ? firstGoal.currentAmount / firstGoal.targetAmount
          : 0;

      const secondProgress =
        secondGoal.targetAmount > 0
          ? secondGoal.currentAmount / secondGoal.targetAmount
          : 0;

      return secondProgress - firstProgress;
    })[0];
  }, [goals]);

  const mostAdvancedGoalProgress =
    mostAdvancedGoal && mostAdvancedGoal.targetAmount > 0
      ? Math.min(
          (mostAdvancedGoal.currentAmount / mostAdvancedGoal.targetAmount) * 100,
          100,
        )
      : 0;

  const savingsRate =
    filteredIncome > 0 ? (filteredBalance / filteredIncome) * 100 : 0;

  const expenseRate =
    filteredIncome > 0 ? (filteredExpense / filteredIncome) * 100 : 0;

  const financialScore = calculateFinancialScore({
    savingsRate,
    expenseRate,
    goalsCount: goals.length,
    goalsProgress,
    transactionCount: filteredTransactions.length,
  });

  const healthStatus = getHealthStatus(financialScore);
  const healthTitle = getHealthTitle(healthStatus);
  const healthDescription = getHealthDescription(healthStatus);

  const topCategory = categoryData[0] ?? null;

  const dashboardInsights: DashboardInsight[] = [
    {
      icon: 'shield',
      title: 'Economia do período',
      description:
        filteredIncome > 0
          ? `Você economizou ${savingsRate.toFixed(1)}% da renda no período selecionado.`
          : 'Cadastre receitas para calcular sua taxa de economia.',
    },
    {
      icon: 'lightbulb',
      title: 'Categoria crítica',
      description: topCategory
        ? `${topCategory.category} é a categoria com maior impacto: ${formatMoney(
            topCategory.value,
          )}.`
        : 'Ainda não há despesas suficientes para identificar categorias críticas.',
    },
    {
      icon: 'target',
      title: 'Direção financeira',
      description: mostAdvancedGoal
        ? `Sua meta mais avançada é ${mostAdvancedGoal.title}, com ${mostAdvancedGoalProgress.toFixed(
            0,
          )}% concluído.`
        : 'Crie uma meta para o MyFlow acompanhar seu progresso financeiro.',
    },
  ];

  const projectedAnnualSavings = filteredBalance > 0 ? filteredBalance * 12 : 0;

  const executiveSummaryTitle =
    filteredBalance >= 0 ? 'Seu fluxo está positivo' : 'Seu fluxo precisa de atenção';

  const executiveSummaryDescription =
    filteredBalance >= 0
      ? `Você recebeu ${formatMoney(filteredIncome)}, gastou ${formatMoney(
          filteredExpense,
        )} e sobrou ${formatMoney(
          filteredBalance,
        )} no período. Mantendo esse ritmo, a projeção anual de economia é de ${formatMoney(
          projectedAnnualSavings,
        )}.`
      : `Você recebeu ${formatMoney(filteredIncome)}, gastou ${formatMoney(
          filteredExpense,
        )} e fechou o período negativo em ${formatMoney(
          Math.abs(filteredBalance),
        )}. Antes de novas compras, revise as categorias de maior impacto.`;

  const kpis = [
    {
      label: 'Saldo Atual',
      value: formatMoney(filteredBalance),
      variant: 'balance' as const,
      description:
        filteredBalance >= 0
          ? 'Resultado positivo no período.'
          : 'Resultado negativo no período.',
      trend: filteredBalance >= 0 ? 'Fluxo positivo' : 'Atenção ao saldo',
    },
    {
      label: 'Entradas',
      value: formatMoney(filteredIncome),
      variant: 'income' as const,
      description: 'Total recebido no filtro atual.',
    },
    {
      label: 'Despesas',
      value: formatMoney(filteredExpense),
      variant: 'expense' as const,
      description: `${expenseRate.toFixed(1)}% da renda consumida.`,
    },
    {
      label: 'Meta Principal',
      value: mostAdvancedGoal ? `${mostAdvancedGoalProgress.toFixed(0)}%` : 'Criar meta',
      variant: 'goal' as const,
      description: mostAdvancedGoal ? mostAdvancedGoal.title : 'Defina seu primeiro objetivo.',
      trend: mostAdvancedGoal ? 'Em andamento' : 'Comece agora',
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
    <div>
      <Topbar onNewTransaction={openNewTransactionModal} />

      <div className="dashboard-header dashboard-header-compact">
        <div className="period-filter-wrapper">
          <select
            className="period-select"
            value={periodFilter}
            onChange={handlePeriodChange}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="custom-date-filter">
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
      </div>

      <div className="kpi-grid">
        {kpis.map((item) => (
          <KPICard
            key={item.label}
            label={item.label}
            value={item.value}
            variant={item.variant}
            description={item.description}
            trend={item.trend}
          />
        ))}
      </div>

      <Card title="Resumo Executivo" subtitle="Leitura direta do período selecionado.">
        <div
          className={`planning-diagnosis-card ${
            filteredBalance >= 0 ? 'healthy' : 'critical'
          }`}
          style={executiveSummaryStyles.container}
        >
          <div>
            <span className="goal-eyebrow">Resultado do período</span>

            <div className="goal-values">
              <strong>{executiveSummaryTitle}</strong>
              <span>{executiveSummaryDescription}</span>
            </div>
          </div>

          <div style={executiveSummaryStyles.metrics}>
            <ExecutiveMiniMetric label="Entrou" value={formatMoney(filteredIncome)} tone="income" />
            <ExecutiveMiniMetric label="Saiu" value={formatMoney(filteredExpense)} tone="expense" />
            <ExecutiveMiniMetric
              label="Sobrou"
              value={formatMoney(filteredBalance)}
              tone={filteredBalance >= 0 ? 'income' : 'expense'}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Saúde Financeira"
        subtitle="Painel executivo do seu fluxo, metas e capacidade de economia."
      >
        <div className={`planning-diagnosis-card ${healthStatus}`} style={healthStyles.container}>
          <div style={healthStyles.content}>
            <div className="planning-diagnosis-header">
              <div>
                <span className="goal-eyebrow">Diagnóstico do período</span>

                <div className="goal-values">
                  <strong>{healthTitle}</strong>
                  <span>{healthDescription}</span>
                </div>
              </div>

              <div className="planning-metric-icon">
                {healthStatus === 'healthy' && <CheckCircle2 size={20} />}
                {healthStatus === 'attention' && <AlertTriangle size={20} />}
                {healthStatus === 'critical' && <XCircle size={20} />}
              </div>
            </div>

            <div style={healthStyles.metricsGrid}>
              <PremiumHealthMetric
                label="Score"
                value={`${financialScore}`}
                description="Índice calculado com base em saldo, despesas, metas e atividade."
              />

              <PremiumHealthMetric
                label="Economia"
                value={`${savingsRate.toFixed(1)}%`}
                description="Percentual da renda que sobrou no período."
              />

              <PremiumHealthMetric
                label="Metas"
                value={`${goalsProgress.toFixed(0)}%`}
                description="Progresso médio das metas cadastradas."
              />
            </div>
          </div>

          <div style={healthStyles.scoreCard}>
            <div style={healthStyles.scoreCircle}>
              <strong>{financialScore}</strong>
              <span>/100</span>
            </div>

            <div style={healthStyles.scoreInfo}>
              <span className="planning-metric-label">Classificação</span>

              <strong>
                {healthStatus === 'healthy'
                  ? 'Saudável'
                  : healthStatus === 'attention'
                    ? 'Atenção'
                    : 'Crítico'}
              </strong>

              <p className="planning-metric-description">
                O score considera saldo do período, taxa de economia, relação entre despesas e renda,
                metas cadastradas e movimentações registradas.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="dashboard-grid" style={dashboardGridStyles}>
        <Card
          title="Meta Principal"
          subtitle="O objetivo que mais representa seu avanço financeiro."
        >
          {mostAdvancedGoal ? (
            <div className="planning-diagnosis-card healthy">
              <div className="planning-diagnosis-header">
                <div>
                  <span className="goal-eyebrow">Objetivo em destaque</span>

                  <div className="goal-values">
                    <strong>{mostAdvancedGoal.title}</strong>

                    <span>
                      {formatMoney(mostAdvancedGoal.currentAmount)} acumulados de{' '}
                      {formatMoney(mostAdvancedGoal.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className="planning-metric-icon">
                  <Target size={20} />
                </div>
              </div>

              <div style={mainGoalStyles.content}>
                <div style={mainGoalStyles.progressTrack}>
                  <div
                    style={{
                      ...mainGoalStyles.progressBar,
                      width: `${mostAdvancedGoalProgress}%`,
                    }}
                  />
                </div>

                <div style={mainGoalStyles.metricsGrid}>
                  <PremiumHealthMetric
                    label="Progresso"
                    value={`${mostAdvancedGoalProgress.toFixed(1)}%`}
                    description="Da meta concluída."
                  />

                  <PremiumHealthMetric
                    label="Acumulado"
                    value={formatMoney(mostAdvancedGoal.currentAmount)}
                    description="Valor já guardado."
                  />

                  <PremiumHealthMetric
                    label="Falta"
                    value={formatMoney(
                      Math.max(
                        mostAdvancedGoal.targetAmount - mostAdvancedGoal.currentAmount,
                        0,
                      ),
                    )}
                    description="Para concluir."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="planning-diagnosis-card attention">
              <div className="planning-diagnosis-header">
                <div>
                  <span className="goal-eyebrow">Próximo passo essencial</span>

                  <div className="goal-values">
                    <strong>Configure sua primeira meta</strong>

                    <span>
                      O MyFlow fica mais inteligente quando existe um objetivo financeiro para orientar
                      o orçamento.
                    </span>
                  </div>
                </div>

                <div className="planning-metric-icon">
                  <Target size={20} />
                </div>
              </div>

              <div style={setupStepsStyles}>
                <SetupStep
                  index={1}
                  title="Crie uma meta"
                  description="Defina o valor que quer alcançar."
                />

                <SetupStep
                  index={2}
                  title="Informe sua reserva"
                  description="Use o Planejamento para registrar sua base financeira."
                />

                <SetupStep
                  index={3}
                  title="Acompanhe recomendações"
                  description="O Dashboard passa a orientar suas decisões."
                />
              </div>

              <div className="planning-actions">
                <button type="button" className="primary-btn" onClick={() => navigate('/goals')}>
                  <Target size={18} />
                  Criar primeira meta
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card title="Despesas por Categoria">
          {categoryData.length === 0 ? (
            <EmptyState
              icon="🏷️"
              title="Nenhuma despesa categorizada"
              description="Cadastre despesas para entender quais categorias mais impactam seu orçamento."
            />
          ) : (
            <div style={categoryChartStyles}>
              <CategoryChart data={categoryData} />
            </div>
          )}
        </Card>
      </div>

      <div style={bottomCardsStyles}>
        <Card
          title="Insights Inteligentes"
          subtitle="Leituras locais geradas a partir do seu fluxo financeiro, sem IA paga."
        >
          <div style={insightsListStyles}>
            {dashboardInsights.map((insight) => (
              <InsightFeedItem
                key={insight.title}
                icon={insight.icon}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </Card>

        <Card
          title="Plano de Ação"
          subtitle="Checklist objetivo para melhorar seu controle financeiro."
        >
          <div style={actionListStyles}>
            <ChecklistAction
              done={filteredBalance >= 0}
              title={filteredBalance >= 0 ? 'Preservar saldo positivo' : 'Recuperar saldo do período'}
              description={
                filteredBalance >= 0
                  ? `Você fechou o período com ${formatMoney(
                      filteredBalance,
                    )} de sobra. Direcione parte desse valor para suas metas.`
                  : `O período está negativo em ${formatMoney(
                      Math.abs(filteredBalance),
                    )}. Revise gastos variáveis antes de assumir novas despesas.`
              }
            />

            {topCategory && (
              <ChecklistAction
                done={false}
                title={`Revisar ${topCategory.category}`}
                description={`${topCategory.category} é sua maior categoria de despesa no período, com ${formatMoney(
                  topCategory.value,
                )}.`}
              />
            )}

            <ChecklistAction
              done={Boolean(mostAdvancedGoal)}
              title={mostAdvancedGoal ? 'Manter ritmo da meta' : 'Criar uma meta financeira'}
              description={
                mostAdvancedGoal
                  ? `${mostAdvancedGoal.title} está com ${mostAdvancedGoalProgress.toFixed(
                      0,
                    )}% de progresso.`
                  : 'Sem uma meta, o MyFlow não consegue orientar suas decisões com precisão.'
              }
            />
          </div>
        </Card>
      </div>

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

const executiveSummaryStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 22,
    alignItems: 'center',
    padding: 22,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(110px, 1fr))',
    gap: 12,
  },
} satisfies Record<string, CSSProperties>;

const healthStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 280px',
    gap: 32,
    alignItems: 'stretch',
  },
  content: {
    display: 'grid',
    gap: 20,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 14,
  },
  scoreCard: {
    display: 'grid',
    gap: 18,
    alignContent: 'center',
    justifyItems: 'center',
    padding: 20,
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  scoreCircle: {
    width: 132,
    height: 132,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.28), rgba(34, 197, 94, 0.24))',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
  },
  scoreInfo: {
    textAlign: 'center',
    display: 'grid',
    gap: 6,
  },
} satisfies Record<string, CSSProperties>;

const dashboardGridStyles: CSSProperties = {
  gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)',
  alignItems: 'stretch',
};

const mainGoalStyles = {
  content: {
    display: 'grid',
    gap: 14,
    marginTop: 20,
  },
  progressTrack: {
    height: 18,
    borderRadius: 999,
    overflow: 'hidden',
    background: 'rgba(148, 163, 184, 0.16)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #2563eb, #22c55e)',
    boxShadow: '0 0 24px rgba(37, 99, 235, 0.45)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
} satisfies Record<string, CSSProperties>;

const setupStepsStyles: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 18,
};

const categoryChartStyles: CSSProperties = {
  maxWidth: 380,
  margin: '0 auto',
};

const bottomCardsStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const insightsListStyles: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const actionListStyles: CSSProperties = {
  display: 'grid',
  gap: 12,
};

type ExecutiveMiniMetricProps = {
  label: string;
  value: string;
  tone: 'income' | 'expense';
};

function ExecutiveMiniMetric({ label, value, tone }: ExecutiveMiniMetricProps) {
  return (
    <div
      style={{
        minWidth: 110,
        padding: '14px 16px',
        borderRadius: 18,
        background: 'var(--premium-soft-surface)',
        border:
          tone === 'income'
            ? '1px solid var(--premium-success-border)'
            : '1px solid var(--premium-danger-border)',
      }}
    >
      <span className="planning-metric-label">{label}</span>

      <strong
        style={{
          display: 'block',
          marginTop: 8,
          fontSize: 18,
          color:
            tone === 'income'
              ? 'var(--premium-success-color)'
              : 'var(--premium-danger-color)',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

type SetupStepProps = {
  index: number;
  title: string;
  description: string;
};

function SetupStep({ index, title, description }: SetupStepProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 16,
        background: 'var(--premium-soft-surface)',
        border: '1px solid var(--premium-soft-border)',
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 900,
          color: 'var(--premium-step-color)',
          background: 'var(--premium-step-bg)',
        }}
      >
        {index}
      </span>

      <div>
        <strong
          style={{
            display: 'block',
            marginBottom: 2,
          }}
        >
          {title}
        </strong>

        <p
          className="planning-metric-description"
          style={{
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

type InsightFeedItemProps = {
  icon: 'shield' | 'lightbulb' | 'target';
  title: string;
  description: string;
};

function InsightFeedItem({ icon, title, description }: InsightFeedItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        padding: '18px 20px',
        borderRadius: 22,
        background: 'var(--premium-soft-surface)',
        border: '1px solid var(--premium-soft-border)',
        boxShadow: 'var(--premium-soft-shadow)',
      }}
    >
      <div className="planning-metric-icon">
        {icon === 'shield' && <ShieldCheck size={18} />}
        {icon === 'lightbulb' && <Lightbulb size={18} />}
        {icon === 'target' && <Target size={18} />}
      </div>

      <div>
        <strong
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 15,
          }}
        >
          {title}
        </strong>

        <p
          className="planning-alert-item"
          style={{
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

type ChecklistActionProps = {
  done: boolean;
  title: string;
  description: string;
};

function ChecklistAction({ done, title, description }: ChecklistActionProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px minmax(0, 1fr)',
        gap: 14,
        alignItems: 'flex-start',
        padding: '18px 20px',
        borderRadius: 22,
        background: done
          ? 'var(--premium-success-surface)'
          : 'var(--premium-warning-surface)',
        border: done
          ? '1px solid var(--premium-success-border)'
          : '1px solid var(--premium-warning-border)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          color: done
            ? 'var(--premium-success-color)'
            : 'var(--premium-warning-color)',
          background: done
            ? 'var(--premium-success-icon-bg)'
            : 'var(--premium-warning-icon-bg)',
        }}
      >
        {done ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      </div>

      <div>
        <strong
          style={{
            display: 'block',
            marginBottom: 4,
          }}
        >
          {title}
        </strong>

        <p
          className="planning-alert-item"
          style={{
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

type PremiumHealthMetricProps = {
  label: string;
  value: string;
  description: string;
};

function PremiumHealthMetric({ label, value, description }: PremiumHealthMetricProps) {
  return (
    <div
      className="planning-diagnosis-card"
      style={{
        padding: 16,
      }}
    >
      <span className="planning-metric-label">{label}</span>

      <strong
        style={{
          display: 'block',
          marginTop: 8,
          fontSize: 28,
          lineHeight: 1,
        }}
      >
        {value}
      </strong>

      <p
        className="planning-metric-description"
        style={{
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}