// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import { CardGridSkeleton } from '@/components/skeletons';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import bonusZoneApi, { BonusZoneCampaign, BonusCampaignType } from '@/services/bonusZoneApi';
import BonusZoneCard from '@/components/earn/BonusZoneCard';
import { useGetCurrencySymbol, useRegionState } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

// ============================================
// FILTER TABS
// ============================================

interface FilterTab {
  key: string;
  label: string;
  type?: BonusCampaignType;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'All' },
  { key: 'cashback_boost', label: 'Cashback', type: 'cashback_boost' },
  { key: 'bank_offer', label: 'Bank Offers', type: 'bank_offer' },
  { key: 'bill_upload_bonus', label: 'Bill Upload', type: 'bill_upload_bonus' },
  { key: 'category_multiplier', label: 'Category Bonus', type: 'category_multiplier' },
  { key: 'festival_offer', label: 'Festival', type: 'festival_offer' },
];

// ============================================
// COMPONENT
// ============================================

function BonusZonePage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const regionState = useRegionState();
  const currencySymbol = getCurrencySymbol();

  const [campaigns, setCampaigns] = useState<BonusZoneCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null);
      const response = await bonusZoneApi.getBonusCampaigns(regionState?.currentRegion);
      if (response.success && response.data?.campaigns) {
        setCampaigns(response.data.campaigns);
      }
    } catch (err) {
      if (!isMounted()) return;
      setError(err.message || 'Failed to load campaigns');
    } finally {
      if (!isMounted()) return;
      setLoading(false);
      if (!isMounted()) return;
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionState?.currentRegion]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Filter campaigns: search first, then type filter
  const searchFiltered = useMemo(
    () =>
      searchQuery.trim()
        ? campaigns.filter((c) => {
            const q = searchQuery.trim().toLowerCase();
            return c.title.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q));
          })
        : campaigns,
    [campaigns, searchQuery],
  );

  const filteredCampaigns = useMemo(
    () => (activeFilter === 'all' ? searchFiltered : searchFiltered.filter((c) => c.campaignType === activeFilter)),
    [searchFiltered, activeFilter],
  );

  // Separate featured and regular
  const featured = useMemo(() => filteredCampaigns.filter((c) => c.display.featured), [filteredCampaigns]);
  const regular = useMemo(() => filteredCampaigns.filter((c) => !c.display.featured), [filteredCampaigns]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Bonus Zone',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.nileBlue,
        }}
      />

      <FlatList
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.orange} />
        }
        data={filteredCampaigns}
        keyExtractor={(item) => item.slug}
        renderItem={useCallback(
          ({ item: campaign }: { item: unknown }) => (
            <BonusZoneCard campaign={campaign} currencySymbol={currencySymbol} />
          ),
          [currencySymbol],
        )}
        ListHeaderComponent={() => (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="happy" size={28} color={colors.brand.orange} />
              <Text style={styles.headerTitle}>Bonus Zone</Text>
              <Text style={styles.headerSubtitle}>Earn extra coins with time-limited bonus campaigns</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search-outline" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search campaigns..."
                  placeholderTextColor={colors.neutral[400]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={styles.searchClearButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {FILTER_TABS.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[styles.filterTab, activeFilter === tab.key ? styles.filterTabActive : null]}
                  onPress={() => setActiveFilter(tab.key)}
                >
                  <Text style={[styles.filterTabText, activeFilter === tab.key ? styles.filterTabTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Results Count */}
            {!loading && !error && filteredCampaigns.length > 0 && (
              <View style={styles.resultCount}>
                <Text style={styles.resultCountText}>
                  {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
                  {activeFilter !== 'all' || searchQuery.trim() ? ' found' : ' available'}
                </Text>
              </View>
            )}

            {/* Loading / Error State */}
            {loading ? (
              <CardGridSkeleton />
            ) : error ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="warning-outline" size={48} color={Colors.error} />
                <Text style={styles.emptyTitle}>Something went wrong</Text>
                <Text style={styles.emptySubtitle}>{error}</Text>
                <Pressable
                  style={{
                    marginTop: Spacing.base,
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: 10,
                    backgroundColor: colors.brand.orange,
                    borderRadius: BorderRadius.sm,
                  }}
                  onPress={fetchCampaigns}
                >
                  <Text style={{ color: colors.text.inverse, ...Typography.body, fontWeight: '600' }}>Retry</Text>
                </Pressable>
              </View>
            ) : filteredCampaigns.length === 0 ? (
              /* Empty State */
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={searchQuery.trim() ? 'search-outline' : 'gift-outline'}
                  size={48}
                  color={colors.border.default}
                />
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim() ? 'No matching campaigns' : 'No campaigns available'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? `No campaigns match "${searchQuery.trim()}". Try a different search.`
                    : activeFilter === 'all'
                      ? 'Check back soon for new bonus opportunities!'
                      : 'No campaigns in this category right now.'}
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{featured.length > 0 ? 'Featured' : 'Campaigns'}</Text>
              </View>
            )}
          </>
        )}
        ListFooterComponent={() => (
          <>
            {/* Claim History Link */}
            <Pressable
              style={styles.historyLink}
              onPress={() => router.push('/bonus-zone-history' as unknown as string)}
            >
              <Ionicons name="receipt-outline" size={18} color={colors.text.tertiary} />
              <Text style={styles.historyLinkText}>View Claim History</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </Pressable>
          </>
        )}
        scrollEnabled={true}
      />
    </>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.nileBlue,
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.nileBlue,
    paddingVertical: 0,
  },
  searchClearButton: {
    marginLeft: Spacing.xs,
  },
  filtersContainer: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  filtersContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
    marginRight: Spacing.sm,
  },
  filterTabActive: {
    backgroundColor: colors.brand.orange,
  },
  filterTabText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  filterTabTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  emptyTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: Spacing.base,
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  sectionLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.md,
  },
  resultCount: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  resultCountText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: Spacing.sm,
  },
  historyLinkText: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});

export default withErrorBoundary(BonusZonePage, 'BonusZone');
