// ==========================================
// MyTalent - Login Screen
// Complete authentication UI with all features
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
import { router } from 'expo-router';
import { useAuthStore, DEMO_CREDENTIALS } from '../../src/store/authStore';
import { Colors } from '../../src/components/Badge';

const { width } = Dimensions.get('window');

// ==========================================
// Constants
// ==========================================

const BRAND_COLORS = {
  primary: '#6366F1', // Indigo
  secondary: '#8B5CF6', // Purple
  accent: '#EC4899', // Pink
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red
  background: '#0F172A', // Dark slate
  card: '#1E293B', // Slate
  border: '#334155', // Slate border
  text: '#F8FAFC', // White text
  textMuted: '#94A3B8', // Muted text
};

interface LoginFormData {
  identifier: string;
  password: string;
}

interface LoginErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

// ==========================================
// Component
// ==========================================

export default function LoginScreen() {
  // State
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOTPLogin, setIsOTPLogin] = useState(false);
  const [phoneForOTP, setPhoneForOTP] = useState('');

  // Auth store
  const { login, loginWithOTP, clearError, error } = useAuthStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Focus states
  const identifierInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Clear error when form changes
    if (error) {
      clearError();
    }
  }, [formData]);

  // ==========================================
  // Validation
  // ==========================================

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Validate identifier
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or phone is required';
    } else if (
      !formData.identifier.includes('@') &&
      !/^\d{10,}$/.test(formData.identifier.replace(/\D/g, ''))
    ) {
      newErrors.identifier = 'Please enter a valid email or phone number';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleLogin = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(formData.identifier, formData.password);

      if (result.success) {
        // Navigate to home
        router.replace('/(tabs)');
      } else {
        setErrors({ general: result.error || 'Login failed. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPLogin = async () => {
    Keyboard.dismiss();

    if (!validatePhone(phoneForOTP)) {
      setErrors({ identifier: 'Please enter a valid phone number' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Request OTP
      const { requestOTP } = await import('../../src/services/authService');
      const response = await requestOTP(phoneForOTP, 'login');

      if (response.success) {
        // Navigate to OTP verification
        router.push({
          pathname: '/auth/otp-verify',
          params: { phone: phoneForOTP, mode: 'login' },
        });
      } else {
        setErrors({ general: response.error || 'Failed to send OTP' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to send OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    Keyboard.dismiss();
    setFormData({
      identifier: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });

    setIsLoading(true);

    try {
      const result = await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setErrors({ general: result.error || 'Demo login failed' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Placeholder for Google authentication
    Alert.alert(
      'Coming Soon',
      'Google Sign-In will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleAppleLogin = async () => {
    // Placeholder for Apple authentication
    Alert.alert(
      'Coming Soon',
      'Apple Sign-In will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderLogo = () => (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          transform: [{ scale: logoScale }],
        },
      ]}
    >
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>MT</Text>
      </View>
      <Text style={styles.appName}>MyTalent</Text>
      <Text style={styles.tagline}>Your Career OS</Text>
    </Animated.View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome back</Text>
      <Text style={styles.subtitleText}>
        Sign in to continue to your career dashboard
      </Text>

      {/* Error Message */}
      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      {/* Login Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, !isOTPLogin && styles.modeButtonActive]}
          onPress={() => setIsOTPLogin(false)}
        >
          <Text
            style={[
              styles.modeButtonText,
              !isOTPLogin && styles.modeButtonTextActive,
            ]}
          >
            Password
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, isOTPLogin && styles.modeButtonActive]}
          onPress={() => setIsOTPLogin(true)}
        >
          <Text
            style={[styles.modeButtonText, isOTPLogin && styles.modeButtonTextActive]}
          >
            OTP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      {isOTPLogin ? (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputWrapper, errors.identifier && styles.inputError]}>
            <Text style={styles.inputPrefix}>+91</Text>
            <TextInput
              ref={identifierInputRef}
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={BRAND_COLORS.textMuted}
              value={phoneForOTP}
              onChangeText={(text) => {
                setPhoneForOTP(text.replace(/\D/g, ''));
                if (errors.identifier) {
                  setErrors((prev) => ({ ...prev, identifier: undefined }));
                }
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.identifier && (
            <Text style={styles.fieldError}>{errors.identifier}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!validatePhone(phoneForOTP) || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleOTPLogin}
            disabled={!validatePhone(phoneForOTP) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          {/* Email/Phone Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email or Phone</Text>
            <TextInput
              ref={identifierInputRef}
              style={[styles.input, errors.identifier && styles.inputError]}
              placeholder="Enter email or phone"
              placeholderTextColor={BRAND_COLORS.textMuted}
              value={formData.identifier}
              onChangeText={(text) => handleInputChange('identifier', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            {errors.identifier && (
              <Text style={styles.fieldError}>{errors.identifier}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
              <TextInput
                ref={passwordInputRef}
                style={styles.passwordInput}
                placeholder="Enter password"
                placeholderTextColor={BRAND_COLORS.textMuted}
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password}</Text>
            )}
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.rememberRow}>
            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              >
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Demo Login */}
      <TouchableOpacity
        style={styles.demoButton}
        onPress={handleDemoLogin}
        disabled={isLoading}
      >
        <Text style={styles.demoButtonText}>Try Demo Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSocialLogin = () => (
    <View style={styles.socialContainer}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleAppleLogin}
          disabled={isLoading}
        >
          <Text style={styles.socialIcon}></Text>
          <Text style={styles.socialButtonText}>Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRegister = () => (
    <View style={styles.registerContainer}>
      <Text style={styles.registerText}>
        Don't have an account?{' '}
      </Text>
      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.registerLink}>Sign Up</Text>
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
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo */}
            {renderLogo()}

            {/* Form */}
            {renderForm()}

            {/* Social Login */}
            {renderSocialLogin()}

            {/* Register Link */}
            {renderRegister()}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing in, you agree to our{' '}
                <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND_COLORS.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: BRAND_COLORS.textMuted,
  },

  // Form
  formContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: BRAND_COLORS.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    marginBottom: 24,
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

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: BRAND_COLORS.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.textMuted,
  },
  modeButtonTextActive: {
    color: '#fff',
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 16,
    color: BRAND_COLORS.textMuted,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: BRAND_COLORS.text,
  },
  inputError: {
    borderColor: BRAND_COLORS.error,
  },
  fieldError: {
    color: BRAND_COLORS.error,
    fontSize: 12,
    marginTop: 4,
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

  // Remember Row
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BRAND_COLORS.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
  },
  forgotText: {
    fontSize: 14,
    color: BRAND_COLORS.primary,
    fontWeight: '500',
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

  // Demo Button
  demoButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoButtonText: {
    color: BRAND_COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },

  // Social Login
  socialContainer: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND_COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.text,
  },

  // Register
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  registerText: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.primary,
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: BRAND_COLORS.primary,
  },
});
