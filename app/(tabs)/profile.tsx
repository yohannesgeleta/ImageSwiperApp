import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useDogPreference } from '@/contexts/dog-preferences';
import {
  fetchDogBreedCatalog,
  formatBreedLabel,
  normalizeBreedName,
  type DogBreedCatalog,
} from '@/services/dog-api';

export default function Profile() {
  const { selectedBreed: confirmedBreed, setSelectedBreed: setConfirmedBreed } = useDogPreference();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [confirmedName, setConfirmedName] = useState('');
  const [confirmedAge, setConfirmedAge] = useState('');
  const [breedOptions, setBreedOptions] = useState<string[]>([]);
  const [selectedBreed, setSelectedBreed] = useState(confirmedBreed);
  const [breedDescriptions, setBreedDescriptions] = useState<Record<string, string>>({});
  const [loadingBreeds, setLoadingBreeds] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [descriptionWarning, setDescriptionWarning] = useState('');

  const applyBreedCatalog = useCallback((catalog: DogBreedCatalog) => {
    setBreedDescriptions(catalog.descriptions);
    setBreedOptions(catalog.breeds);
    setDescriptionWarning(catalog.descriptionWarning ?? '');

    setSelectedBreed((currentBreed) =>
      catalog.breeds.includes(currentBreed) || catalog.breeds.length === 0
        ? currentBreed
        : catalog.breeds[0]
    );
  }, []);

  const loadBreeds = async () => {
    try {
      setLoadingBreeds(true);
      setErrorMessage('');
      const catalog = await fetchDogBreedCatalog();
      applyBreedCatalog(catalog);
    } catch {
      setBreedOptions([]);
      setBreedDescriptions({});
      setErrorMessage('Could not load dog breeds. Check your connection and try again.');
    } finally {
      setLoadingBreeds(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialBreeds = async () => {
      try {
        setLoadingBreeds(true);
        setErrorMessage('');
        const catalog = await fetchDogBreedCatalog();

        if (isMounted) {
          applyBreedCatalog(catalog);
        }
      } catch {
        if (isMounted) {
          setBreedOptions([]);
          setBreedDescriptions({});
          setErrorMessage('Could not load dog breeds. Check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setLoadingBreeds(false);
        }
      }
    };

    loadInitialBreeds();

    return () => {
      isMounted = false;
    };
  }, [applyBreedCatalog]);

  const selectedBreedDescription =
    breedDescriptions[normalizeBreedName(confirmedBreed)] ||
    'A description for this breed was not available from the breed information API.';

  const handleConfirmProfile = () => {
    setConfirmedName(name.trim());
    setConfirmedAge(age.trim());
  };

  const handleConfirmBreed = () => {
    if (selectedBreed) {
      setConfirmedBreed(selectedBreed);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Customize the swiper</Text>
        <Text style={styles.subtitle}>Save a simple profile and choose which breed appears on the home screen.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Your Details</Text>

        {(confirmedName || confirmedAge) ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Name: {confirmedName || 'Not provided'}</Text>
            <Text style={styles.summaryText}>Age: {confirmedAge || 'Not provided'}</Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#7b8794"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age"
            placeholderTextColor="#7b8794"
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleConfirmProfile}>
          <Text style={styles.primaryButtonText}>Confirm Name and Age</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Dog Breed</Text>
        <Text style={styles.helperText}>Current breed: {formatBreedLabel(confirmedBreed)}</Text>

        {loadingBreeds ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#2c7a7b" />
            <Text style={styles.helperText}>Loading breeds...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.secondaryButton} onPress={loadBreeds}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedBreed}
                onValueChange={(itemValue) => setSelectedBreed(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}>
                {breedOptions.map((breed) => (
                  <Picker.Item key={breed} label={formatBreedLabel(breed)} value={breed} />
                ))}
              </Picker>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || !selectedBreed) && styles.mutedButton,
              ]}
              onPress={handleConfirmBreed}
              disabled={!selectedBreed}>
              <Text style={styles.primaryButtonText}>Use Selected Breed</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Breed Description</Text>
        {descriptionWarning ? <Text style={styles.warningText}>{descriptionWarning}</Text> : null}
        <Text style={styles.selectedBreedLabel}>{formatBreedLabel(confirmedBreed)}</Text>
        <Text style={styles.descriptionText}>{selectedBreedDescription}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f7f3ea',
    gap: 16,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  eyebrow: {
    color: '#2c7a7b',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#1f2933',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#52606d',
    fontSize: 16,
    lineHeight: 22,
  },
  panel: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d9e2ec',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#1f2933',
    fontSize: 20,
    fontWeight: '800',
  },
  summaryBox: {
    backgroundColor: '#f0f7f7',
    borderColor: '#b7d4d4',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  summaryText: {
    color: '#1f2933',
    fontSize: 16,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: '#323f4b',
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bcccdc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2933',
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#2c7a7b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: '#2c7a7b',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#2c7a7b',
    fontWeight: '700',
  },
  mutedButton: {
    opacity: 0.65,
  },
  helperText: {
    color: '#52606d',
    fontSize: 15,
    lineHeight: 21,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#bcccdc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  picker: {
    color: '#1f2933',
  },
  pickerItem: {
    color: '#1f2933',
  },
  errorBox: {
    gap: 12,
  },
  errorText: {
    color: '#9b1c1c',
    fontSize: 15,
    lineHeight: 21,
  },
  warningText: {
    color: '#8a6d1d',
    fontSize: 15,
    lineHeight: 21,
  },
  selectedBreedLabel: {
    color: '#2c7a7b',
    fontSize: 18,
    fontWeight: '800',
  },
  descriptionText: {
    color: '#323f4b',
    fontSize: 16,
    lineHeight: 24,
  },
});
