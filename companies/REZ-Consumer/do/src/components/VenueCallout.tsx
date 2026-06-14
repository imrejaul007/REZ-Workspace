// VenueCallout Component
// Mini venue card displayed when marker is selected on map

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MapPin, Star, Navigation } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface VenueCalloutProps {
  id: string;
  name: string;
  image?: string;
  category: string;
  cuisine?: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  karmaDiscount?: number;
  onPress: (id: string) => void;
  onDirections?: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

const CATEGORY_EMOJI: Record<string, string> = {
  restaurants: '🍽️',
  cafes: '☕',
  trials: '✨',
  spa: '💆',
  events: '🎭',
  fitness: '💪',
  default: '📍',
};

export const VenueCallout: React.FC<VenueCalloutProps> = memo(({
  id,
  name,
  image,
  category,
  cuisine,
  distance,
  rating,
  reviewCount,
  priceRange,
  karmaDiscount,
  onPress,
  onDirections,
}) => {
  const { colors, spacing, borderRadius, shadows, typography } = useTheme();
  const emoji = CATEGORY_EMOJI[category] || CATEGORY_EMOJI.default;

  const handlePress = () => {
    onPress(id);
  };

  const handleDirections = () => {
    onDirections?.(id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundElevated,
          borderRadius: borderRadius.card,
        },
        shadows.md,
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Image or Placeholder */}
      <View style={[styles.imageContainer, { borderTopLeftRadius: borderRadius.card, borderTopRightRadius: borderRadius.card }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.fill }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        )}

        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        {/* Karma Discount Badge */}
        {karmaDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.gold }]}>
            <Text style={styles.discountText}>{karmaDiscount}% off</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, { padding: spacing.md }]}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.name, { color: colors.label, ...typography.titleMedium }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {cuisine && (
              <Text
                style={[styles.cuisine, { color: colors.labelSecondary, ...typography.bodySmall }]}
                numberOfLines={1}
              >
                {cuisine}
              </Text>
            )}
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {rating && (
            <View style={styles.infoItem}>
              <Star size={14} color={colors.systemOrange} fill={colors.systemOrange} />
              <Text style={[styles.infoText, { color: colors.label }]}>
                {rating.toFixed(1)}
              </Text>
              {reviewCount && (
                <Text style={[styles.reviewCount, { color: colors.labelSecondary }]}>
                  ({reviewCount})
                </Text>
              )}
            </View>
          )}

          {distance && (
            <View style={styles.infoItem}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.label }]}>
                {distance}
              </Text>
            </View>
          )}

          {priceRange && (
            <Text style={[styles.priceRange, { color: colors.systemGreen }]}>
              {priceRange}
            </Text>
          )}
        </View>

        {/* Action Row */}
        <View style={[styles.actionRow, { marginTop: spacing.sm }]}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={handlePress}
          >
            <Text style={[styles.viewButtonText, { color: colors.primaryContrast }]}>
              View Details
            </Text>
          </TouchableOpacity>

          {onDirections && (
            <TouchableOpacity
              style={[styles.directionsButton, { borderColor: colors.separator }]}
              onPress={handleDirections}
            >
              <Navigation size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

VenueCallout.displayName = 'VenueCallout';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    // padding applied dynamically
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    // inherited from typography
  },
  cuisine: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
