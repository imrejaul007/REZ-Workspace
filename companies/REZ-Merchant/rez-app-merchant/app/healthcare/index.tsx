/**
 * Healthcare Dashboard
 * Main entry screen for healthcare operations features
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';

// Polling interval in milliseconds
const POLLING_INTERVAL = 30000;

interface HealthcareFeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  badge?: string;
}

const HealthcareFeatureCard: React.FC<HealthcareFeatureCardProps> = ({
  title,
  description,
  icon,
  route,
  color,
  badge,
}) => (
  <TouchableOpacity
    style={styles.featureCard}
    onPress={() => router.push(route)}
    activeOpacity={0.8}
  >
    <Card variant="elevated" padding="md" style={styles.cardContent}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.cardTextContainer}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
    </Card>
  </TouchableOpacity>
);

export default function HealthcareIndexScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingPrescriptions: 0,
    activeTelemedicine: 0,
  });

  // Fetch healthcare overview data
  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStats({
        totalPatients: 156,
        todayAppointments: 12,
        pendingPrescriptions: 8,
        activeTelemedicine: 3,
      });
    } catch (error) {
      console.error('[HealthcareIndex] fetchOverview error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and polling setup
  React.useEffect(() => {
    fetchOverview();
    const pollingInterval = setInterval(() => {
      fetchOverview();
    }, POLLING_INTERVAL);
    return () => clearInterval(pollingInterval);
  }, [fetchOverview]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOverview(true);
  }, [fetchOverview]);

  const features = [
    {
      title: 'Patients',
      description: 'Manage patient records and profiles',
      icon: 'people-outline' as const,
      route: '/healthcare/patients',
      color: Colors.light.primary,
      badge: stats.totalPatients > 0 ? stats.totalPatients.toString() : undefined,
    },
    {
      title: 'Appointments',
      description: 'View and manage appointment calendar',
      icon: 'calendar-outline' as const,
      route: '/healthcare/appointments',
      color: Colors.light.info,
      badge: stats.todayAppointments > 0 ? stats.todayAppointments.toString() : undefined,
    },
    {
      title: 'Prescriptions',
      description: 'Manage and issue prescriptions',
      icon: 'document-text-outline' as const,
      route: '/healthcare/prescriptions',
      color: Colors.light.success,
      badge: stats.pendingPrescriptions > 0 ? stats.pendingPrescriptions.toString() : undefined,
    },
    {
      title: 'Telemedicine',
      description: 'Virtual consultations and video calls',
      icon: 'videocam-outline' as const,
      route: '/healthcare/telemedicine',
      color: Colors.light.tertiary,
      badge: stats.activeTelemedicine > 0 ? stats.activeTelemedicine.toString() : undefined,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.light.primaryLight2, Colors.light.background, Colors.light.background]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.greeting}>Healthcare</Text>
          <Text style={styles.subtitle}>
            {activeStore?.name || 'Your Clinic'} - Management Dashboard
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            {loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={styles.statValue}>{stats.totalPatients}</Text>
            )}
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statCard}>
            {loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={styles.statValue}>{stats.todayAppointments}</Text>
            )}
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            {loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={styles.statValue}>{stats.pendingPrescriptions}</Text>
            )}
            <Text style={styles.statLabel}>Rx Pending</Text>
          </View>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Features</Text>
          {features.map((feature) => (
            <HealthcareFeatureCard key={feature.title} {...feature} />
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.light.primary }]}
              onPress={() => router.push('/healthcare/appointments')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>New Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
              onPress={() => router.push('/healthcare/patients')}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Patient</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
    marginTop: 8,
  },
  featureCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
