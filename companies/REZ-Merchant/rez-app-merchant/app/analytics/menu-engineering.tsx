import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

type Quadrant = 'star' | 'plowhorse' | 'puzzle' | 'dog';

interface MenuItem {
  itemId: string;
  name: string;
  category: string;
  orderCount: number;
  revenue: number;
  margin: number;
  foodCostPercentage?: number;
  popularityScore: number;
  marginScore: number;
  quadrant: Quadrant;
}

interface MenuEngineeringData {
  items: MenuItem[];
}

const QUADRANTS: Record<Quadrant, { icon: string; color: string; label: string; desc: string }> = {
  star: {
    icon: '⭐',
    color: Colors.light.success,
    label: 'Stars',
    desc: 'High popularity, high margin',
  },
  plowhorse: {
    icon: '🐴',
    color: Colors.light.primary,
    label: 'Plowhorses',
    desc: 'High popularity, low margin',
  },
  puzzle: {
    icon: '🧩',
    color: Colors.light.warning,
    label: 'Puzzles',
    desc: 'Low popularity, high margin',
  },
  dog: { icon: '🐕', color: '#9CA3AF', label: 'Dogs', desc: 'Low popularity, low margin' },
};

export default function MenuEngineeringScreen() {
  const [data, setData] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuadrant, setExpandedQuadrant] = useState<Quadrant | null>(null);

  const fetchMenuEngineering = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);
      const response = await apiClient.get<MenuEngineeringData>(
        '/merchant/analytics/menu-engineering'
      );
      if (response.success && response.data) {
        setData(response.data.items);
      } else {
        showAlert('Error', response.message || 'Failed to load menu engineering data');
      }
    } catch (error) {
      logger.error('Error fetching menu engineering data:', error);
      showAlert('Error', error?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuEngineering();
  }, [fetchMenuEngineering]);

  const handleRefresh = () => {
    fetchMenuEngineering(true);
  };

  const itemsByQuadrant = useMemo(() => {
    const grouped: Record<Quadrant, MenuItem[]> = {
      star: [],
      plowhorse: [],
      puzzle: [],
      dog: [],
    };
    data.forEach((item) => {
      grouped[item.quadrant].push(item);
    });
    return grouped;
  }, [data]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatMargin = (margin: number) => {
    return `${(margin * 100).toFixed(1)}%`;
  };

  const getFoodCostColor = (foodCostPct: number): string => {
    if (foodCostPct < 30) return Colors.light.success; // Green
    if (foodCostPct <= 40) return Colors.light.warning; // Amber
    return '#EF4444'; // Red
  };

  const getRecommendation = (quadrant: Quadrant, foodCostPct?: number): string => {
    if (!foodCostPct) return '';
    if (foodCostPct > 40) return 'High food cost - consider cost reduction';
    if (foodCostPct > 30) return 'Monitor food cost';
    return 'Optimal food cost';
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading menu analysis...</ThemedText>
      </ThemedView>
    );
  }

  const renderMatrixQuadrant = (quadrant: Quadrant, position: 'tl' | 'tr' | 'bl' | 'br') => {
    const config = QUADRANTS[quadrant];
    const items = itemsByQuadrant[quadrant];
    return (
      <View
        key={quadrant}
        style={[
          styles.quadrant,
          { backgroundColor: `${config.color}15`, borderColor: config.color },
          position === 'tl' && styles.quadrantTL,
          position === 'tr' && styles.quadrantTR,
          position === 'bl' && styles.quadrantBL,
          position === 'br' && styles.quadrantBR,
        ]}
      >
        <ThemedText style={[styles.quadrantIcon, { color: config.color }]}>
          {config.icon}
        </ThemedText>
        <ThemedText style={[styles.quadrantLabel, { color: config.color }]}>
          {config.label}
        </ThemedText>
        <ThemedText style={styles.quadrantCount}>{items.length} items</ThemedText>
      </View>
    );
  };

  const renderQuadrantSection = (quadrant: Quadrant) => {
    const config = QUADRANTS[quadrant];
    const items = itemsByQuadrant[quadrant];
    return (
      <View key={quadrant} style={styles.quadrantSection}>
        <TouchableOpacity
          style={styles.quadrantSectionHeader}
          onPress={() => setExpandedQuadrant(expandedQuadrant === quadrant ? null : quadrant)}
        >
          <View style={styles.headerLeft}>
            <ThemedText style={[styles.headerIcon, { color: config.color }]}>
              {config.icon}
            </ThemedText>
            <View>
              <ThemedText style={styles.sectionTitle}>{config.label}</ThemedText>
              <ThemedText style={styles.sectionDesc}>{config.desc}</ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <ThemedText style={styles.itemCount}>{items.length}</ThemedText>
            <Ionicons
              name={expandedQuadrant === quadrant ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.light.icon}
            />
          </View>
        </TouchableOpacity>

        {expandedQuadrant === quadrant && (
          <View style={styles.itemsList}>
            {items.length === 0 ? (
              <ThemedText style={styles.emptyText}>No items in this quadrant</ThemedText>
            ) : (
              items.map((item, index) => (
                <View
                  key={item.itemId}
                  style={[styles.itemRow, index !== items.length - 1 && styles.itemRowBorder]}
                >
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemCategory}>{item.category}</ThemedText>
                  </View>
                  <View style={styles.itemStats}>
                    <View style={styles.stat}>
                      <ThemedText style={styles.statLabel}>Orders</ThemedText>
                      <ThemedText style={styles.statValue}>{item.orderCount}</ThemedText>
                    </View>
                    <View style={styles.stat}>
                      <ThemedText style={styles.statLabel}>Revenue</ThemedText>
                      <ThemedText style={styles.statValue}>
                        {formatCurrency(item.revenue)}
                      </ThemedText>
                    </View>
                    <View style={styles.stat}>
                      <ThemedText
                        style={[
                          styles.statValue,
                          {
                            color: item.margin > 0.5 ? Colors.light.success : Colors.light.warning,
                          },
                        ]}
                      >
                        {formatMargin(item.margin)}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Margin</ThemedText>
                    </View>
                    {item.foodCostPercentage !== undefined && (
                      <View style={styles.stat}>
                        <ThemedText
                          style={[
                            styles.statValue,
                            { color: getFoodCostColor(item.foodCostPercentage) },
                          ]}
                        >
                          {item.foodCostPercentage.toFixed(1)}%
                        </ThemedText>
                        <ThemedText style={styles.statLabel}>Food Cost</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Menu Engineering</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Analyze items by popularity and margin
        </ThemedText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.matrixContainer}>
          <View style={styles.matrixRow}>
            {renderMatrixQuadrant('star', 'tl')}
            {renderMatrixQuadrant('puzzle', 'tr')}
          </View>
          <View style={styles.matrixRow}>
            {renderMatrixQuadrant('plowhorse', 'bl')}
            {renderMatrixQuadrant('dog', 'br')}
          </View>
        </View>

        <View style={styles.axisLabels}>
          <View style={styles.axisLabel}>
            <Ionicons name="arrow-up" size={16} color={Colors.light.icon} />
            <ThemedText style={styles.axisText}>High Margin</ThemedText>
          </View>
          <View style={styles.axisLabel}>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.icon} />
            <ThemedText style={styles.axisText}>High Popularity</ThemedText>
          </View>
        </View>

        <View style={styles.legendContainer}>
          <ThemedText style={styles.legendTitle}>Recommendations</ThemedText>
          {[
            {
              icon: '⭐',
              bg: Colors.light.success,
              title: 'Stars: Maximize',
              desc: 'High demand and margin. Promote prominently and maintain quality.',
            },
            {
              icon: '🐴',
              bg: Colors.light.primary,
              title: 'Plowhorses: Optimize',
              desc: 'Popular but low margin. Increase prices, reduce costs, or bundle with profitable items.',
            },
            {
              icon: '🧩',
              bg: Colors.light.warning,
              title: 'Puzzles: Consider',
              desc: 'High margin but low popularity. Test pricing, improve visibility, or consider removing.',
            },
            {
              icon: '🐕',
              bg: '#F3F4F6',
              title: 'Dogs: Evaluate',
              desc: 'Low popularity and margin. Consider discontinuing or significantly improving.',
            },
          ].map((rec, idx) => (
            <View key={idx} style={styles.recommendationBox}>
              <View style={[styles.recIcon, { backgroundColor: `${rec.bg}20` }]}>
                <ThemedText style={styles.recIconText}>{rec.icon}</ThemedText>
              </View>
              <View style={styles.recContent}>
                <ThemedText style={styles.recTitle}>{rec.title}</ThemedText>
                <ThemedText style={styles.recDesc}>{rec.desc}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionsContainer}>
          {(['star', 'plowhorse', 'puzzle', 'dog'] as const).map((quadrant) =>
            renderQuadrantSection(quadrant)
          )}
        </View>

        {data.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="analytics" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyStateTitle}>No data available</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Not enough menu data to analyze yet
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: Colors.light.tint },
  headerTitle: { fontSize: 24, fontWeight: '600', color: Colors.light.card, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: `${Colors.light.card}80` },
  matrixContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 1,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  matrixRow: { flexDirection: 'row', gap: 1 },
  quadrant: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quadrantTL: { borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 8 },
  quadrantTR: { borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 8 },
  quadrantBL: { borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 8 },
  quadrantBR: { borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 8 },
  quadrantIcon: { fontSize: 32, marginBottom: 4 },
  quadrantLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  quadrantCount: { fontSize: 11, color: Colors.light.icon },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  axisLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  axisText: { fontSize: 12, color: Colors.light.icon },
  legendContainer: { marginHorizontal: 16, marginBottom: 20 },
  legendTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recIconText: { fontSize: 24 },
  recContent: { flex: 1 },
  recTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  recDesc: { fontSize: 12, color: Colors.light.icon, lineHeight: 16 },
  sectionsContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  quadrantSection: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quadrantSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerIcon: { fontSize: 20, marginRight: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sectionDesc: { fontSize: 12, color: Colors.light.icon },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    minWidth: 24,
    textAlign: 'right',
  },
  itemsList: { borderTopWidth: 1, borderTopColor: Colors.light.border },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  itemCategory: { fontSize: 11, color: Colors.light.icon },
  itemStats: { flexDirection: 'row', gap: 12, marginLeft: 12 },
  stat: { alignItems: 'flex-end' },
  statLabel: { fontSize: 10, color: Colors.light.icon, marginBottom: 2 },
  statValue: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  emptyText: { fontSize: 13, color: Colors.light.icon, textAlign: 'center', paddingVertical: 12 },
  emptyStateContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: Colors.light.icon, textAlign: 'center' },
});
