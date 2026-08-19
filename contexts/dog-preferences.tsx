import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

type DogPreferenceContextValue = {
  selectedBreed: string;
  setSelectedBreed: (breed: string) => void;
};

const DEFAULT_BREED = 'chow';

const DogPreferenceContext = createContext<DogPreferenceContextValue | undefined>(undefined);

export function DogPreferenceProvider({ children }: PropsWithChildren) {
  const [selectedBreed, setSelectedBreed] = useState(DEFAULT_BREED);

  const value = useMemo(
    () => ({
      selectedBreed,
      setSelectedBreed,
    }),
    [selectedBreed]
  );

  return <DogPreferenceContext.Provider value={value}>{children}</DogPreferenceContext.Provider>;
}

export function useDogPreference() {
  const context = useContext(DogPreferenceContext);

  if (!context) {
    throw new Error('useDogPreference must be used inside DogPreferenceProvider');
  }

  return context;
}

