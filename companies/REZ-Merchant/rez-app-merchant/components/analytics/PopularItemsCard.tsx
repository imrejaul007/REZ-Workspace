/**
 * PopularItemsCard Component
 * Ranking of popular/top-selling items
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { TopSellingProduct } from '@/types/analytics';

interface PopularItemsCardProps {
  items: TopSellingProduct[];
  isLoading?: boolean;
  onItemPress?: (item: TopSellingProduct) => void;
  onViewAll?: () => void;
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return Colors.light.textMuted;
  }
};

const getRankIcon = (rank: number): keyof typeof Ionicons.glyphMap => {
  switch (rank) {
    case 1:
      return 'trophy';
    case 2:
      return 'medal';
    case 3:
      return 'ribbon';
    default:
      return 'ellipse';
  }
};

export function PopularItemsCard({
  items,
  isLoading = false,
  onItemPress,
  onViewAll,
}: PopularItemsCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const formatTrend = (trend: number) => {
    if (trend > 0) return `+${trend.toFixed(0)}%`;
    if (trend < 0) return `${trend.toFixed(0)}%`;
    return '0%';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={20} color={Colors.light.warning} />
            <ThemedText style={styles.title}>Popular Items</ThemedText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.warning} />
        </View>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={20} color={Colors.light.warning} />
            <ThemedText style={styles.title}>Popular Items</ThemedText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={40} color={Colors.light.textMuted} />
          <ThemedText style={styles.emptyText}>No items data</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="star" size={20} color={Colors.light.warning} />
          <ThemedText style={styles.title}>Popular Items</ThemedText>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.itemsList}>
        {items.slice(0, 5).map((item, index) => {
          const rank = item.rank || index + 1;
          const rankColor = getRankColor(rank);
          const isTopThree = rank <= 3;

          return (
            <TouchableOpacity
              key={item.productId}
              style={[
                styles.itemRow,
                isTopThree && styles.topThreeItem,
              ]}
              onPress={() => onItemPress?.(item)}
              disabled={!onItemPress}
              activeOpacity={0.7}
            >
              {/* Rank indicator */}
              <View style={[styles.rankContainer, isTopThree && { backgroundColor: `${rankColor}20` }]}>
                {isTopThree ? (
                  <Ionicons name={getRankIcon(rank)} size={18} color={rankColor} />
                ) : (
                  <ThemedText style={styles.rankNumber}>#{rank}</ThemedText>
                )}
              </View>

              {/* Product image or placeholder */}
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube" size={20} color={Colors.light.textMuted} />
                </View>
              )}

              {/* Product info */}
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </ThemedText>
                <View style={styles.productStats}>
                  <ThemedText style={styles.productQuantity}>
                    {item.quantitySold} sold
                  </ThemedText>
                  <View style={styles.dot} />
                  <ThemedText style={styles.productRevenue}>
                    {formatCurrency(item.revenue)}
                  </ThemedText>
                </View>
              </View>

              {/* Trend indicator */}
              <View style={[
                styles.trendContainer,
                { backgroundColor: item.trend >= 0 ? `${Colors.light.success}15` : `${Colors.light.error}15` },
              ]}>
                <Ionicons
                  name={item.trend >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={item.trend >= 0 ? Colors.light.success : Colors.light.error}
                />
                <ThemedText style={[
                  styles.trendText,
                  { color: item.trend >= 0 ? Colors.light.success : Colors.light.error },
                ]}>
                  {formatTrend(item.trend)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>
            {items.reduce((sum, i) => sum + i.quantitySold, 0).toLocaleString()}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Total Sold</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>
            {formatCurrency(items.reduce((sum, i) => sum + i.revenue, 0))}
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
  itemsList: {
    gap: 10,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  topThreeItem: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  rankNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  productStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productQuantity: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.light.textMuted,
  },
  productRevenue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
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

export default PopularItemsCard;
