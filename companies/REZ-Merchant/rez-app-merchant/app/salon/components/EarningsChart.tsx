/**
 * EarningsChart Component - Visual earnings representation
 *
 * Features:
 * - Bar chart for daily earnings
 * - Animated rendering
 * - Touch interaction for details
 * - Responsive sizing
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface EarningsChartProps {
  data: ChartDataPoint[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 40,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.light.navy,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    top: -30,
  },
  tooltipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 20,
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
});

export const EarningsChart: React.FC<EarningsChartProps> = ({ data, height = 150 }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const minValue = 0;

    return {
      bars: data.map((point) => {
        const barHeight = Math.max(((point.value - minValue) / (maxValue - minValue)) * height, 4);
        return {
          ...point,
          barHeight,
          percentage: maxValue > 0 ? (point.value / maxValue) * 100 : 0,
        };
      }),
      maxValue,
      minValue,
      total: data.reduce((sum, d) => sum + d.value, 0),
      average: data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0,
      yLabels: [
        { value: maxValue, label: formatCurrency(maxValue) },
        { value: maxValue / 2, label: formatCurrency(maxValue / 2) },
        { value: 0, label: formatCurrency(0) },
      ],
    };
  }, [data, height]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `Rs. ${(amount / 1000).toFixed(0)}k`;
    }
    return `Rs. ${amount.toFixed(0)}`;
  };

  const formatLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString();
  };

  if (!chartData) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No data available</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chart Bars */}
      <View style={[styles.chartArea, { height }]}>
        {chartData.bars.map((bar, index) => (
          <View key={index} style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: bar.barHeight,
                  backgroundColor: index === chartData.bars.length - 1
                    ? Colors.light.primary
                    : Colors.light.primaryLight,
                  opacity: 0.6 + (bar.percentage / 100) * 0.4,
                },
              ]}
            >
              {/* Tooltip on last bar */}
              {index === chartData.bars.length - 1 && (
                <View style={styles.tooltip}>
                  <ThemedText style={styles.tooltipText}>
                    Rs. {bar.value.toLocaleString()}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.barLabel}>
              {bar.label || formatLabel(bar.date)}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.light.primary }]} />
          <ThemedText style={styles.legendText}>Earnings</ThemedText>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Total</ThemedText>
          <ThemedText style={styles.summaryValue}>
            Rs. {chartData.total.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Average</ThemedText>
          <ThemedText style={styles.summaryValue}>
            Rs. {Math.round(chartData.average).toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Best Day</ThemedText>
          <ThemedText style={styles.summaryValue}>
            Rs. {chartData.maxValue.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

// Alternative simple sparkline version for smaller displays
export const EarningsSparkline: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data,
  width = 100,
  height = 30,
}) => {
  const sparklineData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    return data.map((value, index) => ({
      x: (index / (data.length - 1 || 1)) * width,
      y: height - ((value - minValue) / range) * height,
      value,
    }));
  }, [data, width, height]);

  if (!sparklineData) return null;

  // Create SVG-like path
  const pathD = sparklineData
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <View style={{ width, height }}>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}>
        {/* Simple bar representation instead of SVG path */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2 }}>
          {data.map((value, index) => {
            const max = Math.max(...data);
            const barHeight = max > 0 ? (value / max) * height : 0;
            return (
              <View
                key={index}
                style={{
                  flex: 1,
                  height: Math.max(barHeight, 2),
                  backgroundColor: Colors.light.primary,
                  opacity: 0.4 + (value / max) * 0.6,
                  borderRadius: 1,
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};
