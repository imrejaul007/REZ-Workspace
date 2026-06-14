// @ts-nocheck
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface CategoryBadge {
  category: string;
  categoryEmoji?: string;
  level: 'Newcomer' | 'Regular' | 'Expert' | 'Master';
  trialCount: number;
  nextLevelThreshold: number;
}

interface UndiscoveredCategory {
  category: string;
  categoryEmoji?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  cafe: 'cafe-outline',
  gym: 'fitness-outline',
  salon: 'cut-outline',
  fitness: 'fitness-outline',
  wellness: 'heart-outline',
  home_service: 'home-outline',
  beauty: 'sparkles-outline',
  restaurant: 'restaurant-outline',
  spa: 'water-outline',
};

const BADGE_COLORS: Record<string, string> = {
  Newcomer: colors.text.tertiary,
  Regular: '#CD7F32',
  Expert: '#C0C0C0',
  Master: '#FFD700',
};

export default function BadgesScreen() {
  const router = useRouter();
  const [badges, setBadges] = useState<CategoryBadge[]>([]);
  const [undiscovered, setUndiscovered] = useState<UndiscoveredCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBadges = useCallback(async () => {
    try {
      const data = await tryApi.getBadges();
      if (data && data.earned) {
        setBadges(data.earned);
      }
      if (data && data.undiscovered) {
        setUndiscovered(data.undiscovered);
      }
    } catch (err) {
      if (__DEV__) logger.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBadges();
    setRefreshing(false);
  };

  const getIconName = (category: string): string => {
    return CATEGORY_ICONS[category] || 'star-outline';
  };

  const capitalizeCategory = (cat: string): string => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderBadgeCard = ({ item }: { item: CategoryBadge }) => {
    const badgeColor = BADGE_COLORS[item.level];

    return (
      <View style={styles.badgeCard}>
        {/* Badge Ring */}
        <View style={[styles.badgeRing, { borderColor: badgeColor }]}>
          <Ionicons name={getIconName(item.category)} size={32} color={badgeColor} />
        </View>

        {/* Content */}
        <View style={styles.badgeContent}>
          <Text style={styles.categoryName}>{capitalizeCategory(item.category)}</Text>
          <Text style={[styles.levelLabel, { color: badgeColor }]}>{item.level}</Text>
          <Text style={styles.trialCount}>{item.trialCount} trials</Text>
          <Text style={styles.progressText}>{item.nextLevelThreshold - item.trialCount} more for next level</Text>
        </View>
      </View>
    );
  };

  const renderUndiscoveredCard = ({ item }: { item: UndiscoveredCategory }) => (
    <View style={styles.undiscoveredCard}>
      <View style={styles.undiscoveredBadgeRing}>
        <Ionicons name={getIconName(item.category)} size={28} color={colors.text.tertiary} />
      </View>
      <View style={styles.undiscoveredContent}>
        <Text style={styles.undiscoveredName}>{capitalizeCategory(item.category)}</Text>
        <Text style={styles.undiscoveredText}>Try your first {item.category} trial</Text>
      </View>
    </View>
  );

  const renderSectionHeader = (title: string) => <Text style={styles.sectionTitle}>{title}</Text>;

  const renderFlatListItem = useCallback(({ item }) => {
    if (item.type === 'header') {
      return renderSectionHeader('Your Badges');
    }
    if (item.type === 'undiscovered-header') {
      return renderSectionHeader('Discover More');
    }
    if (item.type === 'badge') {
      return renderBadgeCard({ item: item.data });
    }
    if (item.type === 'undiscovered') {
      return renderUndiscoveredCard({ item: item.data });
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Your Badges</Text>
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Badges</Text>
          <Text style={styles.headerSubtitle}>Explore new categories to earn badges</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={[
          { type: 'header', data: null },
          ...badges.map((b) => ({ type: 'badge', data: b })),
          { type: 'undiscovered-header', data: null },
          ...undiscovered.map((u) => ({ type: 'undiscovered', data: u })),
        ]}
        renderItem={renderFlatListItem}
        keyExtractor={(item, idx) => {
          if (item.type === 'header') return 'header';
          if (item.type === 'undiscovered-header') return 'undiscovered-header';
          return `${item.type}-${item.data?.category}`;
        }}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  badgeRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  badgeContent: {
    flex: 1,
    gap: spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  trialCount: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  undiscoveredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    opacity: 0.6,
  },
  undiscoveredBadgeRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  undiscoveredContent: {
    flex: 1,
    gap: spacing.xs,
  },
  undiscoveredName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  undiscoveredText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
