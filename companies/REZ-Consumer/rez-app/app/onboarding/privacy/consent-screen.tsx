// @ts-nocheck
/**
 * Privacy Consent Screen
 * DPDP-compliant consent collection
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { useAuthUser } from '@/stores/selectors';
import { useIsMounted } from '@/hooks/useIsMounted';
import Constants from 'expo-constants';

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
  granted: boolean;
}

export default function PrivacyConsentScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const user = useAuthUser();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    data_processing: true, // Always required
    location_tracking: false,
    analytics: false,
    marketing: false,
    ai_profiling: false,
  });

  const consentItems: ConsentItem[] = [
    {
      id: 'data_processing',
      title: 'Data Processing',
      description: 'Required to process your orders, payments, and transactions',
      icon: 'shield-checkmark-outline',
      required: true,
      granted: true,
    },
    {
      id: 'location_tracking',
      title: 'Location Tracking',
      description: 'To show nearby deals and personalized offers based on your location',
      icon: 'location-outline',
      required: false,
      granted: consents.location_tracking,
    },
    {
      id: 'analytics',
      title: 'App Analytics',
      description: 'To improve our services and understand usage patterns',
      icon: 'analytics-outline',
      required: false,
      granted: consents.analytics,
    },
    {
      id: 'marketing',
      title: 'Marketing Messages',
      description: 'To send you promotional messages about offers and campaigns',
      icon: 'mail-outline',
      required: false,
      granted: consents.marketing,
    },
    {
      id: 'ai_profiling',
      title: 'AI Recommendations',
      description: 'To personalize your experience with AI-powered recommendations',
      icon: 'bulb-outline',
      required: false,
      granted: consents.ai_profiling,
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    setConsents(prev => ({ ...prev, [id]: value }));
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    try {
      // Grant all consents
      const allConsents = {
        data_processing: true,
        location_tracking: true,
        analytics: true,
        marketing: true,
        ai_profiling: true,
      };

      // Call API to save consents
      for (const [type, granted] of Object.entries(allConsents)) {
        await fetch(`${Constants.expoConfig?.extra?.apiUrl}/api/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            consentType: type,
            status: granted ? 'granted' : 'denied',
            source: 'onboarding',
          }),
        });
      }

      if (isMounted) {
        router.replace('/onboarding/interests');
      }
    } catch (error) {
      logger.error('Consent save error:', error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Save only granted consents
      for (const [type, granted] of Object.entries(consents)) {
        await fetch(`${Constants.expoConfig?.extra?.apiUrl}/api/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            consentType: type,
            status: granted ? 'granted' : 'denied',
            source: 'onboarding',
          }),
        });
      }

      if (isMounted) {
        router.replace('/onboarding/interests');
      }
    } catch (error) {
      logger.error('Consent save error:', error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <Ionicons name="shield-checkmark" size={48} color="#fff" />
        <ThemedText type="headline" style={styles.headerTitle}>
          Your Privacy Matters
        </ThemedText>
        <ThemedText type="body2" style={styles.headerSubtitle}>
          Control how we use your data
        </ThemedText>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <ThemedText type="caption" style={styles.infoText}>
            Under India's DPDP Act, you have rights over your personal data.
            You can update these settings anytime in Settings {'>'} Privacy.
          </ThemedText>
        </View>

        {consentItems.map((item) => (
          <View key={item.id} style={styles.consentCard}>
            <View style={styles.consentHeader}>
              <View style={styles.consentIcon}>
                <Ionicons name={item.icon} size={24} color={Colors.primary} />
              </View>
              <View style={styles.consentInfo}>
                <View style={styles.consentTitleRow}>
                  <ThemedText type="subtitle" style={styles.consentTitle}>
                    {item.title}
                  </ThemedText>
                  {item.required && (
                    <View style={styles.requiredBadge}>
                      <ThemedText type="caption" style={styles.requiredText}>
                        Required
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText type="caption" style={styles.consentDescription}>
                  {item.description}
                </ThemedText>
              </View>
            </View>

            {item.required ? (
              <View style={styles.requiredSwitch}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              </View>
            ) : (
              <Switch
                value={consents[item.id as keyof typeof consents]}
                onValueChange={(value) => handleToggle(item.id, value)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.white}
              />
            )}
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={handleContinue}
            disabled={loading}
          >
            <ThemedText type="button" style={styles.secondaryButtonText}>
              {loading ? 'Saving...' : 'Continue with Selected'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleAcceptAll}
            disabled={loading}
          >
            <ThemedText type="button" style={styles.primaryButtonText}>
              Accept All
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText type="caption" style={styles.footerText}>
            By continuing, you agree to our{' '}
            <ThemedText type="caption" style={styles.link}>
              Terms of Service
            </ThemedText>{' '}
            and{' '}
            <ThemedText type="caption" style={styles.link}>
              Privacy Policy
            </ThemedText>
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
  header: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: Colors.textSecondary,
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  consentHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentTitle: {
    fontWeight: '600',
  },
  requiredBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Spacing.xs,
  },
  requiredText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '600',
  },
  consentDescription: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requiredSwitch: {
    marginLeft: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: Colors.primary,
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
  link: {
    color: Colors.primary,
  },
});
