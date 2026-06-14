// Notifications Preferences Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, MessageCircle, Wallet, Star, Gift, Calendar, Shield, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore, useUIStore } from '@/stores';
import { Card } from '@/components/Card';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface NotificationPreferences {
  push: boolean;
  bookingReminders: boolean;
  walletUpdates: boolean;
  dealsAndOffers: boolean;
  karmaUpdates: boolean;
  chatMessages: boolean;
}

export default function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { token, profile } = useUserStore();
  const { hapticEnabled, soundEnabled, setHapticEnabled, setSoundEnabled } = useUIStore();
  const { status: biometricStatus, canUseBiometric } = useBiometricAuth();

  const API_URL = process.env.EXPO_PUBLIC_DO_API_URL || 'http://localhost:3000';

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push: true,
    bookingReminders: true,
    walletUpdates: true,
    dealsAndOffers: true,
    karmaUpdates: true,
    chatMessages: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({
            push: data.preferences.push ?? true,
            bookingReminders: data.preferences.bookingReminders ?? true,
            walletUpdates: data.preferences.walletUpdates ?? true,
            dealsAndOffers: data.preferences.dealsAndOffers ?? true,
            karmaUpdates: data.preferences.karmaUpdates ?? true,
            chatMessages: data.preferences.chatMessages ?? true,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (updated: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updated };
    setPreferences(newPrefs);
    setSaving(true);

    if (!token) {
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/preferences`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    savePreferences({ [key]: !preferences[key] });
  };

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    value,
    onToggle,
  }: {
    icon;
    title: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon size={20} color={colors.label} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.label }]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.labelSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.fill, true: colors.primary + '60' }}
        thumbColor={value ? colors.primary : colors.gray3}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing.screenPadding }]}>
        <View style={styles.headerRow}>
          <ChevronLeft
            size={24}
            color={colors.label}
            onPress={() => router.back()}
          />
          <Text style={[styles.headerTitle, { color: colors.label }]}>
            Notifications
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Types */}
        <View style={{ paddingHorizontal: spacing.screenPadding }}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            NOTIFICATION TYPES
          </Text>
        </View>

        <Card variant="default" padding="none" style={{ marginHorizontal: spacing.screenPadding, marginTop: 8 }}>
          <SettingRow
            icon={Bell}
            title="Push Notifications"
            description="Receive all notifications"
            value={preferences.push}
            onToggle={() => togglePreference('push')}
          />

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <SettingRow
            icon={Calendar}
            title="Booking Reminders"
            description="Get reminded before your bookings"
            value={preferences.bookingReminders}
            onToggle={() => togglePreference('bookingReminders')}
          />

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <SettingRow
            icon={Wallet}
            title="Wallet Updates"
            description="Coins earned and spent"
            value={preferences.walletUpdates}
            onToggle={() => togglePreference('walletUpdates')}
          />

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <SettingRow
            icon={Gift}
            title="Deals & Offers"
            description="Promotions and special offers"
            value={preferences.dealsAndOffers}
            onToggle={() => togglePreference('dealsAndOffers')}
          />

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <SettingRow
            icon={Star}
            title="Karma Updates"
            description="Tier upgrades and achievements"
            value={preferences.karmaUpdates}
            onToggle={() => togglePreference('karmaUpdates')}
          />

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <SettingRow
            icon={MessageCircle}
            title="Chat Messages"
            description="Messages from venues"
            value={preferences.chatMessages}
            onToggle={() => togglePreference('chatMessages')}
          />
        </Card>

        {/* App Settings */}
        <View style={{ paddingHorizontal: spacing.screenPadding, marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            APP SETTINGS
          </Text>
        </View>

        <Card variant="default" padding="none" style={{ marginHorizontal: spacing.screenPadding, marginTop: 8 }}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={{ fontSize: 20 }}>📳</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.label }]}>
                Haptic Feedback
              </Text>
              <Text style={[styles.settingDescription, { color: colors.labelSecondary }]}>
                Vibration on interactions
              </Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={setHapticEnabled}
              trackColor={{ false: colors.fill, true: colors.primary + '60' }}
              thumbColor={hapticEnabled ? colors.primary : colors.gray3}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={{ fontSize: 20 }}>🔊</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.label }]}>
                Sound Effects
              </Text>
              <Text style={[styles.settingDescription, { color: colors.labelSecondary }]}>
                Audio feedback
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.fill, true: colors.primary + '60' }}
              thumbColor={soundEnabled ? colors.primary : colors.gray3}
            />
          </View>

          {/* Biometric Login Setting */}
          {canUseBiometric() && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.separator }]} />
              <View
                style={styles.settingRow}
                onTouchEnd={() => router.push('/settings/biometric')}
              >
                <View style={styles.settingIcon}>
                  <Shield size={20} color={colors.label} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.label }]}>
                    Biometric Login
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.labelSecondary }]}>
                    {biometricStatus.isEnabled
                      ? `${biometricStatus.biometricType ?? 'Biometric'} enabled`
                      : 'Enable for quick access'}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.labelSecondary} />
              </View>
            </>
          )}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    marginLeft: 60,
  },
});
