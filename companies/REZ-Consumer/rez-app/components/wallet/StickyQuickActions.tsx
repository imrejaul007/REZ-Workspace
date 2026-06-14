// @ts-nocheck
/**
 * StickyQuickActions — Horizontal scrollable quick action bar.
 * First two actions (Add Money + Send) are visually prominent.
 * Remaining actions (History, Transfer, Gift, etc.) appear as icon chips.
 */
import React from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
  /** If true, renders as a full pill button (primary/secondary style) */
  isPrimary?: boolean;
  isSecondary?: boolean;
  /** Gradient colors for the circle background */
  gradientColors?: [string, string];
}

const ACTIONS: QuickAction[] = [
  {
    id: 'add-money',
    icon: 'add-circle',
    label: 'Add Money',
    route: '/payment',
    color: '#fff',
    isPrimary: true,
    gradientColors: ['#D4AF37', '#E6C84A'],
  },
  {
    id: 'send',
    icon: 'paper-plane',
    label: 'Send',
    route: '/wallet/transfer',
    color: colors.nileBlue,
    isSecondary: true,
    gradientColors: ['#1a3a52', '#2A5577'],
  },
  {
    id: 'transactions',
    icon: 'receipt',
    label: 'History',
    route: '/earnings-history',
    color: colors.nileBlue,
    gradientColors: ['#1a3a52', '#234b68'],
  },
  {
    id: 'transfer',
    icon: 'swap-horizontal',
    label: 'Transfer',
    route: '/wallet/transfer',
    color: colors.brand.indigo,
    gradientColors: ['#1a3a52', '#2d5f87'],
  },
  {
    id: 'gift',
    icon: 'gift',
    label: 'Gift',
    route: '/wallet/gift',
    color: colors.lightMustard,
    gradientColors: ['#FFC857', '#e6a800'],
  },
  {
    id: 'gift-cards',
    icon: 'card',
    label: 'Gift Cards',
    route: '/wallet/gift-cards',
    color: colors.lightMustard,
    gradientColors: ['#E6B84E', '#FBBF24'],
  },
  {
    id: 'expiry',
    icon: 'time',
    label: 'Expiry',
    route: '/wallet/expiry-tracker',
    color: colors.warning,
    gradientColors: ['#FF9F1C', '#FBBF24'],
  },
  {
    id: 'drops',
    icon: 'calendar',
    label: 'Drops',
    route: '/wallet/scheduled-drops',
    color: colors.brand.purpleLight,
    gradientColors: ['#1a3a52', '#FFC857'],
  },
  {
    id: 'redeem',
    icon: 'star',
    label: 'Redeem',
    route: '/redeem-coins',
    color: colors.brand.purple,
    gradientColors: ['#7C3AED', '#6D28D9'],
  },
  {
    id: 'wallet-history',
    icon: 'list',
    label: 'History',
    route: '/wallet-history',
    color: colors.brand.teal,
    gradientColors: ['#1a3a52', '#00796B'],
  },
];

// Split into three rows of 4 (row 3 has 2 items)
const ROW_1 = ACTIONS.slice(0, 4);
const ROW_2 = ACTIONS.slice(4, 8);
const ROW_3 = ACTIONS.slice(8);

interface StickyQuickActionsProps {
  isSticky?: boolean;
  style?;
}

export const StickyQuickActions: React.FC<StickyQuickActionsProps> = ({ isSticky, style }) => {
  const router = useRouter();

  const renderAction = (action: QuickAction) => {
    const grad = action.gradientColors ?? ['#1a3a52', '#2A5577'];
    const iconColor = action.isPrimary ? '#1a3a52' : '#fff';

    return (
      <Pressable
        key={action.id}
        style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.75 }]}
        onPress={() => router.push(action.route as unknown)}
        accessibilityLabel={action.label}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name={action.icon} size={22} color={iconColor} />
        </LinearGradient>
        <Text style={styles.label}>{action.label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isSticky && styles.containerSticky,
        style,
      ]}
    >
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          {ROW_1.map(renderAction)}
        </View>
        <View style={styles.gridRow}>
          {ROW_2.map(renderAction)}
        </View>
        {ROW_3.length > 0 && (
          <View style={styles.gridRow}>
            {ROW_3.map(renderAction)}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 0,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(26,58,82,0.08)',
    shadowColor: '#1a3a52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  containerSticky: {
    backgroundColor: Platform.select({
      ios: 'rgba(255,255,255,0.96)',
      android: 'rgba(255,255,255,0.99)',
      default: 'rgba(255,255,255,0.97)',
    }),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  grid: {
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  actionItem: {
    alignItems: 'center',
    width: 64,
    gap: 6,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334E68',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default React.memo(StickyQuickActions);
