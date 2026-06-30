export type FinancialScoreResult = {
    score: number;
  
    level:
      | 'critical'
      | 'attention'
      | 'good'
      | 'excellent';
  
    title: string;
  
    recommendations: string[];
  };
  
  type Params = {
    monthlySurplus: number;
  
    totalIncome: number;
  
    fixedExpenses: number;
  
    currentSavings: number;
  
    goalsCompletionPercentage: number;
  };
  
  export function calculateFinancialScore({
    monthlySurplus,
    totalIncome,
    fixedExpenses,
    currentSavings,
    goalsCompletionPercentage,
  }: Params): FinancialScoreResult {
    let score = 0;
  
    const recommendations: string[] = [];
  
    const savingRate =
      totalIncome > 0
        ? (monthlySurplus / totalIncome) * 100
        : 0;
  
    const fixedExpenseRate =
      totalIncome > 0
        ? (fixedExpenses / totalIncome) * 100
        : 100;
  
    const emergencyMonths =
      fixedExpenses > 0
        ? currentSavings / fixedExpenses
        : 0;
  
    // -------------------------
    // SOBRA MENSAL
    // -------------------------
  
    if (savingRate >= 30) {
      score += 25;
    } else if (savingRate >= 20) {
      score += 20;
    } else if (savingRate >= 10) {
      score += 10;
    } else if (savingRate > 0) {
      score += 5;
  
      recommendations.push(
        'Aumente sua capacidade de economia mensal.',
      );
    } else {
      recommendations.push(
        'Suas despesas estão consumindo toda sua renda.',
      );
    }
  
    // -------------------------
    // DESPESAS FIXAS
    // -------------------------
  
    if (fixedExpenseRate <= 50) {
      score += 25;
    } else if (fixedExpenseRate <= 60) {
      score += 20;
    } else if (fixedExpenseRate <= 70) {
      score += 15;
    } else if (fixedExpenseRate <= 80) {
      score += 5;
  
      recommendations.push(
        'Suas despesas fixas estão elevadas.',
      );
    } else {
      recommendations.push(
        'Suas despesas fixas representam alto risco financeiro.',
      );
    }
  
    // -------------------------
    // RESERVA
    // -------------------------
  
    if (emergencyMonths >= 12) {
      score += 25;
    } else if (emergencyMonths >= 6) {
      score += 20;
    } else if (emergencyMonths >= 3) {
      score += 10;
  
      recommendations.push(
        'Continue fortalecendo sua reserva financeira.',
      );
    } else {
      recommendations.push(
        'Priorize a formação da reserva de emergência.',
      );
    }
  
    // -------------------------
    // METAS
    // -------------------------
  
    if (goalsCompletionPercentage >= 80) {
      score += 25;
    } else if (goalsCompletionPercentage >= 60) {
      score += 20;
    } else if (goalsCompletionPercentage >= 40) {
      score += 10;
    } else if (goalsCompletionPercentage >= 20) {
      score += 5;
    } else {
      recommendations.push(
        'Seus objetivos financeiros ainda estão em estágio inicial.',
      );
    }
  
    score = Math.max(
      0,
      Math.min(score, 100),
    );
  
    if (score >= 85) {
      return {
        score,
        level: 'excellent',
        title: 'Excelente',
        recommendations,
      };
    }
  
    if (score >= 70) {
      return {
        score,
        level: 'good',
        title: 'Bom',
        recommendations,
      };
    }
  
    if (score >= 50) {
      return {
        score,
        level: 'attention',
        title: 'Atenção',
        recommendations,
      };
    }
  
    return {
      score,
      level: 'critical',
      title: 'Crítico',
      recommendations,
    };
  }