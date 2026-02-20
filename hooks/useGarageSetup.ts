import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMakesByYear, fetchModelsByYearMake, NhtsaMake, NhtsaModel } from '../lib/nhtsa';
import { ensureUserProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

const START_YEAR = 1985;

type SavedVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  isPrimary: boolean;
};

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  is_primary: boolean;
  created_at: string;
};

type UseGarageSetupResult = {
  year: string;
  yearOptions: string[];
  makes: NhtsaMake[];
  models: NhtsaModel[];
  selectedMakeId: number | null;
  selectedModelId: number | null;
  savedVehicles: SavedVehicle[];
  primaryVehicle: SavedVehicle | null;
  loadingMakes: boolean;
  loadingModels: boolean;
  loadingSavedVehicles: boolean;
  savingVehicle: boolean;
  error: string | null;
  successMessage: string | null;
  canSaveVehicle: boolean;
  hasFreeVehicleLimitReached: boolean;
  setYear: (value: string) => void;
  setSelectedMakeId: (value: number | null) => void;
  setSelectedModelId: (value: number | null) => void;
  saveSelectedVehicle: () => Promise<void>;
};

function buildYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let value = currentYear; value >= START_YEAR; value -= 1) {
    years.push(String(value));
  }
  return years;
}

const YEAR_OPTIONS = buildYearOptions();

