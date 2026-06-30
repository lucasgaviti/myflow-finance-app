import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  FinancialProfile,
  FinancialProfileFormData,
} from '../types/financialProfile';

export function useFinancialProfile() {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('financial_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil financeiro:', error);
    }

    setProfile(data);
    setLoading(false);
  }

  async function saveProfile(formData: FinancialProfileFormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const payload = {
      user_id: user.id,
      ...formData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('financial_profile')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    return data;
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    fetchProfile,
    saveProfile,
  };
}