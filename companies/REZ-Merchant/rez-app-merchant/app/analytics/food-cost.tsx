import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
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
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';

interface ProductAnalytics {
  id: string;
  name: string;
  foodCostPercentage: number;
  margin: number;
  recipeStatus: 'costed' | 'not_costed';
}

interface FoodCostSummary {
  avgFoodCost: number;
  recipesCostCount: number;
  totalProductsCount: number;
  highRiskItemsCount: number;
  topHighCostProducts: ProductAnalytics[];
  topHighMarginProducts: ProductAnalytics[];
}

export default function FoodCostAnalyticsScreen() {
  const [summary, setSummary] = useState<FoodCostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get<FoodCostSummary>('/merchant/analytics/food-cost');

      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        showAlert('Error', response.message || 'Failed to load analytics');
      }
    } catch (error) {
      logger.error('Error fetching food cost analytics:', error);
      showAlert('Error', error?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  const getFoodCostColor = (percentage: number): string => {
    if (percentage <= 30) return Colors.light.success;
    if (percentage <= 40) return Colors.light.warning;
    return Colors.light.error;
  };

  const getStatusColor = (percentage: number, target: number = 30): string => {
    return percentage <= target ? Colors.light.success : Colors.light.error;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Food Cost Analytics</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Last 30 days</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        {summary && (
          <>
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryValue}>
                  {summary.avgFoodCost.toFixed(1)}%
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Avg food cost</ThemedText>
                <View style={styles.targetRow}>
                  <ThemedText style={styles.targetLabel}>Target: </ThemedText>
                  <ThemedText
                    style={[
                      styles.targetValue,
                      {
                        color: getStatusColor(summary.avgFoodCost, 30),
                      },
                    ]}
                  >
                    {'<30%'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryValue}>
                  {summary.recipesCostCount}/{summary.totalProductsCount}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Recipes costed</ThemedText>
              </View>

              <View style={styles.summaryCard}>
                <ThemedText style={[styles.summaryValue, { color: Colors.light.error }]}>
                  {summary.highRiskItemsCount}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>High-risk items</ThemedText>
              </View>
            </View>

            {/* High Cost Products */}
            {summary.topHighCostProducts.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Top high-cost products</ThemedText>
                <FlatList
                  data={summary.topHighCostProducts}
                  renderItem={({ item }) => (
                    <View style={styles.productRow}>
                      <View style={styles.productInfo}>
                        <ThemedText style={styles.productName}>{item.name}</ThemedText>
                        <View style={styles.costBadgeRow}>
                          <View
                            style={[
                              styles.costBadge,
                              {
                                backgroundColor: `${getFoodCostColor(item.foodCostPercentage)}20`,
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.costBadgeText,
                                {
                                  color: getFoodCostColor(item.foodCostPercentage),
                                },
                              ]}
                            >
                              {item.foodCostPercentage.toFixed(1)}%
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push(`/recipes/${item.id}`)}
                      >
                        <ThemedText style={styles.actionButtonText}>Fix Recipe →</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* High Margin Products */}
            {summary.topHighMarginProducts.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Top high-margin products</ThemedText>
                <FlatList
                  data={summary.topHighMarginProducts}
                  renderItem={({ item }) => (
                    <View style={styles.productRow}>
                      <View style={styles.productInfo}>
                        <ThemedText style={styles.productName}>{item.name}</ThemedText>
                        <View style={styles.costBadgeRow}>
                          <View
                            style={[
                              styles.costBadge,
                              { backgroundColor: `${Colors.light.success}20` },
                            ]}
                          >
                            <ThemedText
                              style={[styles.costBadgeText, { color: Colors.light.success }]}
                            >
                              {item.margin.toFixed(1)}% margin
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.promoteButton}
                        onPress={() => router.push('/(dashboard)/campaign-rules')}
                      >
                        <ThemedText style={styles.promoteButtonText}>Promote →</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: `${Colors.light.card}90`,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 8,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  targetValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  costBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  costBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  costBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  promoteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.light.success}20`,
    borderRadius: 6,
    marginLeft: 8,
  },
  promoteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.success,
  },
});
