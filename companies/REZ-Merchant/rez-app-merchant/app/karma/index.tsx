/**
 * Karma Campaigns List Screen
 * Displays all karma campaigns with filtering and actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { karmaCampaignService, KarmaCampaign, KarmaCampaignStatus } from '@/services/api/karma';
import { BRAND } from '@/constants/brand';
import { showAlert } from '@/utils/alert';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { logger } from '@/utils/logger';

// Status filter options
const STATUS_FILTERS: { label: string; value: KarmaCampaignStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
];

export default function KarmaCampaignsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<KarmaCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<KarmaCampaignStatus | 'all'>('all');
  const [totalCount, setTotalCount] = useState(0);

  const fetchCampaigns = useCallback(async () => {
    try {
      const filters: unknown = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const response = await karmaCampaignService.getCampaigns(filters);
      setCampaigns(response.campaigns);
      setTotalCount(response.campaigns.length);
    } catch (error) {
      logger.error('Error fetching campaigns:', error);
      showAlert('Error', error.message || 'Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const getStatusColor = (status?: KarmaCampaignStatus): string => {
    const statusColors: Record<string, string> = {
      active: '#10B981',
      draft: '#9CA3AF',
      paused: '#F59E0B',
      completed: '#6B7280',
      cancelled: '#EF4444',
    };
    return statusColors[status || ''] || '#6B7280';
  };

  const getStatusLabel = (status?: KarmaCampaignStatus): string => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCampaignTypeEmoji = (type?: string): string => {
    const emojiMap: Record<string, string> = {
      'blood-donation': '🩸',
      'food-distribution': '🍱',
      'ngo-support': '🤝',
      other: '✨',
    };
    return emojiMap[type || ''] || '✨';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderCampaignCard = useCallback(
    ({ item, index }: { item: KarmaCampaign; index: number }) => {
      const statusColor = getStatusColor(item.status);
      const fillPercentage = item.capacity
        ? Math.min((item.capacity.enrolled / item.capacity.goal) * 100, 100)
        : 0;

      const totalCoins = item.rewards?.coins || 0;
      const bonusCoins = item.rewards?.bonusCoins || 0;

      return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
          <TouchableOpacity
            style={styles.campaignCard}
            onPress={() => router.push(`/karma/${item._id}`)}
            activeOpacity={0.8}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.campaignTypeContainer}>
                <Text style={styles.campaignTypeEmoji}>
                  {getCampaignTypeEmoji(item.type)}
                </Text>
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.campaignType}>
                    {item.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            {/* Description */}
            {item.description && (
              <Text style={styles.campaignDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Location & Date */}
            <View style={styles.detailsRow}>
              {item.location?.city && (
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.location.city}
                  </Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.startDate ? formatDate(item.startDate) : 'No start date'}
                </Text>
              </View>
            </View>

            {/* Capacity Progress */}
            {item.capacity && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Participants</Text>
                  <Text style={styles.progressValue}>
                    {item.capacity.enrolled}/{item.capacity.goal}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${fillPercentage}%` }]} />
                </View>
              </View>
            )}

            {/* Rewards */}
            <View style={styles.rewardsRow}>
              <View style={styles.rewardItem}>
                <Ionicons name="wallet" size={14} color="#10B981" />
                <Text style={styles.rewardText}>
                  +{totalCoins} {BRAND.COIN_SHORT}
                </Text>
              </View>
              {bonusCoins > 0 && (
                <View style={styles.rewardItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.rewardText, { color: '#F59E0B' }]}>
                    +{bonusCoins} Bonus
                  </Text>
                </View>
              )}
            </View>

            {/* Verification Methods */}
            {item.verificationMethods && item.verificationMethods.length > 0 && (
              <View style={styles.verificationRow}>
                {item.verificationMethods.map((method, idx) => {
                  const methodConfig: Record<string, { icon: string; label: string; color: string }> = {
                    manual: { icon: 'person', label: 'Manual', color: '#6B7280' },
                    qr: { icon: 'qr-code', label: 'QR', color: '#10B981' },
                    geo: { icon: 'location', label: 'Geo', color: '#3B82F6' },
                  };
                  const config = methodConfig[method] || methodConfig.manual;
                  return (
                    <View
                      key={idx}
                      style={[styles.verificationChip, { backgroundColor: `${config.color}15` }]}
                    >
                      <Ionicons
                        name={config.icon as keyof typeof Ionicons.glyphMap}
                        size={12}
                        color={config.color}
                      />
                      <Text style={[styles.verificationText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.participantsButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/karma/${item._id}`);
                }}
              >
                <Ionicons name="people" size={14} color="#7C3AED" />
                <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>
                  {item.capacity?.enrolled || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.statsButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/karma/${item._id}`);
                }}
              >
                <Ionicons name="analytics" size={14} color="#3B82F6" />
                <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Stats</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#F3F4F6']}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.title}>Karma Campaigns</Text>
                {totalCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {totalCount} {totalCount === 1 ? 'campaign' : 'campaigns'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/karma/create')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>New</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <FlatList
            data={STATUS_FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.filterList}
            renderItem={useCallback(
              ({ item }: { item: { label: string; value: KarmaCampaignStatus | 'all' } }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === item.value && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setStatusFilter(item.value);
                    setIsLoading(true);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === item.value && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ),
              [statusFilter]
            )}
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading campaigns...</Text>
          </View>
        ) : campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-circle-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first karma campaign to engage customers with social impact activities.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/karma/create')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Your First Campaign</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={campaigns}
            renderItem={renderCampaignCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 280,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  campaignTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  campaignTypeEmoji: {
    fontSize: 32,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  campaignType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  campaignDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 4,
  },
  participantsButton: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  statsButton: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
