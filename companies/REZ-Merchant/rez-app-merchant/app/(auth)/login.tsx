import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import { Card, Button, Heading1, BodyText, Heading3 } from '@/components/ui/DesignSystemComponents';
import { platformAlertSimple } from '@/utils/platformAlert';
import {
  useLoginAttemptTracking,
  formatLockoutTime,
  MAX_ATTEMPTS,
} from '@/hooks/useLoginAttemptTracking';
import { unifiedApi, OTPSendResponse } from '@/services/unifiedApi';

const { width } = Dimensions.get('window');

// Login mode enum
type LoginMode = 'email' | 'phone';

export default function LoginScreen() {
  const { state, login, clearError } = useAuth();

  // Email/Password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP mode
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpResponse, setOtpResponse] = useState<OTPSendResponse | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shared loading state
  const [loading, setLoading] = useState(false);

  const {
    isLocked,
    remainingAttempts,
    lockoutRemainingMs,
    checkLockout,
    recordFailedAttempt,
    clearAttempts,
  } = useLoginAttemptTracking();

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendTimerRef.current) clearInterval(resendTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, [resendCooldown > 0]);

  // Check lockout status when email changes
  useEffect(() => {
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail) {
      checkLockout(trimmedEmail);
    }
  }, [email, checkLockout]);

  // Calculate remaining attempts from state
  useEffect(() => {
    if (state.isAuthenticated) {
      // Clear attempts on successful authentication
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail) {
        clearAttempts(trimmedEmail);
      }
    }
  }, [state.isAuthenticated, email, clearAttempts]);

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace('/(dashboard)');
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (state.error && typeof state.error === 'string') {
      platformAlertSimple('Login Error', state.error);
      clearError();
    }
  }, [state.error]);

  // ─── Phone OTP Handlers ──────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      platformAlertSimple('Phone Required', 'Please enter your phone number.');
      return;
    }

    // Basic phone validation
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      platformAlertSimple('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await unifiedApi.auth.sendOTP(trimmedPhone);
      setOtpResponse(response);
      setOtpSent(true);
      setResendCooldown(30); // 30 second cooldown before resend

      platformAlertSimple(
        'OTP Sent',
        `A 6-digit code was sent to ${response.maskedPhone}. Valid for ${Math.floor(response.expiresIn / 60)} minutes.`
      );
    } catch (error) {
      const message = error.message || 'Failed to send OTP. Please try again.';
      platformAlertSimple('OTP Error', message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setOtpLoading(true);
    try {
      const response = await unifiedApi.auth.resendOTP(phone);
      setOtpResponse(response);
      setResendCooldown(30);

      platformAlertSimple(
        'OTP Resent',
        `A new code was sent to ${response.maskedPhone}.`
      );
    } catch (error) {
      const message = error.message || 'Failed to resend OTP. Please try again.';
      platformAlertSimple('OTP Error', message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const trimmedOtp = otp.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      platformAlertSimple('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }

    setVerifyLoading(true);
    try {
      const response = await unifiedApi.auth.loginWithOTP(trimmedPhone, trimmedOtp);

      if (response.success && response.token && response.user) {
        // Store the token and user data for session restoration
        try {
          const { storageService } = await import('@/services/storage');
          await storageService.setAuthToken(response.token);
          await storageService.setUserData({
            id: response.user.id,
            email: response.user.email,
            name: response.user.firstName || response.user.lastName || 'Merchant',
            phone: response.user.phone,
            role: response.user.role,
            merchantId: response.user.merchantId,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // For existing users, fetch merchant data
          if (response.merchant) {
            await storageService.setMerchantData({
              id: response.merchant.id,
              name: response.merchant.name,
              isActive: response.merchant.isActive,
              email: response.user.email,
            } as unknown);
          }

          // Trigger auth state update
          const { apiClient } = await import('@/services/api/client');
          apiClient.setToken(response.token);

          // Navigate to dashboard
          router.replace('/(dashboard)');
        } catch (storageError) {
          console.error('Failed to store auth data:', storageError);
          platformAlertSimple('Login Error', 'Failed to save login session. Please try again.');
        }
      } else if (response.isNewUser) {
        // New user - redirect to registration with phone
        platformAlertSimple(
          'Welcome!',
          'Please complete your registration to get started.',
          [
            {
              text: 'Continue',
              onPress: () => router.push({ pathname: '/(auth)/register', params: { phone: trimmedPhone } }),
            },
          ]
        );
      }
    } catch (error) {
      const code = error.code || 'VERIFY_FAILED';
      let message = error.message || 'Verification failed. Please try again.';

      if (code === 'INVALID_OTP') {
        message = 'Invalid OTP code. Please check and try again.';
        if (error.details) {
          message += ` (${error.details} attempts remaining)`;
        }
      } else if (code === 'OTP_EXPIRED') {
        message = 'OTP has expired. Please request a new one.';
        setOtpSent(false);
        setOtp('');
      } else if (code === 'RATE_LIMITED') {
        message = 'Too many attempts. Please wait a moment and try again.';
      }

      platformAlertSimple('Verification Error', message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleOTPDigitChange = (text: string, index: number) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '');
    if (digits.length > 1) return; // Ignore if pasting multiple digits

    const newOtp = otp.split('');
    newOtp[index] = digits;
    setOtp(newOtp.join(''));

    // Auto-focus next input
    if (digits && index < 5) {
      // Would need refs for auto-focus - simplified for now
    }
  };

  // ─── Email/Password Handlers ─────────────────────────────────────────────────

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      platformAlertSimple('Email Required', 'Please enter your email address.');
      return;
    }
    if (!password) {
      platformAlertSimple('Password Required', 'Please enter your password.');
      return;
    }

    // Check if account is locked due to too many failed attempts
    const locked = await checkLockout(trimmedEmail);
    if (locked) {
      const remainingTime = formatLockoutTime(lockoutRemainingMs);
      platformAlertSimple(
        'Account Temporarily Locked',
        `Too many failed login attempts. Please try again in ${remainingTime}.`
      );
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      // Login successful - clear failed attempts
      await clearAttempts(trimmedEmail);
    } catch (e) {
      // Login failed - record failed attempt
      await recordFailedAttempt(trimmedEmail);

      // Check if now locked
      const nowLocked = await checkLockout(trimmedEmail);
      if (nowLocked) {
        const remainingTime = formatLockoutTime(lockoutRemainingMs);
        platformAlertSimple(
          'Account Temporarily Locked',
          `Too many failed login attempts. Your account is now locked for ${remainingTime}.`
        );
      } else {
        // Get updated remaining attempts from hook
        const remaining = Math.max(0, remainingAttempts - 1);
        const attemptsMessage = remaining > 0
          ? `You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your account is locked.`
          : 'This was your last attempt before the account is locked.';
        platformAlertSimple('Login Failed', `${e.message || 'Invalid email or password.'} ${attemptsMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = loginMode === 'phone' ? handleVerifyOTP : handleEmailLogin;

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
                <Heading1 style={styles.title}>Rez Merchant</Heading1>
                <BodyText style={styles.subtitle}>Sign in to your merchant account</BodyText>
              </View>

              {/* Card */}
              <Card style={styles.formContainer} variant="elevated">
                <Animated.View entering={FadeInDown.delay(50)} style={styles.form}>

                  {/* Login Mode Toggle */}
                  <View style={styles.modeToggle}>
                    <TouchableOpacity
                      style={[styles.modeButton, loginMode === 'email' && styles.modeButtonActive]}
                      onPress={() => {
                        setLoginMode('email');
                        setOtpSent(false);
                        setOtp('');
                      }}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={16}
                        color={loginMode === 'email' ? Colors.primary[600] : Colors.text.tertiary}
                      />
                      <Text style={[styles.modeButtonText, loginMode === 'email' && styles.modeButtonTextActive]}>
                        Email
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeButton, loginMode === 'phone' && styles.modeButtonActive]}
                      onPress={() => {
                        setLoginMode('phone');
                      }}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={16}
                        color={loginMode === 'phone' ? Colors.primary[600] : Colors.text.tertiary}
                      />
                      <Text style={[styles.modeButtonText, loginMode === 'phone' && styles.modeButtonTextActive]}>
                        Phone
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* ─── Email/Password Mode ─── */}
                  {loginMode === 'email' && (
                    <>
                      {/* Email */}
                      <View>
                        <Heading3 style={styles.fieldLabel}>Email</Heading3>
                        <View style={styles.inputRow}>
                          <Ionicons
                            name="mail-outline"
                            size={20}
                            color={Colors.text.tertiary}
                            style={styles.inputIcon}
                          />
                          <RNTextInput
                            style={styles.textInput}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={Colors.text.tertiary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            editable={!loading && !isLocked}
                            autoFocus
                          />
                        </View>
                      </View>

                      {/* Password */}
                      <View>
                        <Heading3 style={styles.fieldLabel}>Password</Heading3>
                        <View style={styles.inputRow}>
                          <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color={Colors.text.tertiary}
                            style={styles.inputIcon}
                          />
                          <RNTextInput
                            style={[styles.textInput, { flex: 1 }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor={Colors.text.tertiary}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="password"
                            editable={!loading && !isLocked}
                            onSubmitEditing={handleLogin}
                          />
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={Colors.text.tertiary}
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                          />
                        </View>
                      </View>

                      {/* Forgot Password */}
                      <View style={styles.forgotRow}>
                        <Button
                          title="Forgot Password?"
                          variant="ghost"
                          onPress={() => router.push('/(auth)/forgot-password')}
                          size="small"
                          style={{ height: 'auto', paddingHorizontal: 0 }}
                          disabled={isLocked || loading}
                        />
                      </View>

                      {/* Lockout Warning */}
                      {isLocked && (
                        <View style={styles.lockoutWarning}>
                          <Ionicons
                            name="lock-closed"
                            size={16}
                            color={Colors.error[500]}
                          />
                          <BodyText style={styles.lockoutText}>
                            Account temporarily locked.{'\n'}
                            Try again in {formatLockoutTime(lockoutRemainingMs)}.
                          </BodyText>
                        </View>
                      )}

                      {/* Login Button */}
                      <Button
                        title={
                          isLocked
                            ? `Locked (${formatLockoutTime(lockoutRemainingMs)})`
                            : loading
                            ? 'Signing in...'
                            : 'Sign In'
                        }
                        onPress={handleLogin}
                        loading={loading && !isLocked}
                        disabled={loading || isLocked}
                        fullWidth
                        style={styles.actionButton}
                      />

                      {/* Remaining Attempts Warning */}
                      {!isLocked && remainingAttempts < MAX_ATTEMPTS && remainingAttempts > 0 && (
                        <View style={styles.attemptsWarning}>
                          <BodyText style={styles.attemptsText}>
                            {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining
                          </BodyText>
                        </View>
                      )}
                    </>
                  )}

                  {/* ─── Phone OTP Mode ─── */}
                  {loginMode === 'phone' && (
                    <>
                      {/* Phone Number */}
                      <View>
                        <Heading3 style={styles.fieldLabel}>Phone Number</Heading3>
                        <View style={styles.inputRow}>
                          <Ionicons
                            name="phone-portrait-outline"
                            size={20}
                            color={Colors.text.tertiary}
                            style={styles.inputIcon}
                          />
                          <RNTextInput
                            style={[styles.textInput, { flex: 1 }]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+91 98765 43210"
                            placeholderTextColor={Colors.text.tertiary}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!otpLoading && !otpSent}
                            autoFocus={loginMode === 'phone'}
                          />
                        </View>
                      </View>

                      {/* Send OTP Button */}
                      {!otpSent && (
                        <Button
                          title={otpLoading ? 'Sending OTP...' : 'Send OTP'}
                          onPress={handleSendOTP}
                          loading={otpLoading}
                          disabled={otpLoading || !phone.trim()}
                          fullWidth
                          style={styles.actionButton}
                          variant="secondary"
                        />
                      )}

                      {/* OTP Input */}
                      {otpSent && (
                        <>
                          <View>
                            <Heading3 style={styles.fieldLabel}>Enter OTP</Heading3>
                            <View style={styles.otpInputRow}>
                              <Ionicons
                                name="key-outline"
                                size={20}
                                color={Colors.text.tertiary}
                                style={styles.inputIcon}
                              />
                              <RNTextInput
                                style={[styles.textInput, { flex: 1, letterSpacing: 4, textAlign: 'center' }]}
                                value={otp}
                                onChangeText={(text) => {
                                  const digits = text.replace(/\D/g, '').slice(0, 6);
                                  setOtp(digits);
                                }}
                                placeholder="000000"
                                placeholderTextColor={Colors.text.tertiary}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!verifyLoading}
                              />
                            </View>
                          </View>

                          {/* OTP Info */}
                          <View style={styles.otpInfo}>
                            <BodyText style={styles.otpInfoText}>
                              Code sent to {otpResponse?.maskedPhone || 'your phone'}
                            </BodyText>
                            {otpResponse?.expiresIn && (
                              <BodyText style={styles.otpExpiryText}>
                                Expires in {Math.floor(otpResponse.expiresIn / 60)}:{String(otpResponse.expiresIn % 60).padStart(2, '0')}
                              </BodyText>
                            )}
                          </View>

                          {/* Verify OTP Button */}
                          <Button
                            title={verifyLoading ? 'Verifying...' : 'Verify & Login'}
                            onPress={handleVerifyOTP}
                            loading={verifyLoading}
                            disabled={verifyLoading || otp.length !== 6}
                            fullWidth
                            style={styles.actionButton}
                          />

                          {/* Resend OTP */}
                          <View style={styles.resendRow}>
                            <BodyText style={styles.resendText}>Didn't receive the code? </BodyText>
                            <TouchableOpacity
                              onPress={handleResendOTP}
                              disabled={resendCooldown > 0 || otpLoading}
                            >
                              <Text style={[
                                styles.resendButton,
                                (resendCooldown > 0 || otpLoading) && styles.resendButtonDisabled
                              ]}>
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Change Phone Number */}
                          <Button
                            title="Change Phone Number"
                            variant="ghost"
                            onPress={() => {
                              setOtpSent(false);
                              setOtp('');
                              setOtpResponse(null);
                            }}
                            size="small"
                            style={{ height: 'auto', paddingHorizontal: 0 }}
                            disabled={otpLoading || verifyLoading}
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* Sign Up Link */}
                  <View style={styles.footer}>
                    <BodyText>Don't have an account? </BodyText>
                    <Button
                      title="Sign Up"
                      variant="ghost"
                      onPress={() => router.push('/(auth)/register')}
                      size="small"
                      style={{ height: 'auto', paddingHorizontal: 4 }}
                    />
                  </View>
                </Animated.View>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

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
  formContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  form: { gap: Spacing.md },
  fieldLabel: {
    marginBottom: Spacing.xs,
    color: Colors.primary[600],
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 14,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: 16,
    color: Colors.text.primary,
  },
  eyeIcon: {
    paddingRight: 14,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -Spacing.xs,
  },
  actionButton: { marginTop: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  lockoutWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.error[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  lockoutText: {
    flex: 1,
    color: Colors.error[700],
    fontSize: 13,
    lineHeight: 18,
  },
  attemptsWarning: {
    alignItems: 'center',
    marginTop: -Spacing.xs,
  },
  attemptsText: {
    color: Colors.warning[600],
    fontSize: 12,
  },
  // Mode Toggle Styles
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: Colors.background.primary,
    ...Shadows.sm,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  modeButtonTextActive: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  // OTP Styles
  otpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    overflow: 'hidden',
  },
  otpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  otpInfoText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  otpExpiryText: {
    fontSize: 12,
    color: Colors.warning[600],
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  resendText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  resendButton: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  resendButtonDisabled: {
    color: Colors.text.tertiary,
  },
});
