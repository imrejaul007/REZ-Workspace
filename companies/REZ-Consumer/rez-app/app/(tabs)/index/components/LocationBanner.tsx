/**
 * LocationBanner Component
 * Location selector banner
 * Extracted from index.tsx
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationDisplay from '@/components/location/LocationDisplay';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface LocationBannerProps {
  location?: {
    city?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  onLocationPress?: () => void;
}

export default function LocationBanner({ location, onLocationPress }: LocationBannerProps) {
  const [showDetailed, setShowDetailed] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.locationRow}
        onPress={onLocationPress}
        accessibilityLabel="Change location"
        accessibilityHint="Tap to change your delivery location"
      >
        {/* Location Icon */}
        <View style={styles.iconWrapper}>
          <Ionicons name="location" size={12} color={colors.text.inverse} />
        </View>

        {/* Location Text */}
        <LocationDisplay
          compact={true}
          showCoordinates={false}
          showLastUpdated={false}
          showRefreshButton={false}
          style={styles.locationDisplay}
          textStyle={styles.locationText}
        />

        {/* Expand/Collapse Icon */}
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  locationRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,178,60,.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDisplay: {
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  chevron: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
