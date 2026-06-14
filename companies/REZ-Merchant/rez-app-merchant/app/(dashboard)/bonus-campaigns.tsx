import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  bonusCampaignService,
  BonusCampaign,
  BonusCampaignType,
} from '@/services/api/bonusCampaigns';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

// ============================================
// HELPERS
// ============================================

const CAMPAIGN_TYPE_CONFIG: Record<
  BonusCampaignType,
  { label: string; color: string; bg: string; icon: string }
> = {
  cashback_boost: {
    label: 'Cashback Boost',
    color: '#10B981',
    bg: '#D1FAE5',
    icon: 'arrow-up-circle',
  },
  bank_offer: { label: 'Bank Offer', color: '#3B82F6', bg: '#DBEAFE', icon: 'card' },
  bill_upload_bonus: { label: 'Bill Upload', color: '#8B5CF6', bg: '#EDE9FE', icon: 'receipt' },
  category_multiplier: { label: 'Category Boost', color: '#F59E0B', bg: '#FEF3C7', icon: 'layers' },
  first_transaction_bonus: {
    label: 'First Transaction',
    color: '#EC4899',
    bg: '#FCE7F3',
    icon: 'star',
  },
  festival_offer: { label: 'Festival Offer', color: '#EF4444', bg: '#FEE2E2', icon: 'gift' },
};

function getTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function formatReward(reward: BonusCampaign['reward']): string {
  if (reward.type === 'percentage') {
    return `${reward.value}% ${reward.coinType === 'branded' ? 'Branded' : 'ReZ'} Coins`;
  }
  if (reward.type === 'flat') {
    return `${reward.value} ${reward.coinType === 'branded' ? 'Branded' : 'ReZ'} Coins`;
  }
  if (reward.type === 'multiplier') {
    return `${reward.value}x ${reward.coinType === 'branded' ? 'Branded' : 'ReZ'} Coins`;
  }
  return `${reward.value} Coins`;
}

function formatRewardShort(reward: BonusCampaign['reward']): string {
  if (reward.type === 'percentage') return `${reward.value}%`;
  if (reward.type === 'multiplier') return `${reward.value}x`;
  return `${reward.value}`;
}

// ============================================
// COMPONENTS
// ============================================

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.emptyIconGradient}>
          <Ionicons name="gift-outline" size={40} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Active Bonus Campaigns</Text>
      <Text style={styles.emptySubtitle}>
        When the platform runs bonus campaigns that could drive traffic to your store, they will
        appear here.
      </Text>
    </View>
  );
}

