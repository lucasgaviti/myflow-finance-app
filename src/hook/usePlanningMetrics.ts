import type {
    Goal,
    GoalPriority,
  } from '../types/goal';
  
  import type {
    FinancialProfileFormData,
  } from '../types/financialProfile';
  
  import type {
    PlanningSettingsFormData,
  } from '../types/planningSettings';
  
  import {
    calculateFinancialScore,
  } from '../utils/financialScore';
  
  type DiagnosisStatus =
    | 'healthy'
    | 'attention'
    | 'critical';
  
  type Params = {
    formData: FinancialProfileFormData;
    planningSettingsForm: PlanningSettingsFormData;
    goals: Goal[];
  };
  
  const priorityOrder: Record<
    GoalPriority,
    number
  > = {
    high: 1,
    medium: 2,
    low: 3,
  };
  
  function addMonthsToCurrentDate(months: number) {
    const date = new Date();
  
    date.setMonth(date.getMonth() + months);
  
    return date.toLocaleDateString('pt-BR');
  }
  
  export function usePlanningMetrics({
    formData,
    planningSettingsForm,
    goals,
  }: Params) {
    const totalIncome =
      formData.salary +
      formData.extra_income;
  
    const fixedExpenses =
      formData.rent +
      formData.energy +
      formData.water +
      formData.internet +
      formData.financing;
  
    const monthlySurplus =
      totalIncome - fixedExpenses;
  
    const positiveMonthlySurplus =
      Math.max(monthlySurplus, 0);
  
    const savingCapacity =
      totalIncome > 0
        ? (monthlySurplus / totalIncome) * 100
        : 0;
  
    const fixedExpensesPercentage =
      totalIncome > 0
        ? (fixedExpenses / totalIncome) * 100
        : 0;
  
    const survivalMonths =
      fixedExpenses > 0
        ? formData.current_savings /
          fixedExpenses
        : 0;
  
    const planningPercentageTotal =
      planningSettingsForm.goals_percentage +
      planningSettingsForm.reserve_percentage +
      planningSettingsForm.free_percentage;
  
    const goalsBudget =
      positiveMonthlySurplus *
      (planningSettingsForm.goals_percentage / 100);
  
    const reserveBudget =
      positiveMonthlySurplus *
      (planningSettingsForm.reserve_percentage / 100);
  
    const freeBudget =
      positiveMonthlySurplus *
      (planningSettingsForm.free_percentage / 100);
  
    const diagnosisIssues = [
      monthlySurplus < 0
        ? 'Sua sobra mensal está negativa. Suas despesas fixas estão maiores que sua renda.'
        : null,
      fixedExpensesPercentage > 70
        ? 'Suas despesas fixas estão acima de 70% da renda. Isso reduz sua margem para metas e imprevistos.'
        : null,
      survivalMonths > 0 && survivalMonths < 3
        ? 'Sua reserva cobre menos de 3 meses de despesas fixas.'
        : null,
      formData.current_savings === 0
        ? 'Você ainda não possui reserva financeira cadastrada.'
        : null,
    ].filter(Boolean) as string[];
  
    const diagnosisStatus: DiagnosisStatus =
      monthlySurplus < 0
        ? 'critical'
        : diagnosisIssues.length > 0
          ? 'attention'
          : 'healthy';
  
    const diagnosisTitle =
      diagnosisStatus === 'healthy'
        ? 'Saudável'
        : diagnosisStatus === 'attention'
          ? 'Atenção'
          : 'Crítico';
  
    const diagnosisDescription =
      diagnosisStatus === 'healthy'
        ? 'Seu perfil financeiro apresenta boa margem para manter metas e construir reserva.'
        : diagnosisStatus === 'attention'
          ? 'Seu perfil financeiro tem pontos que merecem acompanhamento antes de assumir novas metas.'
          : 'Seu perfil financeiro exige ajuste antes de avançar com novas metas ou compromissos.';
  
    const activeGoals = goals
      .filter(
        (goal) =>
          goal.currentAmount <
          goal.targetAmount,
      )
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) {
          return -1;
        }
  
        if (!a.isPrimary && b.isPrimary) {
          return 1;
        }
  
        const priorityDifference =
          priorityOrder[a.priority] -
          priorityOrder[b.priority];
  
        if (priorityDifference !== 0) {
          return priorityDifference;
        }
  
        return a.id - b.id;
      });
  
    const totalGoalTargetAmount =
      goals.reduce(
        (acc, goal) =>
          acc + goal.targetAmount,
        0,
      );
  
    const totalGoalCurrentAmount =
      goals.reduce(
        (acc, goal) =>
          acc + goal.currentAmount,
        0,
      );
  
    const goalsCompletionPercentage =
      totalGoalTargetAmount > 0
        ? (totalGoalCurrentAmount /
            totalGoalTargetAmount) *
          100
        : 0;
  
    const financialScore =
      calculateFinancialScore({
        monthlySurplus,
        totalIncome,
        fixedExpenses,
        currentSavings:
          formData.current_savings,
        goalsCompletionPercentage,
      });
  
    const totalMissingForGoals =
      activeGoals.reduce(
        (acc, goal) =>
          acc +
          Math.max(
            goal.targetAmount -
              goal.currentAmount,
            0,
          ),
        0,
      );
  
    const monthsToCompleteAllGoals =
      goalsBudget > 0 &&
      totalMissingForGoals > 0
        ? Math.ceil(
            totalMissingForGoals /
              goalsBudget,
          )
        : 0;
  
    let accumulatedMissingAmount = 0;
  
    const projectedGoals =
      activeGoals.map((goal) => {
        const remainingAmount =
          Math.max(
            goal.targetAmount -
              goal.currentAmount,
            0,
          );
  
        accumulatedMissingAmount +=
          remainingAmount;
  
        const monthsToComplete =
          goalsBudget > 0
            ? Math.ceil(
                accumulatedMissingAmount /
                  goalsBudget,
              )
            : null;
  
        return {
          ...goal,
          remainingAmount,
          monthsToComplete,
          projectedDate:
            monthsToComplete !== null
              ? addMonthsToCurrentDate(
                  monthsToComplete,
                )
              : null,
        };
      });
  
    const primaryGoalProjection =
      projectedGoals.find(
        (goal) => goal.isPrimary,
      );
  
    return {
      totalIncome,
  
      fixedExpenses,
  
      monthlySurplus,
  
      positiveMonthlySurplus,
  
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
  
      goalsCompletionPercentage,
  
      financialScore,
  
      totalMissingForGoals,
  
      monthsToCompleteAllGoals,
  
      projectedGoals,
  
      primaryGoalProjection,
    };
  }