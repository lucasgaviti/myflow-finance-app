export interface FinancialProfile {
    id: string;
    user_id: string;
  
    salary: number;
    extra_income: number;
  
    rent: number;
    energy: number;
    water: number;
    internet: number;
    financing: number;
  
    current_savings: number;
  
    created_at: string;
    updated_at: string;
  }
  
  export interface FinancialProfileFormData {
    salary: number;
    extra_income: number;
  
    rent: number;
    energy: number;
    water: number;
    internet: number;
    financing: number;
  
    current_savings: number;
  }