import {
    useEffect,
    useState,
  } from 'react';
  
  import { supabase } from '../lib/supabase';
  
  import type {
    CreateFinancialScenarioData,
    FinancialScenario,
  } from '../types/financialScenario';
  
  export function useFinancialScenarios() {
    const [
      scenarios,
      setScenarios,
    ] = useState<FinancialScenario[]>([]);
  
    const [loading, setLoading] =
      useState(true);
  
    async function fetchScenarios() {
      setLoading(true);
  
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        setScenarios([]);
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('financial_scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });
  
      if (error) {
        console.error(
          'Erro ao buscar cenários financeiros:',
          error,
        );
  
        setLoading(false);
        return;
      }
  
      setScenarios(
        (data ?? []).map((scenario) => ({
          ...scenario,
  
          purchase_amount:
            Number(scenario.purchase_amount),
  
          remaining_savings_after_purchase:
            Number(
              scenario.remaining_savings_after_purchase,
            ),
  
          survival_months_after_purchase:
            Number(
              scenario.survival_months_after_purchase,
            ),
  
          goal_delay_months:
            Number(scenario.goal_delay_months),
  
          warnings: Array.isArray(
            scenario.warnings,
          )
            ? scenario.warnings
            : [],
        })),
      );
  
      setLoading(false);
    }
  
    async function createScenario(
      scenario: CreateFinancialScenarioData,
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        throw new Error(
          'Usuário não autenticado.',
        );
      }
  
      const { data, error } = await supabase
        .from('financial_scenarios')
        .insert({
          user_id: user.id,
  
          name: scenario.name,
  
          purchase_amount:
            scenario.purchase_amount,
  
          risk: scenario.risk,
  
          can_afford:
            scenario.can_afford,
  
          remaining_savings_after_purchase:
            scenario.remaining_savings_after_purchase,
  
          survival_months_after_purchase:
            scenario.survival_months_after_purchase,
  
          goal_delay_months:
            scenario.goal_delay_months,
  
          summary:
            scenario.summary,
  
          warnings:
            scenario.warnings,
        })
        .select()
        .single();
  
      if (error) {
        throw error;
      }
  
      setScenarios((prev) => [
        {
          ...data,
  
          purchase_amount:
            Number(data.purchase_amount),
  
          remaining_savings_after_purchase:
            Number(
              data.remaining_savings_after_purchase,
            ),
  
          survival_months_after_purchase:
            Number(
              data.survival_months_after_purchase,
            ),
  
          goal_delay_months:
            Number(data.goal_delay_months),
  
          warnings: Array.isArray(
            data.warnings,
          )
            ? data.warnings
            : [],
        },
        ...prev,
      ]);
  
      return data;
    }
  
    async function removeScenario(id: string) {
      const { error } = await supabase
        .from('financial_scenarios')
        .delete()
        .eq('id', id);
  
      if (error) {
        throw error;
      }
  
      setScenarios((prev) =>
        prev.filter(
          (scenario) =>
            scenario.id !== id,
        ),
      );
    }
  
    useEffect(() => {
      fetchScenarios();
    }, []);
  
    return {
      scenarios,
  
      loading,
  
      fetchScenarios,
  
      createScenario,
  
      removeScenario,
    };
  }