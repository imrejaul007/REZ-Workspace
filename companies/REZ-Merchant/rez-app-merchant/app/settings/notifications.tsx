/**
 * Sprint 15: Notification Preferences Screen
 * Fetches/saves merchant notification preferences.
 * Toggles for push and email notification types with a save button + success toast.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { notificationsService } from '@/services/api/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrefsState {
  newOrderPush: boolean;
  checkInPush: boolean;
  dailySummaryEmail: boolean;
  weeklyDigestEmail: boolean;
  lowInventoryAlert: boolean;
  payoutProcessed: boolean;
}

const DEFAULT_PREFS: PrefsState = {
  newOrderPush: true,
  checkInPush: true,
  dailySummaryEmail: false,
  weeklyDigestEmail: false,
  lowInventoryAlert: true,
  payoutProcessed: true,
};

// ─── Toggle Row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconBg, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={rowStyles.textWrap}>
        <ThemedText style={rowStyles.title}>{title}</ThemedText>
        <ThemedText style={rowStyles.subtitle}>{subtitle}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
        thumbColor={value ? '#7C3AED' : '#9CA3AF'}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Toast animation
  const toastOpacity = React.useRef(new Animated.Value(0)).current;

  const showToast = () => {
    toastOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  // Map API preferences → local state
  const mapApiToState = (apiPrefs): PrefsState => {
    const cats = apiPrefs?.categories ?? {};
    return {
      newOrderPush: cats?.order?.channels?.push?.enabled ?? true,
      checkInPush: cats?.system?.channels?.push?.enabled ?? true,
      dailySummaryEmail: apiPrefs?.dailyDigest?.enabled ?? false,
      weeklyDigestEmail: apiPrefs?.weeklyDigest?.enabled ?? false,
      lowInventoryAlert: cats?.inventory?.channels?.push?.enabled ?? true,
      payoutProcessed: cats?.payment?.channels?.push?.enabled ?? true,
    };
  };

  // Map local state → API patch payload
  const mapStateToApi = (state: PrefsState) => ({
    categories: {
      order: { channels: { push: { enabled: state.newOrderPush } } },
      system: { channels: { push: { enabled: state.checkInPush } } },
      inventory: { channels: { push: { enabled: state.lowInventoryAlert } } },
      payment: { channels: { push: { enabled: state.payoutProcessed } } },
    },
    dailyDigest: { enabled: state.dailySummaryEmail },
    weeklyDigest: { enabled: state.weeklyDigestEmail },
  });

  const loadPrefs = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiPrefs = await notificationsService.getNotificationPreferences();
      setPrefs(mapApiToState(apiPrefs));
    } catch {
      // Use defaults on error — non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const handleToggle = (key: keyof PrefsState) => (value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await notificationsService.updateNotificationPreferences(mapStateToApi(prefs) as unknown as Record<string, unknown>);
      setIsDirty(false);
      showToast();
    } catch {
      // In production, show an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <ThemedText style={styles.navTitle}>Notification Preferences</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <ThemedText style={styles.loadingText}>Loading preferences...</ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Push Notifications section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={16} color="#7C3AED" />
              <ThemedText style={styles.sectionTitle}>Push Notifications</ThemedText>
            </View>
            <View style={styles.sectionBody}>
              <ToggleRow
                icon="receipt-outline"
                iconColor="#6366F1"
                title="New order alerts"
                subtitle="Get notified instantly for every new order"
                value={prefs.newOrderPush}
                onChange={handleToggle('newOrderPush')}
              />
              <ToggleRow
                icon="qr-code-outline"
                iconColor="#10B981"
                title="New customer check-in"
                subtitle="Alert when a customer scans your QR code"
                value={prefs.checkInPush}
                onChange={handleToggle('checkInPush')}
              />
              <ToggleRow
                icon="warning-outline"
                iconColor="#F59E0B"
                title="Low inventory alerts"
                subtitle="Notify when stock falls below threshold"
                value={prefs.lowInventoryAlert}
                onChange={handleToggle('lowInventoryAlert')}
              />
              <ToggleRow
                icon="card-outline"
                iconColor="#10B981"
                title="Payout processed"
                subtitle="Alert when a payout is sent to your account"
                value={prefs.payoutProcessed}
                onChange={handleToggle('payoutProcessed')}
              />
            </View>
          </View>

          {/* Email Notifications section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="mail" size={16} color="#3B82F6" />
              <ThemedText style={styles.sectionTitle}>Email Notifications</ThemedText>
            </View>
            <View style={styles.sectionBody}>
              <ToggleRow
                icon="today-outline"
                iconColor="#3B82F6"
                title="Daily summary email"
                subtitle="Receive a daily recap of orders and revenue"
                value={prefs.dailySummaryEmail}
                onChange={handleToggle('dailySummaryEmail')}
              />
              <ToggleRow
                icon="bar-chart-outline"
                iconColor="#8B5CF6"
                title="Weekly analytics digest"
                subtitle="Weekly insights and performance report"
                value={prefs.weeklyDigestEmail}
                onChange={handleToggle('weeklyDigestEmail')}
              />
            </View>
          </View>

          {/* Save button */}
          <View style={styles.saveWrap}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !isDirty}
              style={[styles.saveBtn, (!isDirty || isSaving) && styles.saveBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Save preferences"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.saveBtnText}>Save Preferences</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Success Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        <ThemedText style={styles.toastText}>Preferences saved</ThemedText>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: {
    color: '#6B7280',
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {},
  saveWrap: {
    padding: 20,
    paddingBottom: 40,
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
