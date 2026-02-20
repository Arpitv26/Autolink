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
  const url = `${BASE_URL}/GetMakesForModelYear/modelyear/${year}?format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch makes.');
  }

  const data = (await response.json()) as NhtsaResponse<{
    Make_ID: number;
    Make_Name: string;
  }>;

  return data.Results.map((item) => ({
    makeId: item.Make_ID,
    makeName: item.Make_Name,
  }));
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
    Model_ID: number;
    Model_Name: string;
  }>;

  return data.Results.map((item) => ({
    modelId: item.Model_ID,
    modelName: item.Model_Name,
  }));
}
