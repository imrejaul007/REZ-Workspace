// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// StoreBottomActionBar.tsx - Sticky bottom action bar
import React from 'react';
import { View, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerImpact } from '@/utils/haptics';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';

export interface StoreBottomActionBarProps {
  storeId?: string;
  storeName?: string;
  storePhone?: string;
  storeCategory?: string; // used to detect food/dining stores
  onScanPayEarn?: () => void;
  onWallet?: () => void;
  onOffers?: () => void;
  onOrderFood?: () => void;
  onBookTable?: () => void;
  onCallStore?: () => void;
}

/** Returns true when the category string indicates a food or dining store */
const isFoodStore = (category?: string): boolean => {
  if (!category) return false;
  const lower = category.toLowerCase();
  return lower.includes('food') || lower.includes('dining') || lower.includes('restaurant');
};

function StoreBottomActionBar({
  storeId,
  storeName,
  storePhone,
  storeCategory,
  onScanPayEarn,
  onWallet,
  onOffers,
  onOrderFood,
  onBookTable,
  onCallStore,
}: StoreBottomActionBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFood = isFoodStore(storeCategory);

  // Animation refs
  const scanPayScale = useSharedValue(1);
  const walletScale = useSharedValue(1);
  const offersScale = useSharedValue(1);
  const orderFoodScale = useSharedValue(1);
  const bookTableScale = useSharedValue(1);
  const callScale = useSharedValue(1);
  const payBillScale = useSharedValue(1);

  const animateScale = (animValue: Animated.SharedValue<number>, toValue: number) => {
    animValue.value = withSpring(toValue);
  };

  // ── Non-food handlers ──────────────────────────────────────────

  const handleScanPayEarn = () => {
    triggerImpact('Medium');
    if (onScanPayEarn) {
      onScanPayEarn();
    } else {
      router.push('/pay-in-store');
    }
  };

  const handleWallet = () => {
    triggerImpact('Light');
    if (onWallet) {
      onWallet();
    } else {
      router.push('/wallet-screen');
    }
  };

  const handleOffers = () => {
    triggerImpact('Light');
    if (onOffers) {
      onOffers();
    } else {
      router.push({
        pathname: '/CardOffersPage',
        params: { storeId: storeId || '' },
      } as unknown as string);
    }
  };

  // ── Food-store handlers ────────────────────────────────────────

  const handleOrderFood = () => {
    triggerImpact('Medium');
    if (onOrderFood) {
      onOrderFood();
    } else {
      // Navigate to the menu tab of this store
      router.push(`/MainStorePage?storeId=${storeId || ''}&tab=menu` as unknown as string);
    }
  };

  const handleBookTable = () => {
    triggerImpact('Light');
    if (onBookTable) {
      onBookTable();
    } else {
      router.push(
        `/MainCategory/food-dining/book-table?storeId=${storeId || ''}&storeName=${encodeURIComponent(storeName || '')}` as unknown,
      );
    }
  };

  const handleCallStore = () => {
    triggerImpact('Light');
    if (onCallStore) {
      onCallStore();
    } else if (storePhone) {
      Linking.openURL(`tel:${storePhone}`).catch(() => {});
    }
  };

  const handlePayBill = () => {
    triggerImpact('Medium');
    if (onScanPayEarn) {
      onScanPayEarn();
    } else {
      router.push({
        pathname: '/pay-in-store/enter-amount',
        params: { storeId: storeId || '', storeName: storeName || '' },
      } as unknown as string);
    }
  };

  // ── Render: food layout ────────────────────────────────────────

  if (isFood) {
    return (
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inner}>
          {/* Order Food — primary/accent button */}
          <Animated.View style={[styles.orderFoodWrapper, { transform: [{ scale: orderFoodScale }] }]}>
            <Pressable
              style={styles.orderFoodButton}
              onPress={handleOrderFood}
              onPressIn={() => animateScale(orderFoodScale, 0.97)}
              onPressOut={() => animateScale(orderFoodScale, 1)}
              accessibilityRole="button"
              accessibilityLabel="Order Food"
            >
              <Ionicons name="bag-handle-outline" size={20} color={colors.background.primary} />
              <ThemedText style={styles.orderFoodButtonText}>Order Food</ThemedText>
            </Pressable>
          </Animated.View>

          {/* Book Table */}
          <Animated.View style={{ transform: [{ scale: bookTableScale }] }}>
            <Pressable
              style={styles.iconButtonFood}
              onPress={handleBookTable}
              onPressIn={() => animateScale(bookTableScale, 0.9)}
              onPressOut={() => animateScale(bookTableScale, 1)}
              accessibilityRole="button"
              accessibilityLabel="Book Table"
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text.primary} />
              <ThemedText style={styles.iconButtonFoodLabel}>Table</ThemedText>
            </Pressable>
          </Animated.View>

          {/* Call Store */}
          <Animated.View style={{ transform: [{ scale: callScale }] }}>
            <Pressable
              style={styles.iconButtonFood}
              onPress={handleCallStore}
              onPressIn={() => animateScale(callScale, 0.9)}
              onPressOut={() => animateScale(callScale, 1)}
              accessibilityRole="button"
              accessibilityLabel="Call Store"
            >
              <Ionicons name="call-outline" size={20} color={colors.text.primary} />
              <ThemedText style={styles.iconButtonFoodLabel}>Call</ThemedText>
            </Pressable>
          </Animated.View>

          {/* Pay Bill */}
          <Animated.View style={{ transform: [{ scale: payBillScale }] }}>
            <Pressable
              style={styles.iconButtonFood}
              onPress={handlePayBill}
              onPressIn={() => animateScale(payBillScale, 0.9)}
              onPressOut={() => animateScale(payBillScale, 1)}
              accessibilityRole="button"
              accessibilityLabel="Pay Bill"
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.text.primary} />
              <ThemedText style={styles.iconButtonFoodLabel}>Pay Bill</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Render: non-food layout (original) ────────────────────────

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.inner}>
        {/* Scan & Pay & Earn Button */}
        <Animated.View style={[styles.mainButtonWrapper, { transform: [{ scale: scanPayScale }] }]}>
          <Pressable
            style={styles.mainButton}
            onPress={handleScanPayEarn}
            onPressIn={() => animateScale(scanPayScale, 0.97)}
            onPressOut={() => animateScale(scanPayScale, 1)}
            accessibilityRole="button"
            accessibilityLabel="Scan Pay and Earn"
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.background.primary} />
            <ThemedText style={styles.mainButtonText}>Scan & Pay & Earn</ThemedText>
          </Pressable>
        </Animated.View>

        {/* Wallet Button */}
        <Animated.View style={{ transform: [{ scale: walletScale }] }}>
          <Pressable
            style={styles.iconButton}
            onPress={handleWallet}
            onPressIn={() => animateScale(walletScale, 0.9)}
            onPressOut={() => animateScale(walletScale, 1)}
            accessibilityRole="button"
            accessibilityLabel="Wallet"
          >
            <Ionicons name="wallet-outline" size={24} color={colors.text.primary} />
          </Pressable>
        </Animated.View>

        {/* Offers Button */}
        <Animated.View style={{ transform: [{ scale: offersScale }] }}>
          <Pressable
            style={styles.iconButton}
            onPress={handleOffers}
            onPressIn={() => animateScale(offersScale, 0.9)}
            onPressOut={() => animateScale(offersScale, 1)}
            accessibilityRole="button"
            accessibilityLabel="Offers"
          >
            <Ionicons name="pricetag" size={22} color={colors.text.primary} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  // Non-food styles
  mainButtonWrapper: {
    flex: 1,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightMustard,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.medium,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background.primary,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Food-store styles
  orderFoodWrapper: {
    flex: 1,
  },
  orderFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.medium,
  },
  orderFoodButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background.primary,
  },
  iconButtonFood: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    backgroundColor: colors.background.primary,
    minWidth: 54,
    gap: 3,
  },
  iconButtonFoodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default withErrorBoundary(StoreBottomActionBar, 'MainStoreSectionStoreBottomActionBar');
