import {
    Repeat,
    TrendingUp,
    CalendarDays,
    AlertTriangle,
  } from 'lucide-react';
  
  import Card from '../components/Card';
  import EmptyState from '../components/EmptyState';
  
  import { useTransactions } from '../hook/useTransactions';
  
  import {
    detectRecurringTransactions,
  } from '../utils/recurring/detectRecurringTransactions';
  
  import {
    formatMoney,
  } from '../utils/format';
  
  import type {
    RecurringTransaction,
  } from '../types/recurringTransaction';
  
  const frequencyLabels = {
    monthly: 'Mensal',
    weekly: 'Semanal',
    unknown: 'Indefinida',
  };
  
  const confidenceLabels = {
    high: 'Alta confiança',
    medium: 'Média confiança',
    low: 'Baixa confiança',
  };
  
  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      'pt-BR',
    );
  }
  
  function getMonthlyImpact(
    recurring: RecurringTransaction,
  ) {
    if (recurring.frequency === 'weekly') {
      return recurring.averageAmount * 4.33;
    }
  
    return recurring.averageAmount;
  }
  
  export default function RecurringTransactions() {
    const {
      transactions,
      isLoading,
    } = useTransactions();
  
    const recurringTransactions =
      detectRecurringTransactions(
        transactions,
      );
  
    const monthlyImpact =
      recurringTransactions.reduce(
        (acc, item) =>
          acc + getMonthlyImpact(item),
        0,
      );
  
    const biggestRecurring =
      recurringTransactions[0];
  
    const highConfidenceCount =
      recurringTransactions.filter(
        (item) =>
          item.confidence === 'high',
      ).length;
  
    return (
      <div>
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Recorrências
          </h1>
  
          <p className="dashboard-subtitle">
            Identifique automaticamente gastos que se repetem no seu histórico financeiro.
          </p>
        </div>
  
        <div className="planning-metrics-grid">
          <MetricCard
            label="Recorrências detectadas"
            value={String(
              recurringTransactions.length,
            )}
            description="Gastos repetidos encontrados no histórico."
          />
  
          <MetricCard
            label="Impacto mensal"
            value={formatMoney(
              monthlyImpact,
            )}
            description="Estimativa mensal das recorrências."
          />
  
          <MetricCard
            label="Alta confiança"
            value={String(
              highConfidenceCount,
            )}
            description="Recorrências com melhor consistência."
          />
  
          <MetricCard
            label="Maior recorrência"
            value={
              biggestRecurring
                ? formatMoney(
                    getMonthlyImpact(
                      biggestRecurring,
                    ),
                  )
                : formatMoney(0)
            }
            description={
              biggestRecurring
                ? biggestRecurring.merchant
                : 'Nenhuma recorrência detectada.'
            }
          />
        </div>
  
        <Card
          title="Despesas recorrentes"
          subtitle="Baseado em frequência, valor médio e repetição por período."
        >
          {isLoading ? (
            <p className="dashboard-subtitle">
              Carregando transações...
            </p>
          ) : recurringTransactions.length === 0 ? (
            <EmptyState
              icon="🔁"
              title="Nenhuma recorrência detectada"
              description="Quando o MyFlow identificar gastos repetidos em meses diferentes, eles aparecerão aqui automaticamente."
            />
          ) : (
            <div className="planning-form">
              {recurringTransactions.map(
                (item) => (
                  <RecurringCard
                    key={`${item.merchant}-${item.firstDate}`}
                    recurring={item}
                  />
                ),
              )}
            </div>
          )}
        </Card>
  
        <Card
          title="Como o MyFlow identifica recorrências?"
          subtitle="A análise é feita localmente, sem custo e sem IA externa."
        >
          <div className="planning-diagnosis-card healthy">
            <div className="planning-diagnosis-header">
              <div>
                <span className="goal-eyebrow">
                  Motor local
                </span>
  
                <div className="goal-values">
                  <strong>
                    Repetição + frequência + variação de valor
                  </strong>
  
                  <span>
                    Uma despesa é considerada recorrente quando aparece mais de uma vez, em períodos diferentes, com valor relativamente consistente.
                  </span>
                </div>
              </div>
  
              <div className="planning-metric-icon">
                <Repeat size={20} />
              </div>
            </div>
  
            <p className="planning-alert-item">
              Quanto mais meses de histórico você importar, melhor será a precisão da detecção.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  type MetricCardProps = {
    label: string;
    value: string;
    description: string;
  };
  
  function MetricCard({
    label,
    value,
    description,
  }: MetricCardProps) {
    return (
      <div className="planning-metric-card">
        <div className="planning-metric-top">
          <div>
            <span className="planning-metric-label">
              {label}
            </span>
  
            <strong className="planning-metric-value">
              {value}
            </strong>
          </div>
  
          <div className="planning-metric-icon">
            <TrendingUp size={20} />
          </div>
        </div>
  
        <p className="planning-metric-description">
          {description}
        </p>
      </div>
    );
  }
  
  type RecurringCardProps = {
    recurring: RecurringTransaction;
  };
  
  function RecurringCard({
    recurring,
  }: RecurringCardProps) {
    const monthlyImpact =
      getMonthlyImpact(recurring);
  
    return (
      <div className="planning-metric-card">
        <div className="planning-metric-top">
          <div>
            <span className="planning-metric-label">
              {frequencyLabels[recurring.frequency]}
            </span>
  
            <strong className="planning-metric-value">
              {recurring.merchant}
            </strong>
          </div>
  
          <span className="category-badge">
            {recurring.category}
          </span>
        </div>
  
        <div className="planning-metrics-grid">
          <MiniMetric
            icon={<Repeat size={16} />}
            label="Ocorrências"
            value={String(
              recurring.occurrences,
            )}
          />
  
          <MiniMetric
            icon={<TrendingUp size={16} />}
            label="Média"
            value={formatMoney(
              recurring.averageAmount,
            )}
          />
  
          <MiniMetric
            icon={<CalendarDays size={16} />}
            label="Período"
            value={`${formatDate(
              recurring.firstDate,
            )} → ${formatDate(
              recurring.lastDate,
            )}`}
          />
  
          <MiniMetric
            icon={<AlertTriangle size={16} />}
            label="Confiança"
            value={
              confidenceLabels[
                recurring.confidence
              ]
            }
          />
        </div>
  
        <p className="planning-metric-description">
          Impacto mensal estimado:{' '}
          <strong>
            {formatMoney(monthlyImpact)}
          </strong>
          . Total já registrado:{' '}
          <strong>
            {formatMoney(
              recurring.totalAmount,
            )}
          </strong>
          .
        </p>
      </div>
    );
  }
  
  type MiniMetricProps = {
    icon: React.ReactNode;
    label: string;
    value: string;
  };
  
  function MiniMetric({
    icon,
    label,
    value,
  }: MiniMetricProps) {
    return (
      <div
        className="planning-diagnosis-card"
        style={{
          padding: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {icon}
  
          <span className="planning-metric-label">
            {label}
          </span>
        </div>
  
        <strong
          style={{
            fontSize: 14,
          }}
        >
          {value}
        </strong>
      </div>
    );
  }