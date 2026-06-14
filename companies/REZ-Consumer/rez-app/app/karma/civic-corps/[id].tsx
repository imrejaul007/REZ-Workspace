/**
 * Mission Detail Screen
 * Shows mission details and allows enrollment/check-in/completion.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export default withErrorBoundary(function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<NBKCMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchMission = useCallback(async () => {
    if (!id) return;
    try {
      const res = await nbkcService.getMission(id);
      if (res.success && res.data) {
        setMission(res.data);
      }
    } catch (e) {
      showAlert('Error', 'Failed to load mission');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  const handleEnroll = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await nbkcService.enrollInMission(id);
      if (res.success) {
        setEnrolled(true);
        showAlert('Enrolled!', 'You have been enrolled in this mission.');
      } else {
        showAlert('Enrollment Failed', res.message ?? 'Please try again.');
      }
    } catch (e) {
      showAlert('Error', 'Failed to enroll. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await nbkcService.checkInToMission(id);
      if (res.success) {
        setCheckedIn(true);
        showAlert('Checked In!', 'Remember to check out when you finish the mission.');
      } else {
        showAlert('Check-in Failed', res.message ?? 'Please try again.');
      }
    } catch (e) {
      showAlert('Error', 'Check-in failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = () => {
    if (!id) return;
    Alert.prompt(
      'Complete Mission',
      'How many hours did you volunteer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (hoursStr) => {
            const hours = parseFloat(hoursStr ?? '0');
            if (isNaN(hours) || hours < 0.5) {
              showAlert('Invalid', 'Please enter at least 0.5 hours.');
              return;
            }
            setActionLoading(true);
            try {
              const res = await nbkcService.completeMission(id, hours);
              if (res.success && res.data) {
                Alert.alert(
                  'Mission Complete!',
                  `You earned ${res.data.karmaEarned} karma and ${res.data.greenEarned} green score!`,
                  [{ text: 'OK', onPress: () => router.back() }],
                );
              } else {
                showAlert('Error', res.message ?? 'Failed to complete mission.');
              }
            } catch (e) {
              showAlert('Error', 'Failed to complete. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      'plain-text',
      '1',
      'decimal-pad',
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <NBKCHeader title="Mission" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={styles.container}>
        <NBKCHeader title="Mission" showBack />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorText}>Mission not found</Text>
        </View>
      </View>
    );
  }

  const cat = CATEGORY_CONFIG[mission.category] ?? CATEGORY_CONFIG.civic;
  const diffColor = DIFFICULTY_COLOR[mission.difficulty] ?? '#6B7280';
  const spotsLeft = mission.maxVolunteers - mission.currentVolunteers;
  const scheduledDate = new Date(mission.scheduledAt);

  return (
    <View style={styles.container}>
      <NBKCHeader title="Mission" subtitle={mission.name} showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Category & Difficulty */}
        <View style={styles.badgesRow}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon as unknown} size={14} color={cat.color} />
            <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
            <Text style={[styles.diffBadgeText, { color: diffColor }]}>
              {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
            </Text>
          </View>
          {mission.ward && (
            <View style={styles.wardBadge}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.wardBadgeText}>{mission.ward}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>{mission.description}</Text>

        {/* Impact */}
        {mission.impact && (
          <View style={styles.impactCard}>
            <Ionicons name="sparkles" size={18} color="#059669" />
            <Text style={styles.impactText}>{mission.impact}</Text>
          </View>
        )}

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#059669" />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#059669" />
            <Text style={styles.infoLabel}>Spots</Text>
            <Text style={[styles.infoValue, { color: spotsLeft > 3 ? '#059669' : '#EF4444' }]}>
              {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="leaf" size={20} color="#059669" />
            <Text style={styles.infoLabel}>Karma</Text>
            <Text style={[styles.infoValue, { color: '#059669', fontWeight: '700' }]}>+{mission.karmaReward}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={20} color="#10B981" />
            <Text style={styles.infoLabel}>Green</Text>
            <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '700' }]}>+{mission.greenScoreReward}</Text>
          </View>
        </View>

        {/* Requirements */}
        {mission.requirements && mission.requirements.length > 0 && (
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {mission.requirements.map((req, i) => (
              <View key={i} style={styles.reqRow}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.reqText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Meeting Point */}
        {mission.meetingPoint && (
          <View style={styles.meetingCard}>
            <Ionicons name="location" size={18} color="#059669" />
            <View>
              <Text style={styles.meetingTitle}>Meeting Point</Text>
              <Text style={styles.meetingText}>{mission.meetingPoint}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Button */}
      {mission.status === 'active' && spotsLeft > 0 && (
        <View style={styles.actionBar}>
          {!enrolled ? (
            <Pressable
              style={[styles.actionBtn, actionLoading && styles.actionBtnDisabled]}
              onPress={handleEnroll}
              disabled={actionLoading}
            >
              <LinearGradient colors={['#047857', '#059669', '#10B981']} style={styles.actionBtnGradient}>
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Enroll in Mission</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          ) : !checkedIn ? (
            <Pressable
              style={[styles.actionBtn, actionLoading && styles.actionBtnDisabled]}
              onPress={handleCheckIn}
              disabled={actionLoading}
            >
              <LinearGradient colors={['#047857', '#059669', '#10B981']} style={styles.actionBtnGradient}>
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="location" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Check In</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.actionBtn, actionLoading && styles.actionBtnDisabled]}
              onPress={handleComplete}
              disabled={actionLoading}
            >
              <LinearGradient colors={['#047857', '#059669', '#10B981']} style={styles.actionBtnGradient}>
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Complete Mission</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}, 'MissionDetail');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.base },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base },
  bottomPadding: { height: 100 },
  errorText: { ...Typography.body, color: '#9CA3AF', marginTop: Spacing.sm },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.base },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  catBadgeText: { ...Typography.bodySmall, fontWeight: '600' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffBadgeText: { ...Typography.bodySmall, fontWeight: '600' },
  wardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wardBadgeText: { ...Typography.bodySmall, color: '#6B7280' },
  description: { ...Typography.body, color: colors.text.primary, lineHeight: 24, marginBottom: Spacing.base },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: 10,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  impactText: { ...Typography.body, color: '#065F46', flex: 1, lineHeight: 22 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  infoItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: { ...Typography.bodySmall, color: '#9CA3AF', marginTop: 4 },
  infoValue: { ...Typography.body2, fontWeight: '600', color: colors.text.primary, marginTop: 2 },
  sectionTitle: { ...Typography.h4, color: colors.text.primary, marginBottom: Spacing.sm },
  requirementsSection: { marginBottom: Spacing.base },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  reqText: { ...Typography.body, color: '#374151', flex: 1 },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  meetingTitle: { ...Typography.body2, fontWeight: '600', color: colors.text.primary },
  meetingText: { ...Typography.body, color: '#6B7280', marginTop: 2 },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionBtnText: { color: '#fff', ...Typography.h4, fontWeight: '700' },
});
