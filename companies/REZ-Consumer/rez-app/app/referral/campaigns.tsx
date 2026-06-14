import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: string;
  referrerReward: { type: string; value: number };
  refereeReward?: { type: string; value: number };
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export default function CampaignsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_REFERRAL_API_URL || 'http://localhost:4019'}/api/campaigns`
      );
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data.campaigns);
      }
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const formatReward = (reward: { type: string; value: number }) => {
    if (reward.type === 'fixed') return `₹${reward.value}`;
    if (reward.type === 'percentage') return `${reward.value}%`;
    if (reward.type === 'coins') return `${reward.value} coins`;
    if (reward.type === 'discount') return `${reward.value}% off`;
    return `${reward.value}`;
  };

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'consumer': return '👥';
      case 'merchant': return '🏪';
      case 'creator': return '⭐';
      default: return '🎯';
    }
  };

  const getCampaignGradient = (type: string) => {
    switch (type) {
      case 'consumer': return '#6366F1';
      case 'merchant': return '#10B981';
      case 'creator': return '#F59E0B';
      default: return '#6366F1';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Campaigns</Text>
        <Text style={styles.subtitle}>Earn extra rewards</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Featured Campaign */}
        <View style={styles.featuredSection}>
          <View style={[styles.featuredCard, { backgroundColor: '#6366F1' }]}>
            <View style={styles.featuredHeader}>
              <Text style={styles.featuredIcon}>🎉</Text>
              <View>
                <Text style={styles.featuredLabel}>FEATURED</Text>
                <Text style={styles.featuredTitle}>Summer Referral Festival</Text>
              </View>
            </View>
            <Text style={styles.featuredDescription}>
              Earn double rewards on all qualified referrals this month!
            </Text>
            <View style={styles.featuredRewards}>
              <View style={styles.featuredReward}>
                <Text style={styles.featuredRewardValue}>2x</Text>
                <Text style={styles.featuredRewardLabel}>Referral Rewards</Text>
              </View>
            </View>
          </View>
        </View>

        {/* All Campaigns */}
        <View style={styles.campaignsSection}>
          <Text style={styles.sectionTitle}>Active Campaigns</Text>

          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={styles.campaignCard}
              onPress={() => router.push(`/referral/campaigns/${campaign.id}`)}
            >
              <View
                style={[
                  styles.campaignIconBg,
                  { backgroundColor: getCampaignGradient(campaign.type) + '20' },
                ]}
              >
                <Text style={styles.campaignIcon}>
                  {getCampaignIcon(campaign.type)}
                </Text>
              </View>

              <View style={styles.campaignInfo}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <Text style={styles.campaignDescription} numberOfLines={2}>
                  {campaign.description}
                </Text>
                <View style={styles.campaignRewards}>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>
                      You: {formatReward(campaign.referrerReward)}
                    </Text>
                  </View>
                  {campaign.refereeReward && (
                    <View style={[styles.rewardBadge, styles.refereeBadge]}>
                      <Text style={styles.rewardText}>
                        Friend: {formatReward(campaign.refereeReward)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          {campaigns.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Active Campaigns</Text>
              <Text style={styles.emptyText}>
                Check back soon for new referral campaigns!
              </Text>
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>🍔</Text>
              <Text style={styles.categoryName}>Food & Dining</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>💄</Text>
              <Text style={styles.categoryName}>Beauty</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>✈️</Text>
              <Text style={styles.categoryName}>Travel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>🏥</Text>
              <Text style={styles.categoryName}>Healthcare</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>🏋️</Text>
              <Text style={styles.categoryName}>Fitness</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>🛒</Text>
              <Text style={styles.categoryName}>Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366F1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  featuredSection: {
    padding: 16,
  },
  featuredCard: {
    padding: 20,
    borderRadius: 16,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  featuredLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featuredDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  featuredRewards: {
    flexDirection: 'row',
  },
  featuredReward: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featuredRewardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featuredRewardLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  campaignsSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  campaignIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  campaignIcon: {
    fontSize: 24,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  campaignDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  campaignRewards: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rewardBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refereeBadge: {
    backgroundColor: '#ECFDF5',
  },
  rewardText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoriesSection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
});
