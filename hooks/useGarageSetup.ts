import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMakesByYear, fetchModelsByYearMake, NhtsaMake, NhtsaModel } from '../lib/nhtsa';
import { ensureUserProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

const START_YEAR = 1985;
const FREE_PLAN_VEHICLE_LIMIT = 1;
const MAX_VEHICLES = 5;
const DEV_BYPASS_PRO_VEHICLE_PAYWALL = parseBooleanEnvFlag(
  process.env.EXPO_PUBLIC_DEV_BYPASS_PRO_VEHICLE_PAYWALL
);

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

type ProfileEntitlementRow = {
  is_pro: boolean;
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
  deletingVehicleId: string | null;
  error: string | null;
  successMessage: string | null;
  canSaveVehicle: boolean;
  canAddVehicle: boolean;
  canOpenProUpgrade: boolean;
  isProMember: boolean;
  devBypassProVehiclePaywall: boolean;
  requiresProForAdditionalVehicles: boolean;
  hasFreeVehicleLimitReached: boolean;
  hasMaxVehicleLimitReached: boolean;
  setYear: (value: string) => void;
  setSelectedMakeId: (value: number | null) => void;
  setSelectedModelId: (value: number | null) => void;
  setPrimaryVehicle: (vehicleId: string) => Promise<boolean>;
  saveSelectedVehicle: () => Promise<void>;
  addSelectedVehicle: () => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
};

function parseBooleanEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

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
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [isProMember, setIsProMember] = useState<boolean>(false);
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

  const canUseProVehicles = isProMember || DEV_BYPASS_PRO_VEHICLE_PAYWALL;
  const hasFreeVehicleLimitReached = savedVehicles.length >= FREE_PLAN_VEHICLE_LIMIT;
  const hasMaxVehicleLimitReached = savedVehicles.length >= MAX_VEHICLES;
  const requiresProForAdditionalVehicles = hasFreeVehicleLimitReached && !canUseProVehicles;
  const canSaveVehicle = Boolean(
    user &&
      year.length === 4 &&
      selectedMake &&
      selectedModel &&
      !savingVehicle
  );
  const canAddVehicle = Boolean(
    user &&
      year.length === 4 &&
      selectedMake &&
      selectedModel &&
      !savingVehicle &&
      !hasMaxVehicleLimitReached &&
      !requiresProForAdditionalVehicles
  );
  const canOpenProUpgrade = Boolean(
    user && !savingVehicle && !hasMaxVehicleLimitReached && requiresProForAdditionalVehicles
  );

  const loadSavedVehicles = useCallback(
    async (options?: { silent?: boolean }): Promise<void> => {
      const silent = options?.silent ?? false;

    if (!user) {
      setSavedVehicles([]);
      setYearState('');
      setSelectedMakeIdState(null);
      setSelectedModelIdState(null);
      setLoadingSavedVehicles(false);
      return;
    }

      if (!silent) {
        setLoadingSavedVehicles(true);
      }
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
    },
    [user]
  );

  const loadProfileEntitlement = useCallback(async (): Promise<void> => {
    if (!user) {
      setIsProMember(false);
      return;
    }

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .maybeSingle<ProfileEntitlementRow>();

    if (profileError) {
      setIsProMember(false);
      return;
    }

    setIsProMember(Boolean(data?.is_pro));
  }, [user]);

  useEffect(() => {
    void loadSavedVehicles();
  }, [loadSavedVehicles]);

  useEffect(() => {
    void loadProfileEntitlement();
  }, [loadProfileEntitlement]);

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

  const setPrimaryVehicle = useCallback(
    async (vehicleId: string): Promise<boolean> => {
      if (!user) {
        setError('Sign in before switching vehicles.');
        return false;
      }

      const targetVehicle = savedVehicles.find((item) => item.id === vehicleId);
      if (!targetVehicle) {
        setError('Selected vehicle was not found.');
        return false;
      }

      if (targetVehicle.isPrimary) {
        return true;
      }

      setSavingVehicle(true);
      setError(null);
      setSuccessMessage(null);

      try {
        await ensureUserProfile(user);

        const { error: clearPrimaryError } = await supabase
          .from('vehicles')
          .update({ is_primary: false })
          .eq('user_id', user.id);

        if (clearPrimaryError) {
          throw new Error('Could not switch active vehicle.');
        }

        const { error: setPrimaryError } = await supabase
          .from('vehicles')
          .update({ is_primary: true })
          .eq('id', vehicleId)
          .eq('user_id', user.id);

        if (setPrimaryError) {
          throw new Error('Could not switch active vehicle.');
        }

        await loadSavedVehicles({ silent: true });
        setSuccessMessage('Active vehicle switched.');
        return true;
      } catch (switchErr) {
        setError(switchErr instanceof Error ? switchErr.message : 'Could not switch active vehicle.');
        return false;
      } finally {
        setSavingVehicle(false);
      }
    },
    [loadSavedVehicles, savedVehicles, user]
  );

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

      let nextPrimaryId: string | null = null;

      if (primaryVehicle) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            make: selectedMake.makeName,
            model: selectedModel.modelName,
            year: parsedYear,
            is_primary: true,
          })
          .eq('id', primaryVehicle.id)
          .eq('user_id', user.id);

        if (updateError) {
          throw new Error('Could not save vehicle.');
        }
        nextPrimaryId = primaryVehicle.id;
      } else {
        const { data: insertedVehicle, error: insertError } = await supabase
          .from('vehicles')
          .insert({
            user_id: user.id,
            make: selectedMake.makeName,
            model: selectedModel.modelName,
            year: parsedYear,
            is_primary: true,
          })
          .select('id')
          .single<{ id: string }>();

        if (insertError || !insertedVehicle?.id) {
          throw new Error('Could not save vehicle.');
        }
        nextPrimaryId = insertedVehicle.id;
      }

      const { error: normalizeError } = await supabase
        .from('vehicles')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('id', nextPrimaryId);

      if (normalizeError) {
        throw new Error('Vehicle saved, but could not finalize primary vehicle state.');
      }

      await loadSavedVehicles();
      setSuccessMessage('Vehicle saved.');
    } catch (saveErr) {
      setError(saveErr instanceof Error ? saveErr.message : 'Could not save vehicle.');
    } finally {
      setSavingVehicle(false);
    }
  }, [loadSavedVehicles, primaryVehicle, selectedMake, selectedModel, user, year]);

  const addSelectedVehicle = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('Sign in before adding a vehicle.');
      return;
    }

    if (hasMaxVehicleLimitReached) {
      setError(`Vehicle limit reached. You can save up to ${MAX_VEHICLES} vehicles.`);
      return;
    }

    if (requiresProForAdditionalVehicles) {
      setError('Upgrade to Pro to add more than 1 vehicle.');
      return;
    }

    if (!selectedMake || !selectedModel || year.length !== 4) {
      setError('Select year, make, and model before adding.');
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

      const { count, error: countError } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        throw new Error('Could not validate vehicle limit.');
      }

      if ((count ?? 0) >= MAX_VEHICLES) {
        throw new Error(`Vehicle limit reached. You can save up to ${MAX_VEHICLES} vehicles.`);
      }

      const { error: insertError } = await supabase.from('vehicles').insert({
        user_id: user.id,
        make: selectedMake.makeName,
        model: selectedModel.modelName,
        year: parsedYear,
        is_primary: !primaryVehicle,
      });

      if (insertError) {
        throw new Error('Could not add vehicle.');
      }

      await loadSavedVehicles();
      setSuccessMessage('Vehicle added.');
    } catch (saveErr) {
      setError(saveErr instanceof Error ? saveErr.message : 'Could not add vehicle.');
    } finally {
      setSavingVehicle(false);
    }
  }, [
    hasMaxVehicleLimitReached,
    loadSavedVehicles,
    primaryVehicle,
    requiresProForAdditionalVehicles,
    selectedMake,
    selectedModel,
    user,
    year,
  ]);

  const deleteVehicle = useCallback(
    async (vehicleId: string): Promise<void> => {
      if (!user) {
        setError('Sign in before deleting a vehicle.');
        return;
      }

      const targetVehicle = savedVehicles.find((item) => item.id === vehicleId);
      if (!targetVehicle) {
        setError('Selected vehicle was not found.');
        return;
      }

      if (savedVehicles.length <= 1) {
        setError('You must keep at least one vehicle.');
        return;
      }

      setDeletingVehicleId(vehicleId);
      setError(null);
      setSuccessMessage(null);

      try {
        await ensureUserProfile(user);

        if (targetVehicle.isPrimary) {
          const nextPrimary = savedVehicles.find((item) => item.id !== vehicleId);
          if (!nextPrimary) {
            throw new Error('Could not assign a new primary vehicle.');
          }

          const { error: clearPrimaryError } = await supabase
            .from('vehicles')
            .update({ is_primary: false })
            .eq('id', vehicleId)
            .eq('user_id', user.id);

          if (clearPrimaryError) {
            throw new Error('Could not update primary vehicle state.');
          }

          const { error: setPrimaryError } = await supabase
            .from('vehicles')
            .update({ is_primary: true })
            .eq('id', nextPrimary.id)
            .eq('user_id', user.id);

          if (setPrimaryError) {
            throw new Error('Could not assign a new primary vehicle.');
          }
        }

        const { error: deleteError } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', vehicleId)
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error('Could not delete vehicle.');
        }

        await loadSavedVehicles();
        setSuccessMessage('Vehicle deleted.');
      } catch (deleteErr) {
        setError(deleteErr instanceof Error ? deleteErr.message : 'Could not delete vehicle.');
      } finally {
        setDeletingVehicleId(null);
      }
    },
    [loadSavedVehicles, savedVehicles, user]
  );

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
    deletingVehicleId,
    error,
    successMessage,
    canSaveVehicle,
    canAddVehicle,
    canOpenProUpgrade,
    isProMember,
    devBypassProVehiclePaywall: DEV_BYPASS_PRO_VEHICLE_PAYWALL,
    requiresProForAdditionalVehicles,
    hasFreeVehicleLimitReached,
    hasMaxVehicleLimitReached,
    setYear,
    setSelectedMakeId,
    setSelectedModelId,
    setPrimaryVehicle,
    saveSelectedVehicle,
    addSelectedVehicle,
    deleteVehicle,
  };
}
