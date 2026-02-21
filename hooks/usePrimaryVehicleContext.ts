import type { User } from '@supabase/supabase-js';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type VehicleContextRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  is_primary: boolean;
  created_at: string;
};

export type PrimaryVehicleContext = {
  id: string;
  make: string;
  model: string;
  year: number;
  isPrimary: boolean;
};

type UsePrimaryVehicleContextResult = {
  primaryVehicle: PrimaryVehicleContext | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function usePrimaryVehicleContext(user: User | null): UsePrimaryVehicleContextResult {
  const [primaryVehicle, setPrimaryVehicle] = useState<PrimaryVehicleContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user) {
      setPrimaryVehicle(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, is_primary, created_at')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<VehicleContextRow>();

    if (queryError) {
      setPrimaryVehicle(null);
      setLoading(false);
      setError('Could not load your primary vehicle.');
      return;
    }

    setPrimaryVehicle(
      data
        ? {
            id: data.id,
            make: data.make,
            model: data.model,
            year: data.year,
            isPrimary: data.is_primary,
          }
        : null
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  return {
    primaryVehicle,
    loading,
    error,
    refresh,
  };
}
