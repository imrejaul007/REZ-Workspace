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
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface Campaign {
  id: string;
  title: string;
  description?: string;
  type: 'MISSION_SPRINT' | 'FESTIVAL' | 'CATEGORY_PUSH';
  goal: string;
  reward: string;
  endsAt: string;
  image?: string;
  isJoined: boolean;
  isCompleted: boolean;
  progress?: {
    completed: number;
    target: number;
  };
}

const TYPE_BADGES: Record<string, string> = {
  MISSION_SPRINT: '🏃',
  FESTIVAL: '🎉',
  CATEGORY_PUSH: '📈',
};

const TYPE_LABELS: Record<string, string> = {
  MISSION_SPRINT: 'Mission Sprint',
  FESTIVAL: 'Festival',
  CATEGORY_PUSH: 'Category Push',
};

// Derive a city name from reverse-geocoding (best-effort; falls back to 'Bangalore')
async function resolveCity(): Promise<string> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'Bangalore';
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync(pos.coords);
    return place?.city || place?.subregion || place?.region || 'Bangalore';
  } catch {
    return 'Bangalore';
  }
}

export default function CampaignsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState('Bangalore');

  useEffect(() => {
    // Resolve city once on mount, then load campaigns
    resolveCity().then((resolvedCity) => {
      setCity(resolvedCity);
      loadCampaigns(resolvedCity);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCampaigns = useCallback(
    async (cityName?: string) => {
      try {
        const data = await tryApi.getCampaigns(cityName ?? city);
        setCampaigns(data);
      } catch (err) {
        if (__DEV__) logger.error('Failed to load campaigns:', err);
      } finally {
        setLoading(false);
      }
    },
    [city],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns(city);
    setRefreshing(false);
  };

  const handleJoinCampaign = async (campaignId: string) => {
    try {
      await tryApi.joinCampaign(campaignId);
      // Reload campaigns to update joined status
      await loadCampaigns();
    } catch (err) {
      if (__DEV__) logger.error('Failed to join campaign:', err);
    }
  };

  const getTimeRemaining = (endsAt: string): string => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const renderCampaignCard = ({ item }: { item: Campaign }) => {
    const timeRemaining = getTimeRemaining(item.endsAt);
    const isExpired = timeRemaining === 'Ended';

    return (
      <View style={[styles.card, (item.isCompleted || isExpired) && styles.cardCompleted]}>
        {/* Image/Banner */}
        {item.image ? (
          <ImageBackground source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover">
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.cardImageOverlay} />
          </ImageBackground>
        ) : (
          <LinearGradient colors={[colors.brand.purple, `${colors.brand.purple}dd`]} style={styles.cardImage} />
        )}

        {/* Completed Badge */}
        {item.isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeEmoji}>{TYPE_BADGES[item.type]}</Text>
                <Text style={styles.typeBadgeText}>{TYPE_LABELS[item.type]}</Text>
              </View>
              <Text style={styles.campaignTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.timeRemaining}>{timeRemaining}</Text>
          </View>

          {/* Goal */}
          <View style={styles.goalSection}>
            <Ionicons name="flag-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.goalText}>{item.goal}</Text>
          </View>

          {/* Progress (if joined) */}
          {item.isJoined && item.progress && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((item.progress.completed / item.progress.target) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {item.progress.completed}/{item.progress.target} completed
              </Text>
            </View>
          )}

          {/* Reward */}
          <View style={styles.rewardSection}>
            <Ionicons name="gift" size={16} color={colors.brand.purple} />
            <Text style={styles.rewardText}>{item.reward}</Text>
          </View>

          {/* Action Button */}
          <Pressable
            style={[
              styles.actionButton,
              item.isJoined && styles.actionButtonSecondary,
              item.isCompleted && styles.actionButtonDisabled,
            ]}
            onPress={() => !item.isJoined && handleJoinCampaign(item.id)}
            disabled={item.isCompleted || isExpired}
          >
            <Text
              style={[
                styles.actionButtonText,
                item.isJoined && styles.actionButtonTextSecondary,
                item.isCompleted && styles.actionButtonTextDisabled,
              ]}
            >
              {item.isCompleted ? 'Completed' : item.isJoined ? 'Continue' : 'Join'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const activeCampaigns = campaigns && Array.isArray(campaigns) ? campaigns.filter((c) => !c.isCompleted) : [];
  const completedCampaigns = campaigns && Array.isArray(campaigns) ? campaigns.filter((c) => c.isCompleted) : [];

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="megaphone-outline" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No active campaigns right now</Text>
      <Text style={styles.emptySubtitle}>Check back soon for exciting discoveries!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Discovery Campaigns</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Discovery Campaigns</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={activeCampaigns.length > 0 ? activeCampaigns : completedCampaigns}
        renderItem={renderCampaignCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<EmptyState />}
        ListHeaderComponent={
          activeCampaigns.length === 0 && completedCampaigns.length > 0 ? (
            <Text style={styles.completedSectionTitle}>Completed Campaigns</Text>
          ) : null
        }
      />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  completedSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  // Card - Premium hero style
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24 },
      android: { elevation: 4 },
    }),
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.background.secondary,
  },
  cardImageOverlay: {
    flex: 1,
  },
  completedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Content - Clean spacing
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleSection: {
    flex: 1,
    gap: spacing.sm,
  },

  // Type Badge - Modern pill
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  typeBadgeEmoji: {
    fontSize: 14,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },

  campaignTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  timeRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },

  // Goal - Clean line
  goalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 14,
  },
  goalText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },

  // Progress - Clean bar
  progressSection: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Reward - Vibrant pill
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rewardText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '700',
  },

  // Action Button - Large gradient
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  actionButtonSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  actionButtonDisabled: {
    backgroundColor: colors.background.secondary,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: colors.text.primary,
  },
  actionButtonTextDisabled: {
    color: colors.text.secondary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
