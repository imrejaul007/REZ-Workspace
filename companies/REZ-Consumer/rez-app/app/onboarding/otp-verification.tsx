// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import analyticsService from '@/services/analyticsService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthActions } from '@/stores/selectors';
import { useAuthStore } from '@/stores/authStore';
import { platformAlertSimple } from '@/utils/platformAlert';
import { triggerImpact, triggerNotification } from '@/utils/haptics';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
function OTPVerificationScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<unknown>();
  // DO NOT subscribe to authLoading/authError/authUser via selectors
  // They cause re-renders that dismiss the keyboard on Android
  const actions = useAuthActions();
  const [isVerifying, setIsVerifying] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60); // Match sign-in's 60 seconds
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [otpError, setOtpError] = useState('');

  // Fixed CA-AUT-022 & CA-AUT-036: Track OTP attempt counter and exponential backoff delay
  const [attemptCount, setAttemptCount] = useState(0);
  const [backoffDelay, setBackoffDelay] = useState(0);

  // Use ref instead of state to avoid re-renders that dismiss the keyboard
  const focusedIndexRef = useRef<number | null>(null);

  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    analyticsService.track('otp_verification_started');
  }, []);

  // Timer interval — restarts cleanly when timer is reset (e.g., on resend OTP)
  const [timerKey, setTimerKey] = React.useState(0);
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerKey]);

  const handleOTPChange = (value: string, index: number) => {
    // Handle paste: if a 6-digit code is pasted, auto-fill all boxes
    if (value.length >= 6) {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      if (digits.length === 6) {
        const newOtp = digits.split('');
        setOtp(newOtp);
        inputRefs.current[5]?.focus();
        handleSubmit(digits);
        return;
      }
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only the last character
    setOtp(newOtp);
    setOtpError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit.length === 1)) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (otpValue?: string) => {
    const otpString = otpValue || otp.join('');

    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      triggerImpact('Light');
      platformAlertSimple("That code didn't match", 'Please enter a valid 6-digit OTP');
      return;
    }

    // Fixed CA-AUT-008: Validate OTP hasn't expired (timer = 0)
    if (timer <= 0) {
      triggerImpact('Light');
      platformAlertSimple('OTP Expired', 'Your verification code has expired. Please request a new one.');
      setOtp(['', '', '', '', '', '']);
      return;
    }

    if (!phoneNumber) {
      platformAlertSimple('Error', 'Phone number not found. Please go back and try again.');
      return;
    }

    // Fixed CA-AUT-022 & CA-AUT-036: Block submit if backoff delay is active
    if (backoffDelay > 0) {
      triggerImpact('Light');
      platformAlertSimple('Please wait', `Too many attempts. Please wait ${Math.ceil(backoffDelay / 1000)} seconds before trying again.`);
      return;
    }

    // Fixed CA-AUT-022: Enforce max 5 attempts per OTP
    const MAX_ATTEMPTS = 5;
    if (attemptCount >= MAX_ATTEMPTS) {
      triggerImpact('Light');
      platformAlertSimple('Too many attempts', 'You have exceeded the maximum number of attempts. Please request a new OTP.');
      return;
    }

    setIsVerifying(true);
    try {
      triggerImpact('Medium');
      const freshUser = await actions.verifyOTP(phoneNumber, otpString);

      // CA-AUT-018: Ensure user is returned from OTP verification
      if (!freshUser) {
        throw new Error('User not returned from OTP verification. Please try again.');
      }

      analyticsService.track('otp_verified');
      triggerNotification('Success');

      if (!isMounted()) return;

      const needsPinSetup = !freshUser.hasPIN;
      if (needsPinSetup) {
        router.replace('/onboarding/set-pin');
      } else if (freshUser.isOnboarded) {
        router.replace('/(tabs)/' as unknown);
      } else {
        router.replace('/onboarding/notification-permission');
      }
    } catch (error) {
      const msg = error?.message || useAuthStore.getState()?.state?.error || '';
      if (!isMounted()) return;

      if (msg.includes('Network') || msg.includes('network')) {
        setOtpError('No internet connection. Check your network and try again.');
      } else if (msg.includes('expired')) {
        setOtpError('OTP expired. Please request a new one.');
      } else if (msg.includes('attempt') || msg.includes('locked') || msg.includes('blocked')) {
        setOtpError('Too many attempts. Please wait and try again.');
      } else {
        setOtpError(msg || 'Invalid OTP. Please check and try again.');
      }

      // Implement exponential backoff: 1s, 2s, 4s, 8s, 16s
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      if (newAttemptCount < MAX_ATTEMPTS) {
        const delayMs = Math.pow(2, newAttemptCount - 1) * 1000; // 1s, 2s, 4s, 8s
        setBackoffDelay(delayMs);

        // Clear backoff delay after timeout
        const timeoutId = setTimeout(() => {
          if (!isMounted()) return;
          setBackoffDelay(0);
        }, delayMs);

        return () => clearTimeout(timeoutId);
      }

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      actions.clearError();
    } finally {
      if (isMounted()) setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !phoneNumber) return;

    try {
      triggerImpact('Light');
      await actions.sendOTP(phoneNumber);
      if (!isMounted()) return;
      setTimer(60);
      if (!isMounted()) return;
      setCanResend(false);
      if (!isMounted()) return;
      setTimerKey((k) => k + 1); // Restart interval cleanly
      setResendMessage('OTP has been resent to your phone number.');
    } catch (error) {
      const errorMessage =
        error?.message || useAuthStore.getState()?.state?.error || 'Failed to resend OTP. Please try again.';
      platformAlertSimple('Error', errorMessage);
      actions.clearError();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Background */}
        <LinearGradient
          colors={[colors.background.secondary, '#EDF2F7', colors.background.secondary]}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative Elements */}
        <View style={styles.decorativeCircles}>
          <View style={[styles.circle, styles.circleGreen]} />
          <View style={[styles.circle, styles.circleGold]} />
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={styles.content} pointerEvents="box-none">
            <View style={styles.glassCard} pointerEvents="auto">
              <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} style={styles.glassShine} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.progressDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotInactive]} />
                  <View style={[styles.dot, styles.dotInactive]} />
                </View>

                {/* Shield Icon */}
                <View style={styles.iconContainer}>
                  <LinearGradient colors={[Colors.gold, colors.nileBlue]} style={styles.iconGradient}>
                    <Ionicons name="shield-checkmark" size={32} color={colors.background.primary} />
                  </LinearGradient>
                </View>

                <Text style={styles.title}>Verify your number</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to{'\n'}
                  <Text style={styles.phoneText}>{phoneNumber}</Text>
                </Text>

                <Pressable
                  onPress={() => router.back()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Change phone number"
                  accessibilityRole="button"
                  style={{ marginTop: 4, marginBottom: 4 }}
                >
                  <Text style={styles.changeNumberText}>Wrong number? Change</Text>
                </Pressable>

                <View style={styles.underlineContainer}>
                  <LinearGradient
                    colors={[Colors.gold, '#E6B84E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.underline}
                  />
                </View>
              </View>

              {/* OTP Inputs */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpInputWrapper,
                      focusedIndex === index && styles.otpInputWrapperFocused,
                      digit && styles.otpInputWrapperFilled,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        if (ref) inputRefs.current[index] = ref;
                      }}
                      style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                      value={digit}
                      onChangeText={(value) => handleOTPChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      onFocus={() => {
                        setFocusedIndex(index);
                        focusedIndexRef.current = index;
                      }}
                      onBlur={() => {
                        focusedIndexRef.current = null;
                      }}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? 6 : 1}
                      textAlign="center"
                      selectTextOnFocus
                      autoFocus={index === 0}
                      textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                      autoComplete={index === 0 ? 'sms-otp' : 'off'}
                      accessibilityLabel={`OTP digit ${index + 1} of 6`}
                    />
                  </View>
                ))}
              </View>

              {/* OTP Error */}
              {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

              {/* Resend Section */}
              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <View style={styles.timerPill}>
                    <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
                    <Text style={styles.timerText}>Resend in {timer}s</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleResendOTP}
                    disabled={!canResend || isVerifying}
                    style={styles.resendButton}
                    accessibilityLabel="Resend OTP"
                    accessibilityRole="button"
                    accessibilityHint="Double tap to send a new verification code to your phone"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="refresh-outline" size={18} color={Colors.gold} />
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </Pressable>
                )}
              </View>

              {/* Resend inline message */}
              {resendMessage ? <Text style={styles.resendMessageText}>{resendMessage}</Text> : null}

              {/* Submit Button */}
              {/* Fixed CA-AUT-022 & CA-AUT-036: Disable button during backoff delay */}
              <Pressable
                style={styles.primaryButtonWrapper}
                onPress={() => handleSubmit()}
                disabled={isVerifying || !otp.every((digit) => digit.length === 1) || backoffDelay > 0 || attemptCount >= 5}
                accessibilityLabel={backoffDelay > 0 ? 'Please wait' : isVerifying ? 'Verifying OTP' : 'Verify and continue'}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isVerifying || !otp.every((digit) => digit.length === 1) || backoffDelay > 0 || attemptCount >= 5,
                  busy: isVerifying,
                }}
                accessibilityHint={backoffDelay > 0 ? `Please wait ${Math.ceil(backoffDelay / 1000)} seconds` : 'Double tap to verify your OTP and continue registration'}
              >
                <LinearGradient
                  colors={
                    isVerifying || !otp.every((digit) => digit.length === 1) || backoffDelay > 0 || attemptCount >= 5
                      ? [colors.neutral[300], colors.neutral[300]]
                      : [Colors.gold, colors.nileBlue]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {backoffDelay > 0 ? `Wait ${Math.ceil(backoffDelay / 1000)}s` : isVerifying ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                  {!isVerifying && backoffDelay === 0 && <Ionicons name="checkmark-circle" size={20} color={colors.background.primary} />}
                </LinearGradient>
              </Pressable>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 40,
  },

  // Decorative
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
  },
  circleGreen: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
    backgroundColor: 'rgba(26, 58, 82, 0.08)', // Nile Blue
  },
  circleGold: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -50,
    backgroundColor: 'rgba(255, 200, 87, 0.1)',
  },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 15,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(30px)',
    }),
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.base,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 24,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 205, 87, 0.3)',
  },
  iconContainer: {
    marginBottom: Spacing.base,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  phoneText: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: 15,
  },
  changeNumberText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  underlineContainer: {
    alignItems: 'center',
  },
  underline: {
    width: 50,
    height: 4,
    borderRadius: 2,
  },

  // OTP Inputs
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  otpInputWrapper: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
  },
  otpInputWrapperFocused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  otpInputWrapperFilled: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(255, 205, 87, 0.1)', // Light Mustard
  },
  otpInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  otpInputFilled: {
    color: Colors.gold,
  },

  // Resend
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(154, 167, 178, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  timerText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 14,
    color: Colors.gold,
    fontWeight: '700',
  },

  // Inline messages
  errorText: {
    color: Colors.error,
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  resendMessageText: {
    color: Colors.success,
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  // Primary Button
  primaryButtonWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default withErrorBoundary(OTPVerificationScreen, 'OnboardingOtpVerification');
