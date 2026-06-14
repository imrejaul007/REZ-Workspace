// ==========================================
// MyTalent - OTP Verification Screen
// Complete OTP input with auto-submit and resend
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { resendOTP, verifyOTP as verifyOTPService } from '../../src/services/authService';

const { width } = Dimensions.get('window');

// ==========================================
// Constants
// ==========================================

const BRAND_COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

interface FormErrors {
  otp?: string;
  general?: string;
}

// ==========================================
// Component
// ==========================================

export default function OTPVerificationScreen() {
  // Get params from navigation
  const params = useLocalSearchParams<{
    phone?: string;
    email?: string;
    mode?: 'login' | 'register' | 'reset';
  }>();

  const phone = params?.phone || '';
  const email = params?.email || '';
  const mode = (params?.mode as 'login' | 'register' | 'reset') || 'login';

  // State
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auth store
  const { loginWithOTP, clearError, error } = useAuthStore();

  // Refs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    // Resend timer countdown
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    // Clear error when otp changes
    if (error) {
      clearError();
    }
  }, [otp]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === OTP_LENGTH && !isVerifying) {
      handleVerifyOTP();
    }
  }, [otp]);

  // Pulse animation for resend button
  useEffect(() => {
    if (resendTimer === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [resendTimer]);

  // ==========================================
  // Handlers
  // ==========================================

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '');

    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1); // Take only last digit if paste
    setOtp(newOtp);

    // Clear error for this input
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (newOtp.every((d) => d !== '')) {
      handleVerifyOTP();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');

    // Validate OTP
    if (otpString.length !== OTP_LENGTH) {
      setErrors({ otp: 'Please enter all 6 digits' });
      shakeInputs();
      return;
    }

    setIsVerifying(true);
    setIsLoading(true);
    setErrors({});

    try {
      let result;

      if (mode === 'login') {
        result = await loginWithOTP(phone, otpString);
      } else {
        // Use the service directly for register/reset modes
        const response = await verifyOTPService(phone, otpString, mode);
        result = { success: response.success, error: response.error };
      }

      if (result.success) {
        // Success animation then navigate
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(pulseAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.replace('/(tabs)');
        });
      } else {
        const errorMessage = result.error || 'Invalid OTP. Please try again.';
        setErrors({ otp: errorMessage });
        shakeInputs();
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      shakeInputs();
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await resendOTP(phone, mode);

      if (response.success) {
        setResendTimer(RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(''));
        Alert.alert(
          'OTP Sent',
          `A new verification code has been sent to ${phone}`,
          [
            {
              text: 'OK',
              onPress: () => {
                inputRefs.current[0]?.focus();
              },
            },
          ]
        );
      } else {
        setErrors({ general: response.error || 'Failed to resend OTP' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhone = () => {
    router.back();
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleChangePhone}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>Verify OTP</Text>
        <Text style={styles.headerSubtitleText}>Enter the code we sent you</Text>
      </View>
    </Animated.View>
  );

  const renderDestination = () => {
    const displayText = phone
      ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
      : email || 'your email';

    return (
      <Animated.View style={[styles.destinationContainer, { opacity: fadeAnim }]}>
        <View style={styles.destinationIcon}>
          <Text style={styles.destinationIconText}>📱</Text>
        </View>
        <Text style={styles.destinationLabel}>Code sent to</Text>
        <Text style={styles.destinationValue}>{displayText}</Text>
        <TouchableOpacity onPress={handleChangePhone}>
          <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderOTPInputs = () => (
    <Animated.View
      style={[
        styles.otpContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
        },
      ]}
    >
      <View style={styles.otpInputsWrapper}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled,
              errors.otp && styles.otpInputError,
              isVerifying && styles.otpInputVerifying,
            ]}
            value={digit}
            onChangeText={(value) => handleOTPChange(index, value)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={index < OTP_LENGTH - 1 ? 'next' : 'done'}
            onSubmitEditing={handleVerifyOTP}
            editable={!isLoading}
          />
        ))}
      </View>

      {errors.otp && (
        <Text style={styles.otpError}>{errors.otp}</Text>
      )}

      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderVerifyButton = () => (
    <Animated.View
      style={[
        styles.buttonContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.verifyButton,
          (otp.join('').length < OTP_LENGTH || isLoading) && styles.verifyButtonDisabled,
        ]}
        onPress={handleVerifyOTP}
        disabled={otp.join('').length < OTP_LENGTH || isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.verifyingText}>Verifying...</Text>
          </View>
        ) : (
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderResendSection = () => (
    <Animated.View
      style={[
        styles.resendContainer,
        { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
      ]}
    >
      {resendTimer > 0 ? (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Resend code in{' '}
            <Text style={styles.timerValue}>{resendTimer}s</Text>
          </Text>
        </View>
      ) : (
        <View>
          <Text style={styles.noReceiveText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOTP}
            disabled={isLoading}
          >
            <Text style={styles.resendButtonText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const renderHelpSection = () => (
    <Animated.View style={[styles.helpContainer, { opacity: fadeAnim }]}>
      <View style={styles.helpRow}>
        <Text style={styles.helpIcon}>💡</Text>
        <Text style={styles.helpText}>
          Tip: In demo mode, use any 6-digit OTP (e.g., 123456)
        </Text>
      </View>
    </Animated.View>
  );

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.content}>
          {renderHeader()}
          {renderDestination()}
          {renderOTPInputs()}
          {renderVerifyButton()}
          {renderResendSection()}
          {renderHelpSection()}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 22,
    color: BRAND_COLORS.text,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 26,
    fontWeight: '700',
    color: BRAND_COLORS.text,
  },
  headerSubtitleText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    marginTop: 4,
  },

  // Destination
  destinationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  destinationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  destinationIconText: {
    fontSize: 28,
  },
  destinationLabel: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    marginBottom: 4,
  },
  destinationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND_COLORS.text,
    marginBottom: 8,
  },
  changeLink: {
    fontSize: 14,
    color: BRAND_COLORS.primary,
    fontWeight: '500',
  },

  // OTP Input
  otpContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpInputsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BRAND_COLORS.border,
    fontSize: 26,
    fontWeight: '700',
    color: BRAND_COLORS.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  otpInputError: {
    borderColor: BRAND_COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  otpInputVerifying: {
    borderColor: BRAND_COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  otpError: {
    color: BRAND_COLORS.error,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },

  // Error
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: BRAND_COLORS.error,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    width: '100%',
  },
  errorText: {
    color: BRAND_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },

  // Verify Button
  buttonContainer: {
    marginBottom: 24,
  },
  verifyButton: {
    backgroundColor: BRAND_COLORS.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyingText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Resend
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
  },
  timerValue: {
    fontWeight: '700',
    color: BRAND_COLORS.primary,
  },
  noReceiveText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 15,
    color: BRAND_COLORS.primary,
    fontWeight: '600',
  },

  // Help
  helpContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
    marginBottom: 20,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: BRAND_COLORS.textMuted,
    lineHeight: 18,
  },
});
