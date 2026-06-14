import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const COLORS = {
  primary: colors.brand.pink,
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: Colors.success,
  background: colors.background.secondary,
  amber: Colors.warning,
};

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    distance: string;
    cashback: string;
    priceRange: string;
    image: string;
    isVerified: boolean;
    category: string;
    services: string[];
    openNow: boolean;
    address?: string;
    timing?: string;
  };
  currencySymbol: string;
  onPress: () => void;
}

const SalonCard: React.FC<SalonCardProps> = ({ salon, currencySymbol, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <CachedImage
          source={{ uri: salon.image || 'https://picsum.photos/400/300' }}
          style={styles.image}
        />

        {/* Cashback Badge */}
        <View style={styles.cashbackBadge}>
          <Text style={styles.cashbackText}>{salon.cashback}</Text>
        </View>

        {/* Verified Badge */}
        {salon.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color={colors.text.inverse} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        {/* Open/Closed Badge */}
        <View
          style={[
            styles.openBadge,
            { backgroundColor: salon.openNow ? COLORS.green500 : '#EF4444' },
          ]}
        >
          <Text style={styles.openBadgeText}>{salon.openNow ? 'Open' : 'Closed'}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {salon.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.amber} />
            <Text style={styles.rating}>{salon.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({salon.reviewCount})</Text>
          </View>
        </View>

        <Text style={styles.category}>{salon.category}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray600} />
            <Text style={styles.metaText}>{salon.distance}</Text>
          </View>
          {salon.timing && (
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={salon.openNow ? COLORS.green500 : COLORS.gray600}
              />
              <Text
                style={[
                  styles.metaText,
                  { color: salon.openNow ? COLORS.green500 : COLORS.gray600 },
                ]}
              >
                {salon.timing}
              </Text>
            </View>
          )}
        </View>

        {/* Services Preview */}
        <View style={styles.servicesContainer}>
          {salon.services.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceChip}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
          {salon.services.length > 3 && (
            <Text style={styles.moreServices}>+{salon.services.length - 3} more</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>
              {currencySymbol}
              {salon.priceRange.replace(currencySymbol, '')}
            </Text>
          </View>
          <Pressable style={styles.bookButton} onPress={onPress}>
            <Text style={styles.bookButtonText}>Book</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray50,
  },
  cashbackBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.green500,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  cashbackText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 192, 106, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  openBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  openBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  content: {
    padding: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
    flex: 1,
    marginRight: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  reviewCount: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  category: {
    ...Typography.body,
    color: COLORS.primary,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  serviceChip: {
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
  },
  serviceText: {
    ...Typography.caption,
    color: colors.text.secondary,
  },
  moreServices: {
    ...Typography.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  priceLabel: {
    ...Typography.caption,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  price: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  bookButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default SalonCard;