function CampaignCard({ campaign }: { campaign: BonusCampaign }) {
  const typeConfig =
    CAMPAIGN_TYPE_CONFIG[campaign.campaignType] || CAMPAIGN_TYPE_CONFIG.cashback_boost;
  const timeLeft = getTimeRemaining(campaign.schedule.endTime);
  const isExpiringSoon = timeLeft.includes('h') && !timeLeft.includes('d');

  return (
    <View style={styles.campaignCard}>
      {/* Header with icon and type badge */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.campaignIcon,
              { backgroundColor: campaign.display?.backgroundColor || typeConfig.bg },
            ]}
          >
            <Text style={styles.campaignIconText}>{campaign.display?.icon || '🎁'}</Text>
          </View>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {campaign.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {campaign.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Type Badge + Reward */}
      <View style={styles.cardBadgeRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
          <Ionicons name={typeConfig.icon as unknown as keyof typeof Ionicons.glyphMap} size={12} color={typeConfig.color} />
          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>
        {campaign.display?.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
      </View>

      {/* Reward Info */}
      <View style={styles.rewardSection}>
        <View style={styles.rewardRow}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardLabel}>Reward</Text>
            <View style={styles.rewardValueRow}>
              <Ionicons name="sparkles" size={16} color="#F59E0B" />
              <Text style={styles.rewardValue}>{formatReward(campaign.reward)}</Text>
            </View>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
            <Text style={styles.rewardLabel}>Per User Cap</Text>
            <Text style={styles.rewardValue}>
              {campaign.reward.capPerUser > 0 ? `${campaign.reward.capPerUser} coins` : 'No cap'}
            </Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
            <Text style={styles.rewardLabel}>Max Claims</Text>
            <Text style={styles.rewardValue}>
              {campaign.maxClaimsPerUser > 0 ? `${campaign.maxClaimsPerUser}x` : 'Unlimited'}
            </Text>
          </View>
        </View>
      </View>

      {/* LI WEI: merchant ROI — Campaign Performance Metrics */}
      {campaign.metrics && (
        <View style={[styles.rewardSection, { borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 10,
              marginTop: 4,
            }}
          >
            Campaign Performance
          </Text>
          <View style={styles.rewardRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardLabel}>Est. Revenue</Text>
              <Text style={[styles.rewardValue, { color: '#10B981' }]}>
                ₹{(campaign.metrics.attributedRevenue || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardLabel}>Reach</Text>
              <Text style={[styles.rewardValue, { color: '#3B82F6' }]}>
                {campaign.metrics.customerCount || 0} customers
              </Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardLabel}>Conversion</Text>
              <Text style={[styles.rewardValue, { color: '#8B5CF6' }]}>
                {((campaign.metrics.conversionRate || 0) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Partner Info */}
      {campaign.fundingSource?.partnerName && (
        <View style={styles.partnerRow}>
          <Ionicons name="business-outline" size={14} color="#6B7280" />
          <Text style={styles.partnerText}>Sponsored by {campaign.fundingSource.partnerName}</Text>
        </View>
      )}

      {/* Footer: Time Remaining */}
      <View style={styles.cardFooter}>
        <View style={[styles.timeContainer, isExpiringSoon && styles.timeContainerUrgent]}>
          <Ionicons name="time-outline" size={14} color={isExpiringSoon ? '#EF4444' : '#6B7280'} />
          <Text style={[styles.timeText, isExpiringSoon && styles.timeTextUrgent]}>{timeLeft}</Text>
        </View>
        <View style={styles.infoTag}>
          <Ionicons name="information-circle-outline" size={14} color="#6366F1" />
          <Text style={styles.infoTagText}>View-only</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function BonusCampaignsScreen() {
  const [campaigns, setCampaigns] = useState<BonusCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // FE-H6 fix: track error state

  const fetchCampaigns = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);
      setFetchError(null);

      const result = await bonusCampaignService.getActiveCampaigns();
      setCampaigns(result.campaigns);
    } catch (error) {
      if (__DEV__) console.error('[BonusCampaigns] Error loading campaigns:', error.message);
      // FE-H6 fix: expose error to UI so merchants don't see empty list and assume no campaigns exist
      setFetchError(error.message || 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleRefresh = () => {
    fetchCampaigns(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBg}>
            <Ionicons name="gift" size={22} color="#fff" />
          </View>
          <View style={styles.headerTextSection}>
            <Text style={styles.headerTitle}>Active Bonus Campaigns</Text>
            <Text style={styles.headerSubtitle}>
              Platform campaigns driving traffic to your store
            </Text>
          </View>
        </View>
        {campaigns.length > 0 && (
          <View style={styles.headerCountBadge}>
            <Text style={styles.headerCountText}>{campaigns.length} active</Text>
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      ) : fetchError ? (
        /* FE-H6 fix: show error banner with retry so merchants can distinguish network error from empty state */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={{ fontSize: 15, color: '#ef4444', textAlign: 'center', marginTop: 12 }}>
            {fetchError}
          </Text>
          <TouchableOpacity
            onPress={() => fetchCampaigns()}
            style={{
              marginTop: 16,
              backgroundColor: '#7C3AED',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#7C3AED']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoBannerText}>
              These are platform-managed bonus campaigns. They incentivize customers to shop and can
              drive additional traffic to stores in your category. This is a read-only view.
            </Text>
          </View>

          {/* Campaign List */}
          {campaigns.length === 0 ? (
            <EmptyState />
          ) : (
            campaigns.map((campaign) => (
              <CampaignCard key={campaign.id || campaign.slug} campaign={campaign} />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  headerCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 18,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Campaign Card
  campaignCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  campaignIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignIconText: {
    fontSize: 22,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },

  // Badge Row
  cardBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },

  // Reward Section
  rewardSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rewardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  rewardDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },

  // Partner Row
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingLeft: 2,
  },
  partnerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeContainerUrgent: {
    backgroundColor: '#FEF2F2',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  timeTextUrgent: {
    color: '#EF4444',
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  infoTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
});
