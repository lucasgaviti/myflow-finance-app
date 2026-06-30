export type FinancialSimulationRisk =
  | 'low'
  | 'medium'
  | 'high';

export type FinancialSimulationResult = {
  purchaseAmount: number;

  canAfford: boolean;

  risk: FinancialSimulationRisk;

  remainingSavingsAfterPurchase: number;

  survivalMonthsAfterPurchase: number;

  goalDelayMonths: number;

  summary: string;

  warnings: string[];
};

type Params = {
  purchaseAmount: number;

  currentSavings: number;

  fixedExpenses: number;

  monthlyGoalsBudget: number;

  primaryGoalRemainingAmount?: number | null;
};

export function simulatePurchaseImpact({
  purchaseAmount,
  currentSavings,
  fixedExpenses,
  monthlyGoalsBudget,
  primaryGoalRemainingAmount,
}: Params): FinancialSimulationResult {
  const remainingSavingsAfterPurchase =
    currentSavings - purchaseAmount;

  const survivalMonthsAfterPurchase =
    fixedExpenses > 0
      ? Math.max(
          remainingSavingsAfterPurchase,
          0,
        ) / fixedExpenses
      : 0;

  const canAfford =
    remainingSavingsAfterPurchase >= 0;

  const goalDelayMonths =
    monthlyGoalsBudget > 0
      ? Math.ceil(
          purchaseAmount /
            monthlyGoalsBudget,
        )
      : 0;

  const warnings: string[] = [];

  if (!canAfford) {
    warnings.push(
      'A compra é maior do que sua reserva atual.',
    );
  }

  if (survivalMonthsAfterPurchase < 3) {
    warnings.push(
      'Após a compra, sua reserva ficaria abaixo de 3 meses de despesas fixas.',
    );
  }

  if (
    primaryGoalRemainingAmount &&
    primaryGoalRemainingAmount > 0 &&
    goalDelayMonths > 0
  ) {
    warnings.push(
      `Sua meta principal pode atrasar aproximadamente ${goalDelayMonths} meses.`,
    );
  }

  let risk: FinancialSimulationRisk = 'low';

  if (
    !canAfford ||
    survivalMonthsAfterPurchase < 1
  ) {
    risk = 'high';
  } else if (
    survivalMonthsAfterPurchase < 3 ||
    goalDelayMonths >= 3
  ) {
    risk = 'medium';
  }

  const summary =
    risk === 'low'
      ? 'A compra parece viável dentro do seu cenário atual.'
      : risk === 'medium'
        ? 'A compra exige atenção, pois pode reduzir sua segurança financeira.'
        : 'A compra apresenta alto risco para seu planejamento atual.';

  return {
    purchaseAmount,

    canAfford,

    risk,

    remainingSavingsAfterPurchase,

    survivalMonthsAfterPurchase,

    goalDelayMonths,

    summary,

    warnings,
  };
}