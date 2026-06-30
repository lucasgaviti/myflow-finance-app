import {
    useEffect,
    useState,
  } from 'react';
  
  import { supabase } from '../lib/supabase';
  
  import type {
    PlanningSettings,
    PlanningSettingsFormData,
  } from '../types/planningSettings';
  
  const defaultSettings: PlanningSettingsFormData = {
    goals_percentage: 70,
    reserve_percentage: 20,
    free_percentage: 10,
  };
  
  export function usePlanningSettings() {
    const [
      settings,
      setSettings,
    ] = useState<PlanningSettings | null>(null);
  
    const [loading, setLoading] =
      useState(true);
  
    async function fetchSettings() {
      setLoading(true);
  
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        setSettings(null);
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('planning_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
  
      if (error) {
        console.error(
          'Erro ao buscar configurações de planejamento:',
          error,
        );
      }
  
      if (!data) {
        const created =
          await saveSettings(defaultSettings);
  
        setSettings(created);
        setLoading(false);
        return;
      }
  
      setSettings(data);
      setLoading(false);
    }
  
    async function saveSettings(
      formData: PlanningSettingsFormData,
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        throw new Error(
          'Usuário não autenticado.',
        );
      }
  
      const total =
        formData.goals_percentage +
        formData.reserve_percentage +
        formData.free_percentage;
  
      if (total !== 100) {
        throw new Error(
          'A soma dos percentuais deve ser igual a 100%.',
        );
      }
  
      const payload = {
        user_id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      };
  
      const { data, error } = await supabase
        .from('planning_settings')
        .upsert(payload, {
          onConflict: 'user_id',
        })
        .select()
        .single();
  
      if (error) {
        throw error;
      }
  
      setSettings(data);
  
      return data;
    }
  
    useEffect(() => {
      fetchSettings();
    }, []);
  
    return {
      settings,
      loading,
      fetchSettings,
      saveSettings,
    };
  }