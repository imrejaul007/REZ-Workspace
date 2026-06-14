// @ts-nocheck
import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Text,
} from 'react-native';
// Platform used for web-only text-overflow styles
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useUserIdentityStore, IdentitySegment } from '@/stores/userIdentityStore';

// Color themes for each action — Section 12 handoff spec
const ACTION_THEMES = {
  voucher: {
    // g50 / linen background
    iconBg: colors.linen,
    iconColor: colors.nileBlue,
    descBg: colors.linen,
    descColor: colors.nileBlue,
  },
  wallet: {
    // #dfebf7 lavenderMist
    iconBg: '#dfebf7',
    iconColor: colors.nileBlue,
    descBg: '#dfebf7',
    descColor: colors.nileBlue,
  },
  offers: {
    // #ffd7b5 lightPeach
    iconBg: '#ffd7b5',
    iconColor: colors.nileBlue,
    descBg: '#ffd7b5',
    descColor: colors.nileBlue,
  },
  store: {
    // mustard light #FFF3CC
    iconBg: '#FFF3CC',
    iconColor: colors.nileBlue,
    descBg: '#FFF3CC',
    descColor: colors.nileBlue,
  },
};

interface QuickActionsSectionProps {
  voucherCount?: number;
  walletBalance?: number;
  newOffersCount?: number;
}

interface QuickActionItem {
  id: 'voucher' | 'wallet' | 'offers' | 'store';
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
}

const SEGMENT_OFFERS_ACTION: Partial<Record<IdentitySegment, QuickActionItem>> = {
  verified_student: {
    id: 'offers',
    title: 'Student Deals',
    icon: 'school-outline',
    route: '/offers/student',
    description: 'Verified savings',
  },
  verified_employee: {
    id: 'offers',
    title: 'Work Perks',
    icon: 'briefcase-outline',
    route: '/offers/corporate',
    description: 'Corporate deals',
  },
  verified_healthcare: {
    id: 'offers',
    title: 'Health Offers',
    icon: 'medkit-outline',
    route: '/offers/zones/heroes',
    description: 'For you',
  },
  verified_defence: {
    id: 'offers',
    title: 'Defence Perks',
    icon: 'shield-outline',
    route: '/offers/zones/heroes',
    description: 'Exclusive deals',
  },
  verified_teacher: {
    id: 'offers',
    title: 'Teacher Deals',
    icon: 'book-outline',
    route: '/offers/zones/heroes',
    description: 'Educator savings',
  },
  verified_senior: {
    id: 'offers',
    title: 'Senior Perks',
    icon: 'heart-outline',
    route: '/offers/zones/senior',
    description: 'Special offers',
  },
  verified_government: {
    id: 'offers',
    title: 'Govt Perks',
    icon: 'ribbon-outline',
    route: '/offers/zones/heroes',
    description: 'Exclusive deals',
  },
};

const DEFAULT_OFFERS_ACTION: QuickActionItem = {
  id: 'offers',
  title: 'Offers',
  icon: 'pricetag-outline',
  route: '/offers',
  description: 'Extra savings',
};

function getQuickActions(segment: IdentitySegment): QuickActionItem[] {
  return [
    { id: 'voucher', title: 'Voucher', icon: 'ticket-outline', route: '/my-vouchers', description: 'Use & save' },
    { id: 'wallet', title: 'Wallet', icon: 'wallet-outline', route: '/wallet-screen', description: 'Your rewards' },
    SEGMENT_OFFERS_ACTION[segment] ?? DEFAULT_OFFERS_ACTION,
    { id: 'store', title: 'Store', icon: 'storefront-outline', route: '/Store', description: 'Nearby' },
  ];
}

function QuickActionsSection({
  voucherCount = 0,
  walletBalance = 0,
  newOffersCount = 0,
}: QuickActionsSectionProps) {
  const router = useRouter();
  const { segment } = useUserIdentityStore();
  const actions = useMemo(() => getQuickActions(segment), [segment]);

  const handlePress = useCallback((route: string) => {
    router.push(route as unknown);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        {actions.map((action) => {
          const theme = ACTION_THEMES[action.id];
          return (
            <Pressable
              key={action.id}
              style={styles.actionItem}
              onPress={() => handlePress(action.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name={action.icon} size={18} color={theme.iconColor} />
              </View>
              <Text style={styles.actionTitle} numberOfLines={1}>{action.title}</Text>
              {/* Single bottom pill — replaces old qa-val + qa-desc */}
              <View style={[styles.bottomPill, { backgroundColor: theme.descBg }]}>
                <Text style={[styles.bottomPillText, { color: theme.descColor }]} numberOfLines={1}>
                  {action.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default memo(QuickActionsSection);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: colors.background.primary,
    marginTop: -4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 8,
  },
  // Section 12: all 4 tiles identical height via minHeight: 120
  actionItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 10,
    minHeight: 120,
    justifyContent: 'flex-start',
  },
  // Section 12: 40x40 icon box, 11px radius
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  // Section 12: title never wraps
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.nileBlue,
    textAlign: 'center',
    marginBottom: 6,
    // Prevent title from wrapping on any platform
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap' as unknown,
        overflow: 'hidden' as unknown,
        textOverflow: 'ellipsis' as unknown,
      },
    }),
  },
  // Section 12: single bottom pill replaces old qa-val + qa-desc
  bottomPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto' as unknown,
    maxWidth: '100%',
  },
  bottomPillText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
