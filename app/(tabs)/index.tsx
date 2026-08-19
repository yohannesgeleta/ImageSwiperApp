import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDogPreference } from '@/contexts/dog-preferences';
import { fetchRandomDogImage, formatBreedLabel } from '@/services/dog-api';

const SWIPE_THRESHOLD = 120;

export default function Homepage() {
  const { width } = useWindowDimensions();
  const { selectedBreed } = useDogPreference();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const cardSize = Math.min(Math.max(width - 48, 260), 420);
  const offscreenX = width + 120;

  const loadDogImage = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const nextImageUrl = await fetchRandomDogImage(selectedBreed);
      setImageUrl(nextImageUrl);
    } catch {
      setImageUrl(null);
      setErrorMessage('Could not load a dog image. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedBreed]);

  useFocusEffect(
    useCallback(() => {
      loadDogImage();
    }, [loadDogImage])
  );

  const showNextImage = () => {
    translateX.value = 0;
    translateY.value = 0;
    loadDogImage();
  };

  const animateToNext = (direction: 'left' | 'right') => {
    if (loading) {
      return;
    }

    translateX.value = withSpring(
      direction === 'right' ? offscreenX : -offscreenX,
      {},
      (finished) => {
        if (finished) {
          runOnJS(showNextImage)();
        }
      }
    );
    translateY.value = withSpring(0);
  };

  const handleLike = () => {
    animateToNext('right');
  };

  const handleDislike = () => {
    animateToNext('left');
  };

  const panGesture = Gesture.Pan()
    .enabled(!loading && !!imageUrl)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldSwipeRight = event.velocityX > 500 || translateX.value > SWIPE_THRESHOLD;
      const shouldSwipeLeft = event.velocityX < -500 || translateX.value < -SWIPE_THRESHOLD;

      if (shouldSwipeRight) {
        runOnJS(handleLike)();
      } else if (shouldSwipeLeft) {
        runOnJS(handleDislike)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15]);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{formatBreedLabel(selectedBreed)}</Text>
          <Text style={styles.title}>Dog Image Swiper</Text>
          <Text style={styles.subtitle}>Swipe the card or use the buttons to browse random dogs.</Text>
        </View>

        <View style={[styles.cardArea, { width: cardSize, height: cardSize }]}>
          {loading ? (
            <View style={styles.feedbackPanel}>
              <ActivityIndicator size="large" color="#2c7a7b" />
              <Text style={styles.feedbackText}>Loading next dog...</Text>
            </View>
          ) : imageUrl ? (
            <GestureDetector gesture={panGesture}>
              <Animated.Image
                source={{ uri: imageUrl }}
                style={[styles.cardImage, { width: cardSize, height: cardSize }, animatedStyle]}
                resizeMode="cover"
              />
            </GestureDetector>
          ) : (
            <View style={styles.feedbackPanel}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={loadDogImage}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.buttonRow, { width: cardSize }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.dislikeButton,
              (pressed || loading) && styles.actionButtonMuted,
            ]}
            onPress={handleDislike}
            disabled={loading}>
            <Text style={styles.buttonText}>Dislike</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.likeButton,
              (pressed || loading) && styles.actionButtonMuted,
            ]}
            onPress={handleLike}
            disabled={loading}>
            <Text style={styles.buttonText}>Like</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f3ea',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    width: '100%',
    maxWidth: 520,
    marginBottom: 24,
    gap: 6,
  },
  eyebrow: {
    color: '#2c7a7b',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#1f2933',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#52606d',
    fontSize: 16,
    lineHeight: 22,
  },
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    borderRadius: 18,
    backgroundColor: '#e5e5e5',
  },
  feedbackPanel: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: '#d9e2ec',
  },
  feedbackText: {
    color: '#52606d',
    fontSize: 16,
  },
  errorText: {
    color: '#9b1c1c',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2c7a7b',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonMuted: {
    opacity: 0.65,
  },
  dislikeButton: {
    backgroundColor: '#d64545',
  },
  likeButton: {
    backgroundColor: '#2f855a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});

