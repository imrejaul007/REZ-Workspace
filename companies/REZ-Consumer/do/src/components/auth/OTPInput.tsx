import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/Button';

interface OTPInputProps {
  phone: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  phone,
  onVerify,
  onResend,
  onBack,
}) => {
  const { colors, spacing, typography } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Countdown timer for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    Haptics.selectionAsync();

    // Only allow digits
    const digit = value.replace(/\D/g, '');
    if (digit.length > 1) {
      // Handle paste
      const digits = digit.split('').slice(0, 4);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 4) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp);
      const lastIndex = Math.min(index + digits.length, 3);
      inputRefs.current[lastIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus next input
      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setError('');

    // Auto-submit when all digits entered
    if (index === 3 && digit && otp.every((d, i) => i === index || d)) {
      // Already handled below
    }
  };

  const handleKeyPress = (e, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      setError('Please enter the complete code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(otpString);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    try {
      await onResend();
      setCountdown(30);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      // Handle error
    }
  };

  const isComplete = otp.every((d) => d.length === 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.label} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View entering={FadeIn} style={styles.content}>
          <Text style={[styles.title, { color: colors.label, ...typography.displayMedium }]}>
            Enter code
          </Text>
          <Text style={[styles.subtitle, { color: colors.labelSecondary, ...typography.bodyLarge }]}>
            We sent a code to{'\n'}+91 {phone}
          </Text>

          {/* OTP Inputs */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.fill,
                    color: colors.label,
                    borderColor: error ? colors.systemRed : digit ? colors.primary : colors.separator,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </Animated.View>

          {error && (
            <Text style={[styles.error, { color: colors.systemRed }]}>
              {error}
            </Text>
          )}

          {/* Verify Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Button
              variant="primary"
              size="large"
              onPress={handleVerify}
              loading={loading}
              disabled={!isComplete}
              fullWidth
            >
              Verify
            </Button>
          </Animated.View>

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.labelSecondary, ...typography.bodyMedium }]}>
              Didn't get the code?
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
              <Text
                style={[
                  styles.resendButton,
                  { color: countdown > 0 ? colors.labelTertiary : colors.primary },
                ]}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  resendText: {},
  resendButton: {
    fontSize: 15,
    fontWeight: '600',
  },
});
