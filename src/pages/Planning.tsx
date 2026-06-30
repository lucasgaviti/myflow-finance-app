import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  Save,
  Target,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Star,
  Calculator,
} from 'lucide-react';

import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import LoadingButton from '../components/LoadingButton';

import PlanningOverview from '../components/planning/PlanningOverview';
import CollapsibleSection from '../components/planning/CollapsibleSection';
import ScenarioList from '../components/planning/ScenarioList';
import SimulationResultCard from '../components/planning/SimulationResultCard';
import CashFlowProjectionCard from '../components/planning/CashFlowProjectionCard';

import { useFinancialProfile } from '../hook/useFinancialProfile';
import { useGoals } from '../hook/useGoals';
import { usePlanningSettings } from '../hook/usePlanningSettings';
import { usePlanningMetrics } from '../hook/usePlanningMetrics';
import { useFinancialScenarios } from '../hook/useFinancialScenarios';

import type { FinancialProfileFormData } from '../types/financialProfile';
import type { PlanningSettingsFormData } from '../types/planningSettings';
import type { GoalPriority } from '../types/goal';

import { formatMoney } from '../utils/format';

import {
  simulatePurchaseImpact,
  type FinancialSimulationResult,
} from '../utils/financialSimulator';

import {
  generateCashFlowProjection,
} from '../utils/cashFlowProjection';

type FinancialProfileField =
  keyof FinancialProfileFormData;

type PlanningSettingsField =
  keyof PlanningSettingsFormData;

const initialFormData: FinancialProfileFormData = {
  salary: 0,
  extra_income: 0,
  rent: 0,
  energy: 0,
  water: 0,
  internet: 0,
  financing: 0,
  current_savings: 0,
};

const initialPlanningSettings: PlanningSettingsFormData = {
  goals_percentage: 70,
  reserve_percentage: 20,
  free_percentage: 10,
};

