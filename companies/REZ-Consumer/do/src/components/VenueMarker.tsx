// VenueMarker Component
// Custom map marker with category icon and selection state

import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { useTheme } from '@/theme/ThemeProvider';

interface VenueMarkerProps {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  subtitle?: string;
  category: string;
  rating?: number;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  restaurants: '🍽️',
  cafes: '☕',
  trials: '✨',
  spa: '💆',
  events: '🎭',
  fitness: '💪',
  default: '📍',
};

export const VenueMarker: React.FC<VenueMarkerProps> = memo(({
  id,
  coordinate,
  title,
  subtitle,
  category,
  rating,
  isSelected,
  onPress,
}) => {
  const { colors, shadows, borderRadius } = useTheme();
  const emoji = CATEGORY_EMOJI[category] || CATEGORY_EMOJI.default;

  const handlePress = () => {
    onPress(id);
  };

  return (
    <Marker
      coordinate={coordinate}
      onPress={handlePress}
      tracksViewChanges={false}
    >
      <View
        style={[
          styles.markerContainer,
          isSelected && styles.markerSelected,
          isSelected && shadows.lg,
          { backgroundColor: isSelected ? colors.primary : colors.backgroundElevated },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Callout with venue info */}
      <Callout tooltip onPress={handlePress}>
        <View
          style={[
            styles.calloutContainer,
            { backgroundColor: colors.backgroundElevated },
          ]}
        >
          <Text
            style={[styles.calloutTitle, { color: colors.label }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.calloutSubtitle, { color: colors.labelSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          {rating && (
            <View style={styles.ratingRow}>
              <Text style={[styles.rating, { color: colors.systemOrange }]}>
                ★ {rating.toFixed(1)}
              </Text>
            </View>
          )}
          <Text style={[styles.calloutHint, { color: colors.primary }]}>
            Tap for details
          </Text>
        </View>
      </Callout>
    </Marker>
  );
});

VenueMarker.displayName = 'VenueMarker';

const styles = StyleSheet.create({
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  markerSelected: {
    transform: [{ scale: 1.15 }],
  },
  emoji: {
    fontSize: 24,
  },
  calloutContainer: {
    width: 180,
    padding: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  calloutHint: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
