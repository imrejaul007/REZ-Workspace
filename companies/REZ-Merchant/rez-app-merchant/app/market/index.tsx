/**
 * Market Intelligence - Mobile View
 * Simplified version for merchant mobile app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Benchmark {
  avgOrderValue: number;
  avgOrdersPerDay: number;
  avgRetentionRate: number;
  avgRevenueGrowth: number;
}

interface Trend {
  locality: string;
  growthRate: number;
  merchantCount: number;
}

export default function MarketIntelligenceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [trending, setTrending] = useState<Trend[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trending' | 'settings'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [benchmarkRes, trendingRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/merchant/intelligence/market/benchmark?industry=restaurant`),
        fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/merchant/intelligence/market/trending?city=Bangalore&industry=restaurant`)
      ]);

      if (benchmarkRes.ok) {
        const data = await benchmarkRes.json();
        setBenchmark(data.data);
      }

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrending(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading market insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Intelligence</Text>
        <Text style={styles.headerSubtitle}>Compare your performance with the market</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'trending', 'settings'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? 'Overview' : tab === 'trending' ? 'Trending' : 'Settings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && (
          <>
            {/* Industry Benchmarks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Industry</Text>
              <Text style={styles.sectionSubtitle}>Restaurant • Bangalore</Text>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    ₹{benchmark?.avgOrderValue?.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.metricLabel}>Avg Order Value</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {benchmark?.avgOrdersPerDay?.toFixed(0) || '0'}
                  </Text>
                  <Text style={styles.metricLabel}>Orders/Day</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {benchmark?.avgRetentionRate?.toFixed(0) || '0'}%
                  </Text>
                  <Text style={styles.metricLabel}>Retention Rate</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={[styles.metricValue, styles.growthValue]}>
                    +{benchmark?.avgRevenueGrowth?.toFixed(1) || '0'}%
                  </Text>
                  <Text style={styles.metricLabel}>30-Day Growth</Text>
                </View>
              </View>
            </View>

            {/* Benchmark vs You */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Performance</Text>

              <View style={styles.benchmarkCard}>
                <View style={styles.benchmarkRow}>
                  <Text style={styles.benchmarkLabel}>Your Avg Order</Text>
                  <Text style={styles.benchmarkValue}>₹450</Text>
                </View>
                <View style={styles.benchmarkBar}>
                  <View style={[styles.benchmarkFill, { width: '75%' }]} />
                </View>
                <Text style={styles.benchmarkCompare}>vs ₹{benchmark?.avgOrderValue?.toLocaleString() || '350'} industry avg</Text>
              </View>

              <View style={styles.benchmarkCard}>
                <View style={styles.benchmarkRow}>
                  <Text style={styles.benchmarkLabel}>Your Orders/Day</Text>
                  <Text style={styles.benchmarkValue}>45</Text>
                </View>
                <View style={styles.benchmarkBar}>
                  <View style={[styles.benchmarkFill, { width: '60%' }]} />
                </View>
                <Text style={styles.benchmarkCompare}>vs {benchmark?.avgOrdersPerDay?.toFixed(0) || '25'} industry avg</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'trending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Areas</Text>
            <Text style={styles.sectionSubtitle}>Fastest growing localities</Text>

            {trending.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up" size={48} color={Colors.gray} />
                <Text style={styles.emptyText}>No trending data yet</Text>
                <Text style={styles.emptySubtext}>
                  Data will appear as more merchants join the program
                </Text>
              </View>
            ) : (
              trending.map((area, index) => (
                <View key={area.locality} style={styles.trendCard}>
                  <View style={styles.trendRank}>
                    <Text style={styles.trendRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendName}>{area.locality}</Text>
                    <Text style={styles.trendMerchants}>{area.merchantCount} merchants</Text>
                  </View>
                  <View style={styles.trendGrowth}>
                    <Ionicons name="arrow-up" size={16} color={Colors.success} />
                    <Text style={styles.trendGrowthText}>+{area.growthRate}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Intelligence</Text>

            <View style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
                <Text style={styles.consentTitle}>You're participating</Text>
              </View>
              <Text style={styles.consentText}>
                Your anonymized data helps create industry benchmarks and insights.
              </Text>
              <TouchableOpacity style={styles.optOutButton}>
                <Text style={styles.optOutText}>Opt Out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What we collect (anonymized):</Text>
              <Text style={styles.infoItem}>• Order counts and values</Text>
              <Text style={styles.infoItem}>• Peak hours and popular items</Text>
              <Text style={styles.infoItem}>• Location (neighborhood only)</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What we NEVER collect:</Text>
              <Text style={styles.infoItem}>• Customer names or phone numbers</Text>
              <Text style={styles.infoItem}>• Individual transactions</Text>
              <Text style={styles.infoItem}>• Bank or payment details</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.gray,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.gray,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  growthValue: {
    color: Colors.success,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  benchmarkCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  benchmarkLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  benchmarkValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  benchmarkBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  benchmarkFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  benchmarkCompare: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginTop: 4,
  },
  trendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  trendRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendRankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trendName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  trendMerchants: {
    fontSize: 12,
    color: Colors.gray,
  },
  trendGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendGrowthText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  consentCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  consentText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
  },
  optOutButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  optOutText: {
    color: Colors.error,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
});
