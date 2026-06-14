// @ts-nocheck
/**
 * My Vouchers Screen
 * Route: /vouchers
 *
 * Displays user's saved and redeemed vouchers.
 * Features:
 * - Active vouchers
 * - Used vouchers history
 * - Expired vouchers
 * - Filter by status
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
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
}

type FilterType = 'all' | 'active' | 'used' | 'expired';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  active: { color: Colors.success, label: 'Active', icon: 'checkmark-circle' },
  used: { color: Colors.textSecondary, label: 'Used', icon: 'time' },
  expired: { color: Colors.error, label: 'Expired', icon: 'close-circle' },
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  discount: 'pricetag',
  cashback: 'cash',
  freebie: 'gift',
  coins: 'wallet',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function MyVouchersPage() {
  const router = useRouter();
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [stats, setStats] = useState({ active: 0, used: 0, expired: 0 });

  const fetchVouchers = useCallback(async () => {
    try {
      const response = await apiClient.get(`${MARKETING_SERVICE}/api/v1/vouchers`);

      if (response.success && response.data) {
        setVouchers(response.data.vouchers || response.data);
      } else {
        setVouchers(getMockVouchers());
      }
    } catch (error) {
      logger.error('Failed to fetch vouchers:', error);
      setVouchers(getMockVouchers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  useEffect(() => {
    filterVouchers();
    calculateStats();
  }, [vouchers, activeFilter]);

  const filterVouchers = () => {
    let filtered = [...vouchers];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(v => v.status === activeFilter);
    }

    // Sort: active first, then by expiry
    filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });

    setFilteredVouchers(filtered);
  };

  const calculateStats = () => {
    const active = vouchers.filter(v => v.status === 'active').length;
    const used = vouchers.filter(v => v.status === 'used').length;
    const expired = vouchers.filter(v => v.status === 'expired').length;
    setStats({ active, used, expired });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  };

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied!', `Coupon code "${code}" copied to clipboard.`);
  };

  const shareVoucher = async (voucher: Voucher) => {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const renderHeader = () => (
    <View>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <LinearGradient
            colors={[Colors.success, `${Colors.success}80`]}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <ThemedText type="hero" style={styles.statValue}>
                {stats.active}
              </ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>
                Active
              </ThemedText>
            </View>
          </LinearGradient>
        </View>
        <View style={styles.statsCard}>
          <LinearGradient
            colors={[Colors.textSecondary, `${Colors.textSecondary}80`]}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <ThemedText type="hero" style={styles.statValue}>
                {stats.used}
              </ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>
                Used
              </ThemedText>
            </View>
          </LinearGradient>
        </View>
        <View style={styles.statsCard}>
          <LinearGradient
            colors={[Colors.error, `${Colors.error}80`]}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <ThemedText type="hero" style={styles.statValue}>
                {stats.expired}
              </ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>
                Expired
              </ThemedText>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All', count: vouchers.length },
          { key: 'active', label: 'Active', count: stats.active },
          { key: 'used', label: 'Used', count: stats.used },
          { key: 'expired', label: 'Expired', count: stats.expired },
        ].map(filter => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key as FilterType)}
          >
            <ThemedText
              type="caption"
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </ThemedText>
            <View
              style={[
                styles.filterCount,
                activeFilter === filter.key && styles.filterCountActive,
              ]}
            >
              <Text style={[
                styles.filterCountText,
                activeFilter === filter.key && styles.filterCountTextActive,
              ]}>
                {filter.count}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderVoucherCard = ({ item }: { item: Voucher }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const daysRemaining = item.status === 'active' ? getDaysRemaining(item.expiresAt) : 0;

    return (
      <Pressable
        style={[styles.voucherCard, item.status !== 'active' && styles.voucherCardInactive]}
        onPress={() => router.push(`/vouchers/${item.id}`)}
      >
        {/* Left side - Value */}
        <View style={[styles.voucherLeft, { backgroundColor: statusConfig.color }]}>
          <Ionicons
            name={TYPE_ICONS[item.type] || 'gift'}
            size={28}
            color={Colors.white}
          />
          <Text style={styles.voucherValue}>{item.value || 'Voucher'}</Text>
          <Text style={styles.voucherType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>

        {/* Right side - Details */}
        <View style={styles.voucherRight}>
          <View style={styles.voucherHeader}>
            <Text style={styles.voucherTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.merchantName} numberOfLines={1}>
            {item.merchantName}
          </Text>

          {item.status === 'active' && (
            <View style={styles.expiryInfo}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.expiryText}>
                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expires today'}
              </Text>
            </View>
          )}

          {item.status === 'used' && item.redeemedAt && (
            <View style={styles.expiryInfo}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.expiryText}>
                Used on {formatDate(item.redeemedAt)}
              </Text>
            </View>
          )}

          {/* Actions */}
          {item.status === 'active' && (
            <View style={styles.voucherActions}>
              {item.code && (
                <Pressable
                  style={styles.codeButton}
                  onPress={() => copyCode(item.code!)}
                >
                  <Text style={styles.codeText}>{item.code}</Text>
                  <Ionicons name="copy" size={14} color={Colors.primary} />
                </Pressable>
              )}
              <Pressable
                style={styles.shareButtonSmall}
                onPress={() => shareVoucher(item)}
              >
                <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={64} color={Colors.border} />
      <ThemedText type="title" style={styles.emptyTitle}>
        No vouchers found
      </ThemedText>
      <ThemedText type="caption" style={styles.emptySubtitle}>
        {activeFilter === 'all'
          ? 'Start saving offers to see them here'
          : `You don't have unknown ${activeFilter} vouchers`}
      </ThemedText>
      {activeFilter === 'all' && (
        <Pressable
          style={styles.browseButton}
          onPress={() => router.push('/offers')}
        >
          <ThemedText type="body" style={styles.browseButtonText}>
            Browse Offers
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'My Vouchers' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="caption" style={styles.loadingText}>
            Loading vouchers...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'My Vouchers' }} />

      <FlatList
        data={filteredVouchers}
        renderItem={renderVoucherCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMockVouchers(): Voucher[] {
  return [
    {
      id: 'v_1',
      title: 'Summer Sale Discount',
      description: 'Get 30% off on all purchases',
      merchantId: 'm1',
      merchantName: 'Trendy Fashions',
      type: 'discount',
      value: '30% OFF',
      code: 'SUMMER30',
      status: 'active',
      minSpend: 500,
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      terms: ['Valid on regular priced items', 'Cannot be combined'],
    },
    {
      id: 'v_2',
      title: 'Free Coffee',
      description: 'Get a free coffee on your next visit',
      merchantId: 'm2',
      merchantName: 'Coffee Culture',
      type: 'freebie',
      value: 'FREE',
      code: 'COFFEEFREE',
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'v_3',
      title: 'Rs. 100 Cashback',
      description: 'Get Rs. 100 cashback on orders above Rs. 500',
      merchantId: 'm3',
      merchantName: 'Food Paradise',
      type: 'cashback',
      value: 'Rs. 100',
      code: 'CASH100',
      status: 'used',
      minSpend: 500,
      expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      redeemedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'v_4',
      title: '50 Coins Bonus',
      description: 'Get 50 bonus coins on your next order',
      merchantId: 'm4',
      merchantName: 'ReZ Rewards',
      type: 'coins',
      value: '50 Coins',
      status: 'expired',
      expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'v_5',
      title: 'Buy 1 Get 1 Pizza',
      description: 'Buy unknown pizza and get another free',
      merchantId: 'm5',
      merchantName: 'Pizza Palace',
      type: 'freebie',
      value: 'BOGO',
      code: 'PIZZABOGO',
      status: 'active',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      terms: ['Valid on dine-in only', 'Premium toppings extra'],
    },
    {
      id: 'v_6',
      title: '20% Off Spa',
      description: 'Get 20% off on all spa treatments',
      merchantId: 'm6',
      merchantName: 'Serenity Spa',
      type: 'discount',
      value: '20% OFF',
      code: 'SPADAY20',
      status: 'used',
      minSpend: 1000,
      expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      claimedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      redeemedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statsCard: {
    flex: 1,
    height: 90,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statsGradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  filterContainer: {
    marginTop: Spacing.sm,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterCount: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: Colors.primary,
  },
  filterCountText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterCountTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  voucherCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  voucherCardInactive: {
    opacity: 0.7,
  },
  voucherLeft: {
    width: 100,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  voucherType: {
    color: Colors.white,
    opacity: 0.9,
    fontSize: 11,
    marginTop: 2,
  },
  voucherRight: {
    flex: 1,
    padding: Spacing.md,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  voucherTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  merchantName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  voucherActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 1,
  },
  shareButtonSmall: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  browseButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
