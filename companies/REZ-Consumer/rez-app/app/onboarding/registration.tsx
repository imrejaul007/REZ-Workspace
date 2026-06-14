// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import analyticsService from '@/services/analyticsService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '@/components/onboarding/FormInput';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import CountryCodePicker, { COUNTRY_CODES, CountryCode } from '@/components/common/CountryCodePicker';
import { showToast } from '@/components/common/ToastManager';
import ReferralHandler from '@/utils/referralHandler';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
// REZ Design System Colors
function RegistrationScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const params = useLocalSearchParams<unknown>();
  const [authLoading, setAuthLoading] = useState(false);
  const [slowLoadingMsg, setSlowLoadingMsg] = useState('');
  const { actions } = useAuth();

  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    referralCode: '',
  });

  useEffect(() => {
    analyticsService.track('registration_started');
  }, []);

  // Auto-populate referral code from deep link or route params
  useEffect(() => {
    const loadReferralCode = async () => {
      // Priority: route params > stored deep link code
      if (params.referralCode) {
        setFormData((prev) => ({ ...prev, referralCode: params.referralCode! }));
        return;
      }
      try {
        const storedReferral = await ReferralHandler.getStoredReferralCode();
        if (storedReferral?.code) {
          if (!isMounted()) return;
          setFormData((prev) => ({ ...prev, referralCode: storedReferral.code }));
        }
      } catch (error) {
        // silently handle
      }
    };
    loadReferralCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.referralCode]);

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find((c) => c.dialCode === '+91') || COUNTRY_CODES[0],
  );

  const [errors, setErrors] = useState({
    phoneNumber: '',
    email: '',
  });

  const [showExistingUserMessage, setShowExistingUserMessage] = useState(false);

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

  const validateEmailOnBlur = (value: string) => {
    if (value.trim() && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'phoneNumber') {
      validatePhoneRealTime(value);
    } else if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      phoneNumber: '',
      email: '',
    };

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{5,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      // Indian mobile numbers start with 6, 7, 8, or 9.
      // Previously used [1-9] which rejected all Indian mobile numbers.
      newErrors.phoneNumber = "That number doesn't look right — double-check and try again";
    }

    // Email is optional, but validate format if provided
    if (formData.email.trim() && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return !newErrors.phoneNumber && !newErrors.email;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setAuthLoading(true);
    const slowHintTimer = setTimeout(() => {
      if (isMounted()) setSlowLoadingMsg('Waking up server, please wait…');
    }, 5000);
    try {
      const cleanPhone = formData.phoneNumber.replace(/^0+/, '');
      const formattedPhone = `${selectedCountry.dialCode}${cleanPhone}`;
      const emailToSend = formData.email.trim() || undefined;
      await actions.sendOTP(formattedPhone, emailToSend, formData.referralCode || undefined, 'signup');

      clearTimeout(slowHintTimer);
      if (isMounted()) setSlowLoadingMsg('');

      router.push({
        pathname: '/onboarding/otp-verification',
        params: { phoneNumber: formattedPhone },
      });
    } catch (error) {
      clearTimeout(slowHintTimer);
      if (isMounted()) setSlowLoadingMsg('');
      const errorMessage =
        error?.message || useAuthStore.getState()?.state?.error || 'Failed to send OTP. Please try again.';

      // Detect "phone already registered" reliably:
      // Primary check: HTTP 409 Conflict status code (set by backend on duplicate phone/email).
      // Fallback: message string match in case the error is rethrown without status code.
      const httpStatus = (error as unknown)?.response?.status || (error as unknown)?.status;
      const isConflict =
        httpStatus === 409 ||
        (errorMessage.toLowerCase().includes('already') &&
          (errorMessage.toLowerCase().includes('registered') || errorMessage.toLowerCase().includes('exists')));
      if (isConflict) {
        if (!isMounted()) return;
        setShowExistingUserMessage(true);
      } else if (errorMessage.toLowerCase().includes('phone')) {
        // Show phone number error in the UI
        if (!isMounted()) return;
        setErrors((prev) => ({ ...prev, phoneNumber: errorMessage }));
      } else {
        showToast({
          type: 'error',
          message: errorMessage,
        });
      }
      actions.clearError();
    } finally {
      if (isMounted()) setAuthLoading(false);
    }
  };

  const handleGoToSignIn = () => {
    router.push('/sign-in');
  };

  const handleTryAgain = () => {
    setShowExistingUserMessage(false);
    setFormData({ phoneNumber: '', email: '', referralCode: '' });
    setErrors({ phoneNumber: '', email: '' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Background */}
      <LinearGradient colors={[colors.linen, '#EDF2F7', colors.linen]} style={StyleSheet.absoluteFill} />

      {/* Decorative Elements */}
      <View style={styles.decorativeCircles}>
        <View style={[styles.circle, styles.circleGreen]} />
        <View style={[styles.circle, styles.circleGold]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showExistingUserMessage ? (
            // Existing User Message
            <View style={styles.glassCard}>
              <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} style={styles.glassShine} />

              <View style={styles.existingUserContainer}>
                <View style={styles.iconContainer}>
                  <LinearGradient colors={[Colors.gold, colors.nileBlue]} style={styles.iconGradient}>
                    <Ionicons name="person-circle" size={48} color={colors.background.primary} />
                  </LinearGradient>
                </View>

                <Text style={styles.existingUserTitle}>Welcome Back!</Text>
                <Text style={styles.existingUserMessage}>Great to see you again! Sign in to continue.</Text>

                <Pressable
                  style={styles.primaryButtonWrapper}
                  onPress={handleGoToSignIn}
                  accessibilityLabel="Go to sign in"
                  accessibilityRole="button"
                  accessibilityHint="Double tap to navigate to the sign in screen"
                >
                  <LinearGradient
                    colors={[Colors.gold, colors.nileBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    <Ionicons name="log-in-outline" size={20} color={colors.background.primary} />
                    <Text style={styles.primaryButtonText}>Go to Sign In</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleTryAgain}
                  accessibilityLabel="Try a different phone number"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>Try Different Number</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // Registration Form
            <View style={styles.glassCard}>
              <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} style={styles.glassShine} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.progressDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotInactive]} />
                  <View style={[styles.dot, styles.dotInactive]} />
                  <View style={[styles.dot, styles.dotInactive]} />
                </View>

                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>Enter your details to get started</Text>

                <View style={styles.underlineContainer}>
                  <LinearGradient
                    colors={[Colors.gold, colors.lightPeach]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.underline}
                  />
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.phoneFieldContainer}>
                  <View style={styles.unifiedPhoneInput}>
                    <CountryCodePicker
                      selectedCountry={selectedCountry}
                      onSelect={setSelectedCountry}
                      style={styles.countryPickerInline}
                    />
                    <View style={styles.phoneDivider} />
                    <View style={styles.phoneNumberInput}>
                      <Ionicons name="call-outline" size={18} color={Colors.gold} style={styles.phoneIcon} />
                      <TextInput
                        style={styles.phoneTextInput}
                        placeholder="Mobile number"
                        placeholderTextColor={colors.gray[400]}
                        value={formData.phoneNumber}
                        onChangeText={(value) => handleInputChange('phoneNumber', value)}
                        keyboardType="phone-pad"
                        accessibilityLabel="Mobile number"
                        accessibilityHint="Enter your mobile number to receive an OTP"
                      />
                    </View>
                  </View>
                  {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
                </View>

                <FormInput
                  placeholder="Email Id (Optional)"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  onBlur={() => validateEmailOnBlur(formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  containerStyle={styles.inputContainer}
                  leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.gold} />}
                />

                <FormInput
                  placeholder="Referral code (Optional)"
                  value={formData.referralCode}
                  onChangeText={(value) => handleInputChange('referralCode', value)}
                  autoCapitalize="characters"
                  containerStyle={styles.inputContainer}
                  leftIcon={<Ionicons name="gift-outline" size={20} color={Colors.gold} />}
                />
              </View>

              {/* Slow network hint */}
              {slowLoadingMsg ? <Text style={styles.slowHint}>{slowLoadingMsg}</Text> : null}

              {/* Submit Button */}
              <Pressable
                style={styles.primaryButtonWrapper}
                onPress={handleSubmit}
                disabled={authLoading || !formData.phoneNumber.trim()}
                accessibilityLabel={authLoading ? 'Submitting registration' : 'Continue with registration'}
                accessibilityRole="button"
                accessibilityState={{ disabled: authLoading || !formData.phoneNumber.trim(), busy: authLoading }}
                accessibilityHint="Double tap to send an OTP to your mobile number and continue registration"
              >
                <LinearGradient
                  colors={authLoading ? [colors.border.default, colors.border.default] : [Colors.gold, colors.nileBlue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>{authLoading ? 'Submitting...' : 'Continue'}</Text>
                  {!authLoading && <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />}
                </LinearGradient>
              </Pressable>

              {/* Sign In Link */}
              <Pressable
                style={styles.signInLink}
                onPress={handleGoToSignIn}
                accessibilityLabel="Already have an account? Sign in"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.signInText}>
                  Already have an account? <Text style={styles.signInHighlight}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          )}
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
    flexGrow: 1,
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.nileBlue, // Nile Blue,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  underlineContainer: {
    alignItems: 'center',
  },
  underline: {
    width: 50,
    height: 4,
    borderRadius: 2,
  },

  // Form
  form: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.base,
  },
  phoneFieldContainer: {
    marginBottom: Spacing.base,
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
    backgroundColor: colors.border.default,
  },
  phoneNumberInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  phoneIcon: {
    marginRight: 10,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: colors.nileBlue, // Nile Blue,
    paddingVertical: 14,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 6,
    marginLeft: Spacing.xs,
  },

  // Buttons
  primaryButtonWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.gold, // Light Mustard,
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
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: Spacing.base,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.body.fontSize,
    color: colors.gray[400],
    fontWeight: '600',
  },
  signInLink: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  signInText: {
    fontSize: Typography.body.fontSize,
    color: colors.gray[400],
  },
  signInHighlight: {
    color: Colors.gold, // Light Mustard,
    fontWeight: '700',
  },
  slowHint: {
    fontSize: Typography.bodySmall.fontSize,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  // Existing User
  existingUserContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
    shadowColor: Colors.gold, // Light Mustard,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  existingUserTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.nileBlue, // Nile Blue,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  existingUserMessage: {
    fontSize: Typography.body.fontSize,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
});

export default withErrorBoundary(RegistrationScreen, 'OnboardingRegistration');
