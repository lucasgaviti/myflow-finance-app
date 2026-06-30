export interface PlanningSettings {
    id: string;
    user_id: string;
  
    goals_percentage: number;
    reserve_percentage: number;
    free_percentage: number;
  
    created_at: string;
    updated_at: string;
  }
  
  export interface PlanningSettingsFormData {
    goals_percentage: number;
    reserve_percentage: number;
    free_percentage: number;
  }