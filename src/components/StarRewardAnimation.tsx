import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StarRewardAnimationProps {
  stars: number;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 8;

export default function StarRewardAnimation({ stars, onComplete }: StarRewardAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const centerStarScale = useSharedValue(0);
  const centerStarRotation = useSharedValue(0);
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  // Particle positions (arranged in a circle)
  const particleAnimations = Array.from({ length: PARTICLE_COUNT }, () => ({
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    scale: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  useEffect(() => {
    // Start the animation sequence
    opacity.value = withTiming(1, { duration: 200 });

    // Animate center star with bounce
    centerStarScale.value = withSequence(
      withSpring(1.5, { damping: 8, stiffness: 150 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    centerStarRotation.value = withSpring(360, { damping: 15, stiffness: 80 });

    // Animate particles bursting outward
    particleAnimations.forEach((particle, index) => {
      const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
      const distance = 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      particle.scale.value = withDelay(
        100,
        withSpring(1, { damping: 10, stiffness: 100 })
      );

      particle.opacity.value = withDelay(
        100,
        withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(300, withTiming(0, { duration: 400 }))
        )
      );

      particle.translateX.value = withDelay(
        100,
        withSpring(targetX, { damping: 8, stiffness: 80 })
      );

      particle.translateY.value = withDelay(
        100,
        withSpring(targetY, { damping: 8, stiffness: 80 })
      );
    });

    // Animate text
    textScale.value = withDelay(
      250,
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    textOpacity.value = withDelay(
      250,
      withTiming(1, { duration: 300 })
    );

    // Fade out everything
    const fadeOutDelay = 1200;
    scale.value = withDelay(
      fadeOutDelay,
      withTiming(0.8, { duration: 300, easing: Easing.ease })
    );

    opacity.value = withDelay(
      fadeOutDelay,
      withTiming(0, { duration: 300, easing: Easing.ease }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value || 1 }],
  }));

  const centerStarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: centerStarScale.value },
      { rotate: `${centerStarRotation.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Particle stars */}
        {particleAnimations.map((particle, index) => {
          const particleStyle = useAnimatedStyle(() => ({
            opacity: particle.opacity.value,
            transform: [
              { translateX: particle.translateX.value },
              { translateY: particle.translateY.value },
              { scale: particle.scale.value },
            ],
          }));

          return (
            <Animated.View key={index} style={[styles.particle, particleStyle]}>
              <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
            </Animated.View>
          );
        })}

        {/* Center star */}
        <Animated.View style={[styles.centerStar, centerStarStyle]}>
          <MaterialCommunityIcons name="star" size={64} color="#fbbf24" />
        </Animated.View>

        {/* Stars earned text */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.starsText}>
            +{stars.toFixed(2).replace(/\.?0+$/, '')}
          </Text>
          <MaterialCommunityIcons name="star" size={24} color="#fbbf24" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerStar: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    bottom: -40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ade80',
  },
});
