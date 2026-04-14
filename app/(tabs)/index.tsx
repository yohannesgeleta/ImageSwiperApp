import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { selectedBreedPreference } from "./profile";

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 150;
const OFFSCREEN_X = width + 100;


export default function Homepage() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomDogImage = async () => {
    try {
      setLoading(true);
      const breed = selectedBreedPreference || 'chow';
      const response = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
      const data = await response.json();
      setImageUrl(data.message);
    } catch (error) {
      console.error(error);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomDogImage();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRandomDogImage();
    }, [])
  );

  const showNextImage = () => {
    translateX.value = 0;
    translateY.value = 0;
    fetchRandomDogImage();
  };

  const animateToNext = (direction: 'left' | 'right') => {
    translateX.value = withSpring(
      direction === 'right' ? OFFSCREEN_X : -OFFSCREEN_X,
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
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
    const shouldSwipeRight =
      event.velocityX > 500 || translateX.value > SWIPE_THRESHOLD;
    const shouldSwipeLeft =
      event.velocityX < -500 || translateX.value < -SWIPE_THRESHOLD;

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
    const rotation = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-15, 0, 15]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Swipe your selected dog breed</Text>

        <View style={styles.cardArea}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : imageUrl ? (
            <GestureDetector gesture={panGesture}>
              <Animated.Image
                source={{ uri: imageUrl }}
                style={[styles.cardImage, animatedStyle]}
                resizeMode="cover"
              />
            </GestureDetector>
          ) : (
            <Text>Could not load dog image.</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.actionButton, styles.dislikeButton]} onPress={handleDislike}>
            <Text style={styles.buttonText}>Dislike</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.likeButton]} onPress={handleLike}>
            <Text style={styles.buttonText}>Like</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8dc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  cardArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: 280,
    height: 280,
    borderRadius:16,
    backgroundColor: '#e5e5e5'
  },
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: 280,
  marginTop: 24,
},

actionButton: {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
},

dislikeButton: {
  backgroundColor: '#e74c3c',
  marginRight: 10,
},

likeButton: {
  backgroundColor: '#2ecc71',
  marginLeft: 10,
},

buttonText: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
},
});