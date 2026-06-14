// OTP Input Screen Component
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/Button';
import { OTPInput } from './OTPInput';
import { rezApi } from '@/services/rezApi';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function OTPInputScreen({ phone, onVerified, onBack }: Props) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid', 'Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await rezApi.verifyOTP(phone, otp);
      if (result.success && result.token) {
        await login(result.token, result.user);
        onVerified();
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const result = await rezApi.sendOTP(phone);
      if (result.success) {
        setResendTimer(30);
        Alert.alert('Success', 'OTP resent successfully');
      } else {
        Alert.alert('Error', 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.label }]}>
            Verify OTP
          </Text>
          <Text style={[styles.subtitle, { color: colors.labelSecondary }]}>
            Enter the 4-digit code sent to{'\n'}+91 {phone}
          </Text>
        </View>

        <View style={styles.otpContainer}>
          <OTPInput
            length={4}
            value={otp}
            onChange={setOtp}
          />
        </View>

        <View style={styles.timer}>
          {resendTimer > 0 ? (
            <Text style={[styles.timerText, { color: colors.labelTertiary }]}>
              Resend OTP in {resendTimer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendText, { color: colors.primary }]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length !== 4}
          fullWidth
          size="large"
        >
          Verify
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  otpContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  timer: {
    alignItems: 'center',
    marginBottom: 32,
    height: 24,
  },
  timerText: {
    fontSize: 14,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
