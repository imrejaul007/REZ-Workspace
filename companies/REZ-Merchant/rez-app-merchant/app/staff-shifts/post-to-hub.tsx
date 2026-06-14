/**
 * PostToHubScreen
 *
 * Surfaces a "Post Gap to RestaurantHub" action when there are unfilled
 * shifts within the next 24 h. Calls POST /auth/rez-bridge to exchange the
 * REZ token for a RestaurantHub JWT, then calls POST /jobs/sync-shifts.
 * Shows a result summary and offers to open RestaurantHub in a browser.
 *
 * Route: /staff-shifts/post-to-hub
 * Link from: staff-shifts/index.tsx via router.push
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { hubSyncService } from '@/services/api/hubSync';
import type { HubSyncResult } from '@/services/api/hubSync';
import { useAuth } from '@/contexts/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const RESTAURANTHUB_JOBS_URL =
  (process.env.EXPO_PUBLIC_RESTAURANTHUB_WEB_URL as string | undefined) ??
  'https://restauranthub.app/jobs';

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PostToHubScreen() {
  const insets = useSafeAreaInsets();
  const { token: rezToken, merchant } = useAuth();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HubSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePostToHub = useCallback(async () => {
    if (!rezToken) {
      Alert.alert('Not logged in', 'Please log in to use this feature.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const syncData = await hubSyncService.syncShifts(rezToken);
      setResult(syncData);
    } catch (err) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [rezToken]);

  const openRestaurantHub = useCallback(() => {
    Linking.openURL(RESTAURANTHUB_JOBS_URL).catch(() => {
      Alert.alert('Cannot open browser', 'Please visit restauranthub.app/jobs manually.');
    });
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post to RestaurantHub</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="briefcase-outline"
            size={32}
            color={Colors.light.tint}
            style={styles.infoIcon}
          />
          <Text style={styles.infoTitle}>Fill open shifts faster</Text>
          <Text style={styles.infoBody}>
            Shift gaps detected in your roster will be posted as draft job listings on
            RestaurantHub. Review and publish them to reach candidates immediately.
          </Text>
        </View>

        {/* Primary CTA */}
        {!result && (
          <TouchableOpacity
            style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
            onPress={handlePostToHub}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.light.card} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.light.card} />
                <Text style={styles.ctaText}>Post Gap to RestaurantHub</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.light.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              <Text style={styles.resultTitle}>
                {result.draftsCreated} job draft{result.draftsCreated !== 1 ? 's' : ''} created on
                RestaurantHub
              </Text>
            </View>

            {result.jobs.map((job) => (
              <View key={job.id} style={styles.jobRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.light.icon} />
                <Text style={styles.jobTitle}>{job.title}</Text>
                {job.rezShiftDate && <Text style={styles.jobDate}>{job.rezShiftDate}</Text>}
              </View>
            ))}

            <Text style={styles.resultHint}>
              These drafts are pending — tap below to review and publish them.
            </Text>

            <TouchableOpacity style={styles.reviewButton} onPress={openRestaurantHub}>
              <Ionicons name="open-outline" size={16} color={Colors.light.tint} />
              <Text style={styles.reviewButtonText}>Review on RestaurantHub</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryLink} onPress={handlePostToHub}>
              <Text style={styles.retryLinkText}>Sync again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: Colors.light.card },

  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },

  infoCard: {
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: `${Colors.light.tint}25`,
  },
  infoIcon: { marginBottom: 4 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, textAlign: 'center' },
  infoBody: { fontSize: 13, color: Colors.light.icon, textAlign: 'center', lineHeight: 20 },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingVertical: 15,
  },
  ctaButtonDisabled: { opacity: 0.65 },
  ctaText: { fontSize: 16, fontWeight: '700', color: Colors.light.card },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { flex: 1, fontSize: 13, color: '#ef4444', lineHeight: 20 },

  resultCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.light.text },

  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  jobTitle: { flex: 1, fontSize: 13, color: Colors.light.text },
  jobDate: { fontSize: 12, color: Colors.light.icon },

  resultHint: { fontSize: 12, color: Colors.light.icon, lineHeight: 18 },

  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  reviewButtonText: { fontSize: 14, fontWeight: '600', color: Colors.light.tint },

  retryLink: { alignItems: 'center', paddingVertical: 4 },
  retryLinkText: { fontSize: 13, color: Colors.light.icon, textDecorationLine: 'underline' },
});
