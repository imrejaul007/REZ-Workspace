// @ts-nocheck
/**
 * SmartBadge Component
 * Shows AI-powered badges: Trending, Popular, Scarcity, Chef's Special
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DemandService, ScarcityService } from '../services';
// @ts-ignore - local type definitions
import type { TrendingItem, ScarcityStatus } from '../services';

interface BadgeProps {
  itemId: string;
  itemName: string;
  storeSlug: string;
  showScarcity?: boolean; // DEFAULT: false - removed fake scarcity for trust
  showTrending?: boolean;
  style?: object;
}

export default function SmartBadge({
  itemId,
  itemName,
  storeSlug,
  showScarcity = false, // DEFAULT: OFF - scarcity signals removed to build trust
  showTrending = true,
  style,
}: BadgeProps) {
  const [badges, setBadges] = useState<Array<{
    type: string;
    label: string;
    icon: string;
    color: string;
  }>>([]);

  useEffect(() => {
    fetchBadges();
  }, [itemId, storeSlug]);

  async function fetchBadges() {
    const badgeList: Array<{
      type: string;
      label: string;
      icon: string;
      color: string;
    }> = [];

    // Get trending
    if (showTrending) {
      try {
        const trendingResult = await DemandService.getTrending(storeSlug, 20);
        if (trendingResult.success && trendingResult.data) {
          // @ts-ignore
          const trendingItem = trendingResult.data.items?.find(
            // @ts-ignore
            (t) => t.itemId === itemId
          ) as unknown;
          if (trendingItem) {
            if (trendingItem.rank <= 10) {
              badgeList.push({
                type: 'trending',
                label: `Trending #${trendingItem.rank}`,
                icon: '🔥',
                color: '#FF9500',
              });
            } else {
              badgeList.push({
                type: 'popular',
                label: `${trendingItem.ordersToday} ordered`,
                icon: '⭐',
                color: '#FFCC00',
              });
            }
          }
        }
      } catch {}
    }

    // Get scarcity - TRUST-FIRST: Show ONLY if real verified data exists
    // Show genuine scarcity from actual inventory, not manufactured pressure
    if (showScarcity) {
      try {
        const scarcityResult = await ScarcityService.getItemStatus(itemId);
        if (scarcityResult.success && scarcityResult.data) {
          // @ts-ignore
          const scarcity: ScarcityStatus = scarcityResult.data;
          // KEEP: Real scarcity from verified data source
          if (scarcity.status === 'scarce') {
            badgeList.push({
              type: 'scarce',
              label: scarcity.quantity <= 5 ? `${scarcity.quantity} left` : 'Limited stock',
              icon: '⏰',
              color: '#FF9500',
            });
          } else if (scarcity.status === 'low') {
            badgeList.push({
              type: 'low',
              label: 'Selling fast',
              icon: '🔥',
              color: '#FF6B35',
            });
          }
        }
      } catch {}
    }

    // Chef's special
    if (itemName.toLowerCase().includes("chef's") || itemName.toLowerCase().includes('special')) {
      badgeList.push({
        type: 'chef',
        label: "Chef's Special",
        icon: '👨‍🍳',
        color: '#AF52DE',
      });
    }

    setBadges(badgeList);
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {badges.map((badge, index) => (
        <View
          key={`${badge.type}-${index}`}
          style={[styles.badge, { backgroundColor: badge.color + '20' }]}
        >
          <Text style={styles.icon}>{badge.icon}</Text>
          <Text style={[styles.label, { color: badge.color }]}>{badge.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
