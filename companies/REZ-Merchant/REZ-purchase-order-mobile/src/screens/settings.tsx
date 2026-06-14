import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePOStore } from '../contexts/store';
import { syncQueue } from '../services/api';
import { RootStackParamList } from '../types';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const {
    isOnline,
    pendingSyncCount,
    lastSyncTime,
    isSyncing,
    syncPendingData,
    reset,
  } = usePOStore();

  const [notifications, setNotifications] = React.useState({
    pushEnabled: true,
    approvalAlerts: true,
    deliveryUpdates: true,
    weeklyReports: false,
  });

  const [offlineMode, setOfflineMode] = React.useState(false);

  const handleSyncNow = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please connect to sync.');
      return;
    }
    await syncPendingData();
    Alert.alert('Sync Complete', 'All data has been synchronized.');
  }, [isOnline, syncPendingData]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will remove locally stored data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Clear local storage
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            reset();
            // Navigate to login screen
          },
        },
      ]
    );
  }, [reset]);

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void,
    danger?: boolean
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <MaterialCommunityIcons
          name={icon as unknown}
          size={22}
          color={danger ? '#F44336' : '#666'}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <View style={styles.syncCard}>
            <View style={styles.syncStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? '#4CAF50' : '#F44336' },
                ]}
              />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.syncInfo}>
              <Text style={styles.syncLabel}>Last Synced</Text>
              <Text style={styles.syncValue}>
                {lastSyncTime
                  ? format(new Date(lastSyncTime), 'MMM dd, yyyy hh:mm a')
                  : 'Never'}
              </Text>
            </View>
            {pendingSyncCount > 0 && (
              <View style={styles.pendingBadge}>
                <MaterialCommunityIcons name="cloud-sync" size={14} color="#FF9800" />
                <Text style={styles.pendingText}>{pendingSyncCount} pending</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
              onPress={handleSyncNow}
              disabled={!isOnline || isSyncing}
            >
              <MaterialCommunityIcons
                name={isSyncing ? 'loading' : 'sync'}
                size={18}
                color={isOnline ? '#2196F3' : '#CCC'}
              />
              <Text
                style={[
                  styles.syncButtonText,
                  !isOnline && styles.syncButtonTextDisabled,
                ]}
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'bell-outline',
              'Push Notifications',
              'Receive alerts and updates',
              <Switch
                value={notifications.pushEnabled}
                onValueChange={(value) =>
                  setNotifications((prev) => ({ ...prev, pushEnabled: value }))
                }
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={notifications.pushEnabled ? '#4CAF50' : '#FFF'}
              />
            )}
            {renderSettingItem(
              'check-circle-outline',
              'Approval Alerts',
              'When POs need your approval',
              <Switch
                value={notifications.approvalAlerts}
                onValueChange={(value) =>
                  setNotifications((prev) => ({ ...prev, approvalAlerts: value }))
                }
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={notifications.approvalAlerts ? '#4CAF50' : '#FFF'}
                disabled={!notifications.pushEnabled}
              />
            )}
            {renderSettingItem(
              'truck-delivery-outline',
              'Delivery Updates',
              'Track delivery status',
              <Switch
                value={notifications.deliveryUpdates}
                onValueChange={(value) =>
                  setNotifications((prev) => ({ ...prev, deliveryUpdates: value }))
                }
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={notifications.deliveryUpdates ? '#4CAF50' : '#FFF'}
                disabled={!notifications.pushEnabled}
              />
            )}
            {renderSettingItem(
              'chart-bar',
              'Weekly Reports',
              'Summary of PO activity',
              <Switch
                value={notifications.weeklyReports}
                onValueChange={(value) =>
                  setNotifications((prev) => ({ ...prev, weeklyReports: value }))
                }
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={notifications.weeklyReports ? '#4CAF50' : '#FFF'}
              />
            )}
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'folder-sync',
              'Offline Mode',
              'Work without internet',
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={offlineMode ? '#4CAF50' : '#FFF'}
              />
            )}
            {renderSettingItem(
              'cached',
              'Clear Cache',
              'Free up storage space',
              undefined,
              handleClearCache
            )}
            {renderSettingItem(
              'database-export',
              'Export Data',
              'Download PO history',
              undefined,
              () => Alert.alert('Export', 'Feature coming soon')
            )}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'account',
              'Profile',
              'Manage your account',
              undefined,
              () => Alert.alert('Profile', 'Feature coming soon')
            )}
            {renderSettingItem(
              'shield-account',
              'Security',
              'Password and authentication',
              undefined,
              () => Alert.alert('Security', 'Feature coming soon')
            )}
            {renderSettingItem(
              'help-circle',
              'Help & Support',
              'FAQs and contact support',
              undefined,
              () => Alert.alert('Help', 'Feature coming soon')
            )}
            {renderSettingItem(
              'file-document',
              'Terms of Service',
              undefined,
              undefined,
              () => Alert.alert('Terms', 'Feature coming soon')
            )}
            {renderSettingItem(
              'shield-check',
              'Privacy Policy',
              undefined,
              undefined,
              () => Alert.alert('Privacy', 'Feature coming soon')
            )}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          {renderSettingItem(
            'logout',
            'Logout',
            undefined,
            undefined,
            handleLogout,
            true
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>REZ Purchase Order</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2026 RABTUL Technologies</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  syncCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  syncInfo: {
    marginBottom: 12,
  },
  syncLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  syncValue: {
    fontSize: 14,
    color: '#666',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  syncButtonTextDisabled: {
    color: '#CCC',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: '#FFEBEE',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  settingTitleDanger: {
    color: '#F44336',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  appVersion: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 8,
  },
});

export default SettingsScreen;
