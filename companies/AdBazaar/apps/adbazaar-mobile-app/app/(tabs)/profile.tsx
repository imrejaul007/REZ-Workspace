import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  danger?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  danger = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center p-4 bg-white border-b border-gray-100"
    >
      <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text
          className={`text-base ${danger ? 'text-red-600' : 'text-gray-900'}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-500">{subtitle}</Text>
        )}
      </View>
      {rightElement}
      {showArrow && onPress && !rightElement && (
        <Text className="text-gray-400 ml-2">›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, connectedPlatforms, setConnectedPlatforms } = useAppStore();
  const { isOnline, pendingActions, lastSyncAt, syncNow } = useOnlineStatus();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [offlineModeEnabled, setOfflineModeEnabled] = React.useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // Handle logout
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      <ScrollView className="flex-1">
        {/* User Info */}
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 items-center">
            <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-3">
              <Text className="text-3xl">👤</Text>
            </View>
            <Text className="text-xl font-semibold text-gray-900">
              {user?.name || 'Demo User'}
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              {user?.email || 'demo@adbazaar.com'}
            </Text>
            <View className="flex-row">
              <View className="bg-indigo-100 px-3 py-1 rounded-full mr-2">
                <Text className="text-sm text-indigo-600 font-medium">
                  Pro Plan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Connected Platforms */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Connected Platforms
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            {[
              { name: 'Twitter', icon: '🐦', connected: true },
              { name: 'LinkedIn', icon: '💼', connected: true },
              { name: 'Instagram', icon: '📷', connected: true },
              { name: 'Facebook', icon: '👥', connected: false },
            ].map((platform, index) => (
              <View
                key={platform.name}
                className={`flex-row items-center p-4 ${
                  index !== 3 ? 'border-b border-gray-100' : ''
                }`}
              >
                <Text className="text-2xl mr-3">{platform.icon}</Text>
                <Text className="flex-1 text-gray-900">{platform.name}</Text>
                <View
                  className={`px-2 py-1 rounded-full ${
                    platform.connected
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      platform.connected
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {platform.connected ? 'Connected' : 'Connect'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Settings
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <SettingItem
              icon="🔔"
              title="Notifications"
              subtitle="Push notifications for posts"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={notificationsEnabled ? '#6366f1' : '#f4f4f5'}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="📴"
              title="Offline Mode"
              subtitle="Cache data for offline access"
              rightElement={
                <Switch
                  value={offlineModeEnabled}
                  onValueChange={setOfflineModeEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={offlineModeEnabled ? '#6366f1' : '#f4f4f5'}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="🔄"
              title="Auto Sync"
              subtitle="Automatically sync when online"
              rightElement={
                <Switch
                  value={autoSyncEnabled}
                  onValueChange={setAutoSyncEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={autoSyncEnabled ? '#6366f1' : '#f4f4f5'}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="🔒"
              title="Privacy"
              subtitle="Manage your privacy settings"
              onPress={() => {}}
            />
            <SettingItem
              icon="❓"
              title="Help & Support"
              subtitle="Get help with AdBazaar"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sync Status */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Sync Status
          </Text>
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  className={`w-3 h-3 rounded-full mr-2 ${
                    isOnline ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <Text className="text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              {pendingActions > 0 && (
                <TouchableOpacity onPress={syncNow}>
                  <Text className="text-indigo-600 font-medium">
                    Sync Now ({pendingActions})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-sm text-gray-500">
              Last synced: {new Date(lastSyncAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View className="px-4 pb-8">
          <View className="bg-white rounded-2xl overflow-hidden">
            <SettingItem
              icon="📱"
              title="App Version"
              subtitle="1.0.0 (Build 1)"
              showArrow={false}
            />
            <SettingItem
              icon="📄"
              title="Terms of Service"
              onPress={() => {}}
            />
            <SettingItem
              icon="🔒"
              title="Privacy Policy"
              onPress={() => {}}
            />
            <SettingItem
              icon="🚪"
              title="Logout"
              onPress={handleLogout}
              danger
              showArrow={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
