import { ThemedText } from '@/components/themed-text';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

type DogCeoBreedResponse = {
  message: Record<string, string[]>;
  status: string;
};

type DogApiBreed = {
  id: string;
  attributes: {
    name: string;
    description?: string;
  };
};

type DogApiBreedResponse = {
  data: DogApiBreed[];
};

function normalizeBreedName(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

function formatBreedLabel(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export let selectedBreedPreference = 'chow';

export default function Profile() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [confirmedName, setConfirmedName] = useState('');
  const [confirmedAge, setConfirmedAge] = useState('');
  const [breedOptions, setBreedOptions] = useState<string[]>([]);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [confirmedBreed, setConfirmedBreed] = useState('');
  const [breedDescriptions, setBreedDescriptions] = useState<Record<string, string>>({});
  const [loadingBreeds, setLoadingBreeds] = useState(true);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadBreeds = async () => {
      try {
        setLoadingBreeds(true);
        setErrorMessage('');

        const [dogCeoResponse, dogApiResponse] = await Promise.all([
          fetch('https://dog.ceo/api/breeds/list/all'),
          fetch('https://dogapi.dog/api/v2/breeds?page[size]=1000'),
        ]);

        const dogCeoData: DogCeoBreedResponse = await dogCeoResponse.json();
        const dogApiData: DogApiBreedResponse = await dogApiResponse.json();

        const dogCeoBreeds = Object.keys(dogCeoData.message || {});
        const descriptions: Record<string, string> = {};

        dogApiData.data.forEach((breed) => {
          const key = normalizeBreedName(breed.attributes.name);
          if (breed.attributes.description) {
            descriptions[key] = breed.attributes.description;
          }
        });

        setBreedDescriptions(descriptions);
        setBreedOptions(dogCeoBreeds);

        if (dogCeoBreeds.length > 0) {
          setSelectedBreed(dogCeoBreeds[0]);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Could not load dog breeds right now.');
      } finally {
        setLoadingBreeds(false);
      }
    };

    loadBreeds();
  }, []);

  useEffect(() => {
    if (!confirmedBreed) {
      setLoadingDescription(false);
      return;
    }

    setLoadingDescription(true);
    const timer = setTimeout(() => {
      setLoadingDescription(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [confirmedBreed]);

  const selectedBreedDescription = !confirmedBreed
    ? 'Select a breed and press Select to see its description.'
    : breedDescriptions[normalizeBreedName(confirmedBreed)] ||
      'A description for this breed was not available from the breed information API.';

  const handleConfirmProfile = () => {
    setConfirmedName(name.trim());
    setConfirmedAge(age.trim());
  };

  const handleConfirmBreed = () => {
    setConfirmedBreed(selectedBreed);
    selectedBreedPreference = selectedBreed;
  };

  return (
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText style={styles.sectionText}>
          Enter your details and pick your favorite dog breed.
        </ThemedText>

        {(confirmedName || confirmedAge) ? (
          <View style={styles.summaryCard}>
            <ThemedText type="subtitle">Your Profile</ThemedText>
            <ThemedText style={styles.summaryText}>Name: {confirmedName || 'Not provided'}</ThemedText>
            <ThemedText style={styles.summaryText}>Age: {confirmedAge || 'Not provided'}</ThemedText>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <ThemedText type="subtitle">Name</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="subtitle">Age</ThemedText>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age"
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <Pressable style={styles.confirmButton} onPress={handleConfirmProfile}>
          <ThemedText style={styles.confirmButtonText}>Confirm Name and Age</ThemedText>
        </Pressable>

        <View style={styles.formGroup}>
          <ThemedText type="subtitle">Select a Dog Breed</ThemedText>
          {loadingBreeds ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : errorMessage ? (
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedBreed}
                onValueChange={(itemValue) => setSelectedBreed(itemValue)}
                style={{ color: 'black' }}
                itemStyle={{ color: 'black' }}>
                {breedOptions.map((breed) => (
                  <Picker.Item
                    key={breed}
                    label={formatBreedLabel(breed)}
                    value={breed}
                  />
                ))}
              </Picker>
            </View>
          )}

          <Pressable
            style={styles.confirmButton}
            onPress={handleConfirmBreed}
            disabled={loadingBreeds || !!errorMessage || !selectedBreed}>
            <ThemedText style={styles.confirmButtonText}>Select</ThemedText>
          </Pressable>
        </View>

        <View style={styles.descriptionCard}>
          <ThemedText type="subtitle">Breed Description</ThemedText>
          {loadingDescription ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            <>
              <ThemedText style={styles.selectedBreedLabel}>
                {confirmedBreed ? formatBreedLabel(confirmedBreed) : 'No breed selected'}
              </ThemedText>
              <ThemedText style={styles.descriptionText}>
                {selectedBreedDescription}
              </ThemedText>
            </>
          )}
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
    backgroundColor:'#b71908ff'
  },
  sectionText: {
    marginTop: 8,
  },
  formGroup: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7c7c7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  loader: {
    marginTop: 12,
  },
  confirmButton: {
    backgroundColor: '#2f80ed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  summaryCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#b71908ff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    backgroundColor: '#b71908ff',
  },
  summaryText: {
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#c7c7c7',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  descriptionCard: {
    borderWidth: 1,
    borderColor: '#b71908ff',
    borderRadius: 1,
    padding: 16,
    gap: 10,
    backgroundColor:'#b71908ff',
  },
  selectedBreedLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  descriptionText: {
    lineHeight: 22,
  },
  errorText: {
    color: '#c0392b',
  },
});
