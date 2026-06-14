import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  FileText,
  Star,
  LogOut,
  Trash2,
} from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore, useUIStore } from '@/stores';
import { Card } from '@/components/Card';
import { rezApi } from '@/services/rezApi';
import * as Haptics from 'expo-haptics';

export const SettingsScreen: React.FC = () => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const router = useRouter();
  const { profile, logout } = useUserStore();
  const { hapticEnabled, soundEnabled, setHapticEnabled, setSoundEnabled, theme, setTheme } = useUIStore();

  const handleToggleHaptic = (value: boolean) => {
    setHapticEnabled(value);
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleSound = (value: boolean) => {
    setSoundEnabled(value);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    Haptics.selectionAsync();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await rezApi.logout();
            } catch (e) {
              // Ignore API error
            }
            logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    icon: React.ReactNode,
    label: string,
    right?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.fill }]}>
          {icon}
        </View>
        <Text style={[styles.settingLabel, { color: colors.label, ...typography.bodyLarge }]}>
          {label}
        </Text>
      </View>
      {right || (onPress && <ChevronRight size={16} color={colors.labelTertiary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundGrouped }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { padding: spacing.screenPadding }]}>
          <Text style={[styles.headerTitle, { color: colors.label, ...typography.displaySmall }]}>
            Settings
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.labelSecondary, ...typography.captionMedium }]}>
            ACCOUNT
          </Text>
          <Card variant="default" padding="none">
            {renderSettingRow(
              <Bell size={20} color={colors.label} />,
              'Notifications',
              <ChevronRight size={16} color={colors.labelTertiary} />,
              () => router.push('/settings/notifications')
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <Shield size={20} color={colors.label} />,
              'Privacy & Security',
              <ChevronRight size={16} color={colors.labelTertiary} />,
              () => router.push('/settings/privacy')
            )}
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.labelSecondary, ...typography.captionMedium }]}>
            PREFERENCES
          </Text>
          <Card variant="default" padding="none">
            {renderSettingRow(
              <Moon size={20} color={colors.label} />,
              'Dark Mode',
              <Switch
                value={theme === 'dark'}
                onValueChange={(value) => handleThemeChange(value ? 'dark' : 'light')}
                trackColor={{ false: colors.fill, true: colors.primary + '60' }}
                thumbColor={theme === 'dark' ? colors.primary : colors.gray3}
              />
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <Bell size={20} color={colors.label} />,
              'Haptic Feedback',
              <Switch
                value={hapticEnabled}
                onValueChange={handleToggleHaptic}
                trackColor={{ false: colors.fill, true: colors.primary + '60' }}
                thumbColor={hapticEnabled ? colors.primary : colors.gray3}
              />
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <Globe size={20} color={colors.label} />,
              'Sound Effects',
              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{ false: colors.fill, true: colors.primary + '60' }}
                thumbColor={soundEnabled ? colors.primary : colors.gray3}
              />
            )}
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.labelSecondary, ...typography.captionMedium }]}>
            SUPPORT
          </Text>
          <Card variant="default" padding="none">
            {renderSettingRow(
              <HelpCircle size={20} color={colors.label} />,
              'Help & Support',
              <ChevronRight size={16} color={colors.labelTertiary} />,
              () => {}
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <FileText size={20} color={colors.label} />,
              'Terms of Service',
              <ChevronRight size={16} color={colors.labelTertiary} />,
              () => {}
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <Shield size={20} color={colors.label} />,
              'Privacy Policy',
              <ChevronRight size={16} color={colors.labelTertiary} />,
              () => {}
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <Star size={20} color={colors.label} />,
              'Rate Do',
              <ChevronRight size={16} color={colors.labelTertiary} />,
              () => {}
            )}
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.labelSecondary, ...typography.captionMedium }]}>
            DANGER ZONE
          </Text>
          <Card variant="default" padding="none">
            {renderSettingRow(
              <LogOut size={20} color={colors.systemRed} />,
              'Sign Out',
              undefined,
              handleLogout
            )}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            {renderSettingRow(
              <Trash2 size={20} color={colors.systemRed} />,
              'Delete Account',
              undefined,
              handleDeleteAccount
            )}
          </Card>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.version, { color: colors.labelTertiary }]}>
            Do v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {},
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {},
  divider: {
    height: 0.5,
    marginLeft: 60,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  version: {
    fontSize: 12,
  },
});
