import {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Target,
  Lightbulb,
} from 'lucide-react';

import TransactionModal from '../components/TransactionModal';
import KPICard from '../components/KPICard';
import Card from '../components/Card';
import Topbar from '../components/Topbar';
import CategoryChart from '../components/CategoryChart';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

import { useTransactions } from '../hook/useTransactions';
import { useGoals } from '../hook/useGoals';

import { formatMoney } from '../utils/format';

import type {
  Transaction,
  TransactionType,
} from '../types/transaction';

const categories = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Moradia',
  'Salário',
  'Investimentos',
  'Outros',
];

type PeriodFilter =
  | 'all'
  | 'today'
  | '7days'
  | '30days'
  | 'month';

export default function Dashboard() {
  const navigate =
    useNavigate();

  const {
    transactions,
    isLoading,
    addTransaction: addTransactionHook,
  } = useTransactions();

  const {
    goals,
    isLoading: isGoalsLoading,
  } = useGoals();

  const [showModal, setShowModal] =
    useState(false);

  const [title, setTitle] =
    useState('');

  const [value, setValue] =
    useState('');

  const [
    formattedValue,
    setFormattedValue,
  ] = useState('');

  const [type, setType] =
    useState<TransactionType>(
      'expense',
    );

  const [category, setCategory] =
    useState('Outros');

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .split('T')[0],
    );

  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>('all');

  const [startDate, setStartDate] =
    useState('');

  const [endDate, setEndDate] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const hasCustomDateFilter =
    Boolean(startDate) ||
    Boolean(endDate);

  function formatCurrency(
    input: string,
  ) {
    const numeric =
      input.replace(/\D/g, '');

    const value =
      Number(numeric) / 100;

    return value.toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      },
    );
  }

  function handleValueChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const raw =
      e.target.value.replace(
        /\D/g,
        '',
      );

    const numeric =
      Number(raw) / 100;

    setValue(String(numeric));

    setFormattedValue(
      formatCurrency(raw),
    );
  }

  function handleStartDateChange(
    value: string,
  ) {
    setStartDate(value);
    setPeriodFilter('all');
  }

  function handleEndDateChange(
    value: string,
  ) {
    setEndDate(value);
    setPeriodFilter('all');
  }

  function clearDateRange() {
    setStartDate('');
    setEndDate('');
  }

  const now = new Date();

  const filteredByPeriod =
    transactions.filter(
      (transaction) => {
        const transactionDate =
          new Date(
            transaction.date,
          );

        if (hasCustomDateFilter) {
          const start =
            startDate
              ? new Date(
                  `${startDate}T00:00:00`,
                )
              : null;

          const end =
            endDate
              ? new Date(
                  `${endDate}T23:59:59`,
                )
              : null;

          if (
            start &&
            transactionDate < start
          ) {
            return false;
          }

          if (
            end &&
            transactionDate > end
          ) {
            return false;
          }

          return true;
        }

        if (
          periodFilter === 'all'
        )
          return true;

        const diffTime =
          now.getTime() -
          transactionDate.getTime();

        const diffDays =
          diffTime /
          (1000 * 60 * 60 * 24);

        if (
          periodFilter ===
          'today'
        ) {
          return (
            transactionDate.toDateString() ===
            now.toDateString()
          );
        }

        if (
          periodFilter ===
          '7days'
        ) {
          return diffDays <= 7;
        }

        if (
          periodFilter ===
          '30days'
        ) {
          return diffDays <= 30;
        }

        if (
          periodFilter ===
          'month'
        ) {
          return (
            transactionDate.getMonth() ===
              now.getMonth() &&
            transactionDate.getFullYear() ===
              now.getFullYear()
          );
        }

        return true;
      },
    );

  function resetForm() {
    setTitle('');
    setValue('');
    setFormattedValue('');
    setType('expense');
    setCategory('Outros');

    setDate(
      new Date()
        .toISOString()
        .split('T')[0],
    );
  }

  async function addTransaction() {
    if (!title || !value)
      return;

    setIsSaving(true);

    try {
      const newTransaction: Transaction =
        {
          id: Date.now(),
          title,
          value:
            Number(value),
          type,
          category,
          date:
            new Date(
              `${date}T12:00:00`,
            ).toISOString(),
        };

      await addTransactionHook(
        newTransaction,
      );

      resetForm();

      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  }

  const categoryMap = new Map<
    string,
    number
  >();

  filteredByPeriod
    .filter(
      (transaction) =>
        transaction.type ===
        'expense',
    )
    .forEach(
      (transaction) => {
        const current =
          categoryMap.get(
            transaction.category,
          ) || 0;

        categoryMap.set(
          transaction.category,
          current +
            transaction.value,
        );
      },
    );

  const categoryData =
    Array.from(
      categoryMap.entries(),
    ).map(
      ([
        category,
        value,
      ]) => ({
        category,
        value,
      }),
    );

  const filteredIncome =
    filteredByPeriod
      .filter(
        (item) =>
          item.type ===
          'income',
      )
      .reduce(
        (acc, item) =>
          acc + item.value,
        0,
      );

  const filteredExpense =
    filteredByPeriod
      .filter(
        (item) =>
          item.type ===
          'expense',
      )
      .reduce(
        (acc, item) =>
          acc + item.value,
        0,
      );

  const filteredBalance =
    filteredIncome -
    filteredExpense;

  const totalGoalsCurrent =
    goals.reduce(
      (acc, goal) =>
        acc + goal.currentAmount,
      0,
    );

  const totalGoalsTarget =
    goals.reduce(
      (acc, goal) =>
        acc + goal.targetAmount,
      0,
    );

  const goalsProgress =
    totalGoalsTarget > 0
      ? Math.min(
          (totalGoalsCurrent /
            totalGoalsTarget) *
            100,
          100,
        )
      : 0;

  const mostAdvancedGoal =
    goals.length > 0
      ? [...goals].sort(
          (a, b) => {
            const progressA =
              a.targetAmount > 0
                ? a.currentAmount /
                  a.targetAmount
                : 0;

            const progressB =
              b.targetAmount > 0
                ? b.currentAmount /
                  b.targetAmount
                : 0;

            return progressB - progressA;
          },
        )[0]
      : null;

  const mostAdvancedGoalProgress =
    mostAdvancedGoal &&
    mostAdvancedGoal.targetAmount > 0
      ? Math.min(
          (mostAdvancedGoal.currentAmount /
            mostAdvancedGoal.targetAmount) *
            100,
          100,
        )
      : 0;

  const savingsRate =
    filteredIncome > 0
      ? (filteredBalance /
          filteredIncome) *
        100
      : 0;

  const expenseRate =
    filteredIncome > 0
      ? (filteredExpense /
          filteredIncome) *
        100
      : 0;

  const financialScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (savingsRate >= 20
            ? 40
            : savingsRate >= 10
              ? 32
              : savingsRate >= 0
                ? 22
                : 8) +
            (expenseRate <= 70
              ? 30
              : expenseRate <= 85
                ? 22
                : expenseRate <= 100
                  ? 12
                  : 4) +
            (goals.length > 0
              ? 12
              : 0) +
            (goalsProgress >= 50
              ? 12
              : goalsProgress > 0
                ? 8
                : 0) +
            (filteredByPeriod.length > 0
              ? 6
              : 0),
        ),
      ),
    );

  const healthStatus =
    financialScore >= 80
      ? 'healthy'
      : financialScore >= 55
        ? 'attention'
        : 'critical';

  const healthTitle =
    healthStatus === 'healthy'
      ? 'Saúde financeira boa'
      : healthStatus === 'attention'
        ? 'Atenção ao orçamento'
        : 'Risco financeiro';

  const healthDescription =
    healthStatus === 'healthy'
      ? 'Seu fluxo está positivo e as despesas estão sob controle.'
      : healthStatus === 'attention'
        ? 'Você ainda tem controle, mas a margem de economia está apertada.'
        : 'As despesas estão comprometendo sua capacidade de guardar dinheiro.';

  const topCategory =
    categoryData.length > 0
      ? [...categoryData].sort(
          (a, b) => b.value - a.value,
        )[0]
      : null;

  const dashboardInsights = [
    filteredIncome > 0
      ? `Você economizou ${savingsRate.toFixed(
          1,
        )}% da renda no período selecionado.`
      : 'Cadastre receitas para calcular sua taxa de economia.',
    topCategory
      ? `${topCategory.category} é a categoria com maior impacto: ${formatMoney(
          topCategory.value,
        )}.`
      : 'Ainda não há despesas suficientes para identificar categorias críticas.',
    mostAdvancedGoal
      ? `Sua meta mais avançada é ${mostAdvancedGoal.title}, com ${mostAdvancedGoalProgress.toFixed(
          0,
        )}% concluído.`
      : 'Crie uma meta para o MyFlow acompanhar seu progresso financeiro.',
  ];

  const projectedAnnualSavings =
    filteredBalance > 0
      ? filteredBalance * 12
      : 0;

  const executiveSummaryTitle =
    filteredBalance >= 0
      ? 'Seu fluxo está positivo'
      : 'Seu fluxo precisa de atenção';

  const executiveSummaryDescription =
    filteredBalance >= 0
      ? `Você recebeu ${formatMoney(filteredIncome)}, gastou ${formatMoney(filteredExpense)} e sobrou ${formatMoney(filteredBalance)} no período. Mantendo esse ritmo, a projeção anual de economia é de ${formatMoney(projectedAnnualSavings)}.`
      : `Você recebeu ${formatMoney(filteredIncome)}, gastou ${formatMoney(filteredExpense)} e fechou o período negativo em ${formatMoney(Math.abs(filteredBalance))}. Antes de novas compras, revise as categorias de maior impacto.`;

  const kpis = [
    {
      label: 'Saldo Atual',
      value:
        formatMoney(
          filteredBalance,
        ),
      variant: 'balance' as const,
      description:
        filteredBalance >= 0
          ? 'Resultado positivo no período.'
          : 'Resultado negativo no período.',
      trend:
        filteredBalance >= 0
          ? 'Fluxo positivo'
          : 'Atenção ao saldo',
    },
    {
      label: 'Entradas',
      value:
        formatMoney(
          filteredIncome,
        ),
      variant: 'income' as const,
      description:
        'Total recebido no filtro atual.',
    },
    {
      label: 'Despesas',
      value:
        formatMoney(
          filteredExpense,
        ),
      variant: 'expense' as const,
      description:
        `${expenseRate.toFixed(1)}% da renda consumida.`,
    },
    {
      label:
        'Meta Principal',
      value:
        mostAdvancedGoal
          ? `${mostAdvancedGoalProgress.toFixed(
              0,
            )}%`
          : 'Criar meta',
      variant: 'goal' as const,
      description:
        mostAdvancedGoal
          ? mostAdvancedGoal.title
          : 'Defina seu primeiro objetivo.',
      trend:
        mostAdvancedGoal
          ? 'Em andamento'
          : 'Comece agora',
    },
  ];

  if (
    isLoading ||
    isGoalsLoading
  ) {
    return <PageLoader />;
  }

  return (
    <div>
      <Topbar
        onNewTransaction={() => {
          resetForm();
          setShowModal(true);
        }}
      />

      <div className="dashboard-header dashboard-header-compact">
        <div className="period-filter-wrapper">
          <select
            className="period-select"
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(
                e.target
                  .value as PeriodFilter,
              );

              clearDateRange();
            }}
          >
            <option value="all">
              Todos os períodos
            </option>

            <option value="today">
              Hoje
            </option>

            <option value="7days">
              Últimos 7 dias
            </option>

            <option value="30days">
              Últimos 30 dias
            </option>

            <option value="month">
              Este mês
            </option>
          </select>

          <div className="custom-date-filter">
            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                handleStartDateChange(
                  e.target.value,
                )
              }
              aria-label="Data inicial"
            />

            <span>até</span>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                handleEndDateChange(
                  e.target.value,
                )
              }
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
        {kpis.map(
          (item) => (
            <KPICard
              key={
                item.label
              }
              label={
                item.label
              }
              value={
                item.value
              }
              variant={
                item.variant
              }
              description={
                item.description
              }
              trend={
                item.trend
              }
            />
          ),
        )}
      </div>

      <Card
        title="Resumo Executivo"
        subtitle="Leitura direta do período selecionado."
      >
        <div
          className={`planning-diagnosis-card ${filteredBalance >= 0 ? 'healthy' : 'critical'}`}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) auto',
            gap: 22,
            alignItems: 'center',
            padding: 22,
          }}
        >
          <div>
            <span className="goal-eyebrow">
              Resultado do período
            </span>

            <div className="goal-values">
              <strong>
                {executiveSummaryTitle}
              </strong>

              <span>
                {executiveSummaryDescription}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(110px, 1fr))',
              gap: 12,
            }}
          >
            <ExecutiveMiniMetric
              label="Entrou"
              value={formatMoney(filteredIncome)}
              tone="income"
            />

            <ExecutiveMiniMetric
              label="Saiu"
              value={formatMoney(filteredExpense)}
              tone="expense"
            />

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
        <div
          className={`planning-diagnosis-card ${healthStatus}`}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) 280px',
            gap: 32,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 20,
            }}
          >
            <div className="planning-diagnosis-header">
              <div>
                <span className="goal-eyebrow">
                  Diagnóstico do período
                </span>

                <div className="goal-values">
                  <strong>
                    {healthTitle}
                  </strong>

                  <span>
                    {healthDescription}
                  </span>
                </div>
              </div>

              <div className="planning-metric-icon">
                {healthStatus === 'healthy' && (
                  <CheckCircle2 size={20} />
                )}

                {healthStatus === 'attention' && (
                  <AlertTriangle size={20} />
                )}

                {healthStatus === 'critical' && (
                  <XCircle size={20} />
                )}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',
                gap: 14,
              }}
            >
              <PremiumHealthMetric
                label="Taxa de economia"
                value={`${savingsRate.toFixed(
                  1,
                )}%`}
                description="Quanto sobrou da renda."
              />

              <PremiumHealthMetric
                label="Renda consumida"
                value={`${expenseRate.toFixed(
                  1,
                )}%`}
                description="Quanto foi usado em despesas."
              />

              <PremiumHealthMetric
                label="Metas"
                value={`${goalsProgress.toFixed(
                  1,
                )}%`}
                description="Progresso financeiro acumulado."
              />
            </div>
          </div>

          <div
            style={{
              borderRadius: 28,
              padding: 22,
              display: 'grid',
              placeItems: 'center',
              background:
                'linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(15, 23, 42, 0.22))',
              border:
                '1px solid rgba(148, 163, 184, 0.16)',
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.18)',
            }}
          >
            <div
              style={{
                width: 194,
                height: 194,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background:
                  `conic-gradient(${
                    healthStatus === 'healthy'
                      ? '#22c55e'
                      : healthStatus === 'attention'
                        ? '#f59e0b'
                        : '#ef4444'
                  } ${financialScore * 3.6}deg, rgba(148, 163, 184, 0.18) 0deg)`,
                boxShadow:
                  '0 24px 60px rgba(15, 23, 42, 0.26)',
              }}
            >
              <div
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background:
                    'rgba(15, 23, 42, 0.94)',
                  border:
                    '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 56,
                      lineHeight: 1,
                      color: '#ffffff',
                    }}
                  >
                    {financialScore}
                  </strong>

                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 12,
                      color:
                        'rgba(226, 232, 240, 0.8)',
                    }}
                  >
                    de 100
                  </span>

                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      padding: '4px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      color:
                        healthStatus === 'healthy'
                          ? '#86efac'
                          : healthStatus === 'attention'
                            ? '#fcd34d'
                            : '#fca5a5',
                      background:
                        'rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {healthStatus === 'healthy'
                      ? 'Saudável'
                      : healthStatus === 'attention'
                        ? 'Atenção'
                        : 'Crítico'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns:
            'minmax(0, 1.25fr) minmax(320px, 0.75fr)',
          alignItems: 'stretch',
        }}
      >
        <Card
          title="Meta Principal"
          subtitle="O objetivo que mais representa seu avanço financeiro."
        >
          {mostAdvancedGoal ? (
            <div className="planning-diagnosis-card healthy">
              <div className="planning-diagnosis-header">
                <div>
                  <span className="goal-eyebrow">
                    Objetivo em destaque
                  </span>

                  <div className="goal-values">
                    <strong>
                      {mostAdvancedGoal.title}
                    </strong>

                    <span>
                      {formatMoney(
                        mostAdvancedGoal.currentAmount,
                      )}{' '}
                      acumulados de{' '}
                      {formatMoney(
                        mostAdvancedGoal.targetAmount,
                      )}
                    </span>
                  </div>
                </div>

                <div className="planning-metric-icon">
                  <Target size={20} />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    height: 18,
                    borderRadius: 999,
                    overflow: 'hidden',
                    background:
                      'rgba(148, 163, 184, 0.16)',
                    border:
                      '1px solid rgba(148, 163, 184, 0.18)',
                  }}
                >
                  <div
                    style={{
                      width: `${mostAdvancedGoalProgress}%`,
                      height: '100%',
                      borderRadius: 999,
                      background:
                        'linear-gradient(90deg, #2563eb, #22c55e)',
                      boxShadow:
                        '0 0 24px rgba(37, 99, 235, 0.45)',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                  }}
                >
                  <PremiumHealthMetric
                    label="Progresso"
                    value={`${mostAdvancedGoalProgress.toFixed(
                      1,
                    )}%`}
                    description="Da meta concluída."
                  />

                  <PremiumHealthMetric
                    label="Acumulado"
                    value={formatMoney(
                      mostAdvancedGoal.currentAmount,
                    )}
                    description="Valor já guardado."
                  />

                  <PremiumHealthMetric
                    label="Falta"
                    value={formatMoney(
                      Math.max(
                        mostAdvancedGoal.targetAmount -
                          mostAdvancedGoal.currentAmount,
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
                  <span className="goal-eyebrow">
                    Próximo passo essencial
                  </span>

                  <div className="goal-values">
                    <strong>
                      Configure sua primeira meta
                    </strong>

                    <span>
                      O MyFlow fica mais inteligente quando existe um objetivo financeiro para orientar o orçamento.
                    </span>
                  </div>
                </div>

                <div className="planning-metric-icon">
                  <Target size={20} />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  marginTop: 18,
                }}
              >
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
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    navigate('/goals')
                  }
                >
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
            <div
              style={{
                maxWidth: 380,
                margin: '0 auto',
              }}
            >
              <CategoryChart
                data={
                  categoryData
                }
              />
            </div>
          )}
        </Card>

      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <Card
          title="Insights Inteligentes"
        subtitle="Leituras locais geradas a partir do seu fluxo financeiro, sem IA paga."
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          {dashboardInsights.map(
            (insight, index) => (
              <InsightFeedItem
                key={insight}
                icon={
                  index === 0
                    ? 'shield'
                    : index === 1
                      ? 'lightbulb'
                      : 'target'
                }
                title={
                  index === 0
                    ? 'Economia do período'
                    : index === 1
                      ? 'Categoria crítica'
                      : 'Direção financeira'
                }
                description={insight}
              />
            ),
          )}
        </div>
        </Card>

        <Card
          title="Plano de Ação"
        subtitle="Checklist objetivo para melhorar seu controle financeiro."
      >
        <div
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          <ChecklistAction
            done={filteredBalance >= 0}
            title={
              filteredBalance >= 0
                ? 'Preservar saldo positivo'
                : 'Recuperar saldo do período'
            }
            description={
              filteredBalance >= 0
                ? `Você fechou o período com ${formatMoney(filteredBalance)} de sobra. Direcione parte desse valor para suas metas.`
                : `O período está negativo em ${formatMoney(Math.abs(filteredBalance))}. Revise gastos variáveis antes de assumir novas despesas.`
            }
          />

          {topCategory && (
            <ChecklistAction
              done={false}
              title={`Revisar ${topCategory.category}`}
              description={`${topCategory.category} é sua maior categoria de despesa no período, com ${formatMoney(topCategory.value)}.`}
            />
          )}

          <ChecklistAction
            done={Boolean(mostAdvancedGoal)}
            title={
              mostAdvancedGoal
                ? 'Manter ritmo da meta'
                : 'Criar uma meta financeira'
            }
            description={
              mostAdvancedGoal
                ? `${mostAdvancedGoal.title} está com ${mostAdvancedGoalProgress.toFixed(0)}% de progresso.`
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
        categories={categories}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving)
            return;

          setShowModal(false);
        }}
        onTitleChange={setTitle}
        onValueChange={
          handleValueChange
        }
        onTypeChange={setType}
        onCategoryChange={
          setCategory
        }
        onDateChange={setDate}
        onSave={addTransaction}
      />


    </div>
  );
}





