/**
 * DashboardSkeleton
 * Placeholder for merchant dashboard during initial load
 *
 * Simulates:
 * - Header stats cards (4 cards)
 * - Chart container
 * - Recent orders list
 *
 * Total load time: typically < 500ms (then replaced with real data)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header stat cards */}
      <View style={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={`stat-${i}`} style={styles.statCard}>
            <SkeletonLoader width="80%" height={12} style={styles.statLabel} />
            <SkeletonLoader width="90%" height={28} style={styles.statValue} />
            <SkeletonLoader width="60%" height={8} style={styles.statHelper} />
          </View>
        ))}
      </View>

      {/* Chart area */}
      <View style={styles.chartContainer}>
        <SkeletonLoader width="40%" height={16} style={styles.chartTitle} />
        <SkeletonLoader width="100%" height={120} style={styles.chart} />
      </View>

      {/* Orders list */}
      <View style={styles.ordersContainer}>
        <SkeletonLoader width="30%" height={16} style={styles.ordersTitle} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={`order-${i}`} style={styles.orderRow}>
            <SkeletonLoader width={40} height={40} variant="circle" />
            <View style={styles.orderInfo}>
              <SkeletonLoader width="60%" height={12} />
              <SkeletonLoader width="40%" height={10} style={styles.orderSubtitle} />
            </View>
            <SkeletonLoader width={60} height={20} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  statLabel: {
    borderRadius: 4,
  },
  statValue: {
    borderRadius: 4,
  },
  statHelper: {
    borderRadius: 3,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 12,
  },
  chartTitle: {
    borderRadius: 4,
  },
  chart: {
    borderRadius: 8,
  },
  ordersContainer: {
    gap: 12,
  },
  ordersTitle: {
    borderRadius: 4,
    marginLeft: 4,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  orderInfo: {
    flex: 1,
    gap: 6,
  },
  orderSubtitle: {
    marginTop: 4,
  },
});

export default DashboardSkeleton;
