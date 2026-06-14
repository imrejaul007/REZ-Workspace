/**
 * Voucher Detail Screen
 * Route: /vouchers/[id]
 *
 * Displays detailed information about a user's voucher.
 * Features:
 * - Voucher details
 * - Copy code functionality
 * - Share voucher
 * - Redeem status
 * - Terms and conditions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Text,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

// API URL from environment
const MARKETING_SERVICE = process.env.EXPO_PUBLIC_MARKETING_SERVICE_URL || 'https://rez-api-gateway.onrender.com/api';

// ============================================================================
// TYPES
// ============================================================================

interface Voucher {
  id: string;
  title: string;
  description: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantAddress?: string;
  type: 'discount' | 'cashback' | 'freebie' | 'coins';
  value?: string;
  code?: string;
  status: 'active' | 'used' | 'expired';
  minSpend?: number;
  maxDiscount?: number;
  expiresAt: string;
  redeemedAt?: string;
  claimedAt: string;
  terms?: string[];
  howToUse?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  active: { color: Colors.success, label: 'Active', icon: 'checkmark-circle' },
  used: { color: Colors.textSecondary, label: 'Used', icon: 'time' },
  expired: { color: Colors.error, label: 'Expired', icon: 'close-circle' },
};

const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  discount: { icon: 'pricetag', color: Colors.primary },
  cashback: { icon: 'cash', color: '#10B981' },
  freebie: { icon: 'gift', color: '#FF6B6B' },
  coins: { icon: 'wallet', color: Colors.warning },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function VoucherDetailPage() {
  const router = useRouter();
  const user = useAuthUser();
  const params = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVoucher = useCallback(async () => {
    if (!params.id) {
      setError('Invalid voucher ID');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`${MARKETING_SERVICE}/api/v1/vouchers/${params.id}`);

      if (response.success && response.data) {
        setVoucher(response.data);
        setError(null);
      } else {
        setVoucher(getMockVoucher(params.id));
      }
    } catch (err) {
      logger.error('Failed to fetch voucher:', err);
      setVoucher(getMockVoucher(params.id));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchVoucher();
  }, [fetchVoucher]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVoucher();
    setRefreshing(false);
  };

  const copyCode = () => {
    if (!voucher?.code) return;

    Clipboard.setString(voucher.code);
    setCopied(true);
    Alert.alert('Copied!', `Coupon code "${voucher.code}" copied to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVoucher = async () => {
    if (!voucher) return;

    try {
      await Share.share({
        message: `Check out this voucher: ${voucher.title} - ${voucher.value || ''} at ${voucher.merchantName}${voucher.code ? ` Use code: ${voucher.code}` : ''}`,
        title: voucher.title,
      });
    } catch (err) {
      logger.error('Share error:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (): number => {
    if (!voucher?.expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(voucher.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Voucher' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="caption" style={styles.loadingText}>
            Loading voucher...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !voucher) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Voucher' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <ThemedText type="body" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={fetchVoucher}>
            <ThemedText type="body" style={styles.retryButtonText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!voucher) return null;

  const statusConfig = STATUS_CONFIG[voucher.status];
  const typeConfig = TYPE_CONFIG[voucher.type] || TYPE_CONFIG.discount;
  const daysRemaining = voucher.status === 'active' ? getDaysRemaining() : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: voucher.title,
          headerStyle: { backgroundColor: Colors.background },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[typeConfig.color, `${typeConfig.color}80`]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Ionicons name={statusConfig.icon} size={14} color={Colors.white} />
              <Text style={styles.statusText}>{statusConfig.label}</Text>
            </View>

            {/* Voucher Value */}
            <View style={styles.valueContainer}>
              <View style={styles.valueIconContainer}>
                <Ionicons name={typeConfig.icon} size={40} color={Colors.white} />
              </View>
              <Text style={styles.valueText}>{voucher.value || 'Voucher'}</Text>
              <Text style={styles.typeText}>
                {voucher.type.charAt(0).toUpperCase() + voucher.type.slice(1)}
              </Text>
            </View>

            {/* Time Remaining */}
            {voucher.status === 'active' && (
              <View style={styles.expiryContainer}>
                <Ionicons name="time" size={16} color={Colors.white} />
                <Text style={styles.expiryText}>
                  {daysRemaining > 0
                    ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
                    : 'Expires today'}
                </Text>
              </View>
            )}

            {voucher.status === 'used' && voucher.redeemedAt && (
              <View style={styles.expiryContainer}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={styles.expiryText}>
                  Redeemed on {formatDate(voucher.redeemedAt)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Merchant Info */}
        <View style={styles.section}>
          <View style={styles.merchantRow}>
            <View style={styles.merchantLogo}>
              <Ionicons name="business" size={24} color={Colors.text} />
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{voucher.merchantName}</Text>
              <Text style={styles.claimedDate}>
                Claimed on {formatDate(voucher.claimedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            About This Voucher
          </ThemedText>
          <Text style={styles.description}>{voucher.description}</Text>
        </View>

        {/* Coupon Code */}
        {voucher.code && voucher.status === 'active' && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Coupon Code
            </ThemedText>
            <Pressable style={styles.couponContainer} onPress={copyCode}>
              <View style={styles.couponCode}>
                <Text style={styles.codeText}>{voucher.code}</Text>
              </View>
              <View style={styles.copyButton}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy'}
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.copyButtonText}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* How to Use */}
        {voucher.howToUse && voucher.howToUse.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              How to Use
            </ThemedText>
            {voucher.howToUse.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: typeConfig.color }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Voucher Details */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Voucher Details
          </ThemedText>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Valid Until</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(voucher.expiresAt)}</Text>
            </View>

            {voucher.minSpend && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="cash-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.detailLabel}>Minimum Spend</Text>
                </View>
                <Text style={styles.detailValue}>Rs. {voucher.minSpend.toLocaleString()}</Text>
              </View>
            )}

            {voucher.maxDiscount && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="cut-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.detailLabel}>Maximum Discount</Text>
                </View>
                <Text style={styles.detailValue}>Rs. {voucher.maxDiscount.toLocaleString()}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Status</Text>
              </View>
              <View style={styles.statusTag}>
                <Text style={[styles.statusTagText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        {voucher.terms && voucher.terms.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Terms & Conditions
            </ThemedText>
            {voucher.terms.map((term, index) => (
              <View key={index} style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Share */}
        {voucher.status === 'active' && (
          <View style={styles.section}>
            <Pressable style={styles.shareButton} onPress={shareVoucher}>
              <Ionicons name="share-social" size={20} color={Colors.primary} />
              <ThemedText type="body" style={styles.shareButtonText}>
                Share with Friends
              </ThemedText>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {voucher.status === 'active' && (
        <View style={styles.actionBar}>
          <View style={styles.actionInfo}>
            <View style={[styles.actionBadge, { backgroundColor: typeConfig.color }]}>
              <Ionicons name={typeConfig.icon} size={18} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.actionLabel}>Value</Text>
              <Text style={styles.actionValue}>{voucher.value || 'Voucher'}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: typeConfig.color }]}
            onPress={voucher.code ? copyCode : undefined}
          >
            <Ionicons name={voucher.code ? 'copy' : 'checkmark'} size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>
              {voucher.code ? 'Copy Code' : 'Use Voucher'}
            </Text>
          </Pressable>
        </View>
      )}

      {voucher.status === 'used' && (
        <View style={styles.usedBar}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.usedText}>This voucher has been used</Text>
        </View>
      )}

      {voucher.status === 'expired' && (
        <View style={styles.expiredBar}>
          <Ionicons name="close-circle" size={24} color={Colors.error} />
          <Text style={styles.expiredText}>This voucher has expired</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMockVoucher(id: string): Voucher {
  const mockVouchers: Record<string, Voucher> = {
    v_1: {
      id: 'v_1',
      title: 'Summer Sale Discount',
      description: 'Get 30% off on all purchases at Trendy Fashions. This exclusive voucher gives you amazing savings on our summer collection.',
      merchantId: 'm1',
      merchantName: 'Trendy Fashions',
      merchantAddress: '123 Fashion Street, Downtown',
      type: 'discount',
      value: '30% OFF',
      code: 'SUMMER30',
      status: 'active',
      minSpend: 500,
      maxDiscount: 500,
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      terms: [
        'Valid on all regular priced items',
        'Cannot be combined with other offers',
        'One use per customer',
        'Valid at all Trendy Fashions stores',
      ],
      howToUse: [
        'Visit unknown Trendy Fashions store',
        'Select your items',
        'Show the coupon code at checkout',
        'Enjoy 30% off your purchase!',
      ],
    },
    v_2: {
      id: 'v_2',
      title: 'Free Coffee',
      description: 'Get a free coffee on your next visit to Coffee Culture.',
      merchantId: 'm2',
      merchantName: 'Coffee Culture',
      type: 'freebie',
      value: 'FREE',
      code: 'COFFEEFREE',
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      terms: [
        'Valid on unknown beverage',
        'Dine-in only',
        'Cannot be exchanged for cash',
      ],
    },
  };

  return mockVouchers[id] || {
    id,
    title: 'Special Voucher',
    description: 'An exclusive voucher with amazing savings.',
    merchantId: 'default',
    merchantName: 'ReZ Partners',
    type: 'discount',
    value: '20% OFF',
    code: 'VOUCHER20',
    status: 'active',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    terms: [],
  };
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  heroGradient: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.lg,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  valueIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  valueText: {
    color: Colors.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
  typeText: {
    color: Colors.white,
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  claimedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  description: {
    color: Colors.textSecondary,
    lineHeight: 24,
    fontSize: 15,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  couponCode: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  copyButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    color: Colors.text,
    lineHeight: 22,
    paddingTop: 4,
  },
  detailsList: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  statusTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  termText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  shareButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  actionValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  usedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  usedText: {
    color: Colors.success,
    fontWeight: '600',
  },
  expiredBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  expiredText: {
    color: Colors.error,
    fontWeight: '600',
  },
});