type ExecutiveMiniMetricProps = {
  label: string;
  value: string;
  tone: 'income' | 'expense';
};

function ExecutiveMiniMetric({
  label,
  value,
  tone,
}: ExecutiveMiniMetricProps) {
  return (
    <div
      style={{
        minWidth: 110,
        padding: '14px 16px',
        borderRadius: 18,
        background:
          'var(--premium-soft-surface)',
        border:
          tone === 'income'
            ? '1px solid var(--premium-success-border)'
            : '1px solid var(--premium-danger-border)',
      }}
    >
      <span className="planning-metric-label">
        {label}
      </span>

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

function SetupStep({
  index,
  title,
  description,
}: SetupStepProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 16,
        background:
          'var(--premium-soft-surface)',
        border:
          '1px solid var(--premium-soft-border)',
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
          background:
            'var(--premium-step-bg)',
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

function InsightFeedItem({
  icon,
  title,
  description,
}: InsightFeedItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        padding: '18px 20px',
        borderRadius: 22,
        background:
          'var(--premium-soft-surface)',
        border:
          '1px solid var(--premium-soft-border)',
        boxShadow:
          'var(--premium-soft-shadow)',
      }}
    >
      <div className="planning-metric-icon">
        {icon === 'shield' && (
          <ShieldCheck size={18} />
        )}

        {icon === 'lightbulb' && (
          <Lightbulb size={18} />
        )}

        {icon === 'target' && (
          <Target size={18} />
        )}
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

function ChecklistAction({
  done,
  title,
  description,
}: ChecklistActionProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px minmax(0, 1fr)',
        gap: 14,
        alignItems: 'flex-start',
        padding: '18px 20px',
        borderRadius: 22,
        background:
          done
            ? 'var(--premium-success-surface)'
            : 'var(--premium-warning-surface)',
        border:
          done
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
          background:
            done
              ? 'var(--premium-success-icon-bg)'
              : 'var(--premium-warning-icon-bg)',
        }}
      >
        {done ? (
          <CheckCircle2 size={18} />
        ) : (
          <AlertTriangle size={18} />
        )}
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

function PremiumHealthMetric({
  label,
  value,
  description,
}: PremiumHealthMetricProps) {
  return (
    <div
      className="planning-diagnosis-card"
      style={{
        padding: 16,
      }}
    >
      <span className="planning-metric-label">
        {label}
      </span>

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

