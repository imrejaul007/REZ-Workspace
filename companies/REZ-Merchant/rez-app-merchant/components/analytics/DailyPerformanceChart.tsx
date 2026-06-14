/**
 * DailyPerformanceChart Component
 * Bar chart showing daily revenue/orders/customers breakdown
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { DailyPerformanceData } from '@/types/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyPerformanceChartProps {
  data: DailyPerformanceData[];
  isLoading?: boolean;
  onBarPress?: (day: DailyPerformanceData) => void;
}

type MetricType = 'revenue' | 'orders' | 'customers';

const METRIC_CONFIG: Record<MetricType, { label: string; color: string; format: (v: number) => string }> = {
  revenue: {
    label: 'Revenue',
    color: '#6366F1',
    format: (v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)}`,
  },
  orders: {
    label: 'Orders',
    color: '#10B981',
    format: (v) => v.toString(),
  },
  customers: {
    label: 'Customers',
    color: '#F59E0B',
    format: (v) => v.toString(),
  },
};

export function DailyPerformanceChart({
  data,
  isLoading = false,
  onBarPress,
}: DailyPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('revenue');
  const [selectedDay, setSelectedDay] = useState<DailyPerformanceData | null>(null);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Daily Performance</ThemedText>
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
          <ThemedText style={styles.title}>Daily Performance</ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.light.textMuted} />
          <ThemedText style={styles.emptyText}>No data available</ThemedText>
        </View>
      </View>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map((d) => d[selectedMetric]));
  const barWidth = Math.min(40, (SCREEN_WIDTH - 80) / data.length - 8);

  const handleBarPress = (day: DailyPerformanceData) => {
    setSelectedDay(day);
    onBarPress?.(day);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Daily Performance</ThemedText>
        <View style={styles.metricToggle}>
          {(Object.keys(METRIC_CONFIG) as MetricType[]).map((metric) => (
            <TouchableOpacity
              key={metric}
              style={[
                styles.metricButton,
                selectedMetric === metric && {
                  backgroundColor: METRIC_CONFIG[metric].color,
                },
              ]}
              onPress={() => setSelectedMetric(metric)}
            >
              <ThemedText
                style={[
                  styles.metricButtonText,
                  selectedMetric === metric && styles.metricButtonTextActive,
                ]}
              >
                {METRIC_CONFIG[metric].label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected day info */}
      {selectedDay && (
        <View style={styles.selectedInfo}>
          <ThemedText style={styles.selectedDayText}>
            {selectedDay.dayOfWeek}
          </ThemedText>
          <View style={styles.selectedMetrics}>
            <View style={styles.selectedMetric}>
              <View style={[styles.metricDot, { backgroundColor: METRIC_CONFIG.revenue.color }]} />
              <ThemedText style={styles.selectedMetricValue}>
                {METRIC_CONFIG.revenue.format(selectedDay.revenue)}
              </ThemedText>
            </View>
            <View style={styles.selectedMetric}>
              <View style={[styles.metricDot, { backgroundColor: METRIC_CONFIG.orders.color }]} />
              <ThemedText style={styles.selectedMetricValue}>
                {selectedDay.orders} orders
              </ThemedText>
            </View>
            <View style={styles.selectedMetric}>
              <View style={[styles.metricDot, { backgroundColor: METRIC_CONFIG.customers.color }]} />
              <ThemedText style={styles.selectedMetricValue}>
                {selectedDay.customers} customers
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {data.map((day, index) => {
            const value = day[selectedMetric];
            const barHeight = maxValue > 0 ? (value / maxValue) * 120 : 0;
            const isSelected = selectedDay?.date === day.date;

            return (
              <TouchableOpacity
                key={day.date || index}
                style={styles.barWrapper}
                onPress={() => handleBarPress(day)}
                activeOpacity={0.7}
              >
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        width: barWidth,
                        backgroundColor: isSelected
                          ? METRIC_CONFIG[selectedMetric].color
                          : `${METRIC_CONFIG[selectedMetric].color}80`,
                      },
                    ]}
                  />
                </View>
                <ThemedText
                  style={[
                    styles.dayLabel,
                    isSelected && { color: METRIC_CONFIG[selectedMetric].color, fontWeight: '600' },
                  ]}
                >
                  {day.dayOfWeek.substring(0, 3)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: METRIC_CONFIG[selectedMetric].color }]} />
          <ThemedText style={styles.legendText}>
            Total: {METRIC_CONFIG[selectedMetric].format(
              data.reduce((sum, d) => sum + d[selectedMetric], 0)
            )}
          </ThemedText>
        </View>
        <ThemedText style={styles.legendSubtext}>
          Avg: {METRIC_CONFIG[selectedMetric].format(
            data.reduce((sum, d) => sum + d[selectedMetric], 0) / data.length
          )}/day
        </ThemedText>
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
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  metricToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 2,
  },
  metricButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  metricButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  metricButtonTextActive: {
    color: 'white',
  },
  selectedInfo: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  selectedMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectedMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedMetricValue: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  legendSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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

export default DailyPerformanceChart;
