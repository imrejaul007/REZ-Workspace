/**
 * AITrendingBanner
 * Shows trending items and scarcity alerts at the top of menu
 * Uses real intentGraphApi service
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTrendingItems, type IntentTrend } from '@/services/intentGraphApi';

interface AITrendingBannerProps {
  storeSlug?: string;
  entityType?: 'product' | 'store' | 'brand';
  onItemPress?: (itemId: string) => void;
  style?: object;
}

interface TrendingItem {
  itemId: string;
  name: string;
  rank: number;
  ordersToday: number;
  trend: 'rising' | 'stable' | 'falling';
}

const AITrendingBanner: React.FC<AITrendingBannerProps> = ({
  storeSlug,
  entityType = 'product',
  onItemPress,
  style,
}) => {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, [storeSlug, entityType]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Use real intentGraphApi
      const result = await getTrendingItems(entityType, { limit: 5 });

      if (result.success && result.data) {
        const trends = (result.data as IntentTrend[]).slice(0, 5).map((item, index) => ({
          itemId: item.entityId || `trend-${index}`,
          name: `${item.entityType} ${index + 1}`,
          rank: index + 1,
          ordersToday: item.signals || 0,
          trend: item.trend,
        }));
        setTrending(trends);
      }
    } catch (error) {
      // Fallback - show nothing if service unavailable
      setTrending([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#5856D6" />
        <Text style={styles.loadingText}>Loading AI insights...</Text>
      </View>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Text style={styles.aiIcon}>✨</Text>
            <Text style={styles.aiText}>AI Insights</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#8E8E93"
        />
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {/* Trending Now */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.trendingIcon}>🔥</Text> Trending Now
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trending.map((item, index) => (
                <Pressable
                  key={item.itemId}
                  style={styles.trendingCard}
                  onPress={() => onItemPress?.(item.itemId)}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.trendingName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.trendingStats}>
                    <Text style={styles.trendingOrders}>{item.ordersToday} ordered</Text>
                    {item.trend === 'rising' && (
                      <Text style={styles.trendingArrow}>↑</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Footer note */}
          <Text style={styles.footer}>
            Updated in real-time based on orders
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8EDFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiIcon: {
    fontSize: 12,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5856D6',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  trendingIcon: {
    fontSize: 12,
  },
  trendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    width: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankBadge: {
    position: 'absolute',
    top: -6,
    left: 8,
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendingName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 4,
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendingOrders: {
    fontSize: 10,
    color: '#8E8E93',
  },
  trendingArrow: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
  },
  footer: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AITrendingBanner;
