import type {
    FinancialSimulationRisk,
  } from '../utils/financialSimulator';
  
  export type FinancialScenario = {
    id: string;
  
    user_id: string;
  
    name: string;
  
    purchase_amount: number;
  
    risk: FinancialSimulationRisk;
  
    can_afford: boolean;
  
    remaining_savings_after_purchase: number;
  
    survival_months_after_purchase: number;
  
    goal_delay_months: number;
  
    summary: string;
  
    warnings: string[];
  
    created_at: string;
  };
  
  export type CreateFinancialScenarioData = {
    name: string;
  
    purchase_amount: number;
  
    risk: FinancialSimulationRisk;
  
    can_afford: boolean;
  
    remaining_savings_after_purchase: number;
  
    survival_months_after_purchase: number;
  
    goal_delay_months: number;
  
    summary: string;
  
    warnings: string[];
  };