const priorityLabels: Record<GoalPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function formatNumberForInput(value: number) {
  if (!value) return '';

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(value: string) {
  const cleaned = value
    .replace(/[^\d,.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(cleaned);

  return Number.isNaN(parsed) ? 0 : parsed;
}

export function Planning() {
  const {
    profile,
    loading,
    saveProfile,
  } = useFinancialProfile();

  const {
    settings,
    loading: loadingSettings,
    saveSettings,
  } = usePlanningSettings();

  const {
    goals,
    isLoading: isLoadingGoals,
  } = useGoals();

  const {
    scenarios,
    loading: loadingScenarios,
    createScenario,
    removeScenario,
  } = useFinancialScenarios();

  const [
    formData,
    setFormData,
  ] = useState<FinancialProfileFormData>(
    initialFormData,
  );

  const [
    displayValues,
    setDisplayValues,
  ] = useState<Record<FinancialProfileField, string>>({
    salary: '',
    extra_income: '',
    rent: '',
    energy: '',
    water: '',
    internet: '',
    financing: '',
    current_savings: '',
  });

  const [
    planningSettingsForm,
    setPlanningSettingsForm,
  ] = useState<PlanningSettingsFormData>(
    initialPlanningSettings,
  );

  const [
    purchaseAmount,
    setPurchaseAmount,
  ] = useState(0);

  const [
    formattedPurchaseAmount,
    setFormattedPurchaseAmount,
  ] = useState('');

  const [
    scenarioName,
    setScenarioName,
  ] = useState('');

  const [
    simulationResult,
    setSimulationResult,
  ] = useState<FinancialSimulationResult | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [
    savingSettings,
    setSavingSettings,
  ] = useState(false);

  const [
    savingScenario,
    setSavingScenario,
  ] = useState(false);

  const [
    deletingScenarioId,
    setDeletingScenarioId,
  ] = useState<string | null>(null);

  const {
    totalIncome,
    fixedExpenses,
    monthlySurplus,
    savingCapacity,
    fixedExpensesPercentage,
    survivalMonths,
    planningPercentageTotal,
    goalsBudget,
    reserveBudget,
    freeBudget,
    diagnosisIssues,
    diagnosisStatus,
    diagnosisTitle,
    diagnosisDescription,
    activeGoals,
    financialScore,
    totalMissingForGoals,
    monthsToCompleteAllGoals,
    projectedGoals,
    primaryGoalProjection,
  } = usePlanningMetrics({
    formData,
    planningSettingsForm,
    goals,
  });

  const cashFlowProjection =
    generateCashFlowProjection({
      months: 12,
      totalIncome,
      fixedExpenses,
      currentSavings:
        formData.current_savings,
      goalsBudget,
      reserveBudget,
      freeBudget,
    });

  useEffect(() => {
    if (!profile) return;

    const nextFormData = {
      salary: profile.salary,
      extra_income: profile.extra_income,
      rent: profile.rent,
      energy: profile.energy,
      water: profile.water,
      internet: profile.internet,
      financing: profile.financing,
      current_savings:
        profile.current_savings,
    };

    setFormData(nextFormData);

    setDisplayValues({
      salary: formatNumberForInput(
        nextFormData.salary,
      ),
      extra_income: formatNumberForInput(
        nextFormData.extra_income,
      ),
      rent: formatNumberForInput(
        nextFormData.rent,
      ),
      energy: formatNumberForInput(
        nextFormData.energy,
      ),
      water: formatNumberForInput(
        nextFormData.water,
      ),
      internet: formatNumberForInput(
        nextFormData.internet,
      ),
      financing: formatNumberForInput(
        nextFormData.financing,
      ),
      current_savings:
        formatNumberForInput(
          nextFormData.current_savings,
        ),
    });
  }, [profile]);

  useEffect(() => {
    if (!settings) return;

    setPlanningSettingsForm({
      goals_percentage:
        settings.goals_percentage,
      reserve_percentage:
        settings.reserve_percentage,
      free_percentage:
        settings.free_percentage,
    });
  }, [settings]);

  function handleChange(
    field: FinancialProfileField,
    value: string,
  ) {
    setDisplayValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFormData((prev) => ({
      ...prev,
      [field]: parseCurrencyInput(value),
    }));
  }

  function handleBlur(
    field: FinancialProfileField,
  ) {
    setDisplayValues((prev) => ({
      ...prev,
      [field]: formatNumberForInput(
        formData[field],
      ),
    }));
  }

  function handlePurchaseAmountChange(
    value: string,
  ) {
    setFormattedPurchaseAmount(value);
    setPurchaseAmount(
      parseCurrencyInput(value),
    );
    setSimulationResult(null);
  }

  function handlePurchaseAmountBlur() {
    setFormattedPurchaseAmount(
      formatNumberForInput(
        purchaseAmount,
      ),
    );
  }

  function handlePlanningSettingsChange(
    field: PlanningSettingsField,
    value: string,
  ) {
    const parsed = Number(value);

    setPlanningSettingsForm((prev) => ({
      ...prev,
      [field]: Number.isNaN(parsed)
        ? 0
        : parsed,
    }));
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);

    try {
      await saveProfile(formData);

      alert(
        'Perfil financeiro salvo com sucesso!',
      );
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao salvar perfil financeiro.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlanningSettings(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (planningPercentageTotal !== 100) {
      alert(
        'A soma dos percentuais precisa ser igual a 100%.',
      );

      return;
    }

    setSavingSettings(true);

    try {
      await saveSettings(
        planningSettingsForm,
      );

      alert(
        'Motor de planejamento salvo com sucesso!',
      );
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao salvar motor de planejamento.',
      );
    } finally {
      setSavingSettings(false);
    }
  }

  function handleSimulatePurchase() {
    if (purchaseAmount <= 0) {
      alert(
        'Informe um valor de compra válido.',
      );

      return;
    }

    const result =
      simulatePurchaseImpact({
        purchaseAmount,
        currentSavings:
          formData.current_savings,
        fixedExpenses,
        monthlyGoalsBudget:
          goalsBudget,
        primaryGoalRemainingAmount:
          primaryGoalProjection?.remainingAmount ??
          null,
      });

    setSimulationResult(result);
  }

  async function handleSaveScenario() {
    if (!simulationResult) {
      alert(
        'Faça uma simulação antes de salvar o cenário.',
      );

      return;
    }

    if (!scenarioName.trim()) {
      alert(
        'Informe um nome para o cenário.',
      );

      return;
    }

    setSavingScenario(true);

    try {
      await createScenario({
        name: scenarioName.trim(),

        purchase_amount:
          simulationResult.purchaseAmount,

        risk:
          simulationResult.risk,

        can_afford:
          simulationResult.canAfford,

        remaining_savings_after_purchase:
          simulationResult.remainingSavingsAfterPurchase,

        survival_months_after_purchase:
          simulationResult.survivalMonthsAfterPurchase,

        goal_delay_months:
          simulationResult.goalDelayMonths,

        summary:
          simulationResult.summary,

        warnings:
          simulationResult.warnings,
      });

      setScenarioName('');
      setFormattedPurchaseAmount('');
      setPurchaseAmount(0);
      setSimulationResult(null);

      alert(
        'Cenário salvo com sucesso!',
      );
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao salvar cenário financeiro.',
      );
    } finally {
      setSavingScenario(false);
    }
  }

  async function handleDeleteScenario(id: string) {
    setDeletingScenarioId(id);

    try {
      await removeScenario(id);
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao excluir cenário financeiro.',
      );
    } finally {
      setDeletingScenarioId(null);
    }
  }

  if (loading || loadingSettings) {
    return (
      <div className="planning-page">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Planejamento Financeiro
          </h1>

          <p className="dashboard-subtitle">
            Carregando seu planejamento financeiro...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Planejamento Financeiro
        </h1>

        <p className="dashboard-subtitle">
          Visão consolidada da sua saúde financeira, metas, cenários e projeção futura.
        </p>
      </div>

      <PlanningOverview
        score={financialScore.score}
        scoreTitle={financialScore.title}
        savingCapacity={savingCapacity}
        currentSavings={formData.current_savings}
        primaryGoalTitle={
          primaryGoalProjection?.title
        }
        primaryGoalRemainingAmount={
          primaryGoalProjection?.remainingAmount
        }
        primaryGoalMonths={
          primaryGoalProjection?.monthsToComplete
        }
      />

      <Card
        title="Diagnóstico financeiro"
        subtitle="Análise automática baseada no seu perfil financeiro atual."
      >
        <div
          className={`planning-diagnosis-card ${diagnosisStatus}`}
        >
          <div className="planning-diagnosis-header">
            <div>
              <span className="goal-eyebrow">
                Status geral
              </span>

              <div className="goal-values">
                <strong>
                  {diagnosisTitle}
                </strong>

                <span>
                  {diagnosisDescription}
                </span>
              </div>
            </div>

            <div className="planning-metric-icon">
              {diagnosisStatus ===
                'healthy' && (
                <CheckCircle2 size={20} />
              )}

              {diagnosisStatus ===
                'attention' && (
                <AlertTriangle size={20} />
              )}

              {diagnosisStatus ===
                'critical' && (
                <XCircle size={20} />
              )}
            </div>
          </div>

          {diagnosisIssues.length > 0 ? (
            <div className="planning-alert-list">
              {diagnosisIssues.map((issue) => (
                <p
                  key={issue}
                  className="planning-alert-item"
                >
                  • {issue}
                </p>
              ))}
            </div>
          ) : (
            <p className="planning-alert-item">
              Nenhum alerta financeiro relevante identificado neste momento.
            </p>
          )}

          {financialScore.recommendations.length > 0 && (
            <div className="planning-alert-list">
              {financialScore.recommendations.map((recommendation) => (
                <p
                  key={recommendation}
                  className="planning-alert-item"
                >
                  • {recommendation}
                </p>
              ))}
            </div>
          )}
        </div>
      </Card>

      {primaryGoalProjection && (
        <Card
          title="Objetivo principal"
          subtitle="Resumo da sua meta mais importante no planejamento atual."
        >
          <div className="planning-diagnosis-card healthy">
            <div className="planning-diagnosis-header">
              <div>
                <span className="goal-eyebrow">
                  Meta principal
                </span>

                <div className="goal-values">
                  <strong>
                    {primaryGoalProjection.title}
                  </strong>

                  <span>
                    Faltam{' '}
                    {formatMoney(
                      primaryGoalProjection.remainingAmount,
                    )}
                  </span>
                </div>
              </div>

              <div className="planning-metric-icon">
                <Star size={20} />
              </div>
            </div>

            <p className="planning-alert-item">
              Com{' '}
              {formatMoney(goalsBudget)} por mês destinado a metas, sua meta principal será atingida em aproximadamente{' '}
              <strong>
                {primaryGoalProjection.monthsToComplete}{' '}
                meses
              </strong>
              , com previsão para{' '}
              <strong>
                {primaryGoalProjection.projectedDate}
              </strong>
              .
            </p>
          </div>
        </Card>
      )}

      <Card
        title="Fluxo de caixa futuro"
        subtitle="Projeção de 12 meses considerando renda, despesas, reserva e metas."
      >
        <CashFlowProjectionCard
          projection={cashFlowProjection}
        />
      </Card>

      <Card
        title="Simulador financeiro"
        subtitle="Simule uma compra e salve cenários para comparar decisões futuras."
      >
        <div className="planning-form">
          <div className="planning-input-grid two">
            <MoneyInput
              label="Valor da compra"
              value={formattedPurchaseAmount}
              onChange={handlePurchaseAmountChange}
              onBlur={handlePurchaseAmountBlur}
            />

            <label className="planning-input-field">
              <span className="planning-input-label">
                Nome do cenário
              </span>

              <input
                className="search-input"
                placeholder="Ex: Troca de celular"
                value={scenarioName}
                onChange={(event) =>
                  setScenarioName(
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="planning-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={handleSimulatePurchase}
            >
              <Calculator size={18} />
              Simular impacto
            </button>
          </div>

          {simulationResult && (
            <>
              <SimulationResultCard
                result={simulationResult}
              />

              <div className="planning-actions">
                <LoadingButton
                  className="secondary-btn"
                  isLoading={savingScenario}
                  onClick={handleSaveScenario}
                >
                  {savingScenario
                    ? 'Salvando cenário...'
                    : 'Salvar cenário'}
                </LoadingButton>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card
        title="Cenários salvos"
        subtitle="Compare simulações anteriores e avalie decisões financeiras."
      >
        <ScenarioList
          scenarios={scenarios}
          loading={loadingScenarios}
          deletingId={deletingScenarioId}
          onDelete={handleDeleteScenario}
        />
      </Card>

      <CollapsibleSection
        title="Configurações"
        subtitle="Edite seu perfil financeiro e a distribuição da sobra mensal."
      >
        <div className="planning-form">
          <section className="planning-section">
            <div className="planning-section-header">
              <span className="goal-eyebrow">
                Perfil financeiro
              </span>

              <span className="planning-input-label">
                Base dos cálculos do planejamento
              </span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="planning-form"
            >
              <section className="planning-section">
                <div className="planning-section-header">
                  <span className="goal-eyebrow">
                    Receitas mensais
                  </span>
                </div>

                <div className="planning-input-grid two">
                  <MoneyInput
                    label="Salário"
                    value={displayValues.salary}
                    onChange={(value) =>
                      handleChange(
                        'salary',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur('salary')
                    }
                  />

                  <MoneyInput
                    label="Renda extra"
                    value={
                      displayValues.extra_income
                    }
                    onChange={(value) =>
                      handleChange(
                        'extra_income',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur(
                        'extra_income',
                      )
                    }
                  />
                </div>
              </section>

              <section className="planning-section">
                <div className="planning-section-header">
                  <span className="goal-eyebrow">
                    Despesas fixas
                  </span>
                </div>

                <div className="planning-input-grid five">
                  <MoneyInput
                    label="Aluguel"
                    value={displayValues.rent}
                    onChange={(value) =>
                      handleChange(
                        'rent',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur('rent')
                    }
                  />

                  <MoneyInput
                    label="Energia"
                    value={displayValues.energy}
                    onChange={(value) =>
                      handleChange(
                        'energy',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur('energy')
                    }
                  />

                  <MoneyInput
                    label="Água"
                    value={displayValues.water}
                    onChange={(value) =>
                      handleChange(
                        'water',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur('water')
                    }
                  />

                  <MoneyInput
                    label="Internet"
                    value={
                      displayValues.internet
                    }
                    onChange={(value) =>
                      handleChange(
                        'internet',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur(
                        'internet',
                      )
                    }
                  />

                  <MoneyInput
                    label="Financiamento"
                    value={
                      displayValues.financing
                    }
                    onChange={(value) =>
                      handleChange(
                        'financing',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur(
                        'financing',
                      )
                    }
                  />
                </div>
              </section>

              <section className="planning-section">
                <div className="planning-section-header">
                  <span className="goal-eyebrow">
                    Reserva financeira
                  </span>
                </div>

                <div className="planning-input-grid two">
                  <MoneyInput
                    label="Reserva atual"
                    value={
                      displayValues.current_savings
                    }
                    onChange={(value) =>
                      handleChange(
                        'current_savings',
                        value,
                      )
                    }
                    onBlur={() =>
                      handleBlur(
                        'current_savings',
                      )
                    }
                  />
                </div>
              </section>

              <div className="planning-actions">
                <LoadingButton
                  className="primary-btn"
                  isLoading={saving}
                >
                  <Save size={18} />
                  {saving
                    ? 'Salvando...'
                    : 'Salvar perfil'}
                </LoadingButton>
              </div>
            </form>
          </section>

          <section className="planning-section">
            <div className="planning-section-header">
              <span className="goal-eyebrow">
                Motor de planejamento
              </span>

              <span className="planning-input-label">
                Total: {planningPercentageTotal}%
              </span>
            </div>

            <form
              onSubmit={
                handleSavePlanningSettings
              }
              className="planning-form"
            >
              <div className="planning-input-grid two">
                <PercentInput
                  label="Metas"
                  value={
                    planningSettingsForm.goals_percentage
                  }
                  onChange={(value) =>
                    handlePlanningSettingsChange(
                      'goals_percentage',
                      value,
                    )
                  }
                />

                <PercentInput
                  label="Reserva"
                  value={
                    planningSettingsForm.reserve_percentage
                  }
                  onChange={(value) =>
                    handlePlanningSettingsChange(
                      'reserve_percentage',
                      value,
                    )
                  }
                />

                <PercentInput
                  label="Uso livre"
                  value={
                    planningSettingsForm.free_percentage
                  }
                  onChange={(value) =>
                    handlePlanningSettingsChange(
                      'free_percentage',
                      value,
                    )
                  }
                />
              </div>

              <div className="planning-actions">
                <LoadingButton
                  className="primary-btn"
                  isLoading={savingSettings}
                >
                  <SlidersHorizontal size={18} />
                  {savingSettings
                    ? 'Salvando...'
                    : 'Salvar motor'}
                </LoadingButton>
              </div>
            </form>
          </section>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Análise avançada"
        subtitle="Detalhamento de indicadores e projeção individual das metas."
      >
        <div className="planning-form">
          <div className="planning-metrics-grid">
            <CompactMetricCard
              label="Receita mensal"
              value={formatMoney(totalIncome)}
              description="Salário mais rendas extras."
            />

            <CompactMetricCard
              label="Despesas fixas"
              value={formatMoney(fixedExpenses)}
              description={`${fixedExpensesPercentage.toFixed(1)}% da renda mensal.`}
            />

            <CompactMetricCard
              label="Sobra mensal"
              value={formatMoney(monthlySurplus)}
              description="Valor após despesas fixas."
            />

            <CompactMetricCard
              label="Para metas"
              value={formatMoney(goalsBudget)}
              description={`${planningSettingsForm.goals_percentage}% da sobra mensal.`}
            />

            <CompactMetricCard
              label="Para reserva"
              value={formatMoney(reserveBudget)}
              description={`${planningSettingsForm.reserve_percentage}% da sobra mensal.`}
            />

            <CompactMetricCard
              label="Uso livre"
              value={formatMoney(freeBudget)}
              description={`${planningSettingsForm.free_percentage}% da sobra mensal.`}
            />

            <CompactMetricCard
              label="Sobrevivência financeira"
              value={`${survivalMonths.toFixed(
                1,
              )} meses`}
              description="Cobertura por despesas fixas."
            />
          </div>

          <Card
            title="Projeção das metas"
            subtitle="Estimativa sequencial baseada em objetivo principal e prioridade."
          >
            {isLoadingGoals ? (
              <p className="dashboard-subtitle">
                Carregando metas...
              </p>
            ) : activeGoals.length === 0 ? (
              <EmptyState
                icon="🎯"
                title="Nenhuma meta pendente"
                description="Crie uma meta financeira ou aguarde uma meta existente ter valor pendente para projetar o prazo."
              />
            ) : goalsBudget <= 0 ? (
              <EmptyState
                icon="⚠️"
                title="Valor para metas insuficiente"
                description="Com os dados atuais, não existe valor positivo destinado para metas."
              />
            ) : (
              <div className="planning-form">
                <div className="planning-diagnosis-card">
                  <div className="planning-diagnosis-header">
                    <div>
                      <span className="goal-eyebrow">
                        Resumo geral
                      </span>

                      <div className="goal-values">
                        <strong>
                          {formatMoney(
                            totalMissingForGoals,
                          )}
                        </strong>

                        <span>
                          pendente em metas
                        </span>
                      </div>
                    </div>

                    <div className="planning-metric-icon">
                      <CalendarDays size={20} />
                    </div>
                  </div>

                  <p className="planning-alert-item">
                    Com{' '}
                    {formatMoney(goalsBudget)} por mês destinado a metas, seguindo a ordem de objetivo principal e prioridade, você concluiria todas as metas pendentes em aproximadamente{' '}
                    <strong>
                      {monthsToCompleteAllGoals}{' '}
                      meses
                    </strong>
                    .
                  </p>
                </div>

                <div className="planning-metrics-grid">
                  {projectedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="planning-metric-card"
                    >
                      <div className="planning-metric-top">
                        <div>
                          <span className="planning-metric-label">
                            {goal.isPrimary
                              ? 'Objetivo principal'
                              : `Prioridade ${priorityLabels[goal.priority]}`}
                          </span>

                          <strong className="planning-metric-value">
                            {goal.title}
                          </strong>
                        </div>

                        <div className="planning-metric-icon">
                          {goal.isPrimary ? (
                            <Star size={20} />
                          ) : (
                            <Target size={20} />
                          )}
                        </div>
                      </div>

                      <p className="planning-metric-description">
                        Faltam{' '}
                        <strong>
                          {formatMoney(
                            goal.remainingAmount,
                          )}
                        </strong>
                        . Considerando as metas anteriores da fila, prazo estimado:{' '}
                        <strong>
                          {goal.monthsToComplete}{' '}
                          meses
                        </strong>
                        . Previsão:{' '}
                        <strong>
                          {goal.projectedDate}
                        </strong>
                        .
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </CollapsibleSection>
    </div>
  );
}

type MoneyInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function MoneyInput({
  label,
  value,
  onChange,
  onBlur,
}: MoneyInputProps) {
  return (
    <label className="planning-input-field">
      <span className="planning-input-label">
        {label}
      </span>

      <div className="planning-input-wrapper">
        <span className="planning-input-prefix">
          R$
        </span>

        <input
          className="search-input planning-input"
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onBlur={onBlur}
        />
      </div>
    </label>
  );
}

type PercentInputProps = {
  label: string;
  value: number;
  onChange: (value: string) => void;
};

function PercentInput({
  label,
  value,
  onChange,
}: PercentInputProps) {
  return (
    <label className="planning-input-field">
      <span className="planning-input-label">
        {label}
      </span>

      <div className="planning-input-wrapper">
        <input
          className="search-input planning-input"
          type="number"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />

        <span
          className="planning-input-prefix"
          style={{
            left: 'auto',
            right: '16px',
          }}
        >
          %
        </span>
      </div>
    </label>
  );
}

type CompactMetricCardProps = {
  label: string;
  value: string;
  description: string;
};

function CompactMetricCard({
  label,
  value,
  description,
}: CompactMetricCardProps) {
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
      </div>

      <p className="planning-metric-description">
        {description}
      </p>
    </div>
  );
}
