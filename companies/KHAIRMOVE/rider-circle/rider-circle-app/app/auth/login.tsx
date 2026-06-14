/**
 * Login Screen
 * Phone/OTP authentication flow for RiderCircle
 */

import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4200';

/**
 * Login screen with phone verification flow
 * Flow: Enter phone → Send OTP → Verify OTP → Redirect to app
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpSent, setOtpSent] = useState(false);

  /**
   * Send OTP to the provided phone number
   * Calls the backend API to send OTP via SMS
   */
  const handleSendOTP = async () => {
    // Validate phone number (basic validation)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      // Call backend API to send OTP
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setStep('otp');
      Alert.alert('OTP Sent', `A verification code has been sent to +${cleanPhone}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
    }
  };

  /**
   * Verify the entered OTP
   * Calls backend API to validate OTP and complete login
   */
  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    try {
      await login(phone, otp);
      router.replace('/(tabs)');
    } catch (err) {
      // Error is handled by the auth store
      Alert.alert('Error', 'Invalid OTP or session expired. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoIcon}>🚴</Text>
        <Text style={styles.logoText}>RiderCircle</Text>
        <Text style={styles.tagline}>The Operating System for Adventure Mobility</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {step === 'phone' ? (
          <>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>

            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Text style={styles.inputIcon}>📱</Text>}
            />

            <Button
              title="Send OTP"
              onPress={handleSendOTP}
              fullWidth
              style={styles.button}
            />

            <Text style={styles.helpText}>
              We'll send you a verification code
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We sent a code to {phone}
            </Text>

            <Input
              label="Enter OTP"
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<Text style={styles.inputIcon}>🔢</Text>}
            />

            <Button
              title="Verify & Login"
              onPress={handleVerifyOTP}
              loading={isLoading}
              fullWidth
              style={styles.button}
            />

            <Button
              title="Resend OTP"
              variant="outline"
              onPress={handleSendOTP}
              fullWidth
              style={styles.resendButton}
              disabled={isLoading}
            />
          </>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#e94560',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  inputIcon: {
    fontSize: 18,
  },
  button: {
    marginTop: 16,
  },
  resendButton: {
    marginTop: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
  termsContainer: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#e94560',
  },
});
