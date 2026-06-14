// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { FEATURES } from './config';

interface ScanFeedbackProps {
  success: boolean;
  message: string;
  onDismiss: () => void;
}

/**
 * Animated scan feedback overlay
 */
export function ScanFeedback({ success, message, onDismiss }: ScanFeedbackProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after delay
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scale }],
          backgroundColor: success ? '#22C55E' : '#EF4444',
        },
      ]}
    >
      <Text style={styles.icon}>{success ? '✓' : '✗'}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

/**
 * Pulse animation for active scanning
 */
export function ScanningPulse() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseContainer,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.pulseRing} />
      <Text style={styles.pulseText}>Scanning...</Text>
    </Animated.View>
  );
}

/**
 * Shimmer loading effect
 */
export function Shimmer({ width = '100%', height = 20, borderRadius = 4 }: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={[styles.shimmer, { width, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.shimmerHighlight,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Item added animation
 */
export function ItemAddedAnimation({ itemName, onComplete }: {
  itemName: string;
  onComplete: () => void;
}) {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onComplete());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.itemAdded,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.itemAddedIcon}>✓</Text>
      <Text style={styles.itemAddedText}>{itemName}</Text>
      <Text style={styles.itemAddedSubtext}>Added to cart</Text>
    </Animated.View>
  );
}

/**
 * Success celebration animation
 */
export function SuccessCelebration({ show }: { show: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.celebration,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Text style={styles.celebrationEmoji}>🎉</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    right: '20%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#22C55E',
    position: 'absolute',
  },
  pulseText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 100,
  },
  shimmer: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmerHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  itemAdded: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  itemAddedIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  itemAddedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  itemAddedSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  celebration: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
  },
  celebrationEmoji: {
    fontSize: 80,
  },
});

export default {
  ScanFeedback,
  ScanningPulse,
  Shimmer,
  ItemAddedAnimation,
  SuccessCelebration,
};
