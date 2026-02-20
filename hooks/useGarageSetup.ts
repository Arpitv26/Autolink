import { useCallback, useMemo, useState } from 'react';
import { fetchMakesByYear, fetchModelsByYearMake, NhtsaMake, NhtsaModel } from '../lib/nhtsa';

const MAX_LIST_ITEMS = 50;

type UseGarageSetupResult = {
  year: string;
  makes: NhtsaMake[];
  models: NhtsaModel[];
  selectedMake: NhtsaMake | null;
  selectedModel: NhtsaModel | null;
  loadingMakes: boolean;
  loadingModels: boolean;
  error: string | null;
  canLoadMakes: boolean;
  canLoadModels: boolean;
  trimmedMakes: NhtsaMake[];
  trimmedModels: NhtsaModel[];
  setYear: (value: string) => void;
  selectMake: (make: NhtsaMake) => void;
  selectModel: (model: NhtsaModel) => void;
  handleLoadMakes: () => Promise<void>;
  handleLoadModels: () => Promise<void>;
};

export function useGarageSetup(): UseGarageSetupResult {
  const [year, setYear] = useState<string>('');
  const [makes, setMakes] = useState<NhtsaMake[]>([]);
  const [models, setModels] = useState<NhtsaModel[]>([]);
  const [selectedMake, setSelectedMake] = useState<NhtsaMake | null>(null);
  const [selectedModel, setSelectedModel] = useState<NhtsaModel | null>(null);
  const [loadingMakes, setLoadingMakes] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canLoadMakes = year.trim().length === 4;
  const canLoadModels = Boolean(selectedMake);

  const trimmedMakes = useMemo(
    (): NhtsaMake[] => makes.slice(0, MAX_LIST_ITEMS),
    [makes]
  );

  const trimmedModels = useMemo(
    (): NhtsaModel[] => models.slice(0, MAX_LIST_ITEMS),
    [models]
  );

  const handleLoadMakes = useCallback(async (): Promise<void> => {
    if (!canLoadMakes) {
      setError('Enter a 4-digit year to load makes.');
      return;
    }

    setError(null);
    setLoadingMakes(true);
    setSelectedMake(null);
    setSelectedModel(null);
    setModels([]);

    try {
      const results = await fetchMakesByYear(year.trim());
      setMakes(results);
      if (results.length === 0) {
        setError('No makes found for that year.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load makes.');
    } finally {
      setLoadingMakes(false);
    }
  }, [canLoadMakes, year]);

  const handleLoadModels = useCallback(async (): Promise<void> => {
    if (!selectedMake) {
      setError('Select a make before loading models.');
      return;
    }

    setError(null);
    setLoadingModels(true);
    setSelectedModel(null);

    try {
      const results = await fetchModelsByYearMake(year.trim(), selectedMake.makeId);
      setModels(results);
      if (results.length === 0) {
        setError('No models found for that make/year.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models.');
    } finally {
      setLoadingModels(false);
    }
  }, [selectedMake, year]);

  const selectMake = useCallback((make: NhtsaMake): void => {
    setSelectedMake(make);
    setModels([]);
    setSelectedModel(null);
  }, []);

  const selectModel = useCallback((model: NhtsaModel): void => {
    setSelectedModel(model);
  }, []);

  return {
    year,
    makes,
    models,
    selectedMake,
    selectedModel,
    loadingMakes,
    loadingModels,
    error,
    canLoadMakes,
    canLoadModels,
    trimmedMakes,
    trimmedModels,
    setYear,
    selectMake,
    selectModel,
    handleLoadMakes,
    handleLoadModels,
  };
}
