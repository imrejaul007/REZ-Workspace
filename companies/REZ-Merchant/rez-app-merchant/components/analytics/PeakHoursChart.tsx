/**
 * PeakHoursChart Component
 * Horizontal bar chart for hourly analysis showing peak business hours
 */

import React from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { HourlyPerformanceData } from '@/types/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PeakHoursChartProps {
  data: HourlyPerformanceData[];
  peakHours?: {
    start: number;
    end: number;
    label: string;
    ordersPercentage: number;
    revenuePercentage: number;
  }[];
  isLoading?: boolean;
}

export function PeakHoursChart({
  data,
  peakHours,
  isLoading = false,
}: PeakHoursChartProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="time" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.title}>Peak Hours Analysis</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="time" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.title}>Peak Hours Analysis</ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={Colors.light.textMuted} />
          <ThemedText style={styles.emptyText}>No data available</ThemedText>
        </View>
      </View>
    );
  }

  // Get top hours by orders
  const maxOrders = Math.max(...data.map((d) => d.orders));
  const sortedByOrders = [...data].sort((a, b) => b.orders - a.orders);
  const topHours = sortedByOrders.slice(0, 6);

  // Determine if hour is peak
  const isPeakHour = (hour: number) => {
    if (!peakHours) return false;
    return peakHours.some((p) => hour >= p.start && hour <= p.end);
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.title}>Peak Hours Analysis</ThemedText>
        </View>
      </View>

      {/* Peak hours summary */}
      {peakHours && peakHours.length > 0 && (
        <View style={styles.peakSummary}>
          {peakHours.map((peak, index) => (
            <View key={index} style={styles.peakBadge}>
              <Ionicons name="flame" size={14} color={Colors.light.warning} />
              <ThemedText style={styles.peakBadgeText}>{peak.label}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Horizontal bars for top hours */}
      <View style={styles.barsContainer}>
        {topHours.map((hourData) => {
          const barWidth = maxOrders > 0 ? (hourData.orders / maxOrders) * 100 : 0;
          const isPeak = isPeakHour(hourData.hour);

          return (
            <View key={hourData.hour} style={styles.barRow}>
              <ThemedText style={styles.hourLabel}>
                {formatHour(hourData.hour)}
              </ThemedText>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: isPeak ? Colors.light.warning : Colors.light.primary,
                    },
                  ]}
                />
                {isPeak && (
                  <View style={styles.peakIndicator}>
                    <Ionicons name="flame" size={10} color={Colors.light.warning} />
                  </View>
                )}
              </View>
              <View style={styles.barStats}>
                <ThemedText style={styles.barValue}>{hourData.orders}</ThemedText>
                <ThemedText style={styles.barSubvalue}>
                  ₹{hourData.revenue >= 1000 ? `${(hourData.revenue / 1000).toFixed(1)}K` : hourData.revenue}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.light.primary }]} />
          <ThemedText style={styles.legendText}>Regular Hours</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.light.warning }]} />
          <Ionicons name="flame" size={12} color={Colors.light.warning} />
          <ThemedText style={styles.legendText}>Peak Hours</ThemedText>
        </View>
      </View>

      {/* Quick insights */}
      <View style={styles.insights}>
        <View style={styles.insightRow}>
          <ThemedText style={styles.insightLabel}>Busiest Hour:</ThemedText>
          <ThemedText style={styles.insightValue}>
            {formatHour(sortedByOrders[0]?.hour || 0)} ({sortedByOrders[0]?.orders || 0} orders)
          </ThemedText>
        </View>
        <View style={styles.insightRow}>
          <ThemedText style={styles.insightLabel}>Avg/Hour:</ThemedText>
          <ThemedText style={styles.insightValue}>
            {(data.reduce((sum, d) => sum + d.orders, 0) / data.length).toFixed(1)} orders
          </ThemedText>
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
  peakSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.light.warning}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  peakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  barsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourLabel: {
    width: 50,
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  barWrapper: {
    flex: 1,
    height: 24,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  peakIndicator: {
    marginLeft: 4,
  },
  barStats: {
    width: 70,
    alignItems: 'flex-end',
  },
  barValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  barSubvalue: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  insights: {
    gap: 6,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  insightValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
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
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: Colors.light.textMuted,
    fontSize: 14,
  },
});

export default PeakHoursChart;
