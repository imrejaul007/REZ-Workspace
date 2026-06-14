import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trialsService, TrialOffer } from '@/services/api/trials';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_approval: { bg: '#FFFBEB', text: '#F59E0B' },
  active: { bg: '#DCFCE7', text: '#16A34A' },
  paused: { bg: '#E5E7EB', text: '#6B7280' },
  rejected: { bg: '#FEE2E2', text: '#EF4444' },
};

export default function TrialsScreen() {
  const router = useRouter();
  const [trials, setTrials] = useState<TrialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await trialsService.getTrials({ page: 1, limit: 50 });
      if (response.success && response.data) {
        setTrials(response.data.trials || []);
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to load trials:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await trialsService.getTrials({ page: 1, limit: 50 });
      if (response.success && response.data) {
        setTrials(response.data.trials || []);
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to refresh trials:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrials();
  }, [loadTrials]);

  const handleToggleStatus = async (trial: TrialOffer) => {
    if (trial.status === 'pending_approval' || trial.status === 'rejected') {
      return; // Can't toggle pending or rejected trials
    }

    const newStatus = trial.status === 'active' ? 'paused' : 'active';
    try {
      const response = await trialsService.updateTrialStatus(trial._id, newStatus);
      if (response.success) {
        setTrials((prev) =>
          prev.map((t) => (t._id === trial._id ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to update trial status:', err);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color={Colors.light.textMuted} />
      <Text style={styles.emptyTitle}>No Trials Yet</Text>
      <Text style={styles.emptySubtitle}>
        You haven't created unknown trials yet. Tap the + button to create your first trial offer.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/try/merchant/create')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Create Trial</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTrial = ({ item }: { item: TrialOffer }) => {
    const statusInfo = STATUS_COLORS[item.status];
    const canToggle = item.status === 'active' || item.status === 'paused';

    return (
      <TouchableOpacity
        style={styles.trialCard}
        onPress={() => router.push(`/try/merchant/${item._id}`)}
        activeOpacity={0.7}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: item.images[0].url }}
              style={styles.trialImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.trialImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={Colors.light.textMuted} />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
              {item.status.replace('_', ' ').charAt(0).toUpperCase() +
                item.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {canToggle && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => handleToggleStatus(item)}
              >
                <Ionicons
                  name={item.status === 'active' ? 'play-circle' : 'pause-circle'}
                  size={24}
                  color={item.status === 'active' ? '#10B981' : '#6B7280'}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.category}>{item.category}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.coinPrice}>
              <Ionicons name="sparkles" size={12} /> {item.trialCoinPrice} Coins
            </Text>
            <Text style={styles.commitmentFee}>₹{item.commitmentFee}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={14} color={Colors.light.textMuted} />
              <Text style={styles.statText}>{item.bookingsToday} today</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.light.textMuted} />
              <Text style={styles.statText}>{(item.completionRate ?? 0).toFixed(0)}% complete</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ReZ TRY Trials</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/try/merchant/create')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={trials}
          renderItem={renderTrial}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.primary}
            />
          }
          scrollIndicatorInsets={{ right: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  trialCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  trialImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
    flex: 1,
  },
  toggleButton: {
    padding: 4,
  },
  categoryRow: {
    marginTop: 6,
  },
  category: {
    fontSize: 12,
    color: Colors.light.textMuted,
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  coinPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  commitmentFee: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});
