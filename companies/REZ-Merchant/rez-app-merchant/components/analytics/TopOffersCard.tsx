/**
 * TopOffersCard Component
 * List of top performing offers with metrics
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { TopOffer } from '@/types/analytics';

interface TopOffersCardProps {
  offers: TopOffer[];
  isLoading?: boolean;
  onOfferPress?: (offer: TopOffer) => void;
  onViewAll?: () => void;
}

export function TopOffersCard({
  offers,
  isLoading = false,
  onOfferPress,
  onViewAll,
}: TopOffersCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const getDiscountLabel = (offer: TopOffer) => {
    switch (offer.discountType) {
      case 'percentage':
        return `${offer.discountValue}% OFF`;
      case 'fixed':
        return `₹${offer.discountValue} OFF`;
      case 'bogo':
        return 'BOGO';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="pricetag" size={20} color={Colors.light.secondary} />
            <ThemedText style={styles.title}>Top Offers</ThemedText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.secondary} />
        </View>
      </View>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="pricetag" size={20} color={Colors.light.secondary} />
            <ThemedText style={styles.title}>Top Offers</ThemedText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={40} color={Colors.light.textMuted} />
          <ThemedText style={styles.emptyText}>No offers data</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pricetag" size={20} color={Colors.light.secondary} />
          <ThemedText style={styles.title}>Top Offers</ThemedText>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.offersList}>
        {offers.slice(0, 5).map((offer, index) => (
          <TouchableOpacity
            key={offer.offerId}
            style={styles.offerItem}
            onPress={() => onOfferPress?.(offer)}
            disabled={!onOfferPress}
            activeOpacity={0.7}
          >
            <View style={styles.offerRank}>
              <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
            </View>

            <View style={styles.offerContent}>
              <View style={styles.offerHeader}>
                <ThemedText style={styles.offerName} numberOfLines={1}>
                  {offer.offerName}
                </ThemedText>
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountText}>
                    {getDiscountLabel(offer)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.offerStats}>
                <View style={styles.stat}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.light.success} />
                  <ThemedText style={styles.statText}>
                    {offer.redemptions} used
                  </ThemedText>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="cash" size={12} color={Colors.light.primary} />
                  <ThemedText style={styles.statText}>
                    {formatCurrency(offer.revenue)}
                  </ThemedText>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="trending-up" size={12} color={Colors.light.info} />
                  <ThemedText style={styles.statText}>
                    {(offer.conversionRate * 100).toFixed(0)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>
            {offers.reduce((sum, o) => sum + o.redemptions, 0)}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Total Used</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>
            {formatCurrency(offers.reduce((sum, o) => sum + o.revenue, 0))}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Total Revenue</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  offersList: {
    gap: 12,
    marginBottom: 16,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
  },
  offerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  offerContent: {
    flex: 1,
    gap: 6,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  offerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  discountBadge: {
    backgroundColor: `${Colors.light.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.success,
  },
  offerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  summary: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: Colors.light.textMuted,
    fontSize: 14,
  },
});

export default TopOffersCard;
