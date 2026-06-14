import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../api/client';
import { secureStorage } from '../services/secure-storage';
import { driverApi } from '../services/api.service';

interface DriverOTPScreenProps {
  phone: string;
  onVerified: (token: string, driver: any) => void;
  onBack: () => void;
}

export const DriverOTPScreen: React.FC<DriverOTPScreenProps> = ({ phone, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Countdown for resend
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((digit) => digit) && newOtp.join('').length === 4) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 4) {
      setError('Please enter 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await driverApi.verifyOTP(phone, code);

      if (response.success && response.token) {
        // Save auth data
        await secureStorage.setToken(response.token);
        if (response.refreshToken) {
          await secureStorage.setRefreshToken(response.refreshToken);
        }
        await secureStorage.setUserData({
          id: response.driver?.id,
          phone: response.driver?.phone,
          name: response.driver?.name,
        });

        driverApi.setToken(response.token);
        onVerified(response.token, response.driver);
      } else {
        setError(response.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await driverApi.requestOTP(phone);
      setResendTimer(30);
      Alert.alert('OTP Sent', 'Check your phone for the new code');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to +91 {phone}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, error && styles.otpInputError]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerify()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't receive code?"}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0 || loading}
          >
            <Text style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  backText: {
    color: '#6B4EFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3d3d54',
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpInputError: {
    borderColor: '#ef4444',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 12,
    marginTop: 40,
  },
  verifyButtonDisabled: {
    backgroundColor: '#4a4a6a',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  resendText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  resendButton: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#4a4a6a',
  },
});

export default DriverOTPScreen;
