// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/apiClient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const STORAGE_KEY = 'rez_notification_preferences';

interface NotificationPreferences {
  streakReminders: boolean;
  coinEarnedAlerts: boolean;
  cashbackAlerts: boolean;
  orderUpdates: boolean;
  offersAndDeals: boolean;
}

const defaultPrefs: NotificationPreferences = {
  streakReminders: true,
  coinEarnedAlerts: true,
  cashbackAlerts: true,
  orderUpdates: true,
  offersAndDeals: false,
};

function NotificationPreferencesScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && isMounted()) {
        setPrefs({ ...defaultPrefs, ...JSON.parse(stored) });
      }
    } catch {
      // Fall back to defaults
    } finally {
      if (isMounted()) setLoading(false);
    }
  };

  const updatePref = async (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    try {
      setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Sync preferences to backend (fire-and-forget, backend may not yet support all keys)
      apiClient.put('/notifications/preferences', updated).catch(() => {});

      if (isMounted()) {
        setShowSuccess(true);
        setTimeout(() => {
          if (isMounted()) setShowSuccess(false);
        }, 2000);
      }
    } catch {
      // Revert on storage failure
      if (isMounted()) setPrefs(prefs);
    } finally {
      if (isMounted()) setSaving(false);
    }
  };

  const renderToggle = (
    label: string,
    description: string,
    key: keyof NotificationPreferences,
    iconName: React.ComponentProps<typeof Ionicons>['name'],
    iconColor: string,
  ) => (
    <View style={styles.prefRow} key={key}>
      <View style={[styles.prefIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.prefText}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefDescription}>{description}</Text>
      </View>
      <Switch
        value={prefs[key]}
        onValueChange={(v) => updatePref(key, v)}
        disabled={saving}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: prefs[key], disabled: saving }}
        trackColor={{ false: colors.border.default, true: Colors.info }}
        thumbColor={prefs[key] ? colors.background.primary : colors.background.secondary}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.info} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Notification Preferences
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }] as unknown}
      >
        <Text style={styles.sectionDesc}>Choose which notifications you receive from REZ.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={22} color="#F59E0B" />
            <Text style={styles.cardTitle}>Streaks & Rewards</Text>
          </View>

          {renderToggle(
            'Streak Reminders',
            'Get reminded to check in before your streak resets',
            'streakReminders',
            'flame',
            '#F59E0B',
          )}

          {renderToggle(
            'Coin Earned Alerts',
            'Be notified each time you earn REZ coins',
            'coinEarnedAlerts',
            'diamond',
            '#F59E0B',
          )}

          {renderToggle(
            'Cashback Alerts',
            'Know instantly when cashback is credited to your wallet',
            'cashbackAlerts',
            'cash',
            '#10B981',
          )}
        </View>

        <View style={[styles.card, { marginTop: Spacing.base }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront" size={22} color={Colors.info} />
            <Text style={styles.cardTitle}>Orders & Offers</Text>
          </View>

          {renderToggle(
            'Order Updates',
            'Track your orders — confirmed, dispatched, and delivered',
            'orderUpdates',
            'bag-handle',
            Colors.info,
          )}

          {renderToggle(
            'Offers & Deals',
            'Personalised deals and limited-time offers near you',
            'offersAndDeals',
            'pricetag',
            '#EC4899',
          )}
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.toast}>
          <ActivityIndicator size="small" color={colors.text.inverse} />
          <Text style={styles.toastText}>Saving...</Text>
        </View>
      )}

      {showSuccess && !saving && (
        <View style={[styles.toast, { backgroundColor: Colors.success }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.text.inverse} />
          <Text style={styles.toastText}>Saved!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  sectionDesc: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginBottom: Spacing.base,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  cardTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: Spacing.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  prefText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  prefLabel: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '500',
  },
  prefDescription: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: Colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});

export default withErrorBoundary(NotificationPreferencesScreen, 'NotificationPreferences');
