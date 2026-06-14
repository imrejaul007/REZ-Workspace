// @ts-nocheck
/**
 * /near-u/[merchantSlug]
 *
 * Dynamic merchant profile page accessible from the Near-U tab.
 * The slug can be either the merchant's custom URL slug or their MongoDB _id.
 * Falls back gracefully if the merchant is not found.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CachedImage from '@/components/ui/CachedImage';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import apiClient from '@/services/apiClient';

interface MerchantProfile {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  city?: string;
  openHours?: string;
  tags?: string[];
}

function MerchantSlugScreen() {
  const router = useRouter();
  const { merchantSlug } = useLocalSearchParams<unknown>();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMerchant = useCallback(async () => {
    if (!merchantSlug) return;
    try {
      setError(null);
      // Try slug first, then fall back to ID lookup
      const res = await apiClient.get<{ merchant: MerchantProfile }>(`/stores/${merchantSlug}`);
      if (res?.success && res.data?.merchant) {
        setMerchant(res.data.merchant);
      } else {
        setError('Merchant not found');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load merchant');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantSlug]);

  useEffect(() => {
    loadMerchant();
  }, [loadMerchant]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMerchant();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.nileBlue || '#1a3a52'} />
      </View>
    );
  }

  if (error || !merchant) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text?.primary || '#111'} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={56} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Merchant not found</Text>
          <Text style={styles.errorSub}>This merchant may have moved or no longer exists</Text>
          <Pressable style={styles.backBtn} onPress={() => router.push('/near-u' as unknown as string)}>
            <Text style={styles.backBtnText}>Browse nearby merchants</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Cover image */}
        <View style={styles.cover}>
          {merchant.coverImage ? (
            <CachedImage source={{ uri: merchant.coverImage }} style={styles.coverImg} />
          ) : (
            <View style={[styles.coverImg, styles.coverPlaceholder]} />
          )}
          <Pressable
            style={styles.backFab}
            onPress={() => router.back()}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </Pressable>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          {merchant.logo && <CachedImage source={{ uri: merchant.logo }} style={styles.logo} />}
          <Text style={styles.merchantName}>{merchant.name}</Text>
          {merchant.category && <Text style={styles.category}>{merchant.category}</Text>}
          {merchant.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>{merchant.rating.toFixed(1)}</Text>
              {merchant.reviewCount && <Text style={styles.reviewCount}>({merchant.reviewCount} reviews)</Text>}
            </View>
          )}
          {merchant.description && <Text style={styles.description}>{merchant.description}</Text>}
          {merchant.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{merchant.address}</Text>
            </View>
          )}
          {merchant.openHours && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{merchant.openHours}</Text>
            </View>
          )}
        </View>

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <Pressable
            style={styles.ctaPrimary}
            onPress={() =>
              router.push({
                pathname: '/StoreListPage',
                params: { merchantId: merchant._id },
              } as unknown as string)
            }
          >
            <Ionicons name="storefront" size={18} color="#fff" />
            <Text style={styles.ctaPrimaryText}>View Offers</Text>
          </Pressable>
          <Pressable style={styles.ctaSecondary} onPress={() => router.push('/try' as unknown as string)}>
            <Ionicons name="flask" size={18} color="#1a3a52" />
            <Text style={styles.ctaSecondaryText}>Try Free</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{ [key: string]: unknown }>({
  safe: { flex: 1, backgroundColor: (colors.background as unknown)?.primary || '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  cover: { height: 200, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#E5E7EB' },
  backFab: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  profileCard: {
    margin: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  logo: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  merchantName: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  category: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  rating: { fontSize: 14, fontWeight: '700', color: '#111' },
  reviewCount: { fontSize: 12, color: '#6B7280' },
  description: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { fontSize: 13, color: '#6B7280' },

  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: spacing.lg,
    marginTop: 4,
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a3a52',
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
  },
  ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e8f0f7',
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#1a3a52',
  },
  ctaSecondaryText: { fontSize: 15, fontWeight: '700', color: '#1a3a52' },

  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  backBtn: {
    backgroundColor: '#1a3a52',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default withErrorBoundary(MerchantSlugScreen, 'MerchantSlug');
