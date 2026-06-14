/**
 * AOVRewardsScreen
 * Merchants manage spend-threshold reward tiers to drive bigger basket sizes.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import CreateModal, { DraftRow, RewardType } from './CreateModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RewardTierRow {
  spendThresholdPaise: number;
  rewardType: RewardType;
  rewardValue: number;
  label?: string;
}

interface AOVRewardTier {
  _id: string;
  name: string;
  isActive: boolean;
  tiers: RewardTierRow[];
}

interface CreatePayload {
  storeId: string;
  name: string;
  tiers: RewardTierRow[];
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function fetchAOVRewards(storeId: string): Promise<AOVRewardTier[]> {
  const res = await apiClient.get(`/merchant/aov-rewards?storeId=${storeId}`);
  return res.data?.data ?? res.data ?? [];
}

async function createAOVReward(payload: CreatePayload): Promise<AOVRewardTier> {
  const res = await apiClient.post('/merchant/aov-rewards', payload);
  return res.data?.data ?? res.data;
}

async function updateAOVReward(id: string, patch: Partial<AOVRewardTier>): Promise<AOVRewardTier> {
  const res = await apiClient.put(`/merchant/aov-rewards/${id}`, patch);
  return res.data?.data ?? res.data;
}

async function deleteAOVReward(id: string): Promise<void> {
  await apiClient.delete(`/merchant/aov-rewards/${id}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function paiseToRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function rewardLabel(row: RewardTierRow) {
  if (row.rewardType === 'coins') return `${row.rewardValue} coins`;
  if (row.rewardType === 'discount') return `${row.rewardValue}% off`;
  return `${row.rewardValue}% cashback`;
}

// ---------------------------------------------------------------------------
// TierCard
// ---------------------------------------------------------------------------
interface TierCardProps {
  item: AOVRewardTier;
  onToggle: (id: string, val: boolean) => void;
  onDelete: (id: string, name: string) => void;
  isToggling: boolean;
}

function TierCard({ item, onToggle, onDelete, isToggling }: TierCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <View style={styles.cardActions}>
          <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
            <ThemedText
              style={[
                styles.badgeText,
                item.isActive ? styles.badgeTextActive : styles.badgeTextInactive,
              ]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </ThemedText>
          </View>
          <Switch
            value={item.isActive}
            onValueChange={(v) => onToggle(item._id, v)}
            disabled={isToggling}
            trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
            thumbColor={item.isActive ? '#7c3aed' : '#9ca3af'}
          />
          <TouchableOpacity
            onPress={() => onDelete(item._id, item.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Delete ${item.name}`}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.breakdown}>
        {item.tiers.map((tier, i) => (
          <View key={i} style={styles.tierRow}>
            <Ionicons name="arrow-forward-circle-outline" size={14} color="#7c3aed" />
            <ThemedText style={styles.tierRowText}>
              Spend {paiseToRupees(tier.spendThresholdPaise)} → {rewardLabel(tier)}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function AOVRewardsScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    data: tiers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['aov-rewards', storeId],
    queryFn: () => fetchAOVRewards(storeId!),
    enabled: !!storeId,
    staleTime: 3 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['aov-rewards', storeId] });
  }, [queryClient, storeId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePayload) => createAOVReward(payload),
    onSuccess: () => {
      invalidate();
      setModalVisible(false);
    },
    onError: () => Alert.alert('Error', 'Failed to create reward tier. Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AOVRewardTier> }) =>
      updateAOVReward(id, patch),
    onSuccess: invalidate,
    onError: () => Alert.alert('Error', 'Failed to update reward tier.'),
    onSettled: () => setTogglingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAOVReward(id),
    onSuccess: invalidate,
    onError: () => Alert.alert('Error', 'Failed to delete reward tier.'),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      setTogglingId(id);
      updateMutation.mutate({ id, patch: { isActive } });
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete Tier', `Remove "${name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]);
    },
    [deleteMutation]
  );

  const handleSave = useCallback(
    (name: string, rows: DraftRow[]) => {
      if (!storeId) return;
      createMutation.mutate({
        storeId,
        name,
        tiers: rows.map((r) => ({
          spendThresholdPaise: Math.round(parseFloat(r.spendRupees) * 100),
          rewardType: r.rewardType,
          rewardValue: parseFloat(r.rewardValue),
        })),
      });
    },
    [storeId, createMutation]
  );

  if (!storeId) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Spend Rewards' }} />
        <Ionicons name="storefront-outline" size={48} color={Colors.light.textMuted} />
        <ThemedText style={styles.emptyText}>Select a store to manage rewards</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Spend Rewards' }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header banner */}
        <LinearGradient
          colors={['#4c1d95', '#7c3aed']}
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.heroTitle}>Spend Rewards</ThemedText>
            <ThemedText style={styles.heroSubtitle}>Reward customers who spend more</ThemedText>
          </View>
          <Ionicons name="gift-outline" size={48} color="rgba(255,255,255,0.25)" />
        </LinearGradient>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={18} color="#7c3aed" style={{ marginTop: 2 }} />
          <ThemedText style={styles.infoText}>
            Customers who see a threshold nudge at checkout spend{' '}
            <ThemedText style={styles.infoHighlight}>23% more</ThemedText> on average. Set tiers to
            automatically show "Spend ₹50 more, get ₹30 back!"
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Active Tiers</ThemedText>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.loadingText}>Loading reward tiers...</ThemedText>
          </View>
        ) : tiers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={48} color={Colors.light.textMuted} />
            <ThemedText style={styles.emptyTitle}>No reward tiers yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Create your first one to drive bigger baskets.
            </ThemedText>
          </View>
        ) : (
          tiers.map((item) => (
            <TierCard
              key={item._id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isToggling={togglingId === item._id}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating create button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Create new reward tier"
      >
        <LinearGradient
          colors={['#7c3aed', '#a78bfa']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <ThemedText style={styles.fabText}>Create Tier</ThemedText>
        </LinearGradient>
      </TouchableOpacity>

      <CreateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        isSaving={createMutation.isPending}
      />
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  content: { padding: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

  heroBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },

  infoBanner: {
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#4c1d95', lineHeight: 19 },
  infoHighlight: { fontWeight: '700', color: '#7c3aed' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },

  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.light.text, flex: 1, marginRight: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeActive: { backgroundColor: '#d1fae5' },
  badgeInactive: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6b7280' },
  breakdown: { gap: 6 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierRowText: { fontSize: 13, color: Colors.light.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginTop: 8 },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyText: { marginTop: 12, color: Colors.light.textSecondary, textAlign: 'center' },
  loadingText: { marginTop: 12, color: Colors.light.textSecondary },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    left: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
