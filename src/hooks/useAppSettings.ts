import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAppSettings<T = any>(key: string) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setValue(null);
        } else {
          throw fetchError;
        }
      } else {
        setValue(data?.value as T ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  }, [key]);

  const update = useCallback(async (newValue: T) => {
    setSaving(true);
    setError(null);
    try {
      const { error: upsertError } = await supabase
        .from('app_settings')
        .upsert({ key, value: newValue, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (upsertError) throw upsertError;

      setValue(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [key]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { value, loading, saving, error, fetch, update };
}

export interface ProposalCoverConfig {
  capaUrl: string | null;
  textColor: string | null;
  textBgColor: string | null;
}

export function useProposalCoverConfig() {
  return useAppSettings<ProposalCoverConfig>('proposal_cover');
}
