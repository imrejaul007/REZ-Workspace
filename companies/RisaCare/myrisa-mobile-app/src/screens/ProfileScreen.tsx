import { logger } from '../../shared/logger';
/**
 * MyRisa Profile Screen
 * User profile, settings, and preferences
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Card, Button, ProgressBar, Chip, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#E57373',
  profile: '#9575CD',
  settings: '#607D8B',
};

export default function ProfileScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    weeklyReports: true,
    reminders: true,
    dataSharing: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
        const userData = await AsyncStorage.getItem('userProfile');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          setUser(getMockUser());
        }
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
        setUser(getMockUser());
      }
    } catch (error) {
      logger.error('Error loading user:', error);
      setUser(getMockUser());
    } finally {
      setLoading(false);
    }
  };

  const getMockUser = () => ({
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
    age: 28,
    gender: 'Female',
    location: 'Mumbai, India',
    joinDate: '2025-06-15',
    healthGoals: [
      { name: 'Improve Sleep', progress: 75 },
      { name: 'Manage Stress', progress: 60 },
      { name: 'Regular Exercise', progress: 80 },
    ],
    preferences: {
      units: 'metric',
      language: 'English',
      timezone: 'IST',
    },
    subscription: {
      plan: 'Premium',
      status: 'active',
      renewsOn: '2026-07-15',
    },
    achievements: [
      { name: '7-Day Streak', emoji: '🔥', earned: true },
      { name: 'First Log', emoji: '⭐', earned: true },
      { name: 'Health Champion', emoji: '🏆', earned: true },
      { name: 'Early Bird', emoji: '🌅', earned: false },
    ],
  });

  const handleSettingToggle = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    });
  };

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
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              logger.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will delete all your health data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('userProfile');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              logger.error('Error clearing data:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.profile }]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Text style={styles.editAvatarText}>✏️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@email.com'}</Text>
        <Chip style={styles.subscriptionChip}>
          {user?.subscription?.plan || 'Free'} Plan
        </Chip>
      </View>

      {/* Health Goals */}
      <Card style={styles.goalsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Health Goals</Text>
          {user?.healthGoals?.map((goal: any, index: number) => (
            <View key={index} style={styles.goalItem}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalProgress}>{goal.progress}%</Text>
              </View>
              <ProgressBar
                progress={goal.progress / 100}
                color={COLORS.primary}
                style={styles.goalProgressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Profile Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{user?.age || 28} years</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{user?.gender || 'Female'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{user?.location || 'Mumbai, India'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{user?.joinDate || '2025-06-15'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Achievements */}
      <Card style={styles.achievementsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {user?.achievements?.map((achievement: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.achievementItem,
                  { opacity: achievement.earned ? 1 : 0.4 }
                ]}
              >
                <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                <Text style={styles.achievementName}>{achievement.name}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Subscription */}
      <Card style={styles.subscriptionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionInfo}>
            <View style={styles.subscriptionPlan}>
              <Text style={styles.planName}>{user?.subscription?.plan || 'Free'}</Text>
              <Chip style={styles.statusChip}>
                {user?.subscription?.status || 'Active'}
              </Chip>
            </View>
            <Text style={styles.renewsText}>
              Renews on {user?.subscription?.renewsOn || '2026-07-15'}
            </Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Receive health reminders</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => handleSettingToggle('notifications')}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Weekly Reports</Text>
              <Text style={styles.settingDescription}>Get weekly health summaries</Text>
            </View>
            <Switch
              value={settings.weeklyReports}
              onValueChange={() => handleSettingToggle('weeklyReports')}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Health Reminders</Text>
              <Text style={styles.settingDescription}>Log mood, sleep, etc.</Text>
            </View>
            <Switch
              value={settings.reminders}
              onValueChange={() => handleSettingToggle('reminders')}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Sharing</Text>
              <Text style={styles.settingDescription}>Help improve AI (anonymous)</Text>
            </View>
            <Switch
              value={settings.dataSharing}
              onValueChange={() => handleSettingToggle('dataSharing')}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Preferences */}
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Units</Text>
            <View style={styles.preferenceValue}>
              <Text style={styles.preferenceText}>{user?.preferences?.units || 'Metric'}</Text>
              <Text style={styles.preferenceArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Language</Text>
            <View style={styles.preferenceValue}>
              <Text style={styles.preferenceText}>{user?.preferences?.language || 'English'}</Text>
              <Text style={styles.preferenceArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Timezone</Text>
            <View style={styles.preferenceValue}>
              <Text style={styles.preferenceText}>{user?.preferences?.timezone || 'IST'}</Text>
              <Text style={styles.preferenceArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={styles.supportCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportIcon}>📖</Text>
            <Text style={styles.supportLabel}>Help Center</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportIcon}>📧</Text>
            <Text style={styles.supportLabel}>Contact Support</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportIcon}>📜</Text>
            <Text style={styles.supportLabel}>Privacy Policy</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportIcon}>📋</Text>
            <Text style={styles.supportLabel}>Terms of Service</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportIcon}>ℹ️</Text>
            <Text style={styles.supportLabel}>About</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.clearDataButton} onPress={handleClearData}>
          <Text style={styles.clearDataText}>Clear All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>MyRisa v1.0.0</Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.profile,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  editAvatarText: {
    fontSize: 18,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  subscriptionChip: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  goalsCard: {
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 14,
    color: '#333',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  editButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.profile + '20',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.profile,
  },
  achievementsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  achievementItem: {
    alignItems: 'center',
    width: '25%',
    padding: 8,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  subscriptionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  subscriptionInfo: {
    marginBottom: 16,
  },
  subscriptionPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  statusChip: {
    backgroundColor: '#E8F5E9',
  },
  renewsText: {
    fontSize: 12,
    color: '#666',
  },
  upgradeButton: {
    backgroundColor: COLORS.profile,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 4,
  },
  preferencesCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
  },
  preferenceArrow: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  supportCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  supportIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  supportLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  supportArrow: {
    fontSize: 14,
    color: '#999',
  },
  actionsContainer: {
    padding: 16,
  },
  clearDataButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
    marginBottom: 12,
  },
  clearDataText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  bottomPadding: {
    height: 100,
  },
});