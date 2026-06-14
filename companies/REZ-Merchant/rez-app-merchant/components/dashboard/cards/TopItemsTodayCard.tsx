/**
 * TopItemsTodayCard — Sprint -1a S-size extraction (#6 of 26).
 *
 * Source: app/(dashboard)/index.tsx lines 777-835 (pre-extraction).
 * Renders the merchant's top 3 items by order count + revenue today —
 * "LI WEI merchant ROI" block. Registry gates visibility off the
 * `items.length > 0` check (see `isVisible`).
 *
 * Props are passed from the shell. This component owns no data fetch;
 * the shell's TanStack Query pipeline produces `items`.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { TopItemToday } from '@/services/api/dashboard';

export interface TopItemsTodayCardProps {
  /** Top items for today, ordered by count/revenue. Max 3 shown. */
  items: TopItemToday[];
}

export const TopItemsTodayCard: React.FC<TopItemsTodayCardProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(250).springify()}
      style={styles.container}
      testID="dashboard-card-top-items-today"
      accessibilityLabel={`Top ${items.length} items today`}
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="flame" size={16} color="#D97706" />
        </View>
        <Heading3 style={styles.title}>Top Items Today</Heading3>
      </View>

      {items.slice(0, 3).map((item, index) => (
        <View
          key={item.productId ?? item._id ?? String(index)}
          style={styles.row}
          accessibilityRole="text"
        >
          <View style={styles.rank}>
            <BodyText style={styles.rankText}>#{index + 1}</BodyText>
          </View>
          <View style={styles.meta}>
            <BodyText style={styles.name}>
              {item.name ?? item.product ?? 'Unnamed item'}
            </BodyText>
            <Caption style={styles.sub}>
              {item.orderCount ?? item.qty ?? item.quantity ?? 0} orders • ₹
              {(item.totalRevenue ?? item.revenue ?? 0).toLocaleString()}
            </Caption>
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconBadge: {
    backgroundColor: '#FCD34D',
    borderRadius: 8,
    padding: 8,
  },
  title: {
    color: Colors.text.primary,
  },
  row: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    padding: 12,
  },
  rank: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary[100],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: Colors.primary[500],
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: Colors.text.primary,
    fontSize: 13,
  },
  sub: {
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});

export default TopItemsTodayCard;
