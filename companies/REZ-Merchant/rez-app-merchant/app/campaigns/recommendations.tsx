/**
 * CampaignRecommendationsScreen
 * AI-suggested campaign list with one-tap launch.
 * API: GET /api/merchant/campaign-recommendations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignRecommendation {
  id: string;
  campaignType: string;
  title: string;
  description: string;
  estimatedImpact: string;
  estimatedROI: number;
  suggestedBudget: number;
  targetSegment: string;
  urgency: 'high' | 'medium' | 'low';
  tags: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const urgencyColor = (u: string) => {
  switch (u) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    default:
      return '#10b981';
  }
};

const urgencyBg = (u: string) => {
  switch (u) {
    case 'high':
      return '#fee2e2';
    case 'medium':
      return '#fef3c7';
    default:
      return '#d1fae5';
  }
};

const formatCurrency = (n: number) =>
  `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CampaignRecommendationsScreen() {
  const [data, setData] = useState<CampaignRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get<CampaignRecommendation[]>(
        'merchant/campaign-recommendations'
      );
      if (res.success && res.data) {
        setData(Array.isArray(res.data) ? res.data : []);
      } else {
        throw new Error(res.message || 'Failed to load recommendations');
      }
    } catch (err) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleLaunch = useCallback(
    async (rec: CampaignRecommendation) => {
      Alert.alert(
        'Launch Campaign',
        `Launch "${rec.title}"?\n\nSuggested budget: ${formatCurrency(rec.suggestedBudget)}\nTarget: ${rec.targetSegment}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Launch',
            style: 'default',
            onPress: async () => {
              setLaunching(rec.id);
              try {
                const res = await apiClient.post('merchant/campaigns/launch-recommendation', {
                  recommendationId: rec.id,
                  budget: rec.suggestedBudget,
                  targetSegment: rec.targetSegment,
                });
                if (res.success) {
                  Alert.alert('Launched!', 'Your campaign has been created and is now running.');
                  await fetchData();
                } else {
                  throw new Error(res.message || 'Launch failed');
                }
              } catch (err) {
                Alert.alert('Launch Failed', err.message || 'Could not launch the campaign.');
              } finally {
                setLaunching(null);
              }
            },
          },
        ]
      );
    },
    [fetchData]
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* AI Header Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerIcon}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>AI-Powered Recommendations</Text>
            <Text style={styles.aiBannerSub}>Based on your sales data and customer behavior</Text>
          </View>
        </View>

        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No recommendations yet</Text>
            <Text style={styles.emptySubtitle}>
              The AI engine needs more transaction data to generate insights. Check back soon.
            </Text>
          </View>
        ) : (
          data.map((rec) => (
            <View key={rec.id} style={styles.recCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.urgencyBadge, { backgroundColor: urgencyBg(rec.urgency) }]}>
                    <Text style={[styles.urgencyText, { color: urgencyColor(rec.urgency) }]}>
                      {rec.urgency.toUpperCase()} PRIORITY
                    </Text>
                  </View>
                  <Text style={styles.campaignType}>{rec.campaignType}</Text>
                </View>
                <View style={styles.roiBadge}>
                  <Text style={styles.roiValue}>
                    {rec.estimatedROI >= 0 ? '+' : ''}
                    {rec.estimatedROI.toFixed(0)}%
                  </Text>
                  <Text style={styles.roiLabel}>Est. ROI</Text>
                </View>
              </View>

              {/* Title & Description */}
              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recDescription}>{rec.description}</Text>

              {/* Impact */}
              <View style={styles.impactRow}>
                <Ionicons name="trending-up" size={14} color="#10b981" />
                <Text style={styles.impactText}>{rec.estimatedImpact}</Text>
              </View>

              {/* Details Row */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={14} color="#9ca3af" />
                  <Text style={styles.detailText}>{rec.targetSegment}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={14} color="#9ca3af" />
                  <Text style={styles.detailText}>
                    Budget: {formatCurrency(rec.suggestedBudget)}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              {rec.tags && rec.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {rec.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Launch Button */}
              <TouchableOpacity
                style={[styles.launchBtn, launching === rec.id && styles.launchBtnDisabled]}
                onPress={() => handleLaunch(rec)}
                disabled={launching === rec.id}
              >
                {launching === rec.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={16} color="#fff" />
                    <Text style={styles.launchBtnText}>Launch this campaign</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // AI Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  aiBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  aiBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

  // Recommendation Card
  recCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: { gap: 6 },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  urgencyText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  campaignType: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  roiBadge: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roiValue: { fontSize: 16, fontWeight: '700', color: '#059669' },
  roiLabel: { fontSize: 10, color: '#059669', marginTop: 1 },

  recTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  recDescription: { fontSize: 13, color: '#6b7280', lineHeight: 19, marginBottom: 10 },

  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  impactText: { fontSize: 13, color: '#10b981', fontWeight: '600' },

  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#6b7280' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tag: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#6366f1', fontWeight: '500' },

  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  launchBtnDisabled: { opacity: 0.5 },
  launchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
