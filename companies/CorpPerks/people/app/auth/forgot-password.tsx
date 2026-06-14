// ==========================================
// MyTalent - Forgot Password Screen
// Password reset flow with OTP verification
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
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { forgotPassword, requestOTP, verifyOTP, resetPassword } from '../../src/services/authService';

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

type Step = 'email' | 'otp' | 'reset';

interface FormErrors {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// ==========================================
// Component
// ==========================================

export default function ForgotPasswordScreen() {
  // Get params if coming from another flow
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();

  // State
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params?.email || '');
  const [phone, setPhone] = useState(params?.phone || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resetToken, setResetToken] = useState('');

  // Refs
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
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

  // ==========================================
  // Validation
  // ==========================================

  const validateEmail = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = (): boolean => {
    const newErrors: FormErrors = {};

    if (!otp || otp.length !== 6) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleSendResetLink = async () => {
    Keyboard.dismiss();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await forgotPassword(email);

      if (response.success) {
        // In demo mode, proceed to reset directly
        if (response.resetToken) {
          setResetToken(response.resetToken);
          setStep('reset');
          Alert.alert(
            'Demo Mode',
            'Password reset is available directly in demo mode. You can set a new password.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Email Sent',
            'If an account exists with this email, you will receive password reset instructions.',
            [
              {
                text: 'Back to Login',
                onPress: () => router.back(),
              },
            ]
          );
        }
      } else {
        setErrors({ general: response.error || 'Failed to send reset link' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    Keyboard.dismiss();

    if (!validateOTP()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await verifyOTP(phone, otp, 'reset');

      if (response.success) {
        setStep('reset');
      } else {
        setErrors({ otp: response.error || 'Invalid OTP. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await resetPassword(resetToken || 'demo-token', password);

      if (response.success) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset. Please sign in with your new password.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else {
        setErrors({ general: response.error || 'Failed to reset password' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await requestOTP(phone, 'reset');

      if (response.success) {
        setResendTimer(60);
        setOtp('');
        Alert.alert('OTP Sent', `A new OTP has been sent to ${phone}`);
      } else {
        setErrors({ general: response.error || 'Failed to resend OTP' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '');
    if (digit.length > 1) {
      // Handle paste
      const digits = digit.slice(0, 6 - index).split('');
      const newOtp = [...otp.padEnd(6, ' ').split('')];
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp.join('').trim());
      // Focus last filled
      const lastFilledIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newOtp = [...otp.padEnd(6, ' ').split('')];
      newOtp[index] = digit;
      setOtp(newOtp.join('').trim());

      // Auto-advance to next input
      if (digit && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }
  };

  const handleOTPKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
    } else if (step === 'reset') {
      setStep('otp');
    } else {
      router.back();
    }
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>Reset Password</Text>
        <Text style={styles.headerSubtitleText}>We'll help you get back in</Text>
      </View>
    </View>
  );

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🔑</Text>
      </View>
      <Text style={styles.stepTitle}>Forgot Password?</Text>
      <Text style={styles.stepDescription}>
        Enter your email address and we'll send you instructions to reset your password.
      </Text>

      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email"
          placeholderTextColor={BRAND_COLORS.textMuted}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSendResetLink}
        />
        {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleSendResetLink}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>📱</Text>
      </View>
      <Text style={styles.stepTitle}>Verify OTP</Text>
      <Text style={styles.stepDescription}>
        Enter the 6-digit code sent to your registered phone number ending in ****{phone.slice(-4)}
      </Text>

      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}
      {errors.otp && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.otp}</Text>
        </View>
      )}

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => (otpInputRefs.current[index] = ref)}
            style={[
              styles.otpInput,
              otp[index] && styles.otpInputFilled,
              errors.otp && styles.otpInputError,
            ]}
            value={otp[index] || ''}
            onChangeText={(value) => handleOTPChange(index, value)}
            onKeyPress={({ nativeEvent }) => handleOTPKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            returnKeyType={index < 5 ? 'next' : 'done'}
            onSubmitEditing={handleVerifyOTP}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={isLoading || otp.length < 6}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      {/* Resend Timer */}
      <View style={styles.resendContainer}>
        {resendTimer > 0 ? (
          <Text style={styles.resendText}>
            Resend OTP in {resendTimer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderResetStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🔒</Text>
      </View>
      <Text style={styles.stepTitle}>Set New Password</Text>
      <Text style={styles.stepDescription}>
        Create a new secure password for your account.
      </Text>

      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
          <TextInput
            ref={passwordInputRef}
            style={styles.passwordInput}
            placeholder="Enter new password"
            placeholderTextColor={BRAND_COLORS.textMuted}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
          />
          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showPasswordText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
          <TextInput
            ref={confirmPasswordInputRef}
            style={styles.passwordInput}
            placeholder="Confirm new password"
            placeholderTextColor={BRAND_COLORS.textMuted}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
          />
          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.showPasswordText}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderBackToLogin = () => (
    <View style={styles.loginContainer}>
      <Text style={styles.loginText}>Remember your password? </Text>
      <TouchableOpacity onPress={() => router.replace('/auth/login')}>
        <Text style={styles.loginLink}>Sign In</Text>
      </TouchableOpacity>
    </View>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {renderHeader()}
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOTPStep()}
            {step === 'reset' && renderResetStep()}
            {renderBackToLogin()}
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: BRAND_COLORS.text,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.text,
  },
  headerSubtitleText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
  },

  // Step Container
  stepContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 36,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },

  // Error
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: BRAND_COLORS.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: BRAND_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  fieldError: {
    color: BRAND_COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },

  // Fields
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: BRAND_COLORS.text,
  },
  inputError: {
    borderColor: BRAND_COLORS.error,
  },

  // Password
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: BRAND_COLORS.text,
  },
  showPasswordButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showPasswordText: {
    fontSize: 14,
    color: BRAND_COLORS.primary,
    fontWeight: '500',
  },

  // OTP
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BRAND_COLORS.border,
    fontSize: 24,
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
  },

  // Resend
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
  },
  resendLink: {
    fontSize: 14,
    color: BRAND_COLORS.primary,
    fontWeight: '600',
  },

  // Buttons
  primaryButton: {
    backgroundColor: BRAND_COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Back to Login
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.primary,
  },
});
