import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trialsService, TrialAnalytics } from '@/services/api/trials';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { trialId } = useLocalSearchParams<{ trialId?: string }>();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<TrialAnalytics | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await trialsService.getAnalytics(trialId);
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      logger.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#8B5CF6', '#A78BFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TRY Analytics</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#8B5CF6', '#A78BFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TRY Analytics</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={64} color={Colors.light.textMuted} />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>Create and complete trials to see analytics</Text>
        </View>
      </View>
    );
  }

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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TRY Analytics</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Bookings</Text>
            <Text style={styles.cardValue}>{analytics.totalBookings}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Completion Rate</Text>
            <Text style={styles.cardValue}>{analytics.completionRate}%</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Completions</Text>
            <Text style={styles.cardValue}>{analytics.totalCompletions}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Avg Reward Value</Text>
            <Text style={styles.cardValue}>₹{analytics.averageRewardValue}</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Today Bookings</Text>
            <Text style={styles.cardValue}>{analytics.todayBookings}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>This Week</Text>
            <Text style={styles.cardValue}>{analytics.thisWeekBookings}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
