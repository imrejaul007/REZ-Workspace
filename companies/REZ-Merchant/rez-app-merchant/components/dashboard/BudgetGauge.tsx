/**
 * BudgetGauge — Semi-circle arc gauge showing monthly cashback budget usage
 * View-based (no SVG dependency), works cross-platform.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BudgetGaugeProps {
  used: number;
  total: number;
  currencySymbol?: string;
}

function BudgetGauge({ used, total, currencySymbol = '₹' }: BudgetGaugeProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percentage,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const getColor = (pct: number) => {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F59E0B';
    return '#10B981';
  };

  const color = getColor(percentage);

  // Arc is built with two semicircle halves clipped
  const rotation = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget</Text>

      <View style={styles.gaugeOuter}>
        {/* Background arc (gray) */}
        <View style={styles.arcContainer}>
          <View style={[styles.arcHalf, styles.arcBackground]} />
        </View>

        {/* Filled arc (colored) */}
        <View style={styles.arcContainer}>
          <Animated.View
            style={[
              styles.arcHalf,
              {
                backgroundColor: color,
                transform: [
                  { translateX: -60 },
                  { rotate: rotation },
                  { translateX: 60 },
                ],
                transformOrigin: 'right center',
              },
            ]}
          />
        </View>

        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={[styles.percentText, { color }]}>{Math.round(percentage)}%</Text>
          <Text style={styles.usedText}>used</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendLabel}>
            Used: {currencySymbol}{used.toLocaleString()}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendLabel}>
            Budget: {currencySymbol}{total.toLocaleString()}
          </Text>
        </View>
      </View>

      {percentage >= 90 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={14} color="#EF4444" />
          <Text style={styles.warningText}>Budget nearly exhausted!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  gaugeOuter: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
    overflow: 'hidden',
  },
  arcContainer: {
    position: 'absolute',
    top: 0,
    width: 120,
    height: 60,
    overflow: 'hidden',
  },
  arcHalf: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  arcBackground: {
    backgroundColor: '#E5E7EB',
  },
  centerContent: {
    alignItems: 'center',
  },
  percentText: {
    fontSize: 22,
    fontWeight: '800',
  },
  usedText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default React.memo(BudgetGauge);
