/**
 * WeatherCard - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface WeatherCardProps {
  temperature?: number;
  condition?: string;
  location?: string;
  onPress?: () => void;
}

export default function WeatherCard({ temperature = 28, condition = 'Sunny', location = 'Mumbai', onPress }: WeatherCardProps) {
  const getWeatherIcon = (cond: string) => {
    switch (cond.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'sunny';
      case 'cloudy':
        return 'cloudy';
      case 'rainy':
        return 'rainy';
      default:
        return 'partly-sunny';
    }
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.main}>
          <Text style={styles.temperature}>{temperature}°</Text>
          <Ionicons name={getWeatherIcon(condition) as unknown} size={32} color={colors.gold} />
        </View>
        <Text style={styles.condition}>{condition}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color={colors.text.tertiary} />
          <Text style={styles.location}>{location}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: 140,
    marginRight: spacing.md,
  },
  content: {
    alignItems: 'center',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperature: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  condition: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  location: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginLeft: 2,
  },
});
