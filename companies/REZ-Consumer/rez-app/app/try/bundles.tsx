// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  trialCount: number;
  trialCoinsIncluded: number;
  rezCoinsBonus: number;
  validDays: number;
  category?: string;
  isFeatured?: boolean;
}

interface ActiveBundle {
  id: string;
  name: string;
  slotsTotal: number;
  slotsUsed: number;
  expiresAt: string;
}

interface PurchaseModalData {
  isVisible: boolean;
  bundle: Bundle | null;
  confirming: boolean;
}

interface OrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export default function BundlesScreen() {
  const router = useRouter();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [activeBundles, setActiveBundles] = useState<ActiveBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState<PurchaseModalData>({
    isVisible: false,
    bundle: null,
    confirming: false,
  });

  useEffect(() => {
    loadBundles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBundles = useCallback(async () => {
    try {
      const [bundlesData, activeBundlesData] = await Promise.all([tryApi.getBundles(), tryApi.getMyBundles()]);
      setBundles(bundlesData);
      setActiveBundles(activeBundlesData);
    } catch (err) {
      if (__DEV__) logger.error('Failed to load bundles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBundles();
    setRefreshing(false);
  };

  const handlePurchase = (bundle: Bundle) => {
    setPurchaseModal({ isVisible: true, bundle, confirming: false });
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseModal.bundle) return;

    setPurchaseModal((prev) => ({ ...prev, confirming: true }));

    try {
      // Create Razorpay order
      const orderResp = await tryApi.createPaymentOrder({
        bundleId: purchaseModal.bundle.id,
        amount: purchaseModal.bundle.price,
      });
      const order: OrderResponse = orderResp as OrderResponse;

      // Open Razorpay checkout
      try {
        const RazorpayCheckout = require('react-native-razorpay').default;
        const paymentResponse = await RazorpayCheckout.open({
          description: `REZ TRY — ${purchaseModal.bundle.name}`,
          currency: 'INR',
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: order.amount || purchaseModal.bundle.price * 100,
          order_id: order.razorpayOrderId,
          name: 'REZ TRY Bundles',
          prefill: { name: '', contact: '' },
          theme: { color: colors.brand.purple },
        });

        // Complete bundle purchase with payment ID
        await tryApi.purchaseBundle(purchaseModal.bundle.id, paymentResponse.razorpay_payment_id);
        await loadBundles();
        setPurchaseModal({ isVisible: false, bundle: null, confirming: false });
      } catch (paymentErr) {
        if (paymentErr.code !== 2) {
          // 2 = user cancelled
          if (__DEV__) logger.error('Payment error:', paymentErr);
        }
        setPurchaseModal((prev) => ({ ...prev, confirming: false }));
      }
    } catch (err) {
      if (__DEV__) logger.error('Failed to purchase bundle:', err);
      setPurchaseModal((prev) => ({ ...prev, confirming: false }));
    }
  };

  const renderFeaturedBundle = (bundle: Bundle) => (
    <LinearGradient
      colors={[colors.brand.purple, `${colors.brand.purple}dd`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.featuredBundle}
    >
      <View style={styles.featuredContent}>
        <View>
          <Text style={styles.featuredLabel}>Featured</Text>
          <Text style={styles.featuredName}>{bundle.name}</Text>
          <Text style={styles.featuredDesc}>{bundle.description}</Text>
        </View>
        <View style={styles.featuredPrice}>
          <Text style={styles.priceAmount}>₹{bundle.price}</Text>
          <Text style={styles.originalPriceSmall}>₹{bundle.originalPrice}</Text>
        </View>
      </View>

      {/* Included Items */}
      <View style={styles.featuredIncluded}>
        <View style={styles.includedItem}>
          <Ionicons name="ticket" size={16} color="#fff" />
          <Text style={styles.includedText}>{bundle.trialCount} trials</Text>
        </View>
        <View style={styles.includedItem}>
          <Text style={styles.includedText}>💎 {bundle.trialCoinsIncluded}</Text>
        </View>
        <View style={styles.includedItem}>
          <Text style={styles.includedText}>🪙 {bundle.rezCoinsBonus}</Text>
        </View>
      </View>

      <Pressable style={styles.buyNowButton} onPress={() => handlePurchase(bundle)}>
        <Text style={styles.buyNowButtonText}>Buy Now</Text>
      </Pressable>
    </LinearGradient>
  );

  const renderBundleCard = ({ item }: { item: Bundle }) => (
    <View style={styles.bundleCard}>
      <View style={styles.bundleHeader}>
        <View>
          <Text style={styles.bundleName}>{item.name}</Text>
          <Text style={styles.bundleDesc} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
      </View>

      {/* Included */}
      <View style={styles.includedSection}>
        <View style={styles.includedRow}>
          <Ionicons name="ticket" size={14} color={colors.text.secondary} />
          <Text style={styles.includedTextSmall}>{item.trialCount} trials</Text>
        </View>
        <View style={styles.includedRow}>
          <Text style={styles.includedTextSmall}>💎 {item.trialCoinsIncluded}</Text>
        </View>
        <View style={styles.includedRow}>
          <Text style={styles.includedTextSmall}>🪙 {item.rezCoinsBonus}</Text>
        </View>
        <View style={styles.includedRow}>
          <Ionicons name="calendar" size={14} color={colors.text.secondary} />
          <Text style={styles.includedTextSmall}>Valid {item.validDays} days</Text>
        </View>
      </View>

      <Pressable style={styles.bundleBuyButton} onPress={() => handlePurchase(item)}>
        <Text style={styles.bundleBuyButtonText}>Buy Now</Text>
      </Pressable>
    </View>
  );

  const renderActiveBundle = ({ item }: { item: ActiveBundle }) => {
    const slotsRemaining = item.slotsTotal - item.slotsUsed;
    const progress = (item.slotsUsed / item.slotsTotal) * 100;

    return (
      <View style={styles.activeBundle}>
        <View style={styles.activeBundleHeader}>
          <View>
            <Text style={styles.activeBundleName}>{item.name}</Text>
            <Text style={styles.slotsText}>
              {slotsRemaining}/{item.slotsTotal} slots left
            </Text>
          </View>
          <Text style={styles.expiryDate}>Expires {new Date(item.expiresAt).toLocaleDateString()}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Trial Passes & Bundles</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  const featuredBundle = bundles && Array.isArray(bundles) ? bundles.find((b) => b.isFeatured) : undefined;
  const regularBundles = bundles && Array.isArray(bundles) ? bundles.filter((b) => !b.isFeatured) : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Trial Passes & Bundles</Text>
          <Text style={styles.headerSubtitle}>More trials, bigger savings</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={regularBundles}
        renderItem={renderBundleCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        scrollEnabled={true}
        ListHeaderComponent={
          <>
            {/* Active Bundles Section */}
            {activeBundles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Active Passes</Text>
                <FlatList
                  data={activeBundles}
                  renderItem={renderActiveBundle}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                />
              </View>
            )}

            {/* Featured Bundle */}
            {featuredBundle && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Offer</Text>
                {renderFeaturedBundle(featuredBundle)}
              </View>
            )}

            {/* Regular Bundles Header */}
            <Text style={styles.sectionTitle}>All Bundles</Text>
          </>
        }
      />

      {/* Purchase Modal */}
      <Modal visible={purchaseModal.isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Purchase</Text>
              <Pressable onPress={() => setPurchaseModal({ isVisible: false, bundle: null, confirming: false })}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            {purchaseModal.bundle && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{purchaseModal.bundle.name}</Text>
                  <Text style={styles.modalDesc}>{purchaseModal.bundle.description}</Text>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Price</Text>
                    <View style={styles.modalPriceGroup}>
                      <Text style={styles.modalPrice}>₹{purchaseModal.bundle.price}</Text>
                      <Text style={styles.modalOriginalPrice}>₹{purchaseModal.bundle.originalPrice}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Includes</Text>
                  <View style={styles.modalIncluded}>
                    <Text style={styles.modalIncludedItem}>✓ {purchaseModal.bundle.trialCount} Trial Passes</Text>
                    <Text style={styles.modalIncludedItem}>
                      ✓ {purchaseModal.bundle.trialCoinsIncluded} Trial Coins
                    </Text>
                    <Text style={styles.modalIncludedItem}>✓ {purchaseModal.bundle.rezCoinsBonus} Bonus ReZ Coins</Text>
                    <Text style={styles.modalIncludedItem}>✓ Valid for {purchaseModal.bundle.validDays} days</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setPurchaseModal({ isVisible: false, bundle: null, confirming: false })}
                disabled={purchaseModal.confirming}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalBuyButton}
                onPress={handleConfirmPurchase}
                disabled={purchaseModal.confirming}
              >
                {purchaseModal.confirming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBuyButtonText}>Confirm Purchase</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header - Modern glass
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },

  // Active Bundle - Clean success card
  activeBundle: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    gap: spacing.md,
  },
  activeBundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeBundleName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  slotsText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  expiryDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#A7F3D0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },

  // Featured Bundle - Premium gradient
  featuredBundle: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24 },
      android: { elevation: 6 },
    }),
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  featuredName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  featuredDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  featuredPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  originalPriceSmall: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
    marginTop: spacing.xs,
  },
  featuredIncluded: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  includedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  buyNowButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#fff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  buyNowButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6366F1',
  },

  // Bundle Card - Premium style
  bundleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bundleName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bundleDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  includedSection: {
    gap: spacing.sm,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  includedTextSmall: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  bundleBuyButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  bundleBuyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal - Premium bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  modalPriceGroup: {
    alignItems: 'flex-end',
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366F1',
  },
  modalOriginalPrice: {
    fontSize: 13,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  modalIncluded: {
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 16,
  },
  modalIncludedItem: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    paddingVertical: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBuyButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#6366F1',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  modalBuyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
