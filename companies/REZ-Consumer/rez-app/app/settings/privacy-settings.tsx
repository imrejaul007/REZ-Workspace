// @ts-nocheck
/**
 * Privacy Settings Screen
 * DPDP-compliant user privacy controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { useAuthUser } from '@/stores/selectors';
import Constants from 'expo-constants';

interface ConsentStatus {
  type: string;
  status: string;
  updatedAt: string;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.apiUrl}/api/consent/summary/${user?.id}`
      );
      const data = await response.json();

      if (data.success) {
        const consentMap: Record<string, boolean> = {};
        for (const [type, info] of Object.entries(data.data.consents)) {
          consentMap[type] = (info as unknown).status === 'granted';
        }
        setConsents(consentMap);
      }
    } catch (error) {
      logger.error('Failed to load consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (type: string, granted: boolean) => {
    try {
      await fetch(`${Constants.expoConfig?.extra?.apiUrl}/api/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          consentType: type,
          status: granted ? 'granted' : 'denied',
          source: 'settings',
        }),
      });

      setConsents(prev => ({ ...prev, [type]: granted }));
    } catch (error) {
      logger.error('Failed to update consent:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.apiUrl}/api/user-rights/export/${user?.id}`,
        {
          headers: { 'x-user-id': user?.id || '' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'Data Export',
          'Your data export is ready. You will receive an email with the download link within 24 hours.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('Export error:', error);
      Alert.alert('Error', 'Failed to initiate data export.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${Constants.expoConfig?.extra?.apiUrl}/api/user-rights/delete/${user?.id}`,
                {
                  method: 'POST',
                  headers: { 'x-user-id': user?.id || '' },
                }
              );

              if (response.ok) {
                Alert.alert(
                  'Account Deletion Initiated',
                  'Your account will be deleted within 7 days. You will receive a confirmation email.'
                );
              }
            } catch (error) {
              logger.error('Delete error:', error);
              Alert.alert('Error', 'Failed to initiate account deletion.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <ThemedText variant="title" style={styles.sectionTitle}>
          Privacy Controls
        </ThemedText>

        <View style={styles.section}>
          <ThemedText variant="caption" style={styles.sectionDescription}>
            Manage how ReZ uses your data. Your choices are saved automatically.
          </ThemedText>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="location" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <ThemedText variant="subtitle">Location Tracking</ThemedText>
                  <ThemedText variant="caption" style={styles.settingDescription}>
                    For personalized nearby offers
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={consents.location_tracking || false}
                onValueChange={(v) => updateConsent('location_tracking', v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="analytics" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <ThemedText variant="subtitle">App Analytics</ThemedText>
                  <ThemedText variant="caption" style={styles.settingDescription}>
                    Help us improve our app
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={consents.analytics || false}
                onValueChange={(v) => updateConsent('analytics', v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <ThemedText variant="subtitle">Marketing Messages</ThemedText>
                  <ThemedText variant="caption" style={styles.settingDescription}>
                    Deals and promotional offers
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={consents.marketing || false}
                onValueChange={(v) => updateConsent('marketing', v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="bulb" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <ThemedText variant="subtitle">AI Recommendations</ThemedText>
                  <ThemedText variant="caption" style={styles.settingDescription}>
                    Personalized suggestions
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={consents.ai_profiling || false}
                onValueChange={(v) => updateConsent('ai_profiling', v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        <ThemedText variant="title" style={styles.sectionTitle}>
          Your Data
        </ThemedText>

        <View style={styles.section}>
          <Pressable style={styles.actionRow} onPress={handleExportData}>
            <View style={styles.actionInfo}>
              <Ionicons name="download" size={24} color={Colors.primary} />
              <View style={styles.actionText}>
                <ThemedText variant="subtitle">Export My Data</ThemedText>
                <ThemedText variant="caption" style={styles.settingDescription}>
                  Download all your data
                </ThemedText>
              </View>
            </View>
            {exporting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            )}
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.actionRow} onPress={handleDeleteAccount}>
            <View style={styles.actionInfo}>
              <Ionicons name="trash" size={24} color={Colors.error} />
              <View style={styles.actionText}>
                <ThemedText variant="subtitle" style={styles.dangerText}>
                  Delete Account
                </ThemedText>
                <ThemedText variant="caption" style={styles.settingDescription}>
                  Permanently remove all data
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText variant="caption" style={styles.footerText}>
            Your data is protected under India's DPDP Act 2023.
            {'\n'}
            Version 2.0 - Last updated May 2026
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionDescription: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingDescription: {
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: Spacing.md,
  },
  dangerText: {
    color: Colors.error,
  },
  footer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
