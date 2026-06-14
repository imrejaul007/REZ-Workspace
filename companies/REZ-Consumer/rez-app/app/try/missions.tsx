import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface Mission {
  id: string;
  title: string;
  description: string;
  category?: string;
  categoryEmoji?: string;
  target: number;
  completed: number;
  reward: {
    rezCoins: number;
    trialCoins: number;
  };
  endsAt: string;
  isCompleted: boolean;
  isExpired: boolean;
}

interface ModalData {
  isVisible: boolean;
  mission: Mission | null;
}

export default function MissionsScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [modalData, setModalData] = useState<ModalData>({ isVisible: false, mission: null });

  const loadMissionsCallback = useCallback(() => {
    loadMissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMissionsCallback();
  }, [loadMissionsCallback]);

  // Refresh data when navigating back to this screen
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadMissionsCallback();
    }, [loadMissionsCallback]),
  );

  useEffect(() => {
    // Update time remaining every minute
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000);
    updateTimeRemaining();
    return () => clearInterval(interval);
  }, []);

  const updateTimeRemaining = () => {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    nextSunday.setHours(23, 59, 59, 999);

    const diff = nextSunday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    setTimeRemaining(`${days}d ${hours}h left`);
  };

  const loadMissions = useCallback(async () => {
    try {
      const data = await tryApi.getMissions();
      setMissions(data);
    } catch (err) {
      if (__DEV__) logger.error('Failed to load missions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const getProgressColor = (completed: number, target: number): string => {
    const percentage = (completed / target) * 100;
    if (percentage >= 100) return colors.successScale[500];
    if (percentage >= 50) return colors.warningScale[500];
    return colors.border.default;
  };

  const renderMissionCard = ({ item }: { item: Mission }) => (
    <Pressable
      style={styles.card}
      onPress={() => setModalData({ isVisible: true, mission: item })}
      accessibilityRole="button"
    >
      {/* Completed Overlay */}
      {item.isCompleted && (
        <View style={styles.completedOverlay}>
          <Ionicons name="checkmark-circle" size={48} color="#fff" />
          <Text style={styles.completedText}>COMPLETED ✓</Text>
        </View>
      )}

      {/* Expired State */}
      {item.isExpired && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>Expired</Text>
        </View>
      )}

      <View style={[styles.cardContent, (item.isCompleted || item.isExpired) && styles.cardContentDimmed]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.missionTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.category && (
              <Text style={styles.categoryTag}>
                {item.categoryEmoji} {item.category}
              </Text>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((item.completed / item.target) * 100, 100)}%`,
                  backgroundColor: getProgressColor(item.completed, item.target),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.completed} / {item.target} completed
          </Text>
        </View>

        {/* Reward */}
        <View style={styles.rewardSection}>
          <Text style={styles.rewardText}>
            🪙 {item.reward.rezCoins} ReZ Coins + {item.reward.trialCoins} Trial Coins on completion
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No missions this week</Text>
      <Text style={styles.emptySubtitle}>Check back Monday for fresh missions!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Weekly Missions</Text>
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
        <View style={styles.headerTitleSection}>
          <Text style={styles.headerTitle}>Weekly Missions</Text>
          <Text style={styles.headerSubtitle}>{timeRemaining}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={missions && Array.isArray(missions) ? missions : []}
        renderItem={renderMissionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<EmptyState />}
      />

      {/* Mission Detail Modal */}
      {modalData.isVisible && modalData.mission && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalData({ isVisible: false, mission: null })} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalData.mission.title}</Text>
              <Pressable onPress={() => setModalData({ isVisible: false, mission: null })} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {modalData.mission.description && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalText}>{modalData.mission.description}</Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Progress</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((modalData.mission.completed / modalData.mission.target) * 100, 100)}%`,
                        backgroundColor: getProgressColor(modalData.mission.completed, modalData.mission.target),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.modalText}>
                  {modalData.mission.completed} / {modalData.mission.target} completed
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Reward</Text>
                <Text style={styles.modalRewardText}>🪙 {modalData.mission.reward.rezCoins} ReZ Coins</Text>
                <Text style={styles.modalRewardText}>💎 {modalData.mission.reward.trialCoins} Trial Coins</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Expires</Text>
                <Text style={styles.modalText}>
                  {new Date(modalData.mission.endsAt).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setModalData({ isVisible: false, mission: null })}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  headerTitleSection: {
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
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  cardContentDimmed: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  categoryTag: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  progressSection: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  rewardSection: {
    backgroundColor: colors.tint.purple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rewardText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: spacing.md,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  expiredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expiredText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: colors.text.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modalRewardText: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  modalCloseButton: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.purple,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
