// ==========================================
// MyTalent - Register Screen
// Complete registration UI with password strength
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
import { useAuthStore } from '../../src/store/authStore';

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

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  general?: string;
}

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

// ==========================================
// Component
// ==========================================

export default function RegisterScreen() {
  // State
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
  const [step, setStep] = useState(1);

  // Auth store
  const { register, clearError, error } = useAuthStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData]);

  // ==========================================
  // Password Strength Calculator
  // ==========================================

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'fair';
    if (score <= 4) return 'good';
    return 'strong';
  };

  const getPasswordStrengthColor = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'weak':
        return BRAND_COLORS.error;
      case 'fair':
        return BRAND_COLORS.warning;
      case 'good':
        return '#3B82F6';
      case 'strong':
        return BRAND_COLORS.success;
    }
  };

  const getPasswordStrengthLabel = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
    }
  };

  const getPasswordStrengthWidth = (strength: PasswordStrength): number => {
    switch (strength) {
      case 'weak':
        return 25;
      case 'fair':
        return 50;
      case 'good':
        return 75;
      case 'strong':
        return 100;
    }
  };

  // ==========================================
  // Validation
  // ==========================================

  const validateStep1 = (): boolean => {
    const newErrors: RegisterErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      if (cleanedPhone.length < 10) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: RegisterErrors = {};

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleNext = () => {
    Keyboard.dismiss();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms,
      });

      if (result.success) {
        Alert.alert(
          'Registration Successful',
          'Welcome to MyTalent! Your account has been created.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        setErrors({ general: result.error || 'Registration failed. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Update password strength when password changes
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error for this field
    if (errors[field as keyof RegisterErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = () => {
    router.back();
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    handleInputChange('phone', cleaned);
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
        <Text style={styles.headerTitleText}>Create Account</Text>
        <Text style={styles.headerSubtitleText}>Join MyTalent today</Text>
      </View>
    </View>
  );

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: step === 1 ? '50%' : '100%' },
          ]}
        />
      </View>
      <View style={styles.stepIndicators}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
      </View>
    </View>
  );

  const renderNameInput = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        ref={nameInputRef}
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Enter your full name"
        placeholderTextColor={BRAND_COLORS.textMuted}
        value={formData.name}
        onChangeText={(text) => handleInputChange('name', text)}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => emailInputRef.current?.focus()}
      />
      {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
    </View>
  );

  const renderEmailInput = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Email Address</Text>
      <TextInput
        ref={emailInputRef}
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Enter your email"
        placeholderTextColor={BRAND_COLORS.textMuted}
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => phoneInputRef.current?.focus()}
      />
      {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Phone Number</Text>
      <View style={[styles.phoneContainer, errors.phone && styles.inputError]}>
        <View style={styles.phonePrefix}>
          <Text style={styles.phonePrefixText}>+91</Text>
        </View>
        <TextInput
          ref={phoneInputRef}
          style={styles.phoneInput}
          placeholder="Enter phone number"
          placeholderTextColor={BRAND_COLORS.textMuted}
          value={formData.phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>
      {errors.phone && <Text style={styles.fieldError}>{errors.phone}</Text>}
    </View>
  );

  const renderPasswordInput = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Password</Text>
      <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
        <TextInput
          ref={passwordInputRef}
          style={styles.passwordInput}
          placeholder="Create a password"
          placeholderTextColor={BRAND_COLORS.textMuted}
          value={formData.password}
          onChangeText={(text) => handleInputChange('password', text)}
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

      {/* Password Strength Indicator */}
      {formData.password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${getPasswordStrengthWidth(passwordStrength)}%`,
                  backgroundColor: getPasswordStrengthColor(passwordStrength),
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.strengthLabel,
              { color: getPasswordStrengthColor(passwordStrength) },
            ]}
          >
            {getPasswordStrengthLabel(passwordStrength)}
          </Text>
        </View>
      )}

      {/* Password Requirements */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Password must include:</Text>
        <View style={styles.requirementsList}>
          <Text
            style={[
              styles.requirementItem,
              formData.password.length >= 8 && styles.requirementMet,
            ]}
          >
            {formData.password.length >= 8 ? '✓' : '•'} At least 8 characters
          </Text>
          <Text
            style={[
              styles.requirementItem,
              /[A-Z]/.test(formData.password) && styles.requirementMet,
            ]}
          >
            {/ [A-Z]/.test(formData.password) ? '✓' : '•'} One uppercase letter
          </Text>
          <Text
            style={[
              styles.requirementItem,
              /[a-z]/.test(formData.password) && styles.requirementMet,
            ]}
          >
            {/[a-z]/.test(formData.password) ? '✓' : '•'} One lowercase letter
          </Text>
          <Text
            style={[
              styles.requirementItem,
              /[0-9]/.test(formData.password) && styles.requirementMet,
            ]}
          >
            {/[0-9]/.test(formData.password) ? '✓' : '•'} One number
          </Text>
          <Text
            style={[
              styles.requirementItem,
              /[^a-zA-Z0-9]/.test(formData.password) && styles.requirementMet,
            ]}
          >
            {/[^a-zA-Z0-9]/.test(formData.password) ? '✓' : '•'} One special character
          </Text>
        </View>
      </View>
    </View>
  );

  const renderConfirmPasswordInput = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Confirm Password</Text>
      <View
        style={[
          styles.passwordContainer,
          errors.confirmPassword && styles.inputError,
        ]}
      >
        <TextInput
          ref={confirmPasswordInputRef}
          style={styles.passwordInput}
          placeholder="Confirm your password"
          placeholderTextColor={BRAND_COLORS.textMuted}
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
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
  );

  const renderTermsCheckbox = () => (
    <TouchableOpacity
      style={styles.termsContainer}
      onPress={() => {
        setAcceptTerms(!acceptTerms);
        if (errors.terms) {
          setErrors((prev) => ({ ...prev, terms: undefined }));
        }
      }}
    >
      <View
        style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}
      >
        {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.termsText}>
        I agree to the{' '}
        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {renderNameInput()}
      {renderEmailInput()}
      {renderPhoneInput()}

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Your Password</Text>
      <Text style={styles.stepSubtitle}>
        Create a strong password to secure your account
      </Text>

      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      {renderPasswordInput()}
      {renderConfirmPasswordInput()}
      {renderTermsCheckbox()}
      {errors.terms && (
        <Text style={[styles.fieldError, { marginTop: 8 }]}>{errors.terms}</Text>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderLoginLink = () => (
    <View style={styles.loginContainer}>
      <Text style={styles.loginText}>Already have an account? </Text>
      <TouchableOpacity onPress={handleLogin}>
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
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {renderHeader()}
            {renderProgressIndicator()}

            {step === 1 ? renderStep1() : renderStep2()}

            {renderLoginLink()}
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
    marginBottom: 24,
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

  // Progress
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.card,
  },
  stepDotActive: {
    backgroundColor: BRAND_COLORS.primary,
  },

  // Step Content
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BRAND_COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
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
  fieldError: {
    color: BRAND_COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },

  // Phone
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    paddingHorizontal: 16,
  },
  phonePrefix: {
    marginRight: 8,
  },
  phonePrefixText: {
    fontSize: 16,
    color: BRAND_COLORS.textMuted,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: BRAND_COLORS.text,
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

  // Password Strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 2,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Requirements
  requirementsContainer: {
    marginTop: 16,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_COLORS.textMuted,
    marginBottom: 8,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
  },
  requirementMet: {
    color: BRAND_COLORS.success,
  },

  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BRAND_COLORS.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    lineHeight: 20,
  },
  termsLink: {
    color: BRAND_COLORS.primary,
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

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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
