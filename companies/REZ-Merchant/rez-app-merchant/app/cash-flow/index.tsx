/**
 * Cash Flow Forecast Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';

const { width } = Dimensions.get('window');

interface DailyProjection {
  date: Date;
  projectedBalance: number;
  expectedInflows: number;
  expectedOutflows: number;
}

interface CashFlowAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
}

interface Forecast {
  openingBalance: number;
  closingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netChange: number;
  confidence: number;
  dailyProjections: DailyProjection[];
  alerts: CashFlowAlert[];
}

export default function CashFlowScreen() {
  const { activeStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [forecastDays, setForecastDays] = useState(30);

  const fetchForecast = useCallback(async () => {
    // Mock data for demo
    const mockForecast: Forecast = {
      openingBalance: 1250000,
      closingBalance: 1450000,
      totalInflows: 850000,
      totalOutflows: 650000,
      netChange: 200000,
      confidence: 87,
      dailyProjections: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() + i * 86400000),
        projectedBalance: 1250000 + (i * 7000) - (i % 7 < 5 ? 25000 : 0),
        expectedInflows: i % 5 === 0 ? 50000 : 15000,
        expectedOutflows: i % 3 === 0 ? 35000 : 12000,
      })),
      alerts: [
        { type: 'info', message: 'Large outflow expected on 15th - ₹2,50,000' },
        { type: 'warning', message: 'Balance may dip below 10L on 22nd' },
      ],
    };
    setForecast(mockForecast);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchForecast();
  };

  const formatCurrency = (amount: number) => `₹${(amount / 100000).toFixed(1)}L`;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return Colors.red[500];
      case 'warning': return Colors.orange[500];
      default: return Colors.blue[500];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const minBalance = Math.min(...(forecast?.dailyProjections.map(p => p.projectedBalance) || [0]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cash Flow Forecast</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{forecast?.confidence}% confident</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          <Animated.View entering={FadeInDown}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Opening</Text>
                <Text style={styles.summaryValue}>{formatCurrency(forecast?.openingBalance || 0)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Closing</Text>
                <Text style={[styles.summaryValue, { color: Colors.green[600] }]}>
                  {formatCurrency(forecast?.closingBalance || 0)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Inflows/Outflows */}
          <Animated.View entering={FadeInDown}>
            <View style={styles.flowCard}>
              <View style={styles.flowRow}>
                <View style={styles.flowItem}>
                  <View style={[styles.flowIcon, { backgroundColor: Colors.green[100] }]}>
                    <Ionicons name="arrow-down" size={16} color={Colors.green[600]} />
                  </View>
                  <Text style={styles.flowLabel}>Inflows</Text>
                  <Text style={[styles.flowValue, { color: Colors.green[600] }]}>
                    {formatCurrency(forecast?.totalInflows || 0)}
                  </Text>
                </View>
                <View style={styles.flowItem}>
                  <View style={[styles.flowIcon, { backgroundColor: Colors.red[100] }]}>
                    <Ionicons name="arrow-up" size={16} color={Colors.red[600]} />
                  </View>
                  <Text style={styles.flowLabel}>Outflows</Text>
                  <Text style={[styles.flowValue, { color: Colors.red[600] }]}>
                    {formatCurrency(forecast?.totalOutflows || 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Net Change</Text>
                <Text style={[styles.netValue, { color: forecast?.netChange && forecast.netChange > 0 ? Colors.green[600] : Colors.red[600] }]}>
                  {forecast?.netChange && forecast.netChange > 0 ? '+' : ''}{formatCurrency(forecast?.netChange || 0)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Alerts */}
          {forecast?.alerts && forecast.alerts.length > 0 && (
            <Animated.View entering={FadeInDown}>
              <Text style={styles.sectionTitle}>Alerts</Text>
              {forecast.alerts.map((alert, index) => (
                <View key={index} style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}>
                  <Ionicons
                    name={alert.type === 'critical' ? 'warning' : alert.type === 'warning' ? 'alert-circle' : 'information-circle'}
                    size={20}
                    color={getAlertColor(alert.type)}
                  />
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Chart Placeholder */}
          <Animated.View entering={FadeInDown}>
            <Text style={styles.sectionTitle}>Projected Balance</Text>
            <View style={styles.chartCard}>
              <View style={styles.chart}>
                {forecast?.dailyProjections.slice(0, 14).map((day, index) => {
                  const maxBalance = Math.max(...(forecast?.dailyProjections.map(p => p.projectedBalance) || [1]));
                  const minB = Math.min(...(forecast?.dailyProjections.map(p => p.projectedBalance) || [0]));
                  const range = maxBalance - minB || 1;
                  const height = ((day.projectedBalance - minB) / range) * 120 + 20;
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={[styles.bar, { height, backgroundColor: day.projectedBalance < minBalance * 1.1 ? Colors.orange[400] : Colors.primary[400] }]} />
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>Today</Text>
                <Text style={styles.chartLabel}>+14 days</Text>
              </View>
            </View>
          </Animated.View>

          {/* Daily Breakdown */}
          <Animated.View entering={FadeInDown}>
            <Text style={styles.sectionTitle}>Daily Projections</Text>
            {forecast?.dailyProjections.slice(0, 7).map((day, index) => (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                  <Text style={styles.dayBalance}>{formatCurrency(day.projectedBalance)}</Text>
                </View>
                <View style={styles.dayFlows}>
                  <View style={styles.dayFlow}>
                    <Text style={styles.dayFlowLabel}>In</Text>
                    <Text style={[styles.dayFlowValue, { color: Colors.green[600] }]}>
                      {formatCurrency(day.expectedInflows)}
                    </Text>
                  </View>
                  <View style={styles.dayFlow}>
                    <Text style={styles.dayFlowLabel}>Out</Text>
                    <Text style={[styles.dayFlowValue, { color: Colors.red[600] }]}>
                      {formatCurrency(day.expectedOutflows)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray[50] },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  confidenceBadge: { backgroundColor: Colors.green[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 12, color: Colors.green[700], fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryLabel: { fontSize: 12, color: Colors.gray[500] },
  summaryValue: { fontSize: 24, fontWeight: '700', color: Colors.gray[900], marginTop: 4 },
  flowCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  flowRow: { flexDirection: 'row', justifyContent: 'space-around' },
  flowItem: { alignItems: 'center' },
  flowIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  flowLabel: { fontSize: 12, color: Colors.gray[500] },
  flowValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  netLabel: { fontSize: 14, color: Colors.gray[700] },
  netValue: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.gray[900], marginBottom: 12, marginTop: 8 },
  alertCard: { backgroundColor: Colors.white, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 4 },
  alertText: { fontSize: 13, color: Colors.gray[700], flex: 1 },
  chartCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  chartBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 2 },
  bar: { width: '60%', borderRadius: 4, minHeight: 4 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { fontSize: 11, color: Colors.gray[500] },
  dayCard: { backgroundColor: Colors.white, borderRadius: 10, padding: 14, marginBottom: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dayDate: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  dayBalance: { fontSize: 14, fontWeight: '700', color: Colors.gray[900] },
  dayFlows: { flexDirection: 'row', gap: 24 },
  dayFlow: { flexDirection: 'row', gap: 6 },
  dayFlowLabel: { fontSize: 12, color: Colors.gray[500] },
  dayFlowValue: { fontSize: 12, fontWeight: '600' },
});
