/**
 * Settings Screen
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../stores/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [settings, setSettings] = useState({
    notifications: {
      sos: true,
      rides: true,
      groups: true,
      events: true,
      marketing: false,
    },
    privacy: {
      showLocation: true,
      showStats: true,
      publicProfile: true,
    },
    safety: {
      autoSOS: true,
      liveTracking: true,
      shareLocation: true,
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updatePrivacySetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }));
  };

  const updateSafetySetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      safety: { ...prev.safety, [key]: value },
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="🚨"
              label="SOS Alerts"
              description="Get notified when riders nearby need help"
              value={settings.notifications.sos}
              onValueChange={(v) => updateNotificationSetting('sos', v)}
            />
            <SettingToggle
              icon="🏍️"
              label="Ride Updates"
              description="Updates from rides you're following"
              value={settings.notifications.rides}
              onValueChange={(v) => updateNotificationSetting('rides', v)}
            />
            <SettingToggle
              icon="👥"
              label="Group Activity"
              description="Posts and updates from your groups"
              value={settings.notifications.groups}
              onValueChange={(v) => updateNotificationSetting('groups', v)}
            />
            <SettingToggle
              icon="📅"
              label="Event Reminders"
              description="Reminders for events you've RSVPed to"
              value={settings.notifications.events}
              onValueChange={(v) => updateNotificationSetting('events', v)}
            />
            <SettingToggle
              icon="🎉"
              label="Promotions"
              description="Deals, offers, and promotional content"
              value={settings.notifications.marketing}
              onValueChange={(v) => updateNotificationSetting('marketing', v)}
              isLast
            />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="📍"
              label="Show Location"
              description="Allow others to see your location"
              value={settings.privacy.showLocation}
              onValueChange={(v) => updatePrivacySetting('showLocation', v)}
            />
            <SettingToggle
              icon="📊"
              label="Show Ride Stats"
              description="Share your ride statistics publicly"
              value={settings.privacy.showStats}
              onValueChange={(v) => updatePrivacySetting('showStats', v)}
            />
            <SettingToggle
              icon="👤"
              label="Public Profile"
              description="Make your profile visible to everyone"
              value={settings.privacy.publicProfile}
              onValueChange={(v) => updatePrivacySetting('publicProfile', v)}
              isLast
            />
          </View>
        </View>

        {/* Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="🆘"
              label="Auto SOS"
              description="Automatically trigger SOS on crash detection"
              value={settings.safety.autoSOS}
              onValueChange={(v) => updateSafetySetting('autoSOS', v)}
            />
            <SettingToggle
              icon="📡"
              label="Live Tracking"
              description="Share live location during rides"
              value={settings.safety.liveTracking}
              onValueChange={(v) => updateSafetySetting('liveTracking', v)}
            />
            <SettingToggle
              icon="🔗"
              label="Share with Emergency Contacts"
              description="Automatically share location with contacts"
              value={settings.safety.shareLocation}
              onValueChange={(v) => updateSafetySetting('shareLocation', v)}
              isLast
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingItem
              icon="✏️"
              label="Edit Profile"
              onPress={() => router.push('/profile/edit')}
            />
            <SettingItem
              icon="🔑"
              label="Change Password"
              onPress={() => router.push('/profile/change-password')}
            />
            <SettingItem
              icon="🔐"
              label="Privacy Settings"
              onPress={() => router.push('/profile/privacy')}
            />
            <SettingItem
              icon="🔔"
              label="Notification Settings"
              onPress={() => router.push('/profile/notifications')}
            />
            <SettingItem
              icon="📱"
              label="Connected Apps"
              onPress={() => router.push('/profile/connected-apps')}
              isLast
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <SettingItem
              icon="❓"
              label="Help Center"
              onPress={() => router.push('/help')}
            />
            <SettingItem
              icon="💬"
              label="Contact Support"
              onPress={() => router.push('/help/contact')}
            />
            <SettingItem
              icon="🐛"
              label="Report a Bug"
              onPress={() => router.push('/help/report-bug')}
            />
            <SettingItem
              icon="⭐"
              label="Rate the App"
              onPress={() => {}}
              isLast
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <SettingItem
              icon="📜"
              label="Terms of Service"
              onPress={() => router.push('/legal/terms')}
            />
            <SettingItem
              icon="🔒"
              label="Privacy Policy"
              onPress={() => router.push('/legal/privacy')}
            />
            <SettingItem
              icon="🍪"
              label="Cookie Policy"
              onPress={() => router.push('/legal/cookies')}
              isLast
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
              <Text style={styles.dangerIcon}>🚪</Text>
              <Text style={styles.dangerText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dangerItem, styles.deleteAccount]}
              onPress={() => Alert.alert('Delete Account', 'This feature is coming soon.')}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>RiderCircle v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ in India</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Setting Components
function SettingToggle({
  icon,
  label,
  description,
  value,
  onValueChange,
  isLast = false,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingContent}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#2a2a4e', true: '#e94560' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SettingItem({
  icon,
  label,
  onPress,
  isLast = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingItem, styles.settingItemClickable, isLast && styles.settingItemLast]}
      onPress={onPress}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  dangerTitle: {
    color: '#ef4444',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemClickable: {
    paddingVertical: 14,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#666',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  deleteAccount: {
    borderBottomWidth: 0,
  },
  dangerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dangerText: {
    fontSize: 16,
    color: '#fff',
  },
  deleteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  deleteText: {
    fontSize: 16,
    color: '#ef4444',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});