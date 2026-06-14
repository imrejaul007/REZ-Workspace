'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsData {
  totalScans: { value: number; change: number };
  totalRevenue: { value: number; change: number };
  totalOrders: { value: number; change: number };
  revenueByType: { type: string; revenue: number; percentage: number; color: string }[];
  scansByType: { type: string; scans: number; percentage: number; color: string }[];
  weeklyTrends: { day: string; scans: number; revenue: number }[];
  topPerformers: { name: string; type: string; scans: number; revenue: number }[];
}

export default function QRAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    setLoading(true);
    // Simulated data - replace with actual API call
    setTimeout(() => {
      setAnalytics({
        totalScans: { value: 24580, change: 12.5 },
        totalRevenue: { value: 234500, change: 18.3 },
        totalOrders: { value: 1523, change: 8.7 },
        revenueByType: [
          { type: 'Menu QR', revenue: 98600, percentage: 42, color: '#10B981' },
          { type: 'Room QR', revenue: 78200, percentage: 33, color: '#8B5CF6' },
          { type: 'Ads QR', revenue: 45600, percentage: 19, color: '#F59E0B' },
          { type: 'Link QR', revenue: 12100, percentage: 6, color: '#EC4899' },
        ],
        scansByType: [
          { type: 'Menu QR', scans: 12450, percentage: 51, color: '#10B981' },
          { type: 'Room QR', scans: 5230, percentage: 21, color: '#8B5CF6' },
          { type: 'Ads QR', scans: 4890, percentage: 20, color: '#F59E0B' },
          { type: 'Link QR', scans: 2010, percentage: 8, color: '#EC4899' },
        ],
        weeklyTrends: [
          { day: 'Mon', scans: 3200, revenue: 32000 },
          { day: 'Tue', scans: 2800, revenue: 28000 },
          { day: 'Wed', scans: 3500, revenue: 35000 },
          { day: 'Thu', scans: 4100, revenue: 41000 },
          { day: 'Fri', scans: 4800, revenue: 48000 },
          { day: 'Sat', scans: 5200, revenue: 52000 },
          { day: 'Sun', scans: 2980, revenue: 28500 },
        ],
        topPerformers: [
          { name: 'Main Dining Menu', type: 'Menu QR', scans: 4520, revenue: 34500 },
          { name: 'Room 305', type: 'Room QR', scans: 234, revenue: 12300 },
          { name: 'Summer Sale Campaign', type: 'Ads QR', scans: 1890, revenue: 15600 },
          { name: 'WhatsApp Link', type: 'Link QR', scans: 890, revenue: 0 },
          { name: 'Banquet Menu', type: 'Menu QR', scans: 1230, revenue: 28900 },
        ],
      });
      setLoading(false);
    }, 500);
  }, [period]);

  const maxScanValue = Math.max(...(analytics?.weeklyTrends.map((t) => t.scans) || [1]));

  const getChangeColor = (change: number) => (change >= 0 ? '#10B981' : '#EF4444');
  const getChangeIcon = (change: number) => (change >= 0 ? 'arrow-up' : 'arrow-down');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Analytics</Text>
          <TouchableOpacity>
            <Ionicons name="download-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#6366F120' }]}>
              <Ionicons name="scan" size={20} color="#6366F1" />
            </View>
            <Text style={styles.summaryValue}>{analytics?.totalScans.value.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Scans</Text>
            <View style={styles.changeBadge}>
              <Ionicons
                name={getChangeIcon(analytics?.totalScans.change || 0)}
                size={12}
                color={getChangeColor(analytics?.totalScans.change || 0)}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: getChangeColor(analytics?.totalScans.change || 0) },
                ]}
              >
                {Math.abs(analytics?.totalScans.change || 0)}%
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="cash" size={20} color="#10B981" />
            </View>
            <Text style={styles.summaryValue}>
              ₹{(analytics?.totalRevenue.value || 0) / 1000}k
            </Text>
            <Text style={styles.summaryLabel}>Revenue</Text>
            <View style={styles.changeBadge}>
              <Ionicons
                name={getChangeIcon(analytics?.totalRevenue.change || 0)}
                size={12}
                color={getChangeColor(analytics?.totalRevenue.change || 0)}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: getChangeColor(analytics?.totalRevenue.change || 0) },
                ]}
              >
                {Math.abs(analytics?.totalRevenue.change || 0)}%
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="cart" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.summaryValue}>{analytics?.totalOrders.value.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Orders</Text>
            <View style={styles.changeBadge}>
              <Ionicons
                name={getChangeIcon(analytics?.totalOrders.change || 0)}
                size={12}
                color={getChangeColor(analytics?.totalOrders.change || 0)}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: getChangeColor(analytics?.totalOrders.change || 0) },
                ]}
              >
                {Math.abs(analytics?.totalOrders.change || 0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Trends Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Trends</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {analytics?.weeklyTrends.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(item.scans / maxScanValue) * 100}%`,
                          backgroundColor: '#6366F1',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by QR Type</Text>
          <View style={styles.breakdownCard}>
            {analytics?.revenueByType.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                  <Text style={styles.breakdownLabel}>{item.type}</Text>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownValue}>₹{item.revenue.toLocaleString()}</Text>
                  <Text style={styles.breakdownPercent}>{item.percentage}%</Text>
                </View>
                <View style={styles.breakdownBarContainer}>
                  <View
                    style={[
                      styles.breakdownBar,
                      { width: `${item.percentage}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Scans Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scans by QR Type</Text>
          <View style={styles.breakdownCard}>
            {analytics?.scansByType.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                  <Text style={styles.breakdownLabel}>{item.type}</Text>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownValue}>{item.scans.toLocaleString()}</Text>
                  <Text style={styles.breakdownPercent}>{item.percentage}%</Text>
                </View>
                <View style={styles.breakdownBarContainer}>
                  <View
                    style={[
                      styles.breakdownBar,
                      { width: `${item.percentage}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          <View style={styles.performersCard}>
            {analytics?.topPerformers.map((item, index) => (
              <View key={index} style={styles.performerRow}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{item.name}</Text>
                  <View style={styles.performerType}>
                    <Text style={styles.performerTypeText}>{item.type}</Text>
                  </View>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.performerScans}>{item.scans} scans</Text>
                  {item.revenue > 0 && (
                    <Text style={styles.performerRevenue}>₹{item.revenue.toLocaleString()}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download" size={20} color="#6366F1" />
          <Text style={styles.exportButtonText}>Export Report</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  periodTextActive: {
    color: '#6366F1',
  },
  content: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 24,
    height: 100,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  breakdownRow: {
    marginBottom: 16,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  breakdownRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownPercent: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownBarContainer: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  performersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  performerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  performerType: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  performerTypeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6366F1',
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerScans: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  performerRevenue: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
});
