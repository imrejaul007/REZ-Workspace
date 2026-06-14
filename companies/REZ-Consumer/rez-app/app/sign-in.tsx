// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CachedImage from '@/components/ui/CachedImage';
import { useRouter, useRootNavigationState } from 'expo-router';
import { platformAlertConfirm } from '@/utils/platformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, type AuthStoreState } from '@/stores/authStore';
import { useAuth } from '@/contexts/AuthContext';
import FormInput from '@/components/onboarding/FormInput';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CountryCodePicker, { COUNTRY_CODES, CountryCode } from '@/components/common/CountryCodePicker';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { useIsMounted } from '@/hooks/useIsMounted';
import * as Haptics from 'expo-haptics';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';
import { showToast } from '@/components/common/ToastManager';

// Rez Design System Colors

function SignInScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  // Read auth state via refs to avoid re-renders that dismiss the keyboard.
  // Only isAuthenticated + user are needed for the navigation effect.
  const userRef = useRef(useAuthStore.getState()?.state?.user);
  const isAuthRef = useRef(useAuthStore.getState()?.state?.isAuthenticated);
  useEffect(() => {
    const unsub = useAuthStore.subscribe((s: AuthStoreState) => {
      userRef.current = s.state.user;
      isAuthRef.current = s.state.isAuthenticated;
    });
    return unsub;
  }, []);
  // These are only read inside the navigation effect and catch blocks, not in JSX
  const user = userRef.current;
  const isAuthenticated = isAuthRef.current;
  // Use AuthContext directly so actions are always real (not Zustand store noops)
  const { actions } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    phoneNumber: '',
    otp: '',
    pin: '',
  });

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find((c) => c.dialCode === '+91') || COUNTRY_CODES[0],
  );

  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [errors, setErrors] = useState({
    phoneNumber: '',
    otp: '',
    pin: '',
  });

  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [slowLoadingMsg, setSlowLoadingMsg] = useState('');
  // Local button-level loading — separate from global authLoading (which starts
  // true during app init and would permanently disable the button on cold start)
  const [isSending, setIsSending] = useState(false);
  const isMounted = useIsMounted();

  // CA-SEC-027 FIX: OTP request rate limiting — max 3 requests per minute
  const otpSendAttemptsRef = useRef<{ timestamp: number; count: number }>({ timestamp: Date.now(), count: 0 });

  const canSendOTP = (): boolean => {
    const now = Date.now();
    const elapsed = now - otpSendAttemptsRef.current.timestamp;

    // Reset counter every 60 seconds
    if (elapsed > 60_000) {
      otpSendAttemptsRef.current = { timestamp: now, count: 0 };
    }

    // Allow up to 3 requests per minute
    return otpSendAttemptsRef.current.count < 3;
  };

  const recordOTPSendAttempt = (): void => {
    otpSendAttemptsRef.current.count++;
  };

  // OTP timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Navigate to homepage on successful login — poll refs instead of depending on store
  const hasNavigatedRef = useRef(false);
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (!rootNavigationState?.key) return;
    // Check auth state from refs (updated via subscription, no re-renders)
    const checkAuth = () => {
      if (hasNavigatedRef.current) return;
      if (isAuthRef.current && userRef.current) {
        hasNavigatedRef.current = true;
        const u = userRef.current;
        setTimeout(() => {
          try {
            if (u.isOnboarded) {
              router.replace('/(tabs)/' as unknown);
            } else {
              router.replace('/onboarding/notification-permission');
            }
          } catch {
            hasNavigatedRef.current = false;
          }
        }, 300);
      }
    };
    checkAuth();
    const unsub = useAuthStore.subscribe(checkAuth);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNavigationState?.key]);

  const validatePhoneRealTime = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 0 && selectedCountry.dialCode === '+91' && cleaned.length !== 10) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Enter a valid 10-digit phone number' }));
    } else if (
      cleaned.length > 0 &&
      selectedCountry.dialCode !== '+91' &&
      (cleaned.length < 5 || cleaned.length > 15)
    ) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Enter a valid phone number' }));
    } else {
      setErrors((prev) => ({ ...prev, phoneNumber: '' }));
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Canonical E.164 — requires + prefix, 7–15 digits (matches backend validator)
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateOTP = (otp: string): boolean => {
    return otp.length === 6 && /^\d+$/.test(otp);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'phoneNumber') {
      validatePhoneRealTime(value);
    } else if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const doSendOTP = async (formattedPhone: string) => {
    // Show "waking up server" hint after 5s so users know it's a cold start, not a crash
    const slowHintTimer = setTimeout(() => {
      if (isMounted()) setSlowLoadingMsg('Waking up server, please wait…');
    }, 5000);

    try {
      await actions.sendOTP(formattedPhone);
      clearTimeout(slowHintTimer);
      if (isMounted()) setSlowLoadingMsg('');
      if (!isMounted()) return;
      setStep('otp');
      if (!isMounted()) return;
      setOtpTimer(60);
      if (!isMounted()) return;
      setCanResendOTP(false);

      // Haptic feedback on successful OTP send
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      // Removed blocking alert — the UI change to OTP step is the confirmation
      // platformAlertSimple was obscuring the step transition, making users think nothing happened
    } catch (error) {
      clearTimeout(slowHintTimer);
      if (isMounted()) setSlowLoadingMsg('');
      const errorMessage =
        error?.message || useAuthStore.getState()?.state?.error || 'Failed to send OTP. Please try again.';

      if (
        errorMessage.toLowerCase().includes('user not found') ||
        errorMessage.toLowerCase().includes('user does not exist') ||
        errorMessage.toLowerCase().includes("user doesn't exist") ||
        errorMessage.toLowerCase().includes('please sign up')
      ) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: 'This phone number is not registered. Please sign up first.',
        }));

        platformAlertConfirm(
          'User Not Found',
          'This phone number is not registered. Please sign up first.',
          () => router.push('/onboarding/splash'),
          'Sign Up',
        );
      } else {
        if (!isMounted()) return;
        setErrors((prev) => ({
          ...prev,
          phoneNumber: errorMessage,
        }));
        // BUG-094 FIX: Gate behind __DEV__ to prevent leaking error details in production
        if (__DEV__) logger.error('[SIGN-IN] OTP send failed: ' + errorMessage);
        showToast({
          type: 'error',
          message: `Could not send OTP: ${errorMessage}\n\nPlease check your internet connection and try again.`,
        });
      }
      actions.clearError();
      throw error;
    }
  };

  const handleRequestOTP = async () => {
    if (!formData.phoneNumber.trim()) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Phone number is required' }));
      return;
    }

    const formattedPhone = `${selectedCountry.dialCode}${formData.phoneNumber}`;

    if (!validatePhoneNumber(formattedPhone)) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Please enter a valid phone number' }));
      return;
    }

    // CA-SEC-027 FIX: Rate limit OTP requests (max 3 per minute)
    if (!canSendOTP()) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: 'Too many OTP requests. Please wait a minute before trying again.',
      }));
      showToast({
        type: 'warning',
        message: 'You have sent too many OTP requests. Please wait 1 minute before trying again.',
      });
      return;
    }

    // Haptic feedback on phone continue
    try {
      await Haptics.selectionAsync();
    } catch {}

    setIsSending(true);
    recordOTPSendAttempt();
    try {
      // Check if this phone number has a PIN set — if so, show PIN screen instead of OTP
      try {
        // BUG FIX: has-pin response has NO "data" wrapper (backend returns {success, hasPin}).
        // apiClient.makeRequest does: data = responseData.data || responseData. When backend
        // has no "data" key, data = the entire response object, so hasPin lives at the TOP level
        // (not response.data.hasPin which would be undefined). Check both paths for safety.
        const response = await apiClient.get<{ hasPin: boolean }>(
          `/user/auth/has-pin?phoneNumber=${encodeURIComponent(formattedPhone)}`,
        );
        const hasPinSet = (response as unknown).hasPin ?? response.data?.hasPin ?? false;
        if (hasPinSet) {
          if (!isMounted()) return;
          setStep('pin');
          return;
        }
      } catch {
        // If has-pin check fails (e.g. network error), fall through to OTP
      }

      await doSendOTP(formattedPhone);
    } finally {
      if (isMounted()) setIsSending(false);
    }
  };

  const handleVerifyPIN = async () => {
    if (!formData.pin || formData.pin.length !== 4) {
      setErrors((prev) => ({ ...prev, pin: 'Please enter your 4-digit PIN' }));
      return;
    }

    setIsSending(true);
    try {
      const formattedPhone = `${selectedCountry.dialCode}${formData.phoneNumber}`;
      const response = await apiClient.post<{
        user: Record<string, unknown>;
        tokens: { accessToken: string; refreshToken: string };
        attemptsLeft?: number;
      }>('/user/auth/login-pin', {
        phoneNumber: formattedPhone,
        pin: formData.pin,
      });

      if (response.success) {
        // Normalise user: backend returns _id, frontend expects id
        const rawUser = (response.data as unknown).user;
        const userId = rawUser._id || rawUser.id;
        if (!userId) {
          throw new Error('Invalid user response: missing userId (_id or id)');
        }
        const user = { ...rawUser, id: userId };
        await actions.loginWithTokens((response.data as unknown).tokens, user);
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        // Navigate based on hasPIN and onboarding status
        const needsPinSetup = !user.hasPIN;
        if (needsPinSetup) {
          router.replace('/onboarding/set-pin');
        } else if (user.isOnboarded) {
          router.replace('/(tabs)/' as unknown);
        } else {
          router.replace('/onboarding/notification-permission');
        }
      } else {
        if (!isMounted()) return;
        const msg = response.message || 'Incorrect PIN';
        setErrors((prev) => ({ ...prev, pin: msg }));
        // Show alert for lockout or low remaining attempts
        const isLocked = msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('locked');
        const attemptsLeft = (response.data as unknown)?.attemptsLeft ?? (response as unknown).attemptsLeft;
        if (isLocked) {
          showToast({
            type: 'error',
            message: msg,
          });
        } else if (attemptsLeft !== undefined && attemptsLeft <= 2) {
          showToast({
            type: 'error',
            message: `${msg} (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left)`,
          });
        }
      }
    } catch (err) {
      if (!isMounted()) return;
      // Handle HTTP 429 (account locked) — apiClient throws on non-2xx
      const httpStatus = err?.response?.status || err?.status;
      const serverMsg = err?.response?.data?.message || err?.message || '';
      const isLockout =
        httpStatus === 429 ||
        serverMsg.toLowerCase().includes('too many') ||
        serverMsg.toLowerCase().includes('locked');
      if (isLockout) {
        const lockMsg = serverMsg || 'Too many incorrect attempts. Account locked for 15 minutes.';
        setErrors((prev) => ({ ...prev, pin: lockMsg }));
        showToast({
          type: 'error',
          message: lockMsg,
        });
      } else {
        setErrors((prev) => ({ ...prev, pin: 'Connection error. Please try again.' }));
      }
    } finally {
      if (isMounted()) setIsSending(false);
    }
  };

  const handleForgotPIN = async () => {
    setFormData((prev) => ({ ...prev, pin: '' }));
    setErrors((prev) => ({ ...prev, pin: '' }));
    setIsSending(true);
    try {
      const formattedPhone = `${selectedCountry.dialCode}${formData.phoneNumber}`;
      await doSendOTP(formattedPhone);
    } catch {
      // error already handled inside doSendOTP
    } finally {
      if (isMounted()) setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim()) {
      setErrors((prev) => ({ ...prev, otp: 'OTP is required' }));
      return;
    }

    if (!validateOTP(formData.otp)) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setIsSending(true);
    try {
      const formattedPhone = `${selectedCountry.dialCode}${formData.phoneNumber}`;
      const result = await actions.login(formattedPhone, formData.otp);
      // Haptic feedback on successful login
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      // Navigate using the freshly-returned user — do NOT read from store as fallback
      // (store user may be stale from a prior session, causing wrong destination).
      if (!isMounted()) return;
      const user = result;
      const needsPinSetup = !user?.hasPIN;
      if (needsPinSetup) {
        router.replace('/onboarding/set-pin');
      } else if (user?.isOnboarded) {
        router.replace('/(tabs)/' as unknown);
      } else {
        router.replace('/onboarding/notification-permission');
      }
    } catch (error) {
      // BUG FIX: Login failed — do NOT navigate anywhere. Stay on the OTP screen
      // and display the error. The old code read useAuthStore.getState()?.state?.user
      // as a fallback — which is the PREVIOUS session's user (or null), causing the
      // app to incorrectly navigate to notification-permission instead of showing the error.
      const errorMessage = error?.message || useAuthStore.getState()?.state?.error || 'Invalid OTP. Please try again.';
      if (!isMounted()) return;
      setErrors((prev) => ({
        ...prev,
        otp: errorMessage,
      }));
      actions.clearError();
    } finally {
      if (isMounted()) setIsSending(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOTP) return;

    try {
      const formattedPhone = `${selectedCountry.dialCode}${formData.phoneNumber}`;
      await actions.sendOTP(formattedPhone);
      if (!isMounted()) return;
      setOtpTimer(60);
      if (!isMounted()) return;
      setCanResendOTP(false);
      showToast({
        type: 'success',
        message: 'New verification code sent to your phone',
      });
    } catch (error) {
      const errorMessage =
        error?.message || useAuthStore.getState()?.state?.error || 'Failed to resend OTP. Please try again.';
      if (!isMounted()) return;
      setErrors((prev) => ({ ...prev, otp: errorMessage }));
      showToast({
        type: 'error',
        message: errorMessage,
      });
      actions.clearError();
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setFormData((prev) => ({ ...prev, otp: '', pin: '' }));
    setErrors((prev) => ({ ...prev, otp: '', pin: '' }));
    setOtpTimer(0);
    setCanResendOTP(false);
  };

  const handleGoToSignUp = () => {
    router.push('/onboarding/splash');
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      {/* Glass Card */}
      <View style={styles.glassCard}>
        {/* Glass Shine Effect */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassShine}
        />

        {/* Header */}
        <View style={styles.header}>
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <CachedImage source={BRAND.LOGO_IMAGE} style={styles.logoImage} contentFit="contain" />
          </View>

          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Brand Underline */}
          <View style={styles.underlineContainer}>
            <LinearGradient
              colors={['#FFC857', '#FFB020']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.phoneInputContainer}>
            <View style={styles.unifiedPhoneInput}>
              <CountryCodePicker
                selectedCountry={selectedCountry}
                onSelect={setSelectedCountry}
                style={styles.countryPickerInline}
              />
              <View style={styles.phoneDivider} />
              <View style={styles.phoneNumberInput}>
                <Ionicons name="call-outline" size={18} color="#1a3a52" style={styles.phoneIcon} />
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="Mobile number"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                  accessibilityLabel="Mobile number"
                  accessibilityHint="Enter your registered mobile number to receive an OTP"
                />
              </View>
            </View>
            {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
          </View>

          {/* Primary Button with Gradient */}
          <Pressable
            style={styles.primaryButtonWrapper}
            onPress={handleRequestOTP}
            disabled={isSending}
            accessibilityLabel={isSending ? 'Sending OTP' : 'Send OTP to phone number'}
            accessibilityRole="button"
          >
            <View style={[styles.primaryButton, { backgroundColor: isSending ? colors.neutral[300] : '#1a3a52' }]}>
              {isSending ? (
                <LoadingSpinner size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
                </>
              )}
            </View>
          </Pressable>
          {!!slowLoadingMsg && (
            <Text style={{ textAlign: 'center', color: colors.text.secondary, fontSize: 13, marginTop: 8 }}>
              {slowLoadingMsg}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      {/* Glass Card */}
      <View style={styles.glassCard}>
        {/* Glass Shine Effect */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassShine}
        />

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackToPhone}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            accessibilityLabel="Go back to phone number entry"
            accessibilityRole="button"
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#1a3a52" />
            </View>
          </Pressable>

          {/* Shield Icon */}
          <View style={styles.shieldIconContainer}>
            <LinearGradient colors={['#1a3a52', '#0d2133']} style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark" size={28} color={colors.text.inverse} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            <Text style={styles.phoneNumber}>
              {selectedCountry.dialCode} {formData.phoneNumber}
            </Text>
          </Text>

          <Pressable
            onPress={handleBackToPhone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Change phone number"
            accessibilityRole="button"
            style={{ marginTop: 4, marginBottom: 4, alignSelf: 'center' }}
          >
            <Text style={{ fontSize: 13, color: '#FFC857', fontWeight: '600', textDecorationLine: 'underline' }}>
              Wrong number? Change
            </Text>
          </Pressable>

          {/* Brand Underline */}
          <View style={styles.underlineContainer}>
            <LinearGradient
              colors={['#FFC857', '#FFB020']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={{ marginBottom: 16 }}>
            <TextInput
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChangeText={(value) => handleInputChange('otp', value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.otp ? colors.error : colors.neutral[200],
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 20,
                fontWeight: '700',
                color: colors.neutral[700],
                textAlign: 'center',
                letterSpacing: 8,
              }}
              placeholderTextColor={colors.neutral[400]}
              accessibilityLabel="One-time password"
              accessibilityHint="Enter the 6-digit code sent to your phone"
            />
            {!!errors.otp && <Text style={{ color: colors.error, fontSize: 14, marginTop: 4 }}>{errors.otp}</Text>}
          </View>

          <View style={styles.otpActions}>
            {otpTimer > 0 ? (
              <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
                <Text style={styles.timerText}>Resend OTP in {otpTimer}s</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleResendOTP}
                disabled={!canResendOTP}
                style={styles.resendButton}
                accessibilityLabel="Resend OTP"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canResendOTP }}
                accessibilityHint="Double tap to send a new verification code to your phone"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={[styles.resendText, !canResendOTP ? styles.resendTextDisabled : null]}>Resend OTP</Text>
              </Pressable>
            )}
          </View>

          {/* Primary Button with Gradient */}
          <Pressable
            style={styles.primaryButtonWrapper}
            onPress={handleVerifyOTP}
            disabled={isSending}
            accessibilityLabel={isSending ? 'Verifying OTP' : 'Verify OTP and sign in'}
            accessibilityRole="button"
          >
            <View style={[styles.primaryButton, { backgroundColor: isSending ? colors.neutral[300] : '#1a3a52' }]}>
              {isSending ? (
                <LoadingSpinner size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                  <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                </>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderPINStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.glassCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassShine}
        />

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackToPhone}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            accessibilityLabel="Go back to phone number entry"
            accessibilityRole="button"
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#1a3a52" />
            </View>
          </Pressable>

          <View style={styles.shieldIconContainer}>
            <LinearGradient colors={['#1a3a52', '#0d2133']} style={styles.shieldIcon}>
              <Ionicons name="keypad" size={28} color={colors.text.inverse} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>
            Enter your 4-digit PIN to sign in{'\n'}
            <Text style={styles.phoneNumber}>
              {selectedCountry.dialCode} {formData.phoneNumber}
            </Text>
          </Text>

          <View style={styles.underlineContainer}>
            <LinearGradient
              colors={['#FFC857', '#FFB020']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
          </View>
        </View>

        <View style={styles.form}>
          <View style={{ marginBottom: 16 }}>
            <TextInput
              placeholder="Enter 4-digit PIN"
              value={formData.pin}
              onChangeText={(v) => handleInputChange('pin', v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={true}
              autoFocus={true}
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.pin ? colors.error : colors.neutral[200],
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 24,
                fontWeight: '700',
                color: colors.neutral[700],
                textAlign: 'center',
                letterSpacing: 12,
              }}
              placeholderTextColor={colors.neutral[400]}
            />
            {!!errors.pin && <Text style={{ color: colors.error, fontSize: 14, marginTop: 4 }}>{errors.pin}</Text>}
          </View>

          <Pressable
            style={styles.primaryButtonWrapper}
            onPress={handleVerifyPIN}
            disabled={isSending || formData.pin.length !== 4}
            accessibilityLabel={isSending ? 'Signing in' : 'Sign in with PIN'}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.primaryButton,
                {
                  backgroundColor: isSending || formData.pin.length !== 4 ? colors.neutral[300] : '#1a3a52',
                },
              ]}
            >
              {isSending ? (
                <LoadingSpinner size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                  <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                </>
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={handleForgotPIN}
            disabled={isSending}
            style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }}
            accessibilityLabel="Forgot PIN? Login with OTP instead"
            accessibilityRole="button"
          >
            <Text style={{ color: '#1a3a52', fontWeight: '600', fontSize: 14 }}>Forgot PIN? Login with OTP</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Hero Gradient Background - Nile Blue */}
      <LinearGradient
        colors={['#1a3a52', '#0d2133', '#0d2133']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Floating Circles */}
      <View style={styles.decorativeCircles}>
        {/* Large Gold Circle - Top Right */}
        <View style={[styles.circle, styles.circleGoldLarge]} />
        {/* Medium Green Circle - Bottom Left */}
        <View style={[styles.circle, styles.circleGreenMedium]} />
        {/* Small Gold Circle - Top Left */}
        <View style={[styles.circle, styles.circleGoldSmall]} />
        {/* Tiny Green Circle - Bottom Right */}
        <View style={[styles.circle, styles.circleGreenTiny]} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {step === 'phone' ? renderPhoneStep() : step === 'pin' ? renderPINStep() : renderOTPStep()}

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
                  },
                ]}
                onPress={handleGoToSignUp}
                accessibilityLabel="Don't have an account? Sign up"
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>
                  Don't have an account? <Text style={styles.signUpText}>Sign Up</Text>
                </Text>
              </Pressable>

              <Pressable
                style={styles.recoveryLink}
                onPress={() => router.push('/account-recovery')}
                accessibilityLabel="Can't access your account? Recover it"
                accessibilityRole="button"
              >
                <Text style={styles.recoveryLinkText}>
                  Can't access your account? <Text style={styles.recoveryText}>Recover</Text>
                </Text>
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
  keyboardContainer: {
    flex: 1,
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

  // Decorative Circles
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
  },
  circleGoldLarge: {
    width: 300,
    height: 300,
    top: -80,
    right: -100,
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
  },
  circleGreenMedium: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleGoldSmall: {
    width: 100,
    height: 100,
    top: 150,
    left: 20,
    backgroundColor: 'rgba(255, 200, 87, 0.10)',
  },
  circleGreenTiny: {
    width: 60,
    height: 60,
    bottom: 200,
    right: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Step Container
  stepContainer: {
    marginVertical: Spacing.lg,
  },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 24,
    padding: Spacing['2xl'],
    overflow: 'hidden',
    // Glass border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    // Glass shadow
    shadowColor: '#0d2133',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 36,
    elevation: 20,
    // Web blur effect
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  // App Logo
  logoContainer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 200,
    height: 107,
  },

  // Shield Icon (OTP step)
  shieldIconContainer: {
    marginBottom: Spacing.lg,
    shadowColor: '#1a3a52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  shieldIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Back Button
  backButton: {
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(26, 58, 82, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.18)',
  },

  // Typography
  title: {
    ...Typography.h1,
    fontWeight: '800',
    color: '#1a3a52',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  phoneNumber: {
    color: '#1a3a52',
    ...Typography.bodyLarge,
    fontWeight: '700',
  },

  // Gold Underline
  underlineContainer: {
    alignItems: 'center',
  },
  underline: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },

  // Form
  form: {
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  phoneInputContainer: {
    marginBottom: Spacing.xl,
  },
  unifiedPhoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  countryPickerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    gap: 6,
  },
  phoneDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.neutral[200],
  },
  phoneNumberInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  phoneIcon: {
    marginRight: Spacing.sm,
  },
  phoneTextInput: {
    flex: 1,
    ...Typography.body,
    color: colors.text.primary,
    paddingVertical: 14,
  },
  errorText: {
    color: Colors.error,
    ...Typography.bodySmall,
    marginTop: 6,
    marginLeft: Spacing.xs,
  },

  // OTP Actions
  otpActions: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(154, 167, 178, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  timerText: {
    ...Typography.body,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  resendButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
  },
  resendText: {
    ...Typography.body,
    color: '#1a3a52',
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: colors.neutral[300],
  },

  // Primary Button
  primaryButtonWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1a3a52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
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

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.88)',
    ...Typography.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  signUpText: {
    color: '#FFC857',
    fontWeight: '700',
  },
  recoveryLink: {
    marginTop: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  recoveryLinkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  recoveryText: {
    color: colors.text.inverse,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default withErrorBoundary(SignInScreen, 'SignIn');
