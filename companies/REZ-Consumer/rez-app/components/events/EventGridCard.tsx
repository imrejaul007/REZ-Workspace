// @ts-nocheck
/**
 * EventGridCard Component
 * Upgraded event card: large 200px image, gradient overlay, price badge (top-right),
 * category pill (top-left), "Book Now" CTA, coins reward indicator.
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { EventItem } from '@/types/homepage.types';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { colors } from '@/constants/theme';
import { BorderRadius, Spacing, Typography } from '@/constants/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2; // 16px padding each side + 16px gap
const CARD_IMAGE_HEIGHT = 200;

interface EventGridCardProps {
  event: EventItem;
  onPress: (event: EventItem) => void;
}

const EventGridCard: React.FC<EventGridCardProps> = ({ event, onPress }) => {
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const handlePress = useCallback(() => {
    onPress(event);
  }, [event, onPress]);

  // Format date
  const formattedDate = useMemo(() => {
    try {
      const date = new Date(event.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return event.date;
    }
  }, [event.date]);

  // Format price
  const priceDisplay = useMemo(() => {
    if (event.price?.isFree) return 'Free';
    const isOnline = (event as unknown).isOnline || (event.location as unknown)?.isOnline;
    const displayCurrency = isOnline ? currencySymbol : (event.price?.currency || currencySymbol);
    return `${displayCurrency}${event.price?.amount || 0}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.price, event.location, currencySymbol]);

  const isFree = event.price?.isFree;

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      accessibilityLabel={`${event.title}, ${formattedDate}, ${priceDisplay}`}
      accessibilityRole="button"
    >
      {/* Image with gradient overlay */}
      <View style={styles.imageContainer}>
        <CachedImage
          source={event.image}
          style={styles.image}
          contentFit="cover"
        />

        {/* Bottom gradient for text legibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={styles.imageGradient}
        />

        {/* Category pill — top-left */}
        <View style={styles.categoryBadge}>
          <ThemedText style={styles.categoryText} numberOfLines={1}>
            {event.category}
          </ThemedText>
        </View>

        {/* Price badge — top-right */}
        <View style={[styles.priceBadge, isFree ? styles.priceBadgeFree : null]}>
          <ThemedText style={styles.priceText}>{priceDisplay}</ThemedText>
        </View>

        {/* Date + venue overlaid at bottom of image */}
        <View style={styles.imageFooter}>
          <View style={styles.imageMeta}>
            <Ionicons name="calendar" size={10} color="rgba(255,255,255,0.9)" />
            <ThemedText style={styles.imageMetaText}>{formattedDate}</ThemedText>
          </View>
          {!!event.location && (
            <View style={styles.imageMeta}>
              <Ionicons
                name={(event as unknown).isOnline ? 'globe' : 'location'}
                size={10}
                color="rgba(255,255,255,0.9)"
              />
              <ThemedText style={styles.imageMetaText} numberOfLines={1}>
                {(event as unknown).isOnline ? 'Online' : (typeof event.location === 'string' ? event.location : 'Venue')}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <ThemedText style={styles.title} numberOfLines={2}>
          {event.title}
        </ThemedText>

        {/* Rating row */}
        {(event.rating ?? 0) > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.brand.goldWarm} />
            <ThemedText style={styles.ratingText}>
              {(event.rating ?? 0).toFixed(1)}
            </ThemedText>
            {(event.reviewCount ?? 0) > 0 && (
              <ThemedText style={styles.reviewCount}>
                ({event.reviewCount})
              </ThemedText>
            )}
          </View>
        )}

        {/* Cashback / coins row */}
        {(event.cashback ?? 0) > 0 && (
          <View style={styles.coinsRow}>
            <Ionicons name="gift" size={11} color={colors.gold} />
            <ThemedText style={styles.coinsText}>
              {event.cashback}% Cashback
            </ThemedText>
          </View>
        )}

        {/* Book Now CTA */}
        <Pressable
          style={styles.bookButton}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`Book ${event.title}`}
        >
          <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
          <Ionicons name="arrow-forward" size={12} color={colors.text.inverse} />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.nileBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '55%',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.background.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  priceBadgeFree: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  priceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background.primary,
  },
  imageFooter: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    gap: 3,
  },
  imageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageMetaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    flex: 1,
  },
  content: {
    padding: 10,
    gap: 5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.amberDark,
  },
  reviewCount: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.greenDark ?? '#2E7D32',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.nileBlue,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 4,
    marginTop: 4,
  },
  bookButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background.primary,
  },
});

export default memo(EventGridCard);
