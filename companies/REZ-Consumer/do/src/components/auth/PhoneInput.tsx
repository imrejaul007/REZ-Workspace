import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/Button';
import { useUserStore } from '@/stores';
import { rezApi } from '@/services/rezApi';

export const PhoneInputScreen: React.FC = () => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { setProfile, setLoading, setAuthenticated } = useUserStore();

  const [phone, setPhone] = useState('');
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (text: string) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
    setError('');
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoadingState(true);
    setError('');

    try {
      await rezApi.sendOTP(`+91${phone}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to OTP verification
      // In a real app, use navigation
      // navigation.navigate('OTP', { phone: `+91${phone}` });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingState(false);
    }
  };

  const isValid = phone.length === 10;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <ChevronLeft size={24} color={colors.label} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View entering={FadeIn} style={styles.content}>
          <Text style={[styles.title, { color: colors.label, ...typography.displayMedium }]}>
            Enter your phone
          </Text>
          <Text style={[styles.subtitle, { color: colors.labelSecondary, ...typography.bodyLarge }]}>
            We'll send you a verification code
          </Text>

          {/* Phone Input */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.inputContainer}>
            <View style={[styles.phoneInput, { backgroundColor: colors.fill }]}>
              <Text style={[styles.countryCode, { color: colors.label }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: colors.label }]}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="9876543210"
                placeholderTextColor={colors.labelTertiary}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>

            {error && (
              <Text style={[styles.error, { color: colors.systemRed }]}>
                {error}
              </Text>
            )}
          </Animated.View>

          {/* Continue Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Button
              variant="primary"
              size="large"
              onPress={handleSendOTP}
              loading={loading}
              disabled={!isValid}
              fullWidth
            >
              Continue
            </Button>
          </Animated.View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.labelTertiary, ...typography.captionMedium }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: '500',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: '100%',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
  terms: {
    textAlign: 'center',
    marginTop: 24,
  },
});
