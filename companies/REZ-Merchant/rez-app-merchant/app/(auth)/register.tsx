/**
 * Registration Screen — Phone + OTP flow.
 * Step 1: Enter phone → send OTP
 * Step 2: Enter OTP → verify and create account
 * Step 3: Enter business details → complete registration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import { Card, Button, Heading1, Heading3, BodyText } from '@/components/ui/DesignSystemComponents';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';
import { showAlert } from '@/utils/alert';
import { CountryCodePicker, COUNTRIES, Country } from '@/components/ui/CountryCodePicker';

// ─── Types & Steps ─────────────────────────────────────────────────────────────

type Step = 'phone' | 'otp' | 'details';

// ─── OTP Input ─────────────────────────────────────────────────────────────────

interface OTPInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

const OTPInput = ({ value, onChange, length = 6 }: OTPInputProps) => {
  const refs = useRef<(RNTextInput | null)[]>([]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  const handleChange = (text: string, idx: number) => {
    const cleaned = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = cleaned;
    onChange(newDigits.join(''));
    if (cleaned && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={otpStyles.container}>
      {digits.map((d, i) => (
        <RNTextInput
          key={i}
          ref={(r) => {
            refs.current[i] = r;
          }}
          style={[otpStyles.box, d && otpStyles.boxFilled]}
          value={d}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          textContentType={i === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          accessibilityLabel={`OTP digit ${i + 1} of 6`}
          accessibilityRole="text"
        />
      ))}
    </View>
  );
};

const otpStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.default,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  boxFilled: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
});

// ─── Field Input ───────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?;
  autoCapitalize?;
  secureTextEntry?: boolean;
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  icon,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: FieldProps) => (
  <View style={fieldStyles.container}>
    <BodyText style={fieldStyles.label}>{label}</BodyText>
    <View style={fieldStyles.inputRow}>
      {icon && (
        <Ionicons name={icon} size={18} color={Colors.text.tertiary} style={fieldStyles.icon} />
      )}
      <RNTextInput
        style={[fieldStyles.input, icon && fieldStyles.inputWithIcon]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        secureTextEntry={secureTextEntry}
      />
    </View>
  </View>
);

const fieldStyles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
  },
  icon: { paddingLeft: 12 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
  },
  inputWithIcon: { paddingLeft: 8 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { state, register, clearError, updateMerchant, updateUser } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount to prevent memory leaks
  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    []
  );

  // Step 1
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // defaults to India (+91)
  const [phone, setPhone] = useState('');
  // Step 2
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState(''); // Server token for OTP verification
  // Step 3
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────

  const sendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      showAlert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    const fullPhone = `${selectedCountry.dial}${cleaned}`;
    setLoading(true);
    try {
      const response = await apiClient.post<{ token?: string }>('merchant/auth/send-otp', {
        phone: fullPhone,
      });
      if (response.success) {
        setOtpToken(response.data?.token || '');
        setStep('otp');
        startResendCooldown();
      } else {
        showAlert('Failed', response.message || 'Could not send OTP. Please try again.');
      }
    } catch (error: unknown) {
      const e = error as { message?: string };
      // Do not silently bypass failures - surface the error
      // so the dev flow reflects real auth state.
      showAlert('Error', e.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────

  const verifyOTP = async () => {
    // OTP must be 6 digits to match backend expectation
    if (otp.length < 6) {
      showAlert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }
    const fullPhone = `${selectedCountry.dial}${phone.replace(/\D/g, '')}`;
    setLoading(true);
    try {
      const response = await apiClient.post('merchant/auth/verify-otp', {
        phone: fullPhone,
        otp,
        token: otpToken,
      });
      if (response.success) {
        setStep('details');
      } else {
        showAlert('Invalid OTP', response.message || 'OTP verification failed. Please try again.');
      }
    } catch (error: unknown) {
      const e = error as { message?: string };
      // Do not silently bypass OTP verification failures.
      showAlert('Error', e.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Complete Registration ──────────────────────────────────────

  const completeRegistration = async () => {
    if (!businessName.trim()) {
      showAlert('Required', 'Please enter your business name.');
      return;
    }
    if (!ownerName.trim()) {
      showAlert('Required', 'Please enter owner name.');
      return;
    }
    // Validate email format when provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    // Enforce password strength matching backend requirement (10+ chars with complexity)
    if (password.length < 10 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      showAlert(
        'Error',
        'Password must be 10+ chars with uppercase, lowercase, number, and special character'
      );
      return;
    }

    const fullPhone = `${selectedCountry.dial}${phone.replace(/\D/g, '')}`;
    setLoading(true);
    try {
      const registrationData = {
        phone: fullPhone,
        otp,
        otpToken,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim() || undefined,
        password,
      };

      const response = await apiClient.post<{
        token?: string;
        merchant?;
        user?;
      }>('merchant/auth/register-otp', registrationData);

      if (response.success) {
        // Store token/merchant/user directly from registration response
        // instead of calling login(phone, password) — login() expects email+password
        // and would hit a different endpoint, causing a second unnecessary API call.
        const data = response.data;
        if (data?.token) {
          await storageService.setAuthToken(data.token);
          if (data.merchant) {
            await storageService.setMerchantData(data.merchant);
            updateMerchant(data.merchant);
          }
          if (data.user) {
            await storageService.setUserData(data.user);
            updateUser(data.user);
          }
          apiClient.setToken(data.token);
        }
        showAlert('Account Created!', "Welcome to Rez Merchant! Let's complete your store setup.", [
          { text: 'Continue', onPress: () => router.replace('/onboarding') },
        ]);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: unknown) {
      const e = error as { message?: string };
      // Do not navigate to onboarding without proper auth state.
      showAlert('Registration Failed', e.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend Cooldown ─────────────────────────────────────────────────────

  // Store interval in ref so it can be cleared on unmount
  const startResendCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[800]]}
          style={styles.backgroundGradient}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              {/* Header */}
              <View style={styles.header}>
                <Heading1 style={styles.title}>Join Rez Merchant</Heading1>
                <BodyText style={styles.subtitle}>
                  {step === 'phone' && 'Enter your mobile number to get started'}
                  {step === 'otp' && `Enter the OTP sent to ${selectedCountry.dial} ${phone}`}
                  {step === 'details' && 'Almost there! Set up your business profile'}
                </BodyText>

                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                  {(['phone', 'otp', 'details'] as Step[]).map((s, i) => (
                    <View key={s} style={styles.stepRow}>
                      <View
                        style={[
                          styles.stepDot,
                          step === s && styles.stepDotActive,
                          (['phone', 'otp', 'details'] as Step[]).indexOf(step) > i &&
                            styles.stepDotDone,
                        ]}
                      >
                        {(['phone', 'otp', 'details'] as Step[]).indexOf(step) > i ? (
                          <Ionicons name="checkmark" size={12} color="white" />
                        ) : (
                          <BodyText style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                            {i + 1}
                          </BodyText>
                        )}
                      </View>
                      {i < 2 && (
                        <View
                          style={[
                            styles.stepLine,
                            (['phone', 'otp', 'details'] as Step[]).indexOf(step) > i &&
                              styles.stepLineDone,
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Card */}
              <Card style={styles.formContainer} variant="elevated">
                {/* STEP 1: Phone */}
                {step === 'phone' && (
                  <Animated.View entering={FadeInDown.delay(50)} style={styles.form}>
                    <Heading3 style={styles.stepTitle}>Your Mobile Number</Heading3>
                    <View style={styles.phoneRow}>
                      <CountryCodePicker
                        value={selectedCountry}
                        onChange={setSelectedCountry}
                        style={styles.countryCode}
                      />
                      <RNTextInput
                        style={styles.phoneInput}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="10-digit mobile number"
                        placeholderTextColor={Colors.text.tertiary}
                        keyboardType="phone-pad"
                        maxLength={10}
                        autoFocus
                      />
                    </View>
                    <BodyText style={styles.hint}>
                      We'll send a verification code to this number.
                    </BodyText>
                    <Button
                      title={loading ? 'Sending OTP...' : 'Send OTP'}
                      onPress={sendOTP}
                      loading={loading}
                      fullWidth
                      style={styles.actionButton}
                    />
                    <View style={styles.footer}>
                      <BodyText>Already have an account? </BodyText>
                      <Button
                        title="Sign In"
                        variant="ghost"
                        onPress={() => router.push('/(auth)/login')}
                        size="small"
                        style={{ height: 'auto', paddingHorizontal: 4 }}
                      />
                    </View>
                  </Animated.View>
                )}

                {/* STEP 2: OTP */}
                {step === 'otp' && (
                  <Animated.View entering={FadeInDown.delay(50)} style={styles.form}>
                    <Heading3 style={styles.stepTitle}>Enter Verification Code</Heading3>
                    <BodyText style={styles.otpSubtitle}>
                      6-digit code sent to {selectedCountry.dial} {phone}
                    </BodyText>
                    <OTPInput value={otp} onChange={setOtp} length={6} />
                    <Button
                      title={loading ? 'Verifying...' : 'Verify OTP'}
                      onPress={verifyOTP}
                      loading={loading}
                      fullWidth
                      style={styles.actionButton}
                    />
                    <View style={styles.resendRow}>
                      {resendCooldown > 0 ? (
                        <BodyText style={styles.resendCooldown}>
                          Resend in {resendCooldown}s
                        </BodyText>
                      ) : (
                        <Button
                          title="Resend OTP"
                          variant="ghost"
                          onPress={() => {
                            setOtp('');
                            sendOTP();
                          }}
                          size="small"
                        />
                      )}
                    </View>
                    <Button
                      title="Change Number"
                      variant="ghost"
                      onPress={() => {
                        setStep('phone');
                        setOtp('');
                      }}
                      size="small"
                      style={styles.changeButton}
                    />
                  </Animated.View>
                )}

                {/* STEP 3: Details */}
                {step === 'details' && (
                  <Animated.View entering={FadeInDown.delay(50)} style={styles.form}>
                    <Heading3 style={styles.stepTitle}>Business Details</Heading3>
                    <Field
                      label="Business Name *"
                      value={businessName}
                      onChange={setBusinessName}
                      placeholder="Your store or business name"
                      icon="storefront-outline"
                    />
                    <Field
                      label="Owner Name *"
                      value={ownerName}
                      onChange={setOwnerName}
                      placeholder="Your full name"
                      icon="person-outline"
                    />
                    <Field
                      label="Email (optional)"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      icon="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Field
                      label="Password *"
                      value={password}
                      onChange={setPassword}
                      placeholder="Min. 10 chars, A-Z, a-z, 0-9, @$!%*?&"
                      icon="lock-closed-outline"
                      secureTextEntry
                    />
                    <Button
                      title={loading ? 'Creating Account...' : 'Create My Account'}
                      onPress={completeRegistration}
                      loading={loading}
                      fullWidth
                      style={styles.actionButton}
                    />
                  </Animated.View>
                )}
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '40%',
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 8,
  },
  title: {
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: 'white' },
  stepDotDone: { backgroundColor: Colors.success[500] },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: Colors.success[400] },
  formContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  form: { gap: Spacing.md },
  stepTitle: {
    marginBottom: Spacing.xs,
    color: Colors.primary[600],
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.background.secondary,
    borderRightWidth: 1.5,
    borderRightColor: Colors.border.default,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  actionButton: { marginTop: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  otpSubtitle: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 13,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendCooldown: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  changeButton: {
    alignSelf: 'center',
  },
});
