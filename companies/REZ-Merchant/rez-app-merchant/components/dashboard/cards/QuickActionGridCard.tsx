/**
 * QuickActionGridCard — Sprint -1a / Phase F extraction (#9 of 26).
 *
 * Source: app/(dashboard)/index.tsx lines 931-996 (pre-extraction).
 *
 * 2x2 (plus a wider Settlements row) grid of pastel-tiled shortcuts to
 * the most common merchant jumping-off points: POS, Verify Deal,
 * Create Offer, Customers, and Settlements. The grid is static — no
 * data dependency — so visibility is always `true`; mode/vertical
 * gating is applied at the registry level, not here.
 *
 * Registry note: this card's items should eventually come from a
 * props-driven list so Simple mode gets 4 actions and Advanced mode
 * gets more. For now the list is inline, matching the pre-extraction
 * shape 1:1.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { BodyText } from '@/components/ui/DesignSystemComponents';

interface QuickActionItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  route: Href;
  bg: string;
  color: string;
  fullWidth?: boolean;
}

const DEFAULT_ITEMS: QuickActionItem[] = [
  { icon: 'storefront-outline', label: 'POS — Sell Now', route: '/pos', bg: '#EDE9FE', color: '#7C3AED' },
  { icon: 'ticket-outline', label: 'Verify Deal', route: '/(dashboard)/deals', bg: '#EFF6FF', color: '#3B82F6' },
  { icon: 'add-circle-outline', label: 'Create Offer', route: '/(dashboard)/create-offer', bg: '#F0FDF4', color: '#10B981' },
  { icon: 'people-outline', label: 'Customers', route: '/customers', bg: '#FDF4FF', color: '#A855F7' },
  { icon: 'receipt-outline', label: 'Settlements', route: '/settlements', bg: '#FEF3C7', color: '#D97706', fullWidth: true },
];

export interface QuickActionGridCardProps {
  /** Override the default action set — used by Simple mode to show a slimmer grid. */
  items?: QuickActionItem[];
  /** Entry animation delay in ms. Defaults to 200 to match the pre-extraction feel. */
  animationDelay?: number;
}

export const QuickActionGridCard: React.FC<QuickActionGridCardProps> = ({
  items = DEFAULT_ITEMS,
  animationDelay = 200,
}) => {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.delay(animationDelay).springify()}
      style={styles.container}
      testID="dashboard-card-quick-action-grid"
    >
      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route)}
            style={[
              styles.tile,
              { backgroundColor: item.bg, minWidth: item.fullWidth ? '100%' : '45%' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Ionicons name={item.icon} size={22} color={item.color} />
            <BodyText style={styles.label}>{item.label}</BodyText>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});

export default QuickActionGridCard;
