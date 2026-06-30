export type CashFlowProjectionMonth = {
    month: number;
  
    label: string;
  
    income: number;
  
    fixedExpenses: number;
  
    monthlySurplus: number;
  
    goalsBudget: number;
  
    reserveBudget: number;
  
    freeBudget: number;
  
    projectedSavings: number;
  
    projectedGoalsContribution: number;
  };
  
  type Params = {
    months?: number;
  
    totalIncome: number;
  
    fixedExpenses: number;
  
    currentSavings: number;
  
    goalsBudget: number;
  
    reserveBudget: number;
  
    freeBudget: number;
  };
  
  function getMonthLabel(monthOffset: number) {
    const date = new Date();
  
    date.setMonth(date.getMonth() + monthOffset);
  
    return date.toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    });
  }
  
  export function generateCashFlowProjection({
    months = 12,
    totalIncome,
    fixedExpenses,
    currentSavings,
    goalsBudget,
    reserveBudget,
    freeBudget,
  }: Params): CashFlowProjectionMonth[] {
    const projection: CashFlowProjectionMonth[] = [];
  
    let projectedSavings = currentSavings;
    let projectedGoalsContribution = 0;
  
    const monthlySurplus =
      totalIncome - fixedExpenses;
  
    for (let index = 1; index <= months; index += 1) {
      projectedSavings += reserveBudget;
      projectedGoalsContribution += goalsBudget;
  
      projection.push({
        month: index,
  
        label: getMonthLabel(index - 1),
  
        income: totalIncome,
  
        fixedExpenses,
  
        monthlySurplus,
  
        goalsBudget,
  
        reserveBudget,
  
        freeBudget,
  
        projectedSavings,
  
        projectedGoalsContribution,
      });
    }
  
    return projection;
  }