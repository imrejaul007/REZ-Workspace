/**
 * Offline Ads List Screen
 *
 * Lists all offline advertisements (rickshaw, bus, hoarding, billboard).
 * Features: Create ad, view QR codes, track scans, view analytics.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/Colors';
import { useMerchant } from '@/contexts/MerchantContext';
import { useStore } from '@/contexts/StoreContext';
import { offlineAdsService, OfflineAd, AdType, AdStatus } from '@/services/offlineAdsService';
import { formatCurrencyINR } from '@/services/api/marketingService';
import { logger } from '@/utils/logger';

// Ad type icons mapping
const AD_TYPE_ICONS: Record<AdType, string> = {
  rickshaw: 'car-outline',
  bus: 'bus-outline',
  hoarding: 'albums-outline',
  billboard: 'grid-outline',
};

// Ad type labels
const AD_TYPE_LABELS: Record<AdType, string> = {
  rickshaw: 'Rickshaw',
  bus: 'Bus',
  hoarding: 'Hoarding',
  billboard: 'Billboard',
};

// Status colors
const STATUS_COLORS: Record<AdStatus, { bg: string; text: string }> = {
  active: { bg: '#d1fae5', text: '#059669' },
  paused: { bg: '#fef3c7', text: '#d97706' },
  completed: { bg: '#dbeafe', text: '#1d4ed8' },
  draft: { bg: '#f3f4f6', text: '#6b7280' },
};

// Status labels
const STATUS_LABELS: Record<AdStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  draft: 'Draft',
};

interface AdCardProps {
  ad: OfflineAd;
  onPress: () => void;
  onToggleStatus: () => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, onPress, onToggleStatus }) => {
  const statusColor = STATUS_COLORS[ad.status] || STATUS_COLORS.draft;
  const typeIcon = AD_TYPE_ICONS[ad.type] || 'pricetag-outline';
  const typeLabel = AD_TYPE_LABELS[ad.type] || ad.type;

  const validUntil = ad.validUntil
    ? new Date(ad.validUntil).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No expiry';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.typeIconContainer}>
            <Ionicons name={typeIcon as unknown} size={20} color={Colors.light.primary} />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.adTitle} numberOfLines={1}>
              {ad.title}
            </Text>
            <Text style={styles.adType}>{typeLabel}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {STATUS_LABELS[ad.status]}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="qr-code-outline" size={16} color={Colors.light.icon} />
            <Text style={styles.statLabel}>Scans</Text>
            <Text style={styles.statValue}>{ad.scanCount?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={Colors.light.icon} />
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{ad.viewCount?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={16} color={Colors.light.icon} />
            <Text style={styles.statLabel}>Locations</Text>
            <Text style={styles.statValue}>{ad.locations?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="map-outline" size={14} color={Colors.light.icon} />
          <Text style={styles.locationText} numberOfLines={1}>
            {ad.locations?.join(', ') || 'No locations selected'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.validUntil}>Valid until {validUntil}</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
          >
            <Ionicons
              name={ad.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={16}
              color={Colors.light.primary}
            />
            <Text style={styles.toggleButtonText}>
              {ad.status === 'active' ? 'Pause' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OfflineAdsIndexScreen() {
  const insets = useSafeAreaInsets();
  const { merchant } = useMerchant();
  const { activeStore } = useStore();

  const [ads, setAds] = useState<OfflineAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AdType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<AdStatus | 'all'>('all');
  const [totalStats, setTotalStats] = useState({
    totalScans: 0,
    totalViews: 0,
    activeAds: 0,
  });

  const merchantId = merchant?._id || '';

  const fetchAds = useCallback(async (isRefresh = false) => {
    if (!merchantId) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const filters: { type?: AdType; status?: AdStatus } = {};
      if (selectedType !== 'all') filters.type = selectedType;
      if (selectedStatus !== 'all') filters.status = selectedStatus;

      const result = await offlineAdsService.getOfflineAds(merchantId, filters);
      if (result.success && result.data) {
        let filteredAds = result.data;
        if (searchQuery) {
          filteredAds = filteredAds.filter((ad) =>
            ad.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setAds(filteredAds);

        // Calculate total stats
        const stats = {
          totalScans: result.data.reduce((sum, ad) => sum + (ad.scanCount || 0), 0),
          totalViews: result.data.reduce((sum, ad) => sum + (ad.viewCount || 0), 0),
          activeAds: result.data.filter((ad) => ad.status === 'active').length,
        };
        setTotalStats(stats);
      }
    } catch (error) {
      logger.error('[OfflineAds] Error fetching ads:', error);
      Alert.alert('Error', error?.message || 'Failed to load offline ads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId, selectedType, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleAdPress = useCallback((ad: OfflineAd) => {
    const adId = ad.id || ad._id;
    router.push(`/offline-ads/${adId}`);
  }, []);

  const handleToggleStatus = useCallback(async (ad: OfflineAd) => {
    const adId = ad.id || ad._id;
    if (!adId) return;

    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'pause';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Ad`,
      `Are you sure you want to ${action} this ad?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const result = await offlineAdsService.updateOfflineAd(merchantId, adId, {
                status: newStatus,
              });
              if (result.success) {
                setAds((prev) =>
                  prev.map((a) => {
                    const id = a.id || a._id;
                    return id === adId ? { ...a, status: newStatus } : a;
                  })
                );
              }
            } catch (error) {
              Alert.alert('Error', error?.message || `Failed to ${action} ad`);
            }
          },
        },
      ]
    );
  }, [merchantId]);

  const handleCreateAd = useCallback(() => {
    router.push('/offline-ads/create');
  }, []);

  const handleDeleteAd = useCallback((ad: OfflineAd) => {
    const adId = ad.id || ad._id;
    if (!adId) return;

    Alert.alert(
      'Delete Ad',
      `Are you sure you want to delete "${ad.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await offlineAdsService.deleteOfflineAd(merchantId, adId);
              if (result.success) {
                setAds((prev) => prev.filter((a) => (a.id || a._id) !== adId));
              }
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to delete ad');
            }
          },
        },
      ]
    );
  }, [merchantId]);

  const renderAdCard = useCallback(
    ({ item }: { item: OfflineAd }) => (
      <AdCard
        ad={item}
        onPress={() => handleAdPress(item)}
        onToggleStatus={() => handleToggleStatus(item)}
      />
    ),
    [handleAdPress, handleToggleStatus]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="megaphone-outline" size={64} color={Colors.light.icon} />
      <Text style={styles.emptyTitle}>No offline ads yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first ad to reach customers through rickshaws, buses, hoardings, and billboards.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateAd}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Ad</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="qr-code" size={24} color={Colors.light.primary} />
          <Text style={styles.statCardValue}>{totalStats.totalScans.toLocaleString()}</Text>
          <Text style={styles.statCardLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="eye" size={24} color={Colors.light.secondary} />
          <Text style={styles.statCardValue}>{totalStats.totalViews.toLocaleString()}</Text>
          <Text style={styles.statCardLabel}>Total Views</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="radio-button-on" size={24} color={Colors.light.warning} />
          <Text style={styles.statCardValue}>{totalStats.activeAds}</Text>
          <Text style={styles.statCardLabel}>Active Ads</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ads..."
          placeholderTextColor={Colors.light.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={[
            { label: 'All Types', value: 'all' as const },
            { label: 'Rickshaw', value: 'rickshaw' as AdType },
            { label: 'Bus', value: 'bus' as AdType },
            { label: 'Hoarding', value: 'hoarding' as AdType },
            { label: 'Billboard', value: 'billboard' as AdType },
          ]}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={[
            { label: 'All Status', value: 'all' as const },
            { label: 'Active', value: 'active' as AdStatus },
            { label: 'Paused', value: 'paused' as AdStatus },
            { label: 'Draft', value: 'draft' as AdStatus },
            { label: 'Completed', value: 'completed' as AdStatus },
          ]}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Ads</Text>
        <TouchableOpacity onPress={handleCreateAd} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && ads.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading ads...</Text>
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id || item._id || ''}
          renderItem={renderAdCard}
          ListHeaderComponent={ads.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            ads.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAds(true)}
              tintColor={Colors.light.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.icon,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginTop: 4,
  },
  statCardLabel: {
    fontSize: 10,
    color: Colors.light.icon,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  adType: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.light.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.icon,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validUntil: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight2,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
