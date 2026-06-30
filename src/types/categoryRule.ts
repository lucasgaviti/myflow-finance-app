export type CategoryRule = {
    id: string;
  
    userId: string;
  
    keyword: string;
  
    category: string;
  
    createdAt: string;
  };
  
  export type SupabaseCategoryRule = {
    id: string;
  
    user_id: string;
  
    keyword: string;
  
    category: string;
  
    created_at: string;
  };
  
  export type CreateCategoryRuleData = {
    keyword: string;
  
    category: string;
  };
  
  export type UpdateCategoryRuleData = {
    keyword?: string;
  
    category?: string;
  };