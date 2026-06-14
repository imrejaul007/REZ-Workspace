/**
 * Campaigns Screen
 * Route: /campaigns
 *
 * Lists all active merchant campaigns that users can browse and participate in.
 * Features:
 * - Filter by category/status
 * - Campaign cards with progress
 * - Pull-to-refresh
 * - Search functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
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
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface Campaign {
  id: string;
  title: string;
  description: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  category: string;
  status: 'active' | 'upcoming' | 'expired';
  rewardType: 'coins' | 'discount' | 'voucher' | 'cashback';
  rewardValue?: string;
  targetCount?: number;
  currentCount?: number;
  startsAt?: string;
  endsAt?: string;
  imageUrl?: string;
  terms?: string[];
  minSpend?: number;
  isParticipating?: boolean;
}

type FilterType = 'all' | 'active' | 'upcoming' | 'my_campaigns';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant',
  shopping: 'cart',
  beauty: 'sparkles',
  fitness: 'fitness',
  travel: 'airplane',
  entertainment: 'game-controller',
  health: 'medical',
  education: 'school',
  default: 'pricetag',
};

const STATUS_COLORS = {
  active: Colors.success,
  upcoming: Colors.warning,
  expired: Colors.textSecondary,
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignsPage() {
  const router = useRouter();
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await apiClient.get(`${MARKETING_SERVICE}/api/v1/campaigns`);

      if (response.success && response.data) {
        setCampaigns(response.data.campaigns || response.data);
      } else {
        // Use mock data for demo
        setCampaigns(getMockCampaigns());
      }
    } catch (error) {
      logger.error('Failed to fetch campaigns:', error);
      setCampaigns(getMockCampaigns());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchQuery, activeFilter, selectedCategory]);

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    // Apply status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(c => c.status === 'active');
    } else if (activeFilter === 'upcoming') {
      filtered = filtered.filter(c => c.status === 'upcoming');
    } else if (activeFilter === 'my_campaigns') {
      filtered = filtered.filter(c => c.isParticipating);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.title.toLowerCase().includes(query) ||
          c.merchantName.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    setFilteredCampaigns(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const categories = [...new Set(campaigns.map(c => c.category))];

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.headerTitle}>
                Campaigns
              </ThemedText>
              <ThemedText type="default" style={styles.headerSubtitle}>
                Discover exclusive offers
              </ThemedText>
            </View>
            <Pressable style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search campaigns..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All', icon: 'apps' },
          { key: 'active', label: 'Active', icon: 'flash' },
          { key: 'upcoming', label: 'Upcoming', icon: 'time' },
          { key: 'my_campaigns', label: 'My Campaigns', icon: 'heart' },
        ].map(filter => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key as FilterType)}
          >
            <Ionicons
              name={filter.icon as unknown}
              size={16}
              color={activeFilter === filter.key ? Colors.primary : Colors.textSecondary}
            />
            <ThemedText
              type="caption"
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Category Pills */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          <Pressable
            style={[
              styles.categoryPill,
              !selectedCategory && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <ThemedText
              type="caption"
              style={[
                styles.categoryPillText,
                !selectedCategory && styles.categoryPillTextActive,
              ]}
            >
              All
            </ThemedText>
          </Pressable>
          {categories.map(category => (
            <Pressable
              key={category}
              style={[
                styles.categoryPill,
                selectedCategory === category && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons
                name={CATEGORY_ICONS[category] || CATEGORY_ICONS.default}
                size={14}
                color={selectedCategory === category ? Colors.white : Colors.textSecondary}
              />
              <ThemedText
                type="caption"
                style={[
                  styles.categoryPillText,
                  selectedCategory === category && styles.categoryPillTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderCampaignCard = ({ item }: { item: Campaign }) => (
    <Pressable
      style={styles.campaignCard}
      onPress={() => router.push(`/campaigns/${item.id}`)}
    >
      {/* Campaign Image/Gradient */}
      <LinearGradient
        colors={[
          getCategoryColor(item.category),
          `${getCategoryColor(item.category)}80`,
        ]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.merchantBadge}>
            <Ionicons name="business" size={14} color={Colors.white} />
            <ThemedText type="caption" style={styles.merchantName}>
              {item.merchantName}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          >
            <ThemedText type="caption" style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardContent}>
          <ThemedText type="title" style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText type="caption" style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        </View>

        {/* Reward Badge */}
        <View style={styles.rewardContainer}>
          <View style={styles.rewardBadge}>
            <Ionicons
              name={getRewardIcon(item.rewardType)}
              size={16}
              color={Colors.primary}
            />
            <ThemedText type="caption" style={styles.rewardText}>
              {item.rewardValue || getDefaultRewardLabel(item.rewardType)}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Section */}
      {item.targetCount && item.currentCount !== undefined && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText type="caption" style={styles.progressLabel}>
              Participants
            </ThemedText>
            <ThemedText type="caption" style={styles.progressCount}>
              {item.currentCount}/{item.targetCount}
            </ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (item.currentCount / item.targetCount) * 100)}%`,
                  backgroundColor: STATUS_COLORS.active,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.cardFooter}>
        {item.endsAt && (
          <View style={styles.expiryInfo}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <ThemedText type="caption" style={styles.expiryText}>
              Ends {formatDate(item.endsAt)}
            </ThemedText>
          </View>
        )}
        <View style={styles.actionButtons}>
          {item.isParticipating ? (
            <View style={styles.participatingBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <ThemedText type="caption" style={styles.participatingText}>
                Joined
              </ThemedText>
            </View>
          ) : (
            <View style={styles.joinButton}>
              <ThemedText type="caption" style={styles.joinButtonText}>
                Join Now
              </ThemedText>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={48} color={Colors.border} />
      <ThemedText type="default" style={styles.emptyTitle}>
        No campaigns found
      </ThemedText>
      <ThemedText type="caption" style={styles.emptySubtitle}>
        Try adjusting your filters or search query
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Campaigns' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="caption" style={styles.loadingText}>
            Loading campaigns...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Campaigns' }} />

      <FlatList
        data={filteredCampaigns}
        renderItem={renderCampaignCard}
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

function getMockCampaigns(): Campaign[] {
  return [
    {
      id: 'camp_1',
      title: 'Summer Mega Sale',
      description: 'Get up to 50% off on all summer collections. Shop now and save big!',
      merchantId: 'm1',
      merchantName: 'Fashion Hub',
      category: 'shopping',
      status: 'active',
      rewardType: 'discount',
      rewardValue: '50% OFF',
      targetCount: 1000,
      currentCount: 723,
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
    },
    {
      id: 'camp_2',
      title: 'Cafe Rewards Week',
      description: 'Buy 1 Get 1 Free on all beverages at participating cafes.',
      merchantId: 'm2',
      merchantName: 'Coffee Culture',
      category: 'food',
      status: 'active',
      rewardType: 'voucher',
      rewardValue: 'BOGO',
      targetCount: 500,
      currentCount: 312,
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: true,
    },
    {
      id: 'camp_3',
      title: 'Fitness Challenge',
      description: 'Complete 10 workouts this month and earn exclusive rewards.',
      merchantId: 'm3',
      merchantName: 'FitLife Gym',
      category: 'fitness',
      status: 'upcoming',
      rewardType: 'coins',
      rewardValue: '500 Coins',
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
    },
    {
      id: 'camp_4',
      title: 'Beauty Bonanza',
      description: 'Exclusive deals on skincare and makeup. Limited time only!',
      merchantId: 'm4',
      merchantName: 'Glow Studio',
      category: 'beauty',
      status: 'active',
      rewardType: 'cashback',
      rewardValue: '20% Cashback',
      targetCount: 200,
      currentCount: 89,
      endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
    },
    {
      id: 'camp_5',
      title: 'Weekend Getaway',
      description: 'Special travel packages with up to 30% discount.',
      merchantId: 'm5',
      merchantName: 'TravelEase',
      category: 'travel',
      status: 'active',
      rewardType: 'discount',
      rewardValue: '30% OFF',
      minSpend: 5000,
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
    },
  ];
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: '#FF6B6B',
    shopping: '#4ECDC4',
    beauty: '#FF69B4',
    fitness: '#45B7D1',
    travel: '#96CEB4',
    entertainment: '#DDA0DD',
    health: '#98D8C8',
    education: '#F7DC6F',
  };
  return colors[category] || Colors.primary;
}

function getRewardIcon(type: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    coins: 'wallet',
    discount: 'pricetag',
    voucher: 'ticket',
    cashback: 'cash',
  };
  return icons[type] || 'gift';
}

function getDefaultRewardLabel(type: string): string {
  const labels: Record<string, string> = {
    coins: 'Earn Coins',
    discount: 'Special Discount',
    voucher: 'Free Voucher',
    cashback: 'Cashback',
  };
  return labels[type] || 'Reward';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days left`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  header: {
    marginBottom: Spacing.md,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    marginTop: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: 6,
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
  categoryContainer: {
    marginTop: Spacing.md,
  },
  categoryContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginRight: Spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
  },
  categoryPillText: {
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  campaignCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardGradient: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  merchantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  merchantName: {
    color: Colors.white,
    opacity: 0.9,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    color: Colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    color: Colors.white,
    opacity: 0.8,
    fontSize: 13,
  },
  rewardContainer: {
    flexDirection: 'row',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  rewardText: {
    color: Colors.text,
    fontWeight: '600',
  },
  progressSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: Colors.textSecondary,
  },
  progressCount: {
    color: Colors.text,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participatingText: {
    color: Colors.success,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
