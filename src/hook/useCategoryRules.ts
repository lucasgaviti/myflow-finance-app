import {
    useEffect,
    useState,
  } from 'react';
  
  import { supabase } from '../lib/supabase';
  
  import {
    notifyError,
    notifySuccess,
  } from '../lib/toast';
  
  import {
    useAuth,
  } from '../contexts/AuthContext';
  
  import type {
    CategoryRule,
    CreateCategoryRuleData,
    SupabaseCategoryRule,
    UpdateCategoryRuleData,
  } from '../types/categoryRule';
  
  function mapRuleFromSupabase(
    rule: SupabaseCategoryRule,
  ): CategoryRule {
    return {
      id: rule.id,
  
      userId: rule.user_id,
  
      keyword: rule.keyword,
  
      category: rule.category,
  
      createdAt: rule.created_at,
    };
  }
  
  export function useCategoryRules() {
    const { user } = useAuth();
  
    const [
      rules,
      setRules,
    ] = useState<CategoryRule[]>([]);
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    async function fetchRules() {
      if (!user) {
        setRules([]);
        setIsLoading(false);
        return;
      }
  
      setIsLoading(true);
  
      const { data, error } =
        await supabase
          .from('category_rules')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          });
  
      if (error) {
        notifyError(error.message);
        setIsLoading(false);
        return;
      }
  
      setRules(
        (data ?? []).map(
          mapRuleFromSupabase,
        ),
      );
  
      setIsLoading(false);
    }
  
    useEffect(() => {
      fetchRules();
    }, [user?.id]);
  
    async function createRule(
      rule: CreateCategoryRuleData,
    ) {
      if (!user) return null;
  
      const { data, error } =
        await supabase
          .from('category_rules')
          .upsert(
            {
              user_id: user.id,
  
              keyword:
                rule.keyword
                  .trim()
                  .toLowerCase(),
  
              category:
                rule.category,
            },
            {
              onConflict:
                'user_id,keyword',
            },
          )
          .select()
          .single();
  
      if (error) {
        notifyError(error.message);
        return null;
      }
  
      const mappedRule =
        mapRuleFromSupabase(data);
  
      setRules((prev) => {
        const withoutCurrent =
          prev.filter(
            (item) =>
              item.id !== mappedRule.id &&
              item.keyword !==
                mappedRule.keyword,
          );
  
        return [
          mappedRule,
          ...withoutCurrent,
        ];
      });
  
      notifySuccess(
        'Regra de categoria salva.',
      );
  
      return mappedRule;
    }
  
    async function updateRule(
      id: string,
      rule: UpdateCategoryRuleData,
    ) {
      if (!user) return null;
  
      const { data, error } =
        await supabase
          .from('category_rules')
          .update({
            keyword:
              rule.keyword
                ?.trim()
                .toLowerCase(),
  
            category:
              rule.category,
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
  
      if (error) {
        notifyError(error.message);
        return null;
      }
  
      const mappedRule =
        mapRuleFromSupabase(data);
  
      setRules((prev) =>
        prev.map((item) =>
          item.id === id
            ? mappedRule
            : item,
        ),
      );
  
      notifySuccess(
        'Regra atualizada.',
      );
  
      return mappedRule;
    }
  
    async function removeRule(id: string) {
      if (!user) return;
  
      const { error } =
        await supabase
          .from('category_rules')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
  
      if (error) {
        notifyError(error.message);
        return;
      }
  
      setRules((prev) =>
        prev.filter(
          (item) =>
            item.id !== id,
        ),
      );
  
      notifySuccess(
        'Regra removida.',
      );
    }
  
    return {
      rules,
  
      isLoading,
  
      fetchRules,
  
      createRule,
  
      updateRule,
  
      removeRule,
    };
  }