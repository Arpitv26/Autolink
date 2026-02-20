export type NhtsaMake = {
  makeId: number;
  makeName: string;
};

export type NhtsaModel = {
  modelId: number;
  modelName: string;
};

type NhtsaResponse<T> = {
  Results: T[];
};

const BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export async function fetchMakesByYear(year: string): Promise<NhtsaMake[]> {
  // vPIC does not provide a "makes by year" endpoint.
  // We use car makes and apply year filtering when loading models.
  const url = `${BASE_URL}/GetMakesForVehicleType/car?format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch makes.');
  }

  const data = (await response.json()) as NhtsaResponse<{
    MakeId?: number;
    MakeName?: string;
    Make_ID?: number;
    Make_Name?: string;
  }>;

  return data.Results.map((item) => {
    const makeId = item.MakeId ?? item.Make_ID ?? 0;
    const makeName = item.MakeName ?? item.Make_Name ?? '';
    return {
      makeId,
      makeName,
    };
  }).filter((item) => item.makeId > 0 && item.makeName.length > 0);
}

export async function fetchModelsByYearMake(
  year: string,
  makeId: number
): Promise<NhtsaModel[]> {
  const url = `${BASE_URL}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch models.');
  }

  const data = (await response.json()) as NhtsaResponse<{
    Model_ID?: number;
    Model_Name?: string;
    ModelId?: number;
    ModelName?: string;
  }>;

  return data.Results.map((item) => {
    const modelId = item.Model_ID ?? item.ModelId ?? 0;
    const modelName = item.Model_Name ?? item.ModelName ?? '';
    return {
      modelId,
      modelName,
    };
  }).filter((item) => item.modelId > 0 && item.modelName.length > 0);
}
