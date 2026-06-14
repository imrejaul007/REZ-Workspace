/**
 * Merchant — Trial Detail Screen
 * Route: /try/merchant/[id]
 *
 * Shows full details of a single trial offer with quick actions:
 *   • Pause / Resume toggle
 *   • Go to QR Scanner
 *   • View Analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  Switch,
} from 'react-native';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trialsService, TrialOffer } from '@/services/api/trials';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending_approval: { bg: '#FFFBEB', text: '#F59E0B', label: 'Pending Approval' },
  active: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
  paused: { bg: '#E5E7EB', text: '#6B7280', label: 'Paused' },
  rejected: { bg: '#FEE2E2', text: '#EF4444', label: 'Rejected' },
};

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function TrialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [trial, setTrial] = useState<TrialOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loadTrial = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      // The trials list endpoint is the only one available — fetch all and find by id
      const response = await trialsService.getTrials({ limit: 100 });
      if (response.success && response.data) {
        const found = (response.data.trials || []).find((t: TrialOffer) => t._id === id);
        setTrial(found ?? null);
      }
    } catch (err) {
      logger.error('[TrialDetail] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrial();
  }, [loadTrial]);

  const handleToggle = async () => {
    if (!trial) return;
    if (trial.status === 'pending_approval' || trial.status === 'rejected') {
      platformAlertSimple('Cannot toggle', 'Only active or paused trials can be toggled.');
      return;
    }
    const next = trial.status === 'active' ? 'paused' : 'active';
    platformAlertConfirm(
      `${next === 'active' ? 'Resume' : 'Pause'} trial?`,
      `Are you sure you want to ${next === 'active' ? 'resume' : 'pause'} "${trial.title}"?`,
      async () => {
        setToggling(true);
        try {
          const response = await trialsService.updateTrialStatus(trial._id, next);
          if (response.success) {
            setTrial((prev) => (prev ? { ...prev, status: next } : prev));
          } else {
            platformAlertSimple('Error', response.message || 'Failed to update status');
          }
        } catch {
          platformAlertSimple('Error', 'Network error. Please try again.');
        } finally {
          setToggling(false);
        }
      },
      next === 'active' ? 'Resume' : 'Pause'
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!trial) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textMuted} />
        <Text style={styles.notFoundText}>Trial not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = STATUS_COLORS[trial.status] ?? STATUS_COLORS.paused;
  const canToggle = trial.status === 'active' || trial.status === 'paused';
  const isActive = trial.status === 'active';

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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trial.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        {trial.images && trial.images.length > 0 ? (
          <Image
            source={{ uri: trial.images[0].url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="image-outline" size={48} color={Colors.light.textMuted} />
          </View>
        )}

        {/* Status + toggle row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
          </View>
          {canToggle && (
            <View style={styles.toggleRow}>
              {toggling ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <>
                  <Text style={styles.toggleLabel}>{isActive ? 'Active' : 'Paused'}</Text>
                  <Switch
                    value={isActive}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor="#fff"
                  />
                </>
              )}
            </View>
          )}
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => router.push('/try/merchant/scanner')}
          >
            <Ionicons name="qr-code" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => router.push(`/try/merchant/analytics?trialId=${trial._id}`)}
          >
            <Ionicons name="bar-chart" size={20} color="#8B5CF6" />
            <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Stats summary */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{trial.bookingsToday}</Text>
            <Text style={styles.statLabel}>Today's Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(trial.completionRate ?? 0).toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{trial.dailySlots}</Text>
            <Text style={styles.statLabel}>Daily Slots</Text>
          </View>
        </View>

        {/* Pricing section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <InfoRow label="Original Price" value={`₹${trial.originalPrice}`} />
          <InfoRow label="Trial Coin Price" value={`${trial.trialCoinPrice} coins`} />
          <InfoRow label="Commitment Fee" value={`₹${trial.commitmentFee}`} />
        </View>

        {/* QR & Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR & Scheduling</Text>
          <InfoRow label="QR Window Type" value={trial.qrWindowType} />
          <InfoRow label="QR Window Duration" value={`${trial.qrWindowMinutes} min`} />
          <InfoRow label="Daily Slots" value={trial.dailySlots} />
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Rewards</Text>
          <InfoRow label="ReZ Coins Earned" value={`${trial.rewardCoins} 🪙`} />
          <InfoRow
            label="Branded Coins Earned"
            value={`${trial.brandedCoins} ${trial.brandedCoinLabel || 'coins'}`}
          />
        </View>

        {/* Category & Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classification</Text>
          <InfoRow label="Category" value={trial.category} />
          {trial.status === 'rejected' && trial.rejectionReason && (
            <View style={styles.rejectionBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.rejectionText}>{trial.rejectionReason}</Text>
            </View>
          )}
        </View>

        {/* Terms */}
        {trial.terms ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{trial.terms}</Text>
          </View>
        ) : null}

        {/* Upsell links */}
        {trial.upsellLinks && trial.upsellLinks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upsell Links</Text>
            {trial.upsellLinks.map((link, i) => (
              <View key={i} style={styles.upsellRow}>
                <Ionicons name="link" size={14} color="#8B5CF6" />
                <Text style={styles.upsellTitle}>{link.title}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroPlaceholder: {
    backgroundColor: Colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    color: Colors.light.textHeading,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnPrimary: {
    backgroundColor: '#8B5CF6',
  },
  actionBtnSecondary: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  section: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 18,
  },
  termsText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    lineHeight: 18,
  },
  upsellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  upsellTitle: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.textMuted,
    marginTop: 8,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
