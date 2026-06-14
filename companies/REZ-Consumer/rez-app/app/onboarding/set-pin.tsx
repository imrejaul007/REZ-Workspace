import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useAuthStore, type AuthStoreState } from '@/stores/authStore';
import { platformAlertSimple } from '@/utils/platformAlert';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import apiClient from '@/services/apiClient';

function SetPinScreen() {
  const router = useRouter();
  const isMounted = useIsMounted();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errors, setErrors] = useState({ pin: '', confirmPin: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine where to navigate after PIN setup (or skip)
  const isOnboarded = useAuthStore((s: AuthStoreState) => s.state?.user?.isOnboarded ?? false);
  const nextRoute = isOnboarded ? '/(tabs)/' : '/onboarding/notification-permission';

  // CA-AUT-027 FIX: Validate PIN strength (reject weak PINs like 1111, 1234, sequential)
  const isWeakPin = (pinValue: string): boolean => {
    // Reject all same digit (1111, 2222, etc.)
    if (/^(\d)\1{3}$/.test(pinValue)) return true;

    // Reject simple sequences (1234, 2345, 0123, 9876, etc.)
    const digits = pinValue.split('').map(Number);
    const isSequential = digits.every((d, i, arr) => i === 0 || d === arr[i - 1] + 1 || d === arr[i - 1] - 1);
    if (isSequential) return true;

    // Reject common patterns (birthday-like: 0101, 1212, etc.)
    if (/^(\d{2})\1$/.test(pinValue)) return true;

    return false;
  };

  const handleSetPin = async () => {
    // Validate
    setErrors({ pin: '', confirmPin: '' });

    if (!pin || pin.length !== 4) {
      setErrors((prev) => ({ ...prev, pin: 'PIN must be exactly 4 digits' }));
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrors((prev) => ({ ...prev, pin: 'PIN must contain only digits' }));
      return;
    }
    if (isWeakPin(pin)) {
      setErrors((prev) => ({ ...prev, pin: 'PIN is too simple (avoid 1111, 1234, patterns)' }));
      return;
    }
    if (pin !== confirmPin) {
      setErrors((prev) => ({ ...prev, confirmPin: 'PINs do not match' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ message: string }>('/user/auth/set-pin', { pin });

      if (response.success) {
        if (!isMounted()) return;
        platformAlertSimple('PIN Set', 'Your 4-digit PIN has been set. Use it next time you sign in.');
        router.replace(nextRoute as unknown as string);
      } else {
        if (!isMounted()) return;
        setErrors((prev) => ({ ...prev, pin: response.message || 'Failed to set PIN. Try again.' }));
      }
    } catch (err) {
      if (!isMounted()) return;
      setErrors((prev) => ({ ...prev, pin: 'Connection error. Please try again.' }));
    } finally {
      if (isMounted()) setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.replace(nextRoute as unknown as string);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[Colors.gold, colors.nileBlue, colors.nileBlue]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={styles.decorativeCircles}>
        <View style={[styles.circle, styles.circleTop]} />
        <View style={[styles.circle, styles.circleBottom]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.glassCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glassShine}
              />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <LinearGradient colors={[Colors.gold, colors.nileBlue]} style={styles.iconGradient}>
                    <Ionicons name="keypad" size={28} color={colors.text.inverse} />
                  </LinearGradient>
                </View>

                <Text style={styles.title}>Set a PIN</Text>
                <Text style={styles.subtitle}>
                  Create a 4-digit PIN for quick sign-in next time.{'\n'}You can always use OTP instead.
                </Text>

                <View style={styles.underlineContainer}>
                  <LinearGradient
                    colors={[Colors.gold, colors.nileBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.underline}
                  />
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* PIN input */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>4-digit PIN</Text>
                  <TextInput
                    value={pin}
                    onChangeText={(v) => {
                      setPin(v.replace(/\D/g, ''));
                      if (errors.pin) setErrors((prev) => ({ ...prev, pin: '' }));
                    }}
                    placeholder="Enter PIN"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry={true}
                    autoFocus={true}
                    style={[styles.pinInput, { borderColor: errors.pin ? colors.error : colors.neutral[200] }]}
                    placeholderTextColor={colors.neutral[400]}
                    accessibilityLabel="4-digit PIN"
                    accessibilityHint="Enter a 4-digit PIN you'll use for quick sign-in"
                  />
                  {!!errors.pin && <Text style={styles.errorText}>{errors.pin}</Text>}
                </View>

                {/* Confirm PIN input */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={styles.inputLabel}>Confirm PIN</Text>
                  <TextInput
                    value={confirmPin}
                    onChangeText={(v) => {
                      setConfirmPin(v.replace(/\D/g, ''));
                      if (errors.confirmPin) setErrors((prev) => ({ ...prev, confirmPin: '' }));
                    }}
                    placeholder="Re-enter PIN"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry={true}
                    style={[styles.pinInput, { borderColor: errors.confirmPin ? colors.error : colors.neutral[200] }]}
                    placeholderTextColor={colors.neutral[400]}
                    accessibilityLabel="Confirm 4-digit PIN"
                    accessibilityHint="Re-enter your PIN to confirm it matches"
                  />
                  {!!errors.confirmPin && <Text style={styles.errorText}>{errors.confirmPin}</Text>}
                </View>

                {/* Set PIN button */}
                <Pressable
                  style={styles.primaryButtonWrapper}
                  onPress={handleSetPin}
                  disabled={isSubmitting}
                  accessibilityLabel={isSubmitting ? 'Setting PIN' : 'Set PIN and continue'}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.primaryButton,
                      { backgroundColor: isSubmitting ? colors.neutral[300] : colors.nileBlue },
                    ]}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="small" color={colors.text.inverse} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Set PIN & Continue</Text>
                        <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                      </>
                    )}
                  </View>
                </Pressable>

                {/* Skip */}
                <Pressable
                  onPress={handleSkip}
                  disabled={isSubmitting}
                  style={styles.skipButton}
                  accessibilityLabel="Skip setting a PIN"
                  accessibilityRole="button"
                >
                  <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
  },
  circleTop: {
    width: 300,
    height: 300,
    top: -80,
    right: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  circleBottom: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: Spacing['2xl'],
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 20,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    }),
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    marginBottom: Spacing.lg,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  underlineContainer: {
    alignItems: 'center',
  },
  underline: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  form: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  pinInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[700],
    textAlign: 'center',
    letterSpacing: 12,
  },
  errorText: {
    color: Colors.error,
    ...Typography.bodySmall,
    marginTop: 6,
    marginLeft: Spacing.xs,
  },
  primaryButtonWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: Spacing.base,
  },
  primaryButton: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    color: colors.text.tertiary,
    ...Typography.body,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default withErrorBoundary(SetPinScreen, 'OnboardingSetPin');
