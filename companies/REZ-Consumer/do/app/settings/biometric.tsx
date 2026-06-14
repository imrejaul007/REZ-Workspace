// Biometric Settings Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield, Fingerprint, Smartphone } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export default function BiometricScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const {
    status,
    isLoading,
    canUseBiometric,
    enableBiometric,
    disableBiometric,
    initialize,
  } = useBiometricAuth();

  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleToggle = async (value: boolean) => {
    setIsToggling(true);
    try {
      if (value) {
        const success = await enableBiometric();
        if (!success) {
          Alert.alert(
            'Enable Failed',
            'Could not enable biometric authentication. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const success = await disableBiometric();
        if (!success) {
          Alert.alert(
            'Disable Failed',
            'Could not disable biometric authentication. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } finally {
      setIsToggling(false);
    }
  };

  const getBiometricIcon = () => {
    switch (status.biometricType) {
      case 'Face ID':
        return '👤';
      case 'Touch ID':
        return '👆';
      default:
        return '🔐';
    }
  };

  const renderStatus = () => {
    if (isLoading) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.labelSecondary }]}>
            Checking biometric availability...
          </Text>
        </View>
      );
    }

    if (!status.hasHardware) {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIcon, { backgroundColor: colors.fill }]}>
            <Smartphone size={24} color={colors.labelSecondary} />
          </View>
          <Text style={[styles.statusText, { color: colors.labelSecondary }]}>
            This device does not support biometric authentication
          </Text>
        </View>
      );
    }

    if (!status.isEnrolled) {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIcon, { backgroundColor: colors.fill }]}>
            <Fingerprint size={24} color={colors.labelSecondary} />
          </View>
          <Text style={[styles.statusText, { color: colors.labelSecondary }]}>
            No biometrics enrolled. Please set up Face ID or Touch ID in your device settings.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusIcon, { backgroundColor: colors.primary + '20' }]}>
          <Shield size={24} color={colors.primary} />
        </View>
        <Text style={[styles.statusText, { color: colors.labelSecondary }]}>
          {status.biometricType} is available and ready to use
        </Text>
      </View>
    );
  };

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
            Biometric Login
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.secondaryFill }]}>
          <Text style={[styles.infoIcon]}>{getBiometricIcon()}</Text>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.label }]}>
              {status.biometricType ?? 'Biometric'} Login
            </Text>
            <Text style={[styles.infoDescription, { color: colors.labelSecondary }]}>
              Use {status.biometricType ?? 'biometric'} to securely access your account
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            STATUS
          </Text>
          {renderStatus()}
        </View>

        {/* Toggle Setting */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            SETTINGS
          </Text>
          <View style={[styles.toggleCard, { backgroundColor: colors.secondaryFill }]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: colors.label }]}>
                  Enable {status.biometricType ?? 'Biometric'} Login
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.labelSecondary }]}>
                  {status.isEnabled
                    ? 'Use biometrics to sign in faster'
                    : 'Turn on to use biometrics for login'}
                </Text>
              </View>
              <Switch
                value={status.isEnabled}
                onValueChange={handleToggle}
                disabled={!canUseBiometric() || isToggling}
                trackColor={{ false: colors.fill, true: colors.primary + '60' }}
                thumbColor={status.isEnabled ? colors.primary : colors.gray3}
              />
            </View>
            {isToggling && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.labelSecondary }]}>
                  Please authenticate...
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            BENEFITS
          </Text>
          <View style={[styles.benefitsCard, { backgroundColor: colors.secondaryFill }]}>
            <BenefitRow
              icon="🔒"
              title="Enhanced Security"
              description="Your biometric data never leaves your device"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <BenefitRow
              icon="⚡"
              title="Quick Access"
              description="Sign in with a simple glance or touch"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <BenefitRow
              icon="📱"
              title="No Passwords"
              description="Never forget your password again"
              colors={colors}
            />
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={[styles.privacyText, { color: colors.labelSecondary }]}>
            Your biometric data is stored securely on your device and is never
            shared with ReZ or any third parties.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface BenefitRowProps {
  icon: string;
  title: string;
  description: string;
  colors: any;
}

function BenefitRow({ icon, title, description, colors }: BenefitRowProps) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <View style={styles.benefitTextContainer}>
        <Text style={[styles.benefitTitle, { color: colors.label }]}>{title}</Text>
        <Text style={[styles.benefitDescription, { color: colors.labelSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
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
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleCard: {
    borderRadius: 12,
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
  },
  benefitsCard: {
    borderRadius: 12,
    padding: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  privacyNote: {
    paddingHorizontal: 8,
    marginTop: 'auto',
    paddingBottom: 16,
  },
  privacyText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
