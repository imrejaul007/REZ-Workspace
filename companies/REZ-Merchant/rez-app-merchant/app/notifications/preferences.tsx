import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/utils/alert';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/queries/useNotifications';
import {
  NotificationType,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from '@/types/notifications';
import { Colors } from '@/constants/DesignTokens';

/**
 * InAppSettings — MER-HIGH-02 fix: typed interface for in-app notification settings.
 * The backend returns this nested object but it's not in NotificationPreferences.
 */
interface InAppSettings {
  sound?: boolean;
  vibration?: boolean;
  badgeCount?: boolean;
}

const NOTIFICATION_CATEGORIES = [
  { type: NotificationType.ORDER, label: 'Order Notifications', icon: 'cart' },
  { type: NotificationType.PRODUCT, label: 'Product Notifications', icon: 'cube' },
  { type: NotificationType.TEAM, label: 'Team Notifications', icon: 'people' },
  { type: NotificationType.SYSTEM, label: 'System Notifications', icon: 'settings' },
  { type: NotificationType.CASHBACK, label: 'Cashback Notifications', icon: 'cash' },
  { type: NotificationType.PAYMENT, label: 'Payment Notifications', icon: 'card' },
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export default function NotificationPreferencesScreen() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleTogglePush = (value: boolean) => {
    updateMutation.mutate({ globalMute: !value });
  };

  const handleToggleCategory = (type: NotificationType, channel: string, value: boolean) => {
    const categoryPrefs = preferences?.categories?.[type];
    if (!categoryPrefs) return;

    updateMutation.mutate({
      categories: {
        ...preferences?.categories,
        [type]: {
          ...categoryPrefs,
          channels: {
            ...categoryPrefs.channels,
            [channel]: {
              ...categoryPrefs.channels[channel as keyof typeof categoryPrefs.channels],
              enabled: value,
            },
          },
        },
      },
    });
  };

  const handleToggleChannel = (notificationType: string, channel: string, value: boolean) => {
    updateMutation.mutate({
      channels: {
        ...preferences?.channels,
        [notificationType]: {
          ...preferences?.channels?.[notificationType],
          [channel]: value,
        },
      },
    } as UpdateNotificationPreferencesRequest & {
      channels?: Record<string, Record<string, boolean>>;
    });
  };

  const handleToggleEmail = (field: string, value: boolean) => {
    updateMutation.mutate({
      email: {
        ...preferences?.email,
        [field]: value,
      },
    } as UpdateNotificationPreferencesRequest);
  };

  const handleToggleQuietHours = (value: boolean) => {
    updateMutation.mutate({
      doNotDisturb: {
        ...preferences?.doNotDisturb,
        enabled: value,
      },
    } as UpdateNotificationPreferencesRequest);
  };

  const handleStartTimeChange = (event: unknown, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      updateMutation.mutate({
        doNotDisturb: {
          ...preferences?.doNotDisturb,
          startTime: timeString,
        },
      } as UpdateNotificationPreferencesRequest);
    }
  };

  const handleEndTimeChange = (event: unknown, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      updateMutation.mutate({
        doNotDisturb: {
          ...preferences?.doNotDisturb,
          endTime: timeString,
        },
      } as UpdateNotificationPreferencesRequest);
    }
  };

  const handleSave = () => {
    showAlert('Success', 'Notification preferences saved successfully!');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  const pushEnabled = !preferences?.globalMute;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications in the app</Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={pushEnabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          {pushEnabled && (
            <>
              {NOTIFICATION_CATEGORIES.map((category) => {
                const categoryPref = preferences?.categories?.[category.type];
                const isEnabled = categoryPref?.channels?.push?.enabled ?? true;

                return (
                  <View key={category.type} style={styles.categoryRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons name={category.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={Colors.gray[500]} />
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={(value) => handleToggleCategory(category.type, 'push', value)}
                      trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                      thumbColor={isEnabled ? '#3B82F6' : '#F3F4F6'}
                    />
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* Notification Channels Matrix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          <Text style={styles.sectionDescription}>
            Choose how you want to receive each notification type
          </Text>

          <View style={styles.channelMatrix}>
            {/* Header Row */}
            <View style={styles.channelHeaderRow}>
              <View style={[styles.channelHeaderCell, styles.channelTypeColumn]}>
                <Text style={styles.channelHeaderText}>Type</Text>
              </View>
              <View style={styles.channelHeaderCell}>
                <Ionicons name="notifications" size={16} color={Colors.primary[500]} />
                <Text style={styles.channelHeaderSmall}>Push</Text>
              </View>
              <View style={styles.channelHeaderCell}>
                <Ionicons name="chatbubble" size={16} color="#2563EB" />
                <Text style={styles.channelHeaderSmall}>SMS</Text>
              </View>
              <View style={styles.channelHeaderCell}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.channelHeaderSmall}>WhatsApp</Text>
              </View>
              <View style={styles.channelHeaderCell}>
                <Ionicons name="mail" size={16} color="#EA4335" />
                <Text style={styles.channelHeaderSmall}>Email</Text>
              </View>
            </View>

            {/* Data Rows */}
            {NOTIFICATION_CATEGORIES.map((category) => (
              <View key={category.type} style={styles.channelDataRow}>
                <View style={[styles.channelDataCell, styles.channelTypeColumn]}>
                  <Text style={styles.channelTypeLabel}>{category.label}</Text>
                </View>
                {['push', 'sms', 'whatsapp', 'email'].map((channel) => (
                  <View key={channel} style={styles.channelDataCell}>
                    <Switch
                      value={preferences?.channels?.[category.type]?.[channel] ?? true}
                      onValueChange={(value) => handleToggleChannel(category.type, channel, value)}
                      trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                      thumbColor={
                        (preferences?.channels?.[category.type]?.[channel] ?? true)
                          ? '#3B82F6'
                          : '#F3F4F6'
                      }
                      style={styles.channelSwitch}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
        {/* Email Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Daily Digest</Text>
                <Text style={styles.settingDescription}>
                  Receive a daily summary of notifications
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.dailyDigest?.enabled ?? false}
              onValueChange={(value) =>
                updateMutation.mutate({
                  dailyDigest: { ...preferences?.dailyDigest, enabled: value },
                } as UpdateNotificationPreferencesRequest)
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={preferences?.dailyDigest?.enabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="calendar" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Weekly Summary</Text>
                <Text style={styles.settingDescription}>Receive a weekly summary of activity</Text>
              </View>
            </View>
            <Switch
              value={preferences?.weeklyDigest?.enabled ?? false}
              onValueChange={(value) =>
                updateMutation.mutate({
                  weeklyDigest: { ...preferences?.weeklyDigest, enabled: value },
                } as UpdateNotificationPreferencesRequest)
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={preferences?.weeklyDigest?.enabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="megaphone" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Marketing Emails</Text>
                <Text style={styles.settingDescription}>
                  Receive promotional emails and updates
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.email?.marketingEmails ?? false}
              onValueChange={(value) => handleToggleEmail('marketingEmails', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={preferences?.email?.marketingEmails ? '#3B82F6' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* In-App Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In-App Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Text style={styles.settingDescription}>Play sound for new notifications</Text>
              </View>
            </View>
            <Switch
              value={
                (preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                  ?.inAppSettings?.sound ?? true
              }
              onValueChange={(value) =>
                updateMutation.mutate({
                  inAppSettings: {
                    ...(preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                      ?.inAppSettings,
                    sound: value,
                  },
                } as UpdateNotificationPreferencesRequest & { inAppSettings?: InAppSettings })
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={
                (preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                  ?.inAppSettings?.sound !== false
                  ? '#3B82F6'
                  : '#F3F4F6'
              }
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Text style={styles.settingDescription}>Vibrate for new notifications</Text>
              </View>
            </View>
            <Switch
              value={
                (preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                  ?.inAppSettings?.vibration ?? true
              }
              onValueChange={(value) =>
                updateMutation.mutate({
                  inAppSettings: {
                    ...(preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                      ?.inAppSettings,
                    vibration: value,
                  },
                } as UpdateNotificationPreferencesRequest & { inAppSettings?: InAppSettings })
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={
                (preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                  ?.inAppSettings?.vibration !== false
                  ? '#3B82F6'
                  : '#F3F4F6'
              }
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-circle" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Badge Count</Text>
                <Text style={styles.settingDescription}>Show unread count on app icon</Text>
              </View>
            </View>
            <Switch
              value={
                (preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                  ?.inAppSettings?.badgeCount ?? true
              }
              onValueChange={(value) =>
                updateMutation.mutate({
                  inAppSettings: {
                    ...(preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                      ?.inAppSettings,
                    badgeCount: value,
                  },
                } as UpdateNotificationPreferencesRequest & { inAppSettings?: InAppSettings })
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={
                (preferences as NotificationPreferences & { inAppSettings?: InAppSettings })
                  ?.inAppSettings?.badgeCount !== false
                  ? '#3B82F6'
                  : '#F3F4F6'
              }
            />
          </View>
        </View>

        {/* Quiet Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={24} color={Colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  Pause notifications during specific hours
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.doNotDisturb?.enabled ?? false}
              onValueChange={handleToggleQuietHours}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={preferences?.doNotDisturb?.enabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          {preferences?.doNotDisturb?.enabled && (
            <>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeLabel}>Start Time</Text>
                <Text style={styles.timeValue}>
                  {preferences?.doNotDisturb?.startTime || '22:00'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
              </TouchableOpacity>

              {showStartTimePicker && (
                <DateTimePicker
                  value={
                    new Date(`2000-01-01T${preferences?.doNotDisturb?.startTime || '22:00'}:00`)
                  }
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleStartTimeChange}
                />
              )}

              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeLabel}>End Time</Text>
                <Text style={styles.timeValue}>
                  {preferences?.doNotDisturb?.endTime || '08:00'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
              </TouchableOpacity>

              {showEndTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${preferences?.doNotDisturb?.endTime || '08:00'}:00`)}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleEndTimeChange}
                />
              )}

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="alert-circle" size={20} color={Colors.warning[500]} />
                  <Text style={styles.settingLabel}>Allow Urgent Notifications</Text>
                </View>
                <Switch
                  value={preferences?.doNotDisturb?.allowUrgent ?? true}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      doNotDisturb: {
                        ...preferences?.doNotDisturb,
                        allowUrgent: value,
                      },
                    })
                  }
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={preferences?.doNotDisturb?.allowUrgent ? '#3B82F6' : '#F3F4F6'}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.text.inverse} />
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.background.primary,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[900],
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingLeft: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  categoryLabel: {
    fontSize: 15,
    color: Colors.gray[700],
    marginLeft: 12,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  timeLabel: {
    fontSize: 15,
    color: Colors.gray[500],
    flex: 1,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[900],
    marginRight: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 12,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 16,
  },
  channelMatrix: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  channelHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  channelHeaderCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHeaderSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary[500],
    marginTop: 2,
  },
  channelHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  channelTypeColumn: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  channelDataRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: 'center',
  },
  channelDataCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTypeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  channelSwitch: {
    transform: [{ scale: 0.9 }],
  },
});
