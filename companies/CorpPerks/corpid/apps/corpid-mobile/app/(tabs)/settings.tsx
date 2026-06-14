'use client';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  User, Bell, Shield, Lock, HelpCircle, FileText, LogOut,
  ChevronRight, Eye, EyeOff, Smartphone, Globe, Key
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, ciScore, logout, initializeMockData } = useAppStore();

  useEffect(() => {
    if (!user) {
      initializeMockData();
    }
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of CorpID?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('corpid_token');
            await SecureStore.deleteItemAsync('corpid_user');
            await SecureStore.deleteItemAsync('corpid_corpid');
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>
        <Icon size={20} color="#6366f1" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && onPress && (
        <ChevronRight size={18} color="#666" />
      ))}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </LinearGradient>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileCorpId}>{user?.corpId || 'CI-IND-XXXXX'}</Text>
            <View style={styles.profileBadges}>
              <View style={[styles.profileBadge, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.profileBadgeText}>{ciScore?.tier || 'UNVERIFIED'}</Text>
              </View>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>Level {user?.verificationLevel || 0}/5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <SectionHeader title="Account" />
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={User}
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
            />
            <SettingItem
              icon={Key}
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon.')}
            />
            <SettingItem
              icon={Smartphone}
              title="Connected Devices"
              subtitle="Manage linked devices"
              onPress={() => Alert.alert('Coming Soon', 'Device management will be available soon.')}
            />
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <SectionHeader title="Privacy & Security" />
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Shield}
              title="Privacy Settings"
              subtitle="Control your data visibility"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon.')}
            />
            <SettingItem
              icon={Lock}
              title="Security"
              subtitle="Biometrics, 2FA, and more"
              onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon.')}
            />
            <SettingItem
              icon={Eye}
              title="Who Can View My Profile"
              subtitle="Currently: Connections only"
              onPress={() => Alert.alert('Coming Soon', 'Profile visibility settings will be available soon.')}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Bell}
              title="Push Notifications"
              subtitle="Verification alerts, score updates"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon.')}
            />
            <SettingItem
              icon={Globe}
              title="Email Preferences"
              subtitle="Weekly digest, marketing emails"
              onPress={() => Alert.alert('Coming Soon', 'Email preferences will be available soon.')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SectionHeader title="Support" />
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={HelpCircle}
              title="Help Center"
              subtitle="FAQs and guides"
              onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon.')}
            />
            <SettingItem
              icon={FileText}
              title="Terms of Service"
              subtitle="Legal information"
              onPress={() => Alert.alert('Terms', 'Terms of Service for CorpID')}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={[styles.section, styles.lastSection]}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>CorpID v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 CorpPerks. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCorpId: {
    color: '#6366f1',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  profileBadges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  profileBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  profileBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d4a',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    color: '#666',
    fontSize: 12,
  },
  copyrightText: {
    color: '#555',
    fontSize: 11,
    marginTop: 4,
  },
  lastSection: {
    paddingBottom: 16,
  },
});
