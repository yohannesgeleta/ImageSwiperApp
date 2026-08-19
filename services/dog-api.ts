export type DogBreedCatalog = {
  breeds: string[];
  descriptions: Record<string, string>;
  descriptionWarning?: string;
};

type DogCeoBreedListResponse = {
  message?: Record<string, string[]>;
  status?: string;
};

type DogCeoImageResponse = {
  message?: string;
  status?: string;
};

type DogApiBreed = {
  id: string;
  attributes?: {
    name?: string;
    description?: string;
  };
};

type DogApiBreedResponse = {
  data?: DogApiBreed[];
};

export function normalizeBreedName(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

export function formatBreedLabel(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function readJson<T>(response: Response, serviceName: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${serviceName} returned HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchRandomDogImage(breed: string) {
  const response = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
  const data = await readJson<DogCeoImageResponse>(response, 'Dog image API');

  if (data.status !== 'success' || typeof data.message !== 'string') {
    throw new Error('Dog image API returned an unexpected response');
  }

  return data.message;
}

export async function fetchDogBreedCatalog(): Promise<DogBreedCatalog> {
  const dogCeoResponse = await fetch('https://dog.ceo/api/breeds/list/all');
  const dogCeoData = await readJson<DogCeoBreedListResponse>(dogCeoResponse, 'Dog breed API');

  if (dogCeoData.status !== 'success' || !dogCeoData.message) {
    throw new Error('Dog breed API returned an unexpected response');
  }

  const breeds = Object.keys(dogCeoData.message).sort();
  const descriptions: Record<string, string> = {};
  let descriptionWarning: string | undefined;

  try {
    const dogApiResponse = await fetch('https://dogapi.dog/api/v2/breeds?page[size]=1000');
    const dogApiData = await readJson<DogApiBreedResponse>(dogApiResponse, 'Breed description API');

    dogApiData.data?.forEach((breed) => {
      const name = breed.attributes?.name;
      const description = breed.attributes?.description;

      if (name && description) {
        descriptions[normalizeBreedName(name)] = description;
      }
    });
  } catch {
    descriptionWarning = 'Breed names loaded, but descriptions are temporarily unavailable.';
  }

  return {
    breeds,
    descriptions,
    descriptionWarning,
  };
}

