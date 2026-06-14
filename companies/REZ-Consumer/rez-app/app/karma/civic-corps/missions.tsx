/**
 * Civic Missions Screen
 * Lists available civic missions for NBKC.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { NBKCHeader } from './_layout';
import * as nbkcService from '@/services/nbkcService';
import { showAlert } from '@/utils/alert';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import type { NBKCMission } from '@/types/entities/nbkc';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  environment: { icon: 'leaf', color: '#22C55E', bg: '#DCFCE7', label: 'Environment' },
  water: { icon: 'water', color: '#3B82F6', bg: '#DBEAFE', label: 'Water' },
  waste: { icon: 'trash', color: '#F97316', bg: '#FFF7ED', label: 'Waste' },
  civic: { icon: 'construct', color: '#8B5CF6', bg: '#EDE9FE', label: 'Civic' },
  community: { icon: 'people', color: '#EC4899', bg: '#FCE7F3', label: 'Community' },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

const CATEGORIES = ['All', 'environment', 'water', 'waste', 'civic', 'community'];

function MissionCard({ mission, onPress }: { mission: NBKCMission; onPress: () => void }) {
  const cat = CATEGORY_CONFIG[mission.category] ?? CATEGORY_CONFIG.civic;
  const diffColor = DIFFICULTY_COLOR[mission.difficulty] ?? '#6B7280';
  const scheduledDate = new Date(mission.scheduledAt);

  return (
    <Pressable style={styles.missionCard} onPress={onPress}>
      <View style={styles.missionHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
          <Ionicons name={cat.icon as unknown} size={14} color={cat.color} />
          <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
          <Text style={[styles.diffLabel, { color: diffColor }]}>
            {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.missionName}>{mission.name}</Text>
      <Text style={styles.missionDesc} numberOfLines={2}>
        {mission.description}
      </Text>

      <View style={styles.missionMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {mission.currentVolunteers}/{mission.maxVolunteers}
          </Text>
        </View>
        <View style={styles.rewardBadge}>
          <Ionicons name="leaf" size={12} color="#059669" />
          <Text style={styles.rewardText}>+{mission.karmaReward}</Text>
        </View>
        <View style={styles.greenBadge}>
          <Ionicons name="star" size={12} color="#10B981" />
          <Text style={styles.greenText}>+{mission.greenScoreReward}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default withErrorBoundary(function CivicMissionsScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<NBKCMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchMissions = useCallback(async () => {
    try {
      const params: { category?: string } = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await nbkcService.listMissions(params);
      if (res.success && res.data) {
        setMissions(res.data.missions);
      }
    } catch (e) {
      showAlert('Error', 'Failed to load missions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchMissions();
    }, [fetchMissions]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMissions();
  };

  return (
    <View style={styles.container}>
      <NBKCHeader title="Civic Missions" subtitle="Namma Bengaluru Karma Corps" showBack />

      {/* Category Filter */}
      <View style={styles.filterRow}>
        <FlashList
          horizontal
          data={CATEGORIES}
          estimatedItemSize={80}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.base }}
          renderItem={({ item }) => {
            const active = item === selectedCategory;
            const cat = item !== 'All' ? CATEGORY_CONFIG[item] : null;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  active && { backgroundColor: cat?.color ?? '#059669', borderColor: cat?.color ?? '#059669' },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.filterChipText, active && { color: '#fff' }]}>
                  {item === 'All' ? 'All' : (cat?.label ?? item)}
                </Text>
              </Pressable>
            );
          }}
          keyExtractor={(item) => item}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlashList
          data={missions}
          estimatedItemSize={180}
          contentContainerStyle={{ padding: Spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          renderItem={({ item }) => (
            <MissionCard mission={item} onPress={() => router.push(`/karma/civic-corps/${item.id}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No missions found</Text>
              <Text style={styles.emptySubtext}>Check back soon for new civic missions</Text>
            </View>
          }
        />
      )}
    </View>
  );
}, 'CivicMissions');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipText: { ...Typography.bodySmall, fontWeight: '500', color: '#6B7280' },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  categoryLabel: { ...Typography.bodySmall, fontWeight: '600' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffLabel: { ...Typography.bodySmall, fontWeight: '500' },
  missionName: { ...Typography.h4, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  missionDesc: { ...Typography.body, color: '#6B7280', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  missionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.bodySmall, color: '#6B7280' },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rewardText: { ...Typography.bodySmall, fontWeight: '600', color: '#059669' },
  greenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  greenText: { ...Typography.bodySmall, fontWeight: '600', color: '#10B981' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { ...Typography.h4, color: '#9CA3AF', marginTop: Spacing.base },
  emptySubtext: { ...Typography.bodySmall, color: '#D1D5DB', marginTop: 4 },
});