export function useGarageSetup(user: User | null): UseGarageSetupResult {
  const [year, setYearState] = useState<string>('');
  const [makes, setMakes] = useState<NhtsaMake[]>([]);
  const [models, setModels] = useState<NhtsaModel[]>([]);
  const [selectedMakeId, setSelectedMakeIdState] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelIdState] = useState<number | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [loadingMakes, setLoadingMakes] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [loadingSavedVehicles, setLoadingSavedVehicles] = useState<boolean>(true);
  const [savingVehicle, setSavingVehicle] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedMake = useMemo(
    (): NhtsaMake | null => makes.find((item) => item.makeId === selectedMakeId) ?? null,
    [makes, selectedMakeId]
  );

  const selectedModel = useMemo(
    (): NhtsaModel | null =>
      models.find((item) => item.modelId === selectedModelId) ?? null,
    [models, selectedModelId]
  );

  const primaryVehicle = useMemo(
    (): SavedVehicle | null => savedVehicles.find((item) => item.isPrimary) ?? savedVehicles[0] ?? null,
    [savedVehicles]
  );

  const hasFreeVehicleLimitReached = savedVehicles.length >= 1;
  const canSaveVehicle = Boolean(
    user &&
      year.length === 4 &&
      selectedMake &&
      selectedModel &&
      !savingVehicle
  );

  const loadSavedVehicles = useCallback(async (): Promise<void> => {
    if (!user) {
      setSavedVehicles([]);
      setYearState('');
      setSelectedMakeIdState(null);
      setSelectedModelIdState(null);
      setLoadingSavedVehicles(false);
      return;
    }

    setLoadingSavedVehicles(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, is_primary, created_at')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .returns<VehicleRow[]>();

    if (fetchError) {
      setError('Could not load saved vehicles.');
      setLoadingSavedVehicles(false);
      return;
    }

    const rows = data ?? [];
    const mapped: SavedVehicle[] = rows.map((item) => ({
      id: item.id,
      make: item.make,
      model: item.model,
      year: item.year,
      isPrimary: item.is_primary,
    }));

    setSavedVehicles(mapped);
    setLoadingSavedVehicles(false);
  }, [user]);

  useEffect(() => {
    void loadSavedVehicles();
  }, [loadSavedVehicles]);

  useEffect(() => {
    let isMounted = true;

    const loadMakes = async (): Promise<void> => {
      if (year.length !== 4) {
        setMakes([]);
        setModels([]);
        setSelectedMakeIdState(null);
        setSelectedModelIdState(null);
        return;
      }

      setLoadingMakes(true);
      setError(null);
      setModels([]);
      setSelectedMakeIdState(null);
      setSelectedModelIdState(null);

      try {
        const results = (await fetchMakesByYear(year)).sort((a, b) =>
          a.makeName.localeCompare(b.makeName)
        );
        if (!isMounted) return;
        setMakes(results);

        if (results.length === 0) {
          setError('No makes found for that year.');
        }
      } catch (fetchErr) {
        if (!isMounted) return;
        setError(fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch makes.');
      } finally {
        if (isMounted) {
          setLoadingMakes(false);
        }
      }
    };

    void loadMakes();
    return () => {
      isMounted = false;
    };
  }, [year]);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async (): Promise<void> => {
      if (!selectedMakeId || year.length !== 4) {
        setModels([]);
        setSelectedModelIdState(null);
        return;
      }

      setLoadingModels(true);
      setError(null);
      setSelectedModelIdState(null);

      try {
        const results = (await fetchModelsByYearMake(year, selectedMakeId)).sort((a, b) =>
          a.modelName.localeCompare(b.modelName)
        );
        if (!isMounted) return;
        setModels(results);

        if (results.length === 0) {
          setError('No models found for that make/year.');
        }
      } catch (fetchErr) {
        if (!isMounted) return;
        setError(fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch models.');
      } finally {
        if (isMounted) {
          setLoadingModels(false);
        }
      }
    };

    void loadModels();
    return () => {
      isMounted = false;
    };
  }, [selectedMakeId, year]);

  const setYear = useCallback((value: string): void => {
    setYearState(value);
    setSuccessMessage(null);
  }, []);

  const setSelectedMakeId = useCallback((value: number | null): void => {
    setSelectedMakeIdState(value);
    setSuccessMessage(null);
  }, []);

  const setSelectedModelId = useCallback((value: number | null): void => {
    setSelectedModelIdState(value);
    setSuccessMessage(null);
  }, []);

  const saveSelectedVehicle = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('Sign in before saving a vehicle.');
      return;
    }

    if (!selectedMake || !selectedModel || year.length !== 4) {
      setError('Select year, make, and model before saving.');
      return;
    }

    const parsedYear = Number.parseInt(year, 10);
    if (!Number.isFinite(parsedYear)) {
      setError('Model year is invalid.');
      return;
    }

    setSavingVehicle(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await ensureUserProfile(user);

      const primary = primaryVehicle ?? null;

      const { error: clearPrimaryError } = await supabase
        .from('vehicles')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      if (clearPrimaryError) {
        throw new Error('Could not update primary vehicle.');
      }

      if (primary) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            make: selectedMake.makeName,
            model: selectedModel.modelName,
            year: parsedYear,
            is_primary: true,
          })
          .eq('id', primary.id)
          .eq('user_id', user.id);

        if (updateError) {
          throw new Error('Could not save vehicle.');
        }
      } else {
        const { error: insertError } = await supabase.from('vehicles').insert({
          user_id: user.id,
          make: selectedMake.makeName,
          model: selectedModel.modelName,
          year: parsedYear,
          is_primary: true,
        });

        if (insertError) {
          throw new Error('Could not save vehicle.');
        }
      }

      await loadSavedVehicles();
      setSuccessMessage('Vehicle saved.');
    } catch (saveErr) {
      setError(saveErr instanceof Error ? saveErr.message : 'Could not save vehicle.');
    } finally {
      setSavingVehicle(false);
    }
  }, [loadSavedVehicles, primaryVehicle, selectedMake, selectedModel, user, year]);

  return {
    year,
    yearOptions: YEAR_OPTIONS,
    makes,
    models,
    selectedMakeId,
    selectedModelId,
    savedVehicles,
    primaryVehicle,
    loadingMakes,
    loadingModels,
    loadingSavedVehicles,
    savingVehicle,
    error,
    successMessage,
    canSaveVehicle,
    hasFreeVehicleLimitReached,
    setYear,
    setSelectedMakeId,
    setSelectedModelId,
    saveSelectedVehicle,
  };
}
