// Phone Input Screen Component
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/Button';
import { PhoneInput } from './PhoneInput';
import { rezApi } from '@/services/rezApi';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface Props {
  onSubmit: (phone: string) => void;
}

export default function PhoneInputScreen({ onSubmit }: Props) {
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(true);
  const { status: biometricStatus, canUseBiometric, authenticate } = useBiometricAuth();

  // Check for biometric on mount
  useEffect(() => {
    const checkBiometric = async () => {
      setCheckingBiometric(true);
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UI
      setCheckingBiometric(false);
    };
    checkBiometric();
  }, []);

  // Try biometric authentication if enabled
  useEffect(() => {
    const tryBiometric = async () => {
      if (!biometricStatus.isEnabled || !canUseBiometric()) {
        return;
      }

      // Small delay to show the phone screen first
      const timer = setTimeout(async () => {
        const result = await authenticate({
          promptMessage: 'Sign in to Do',
        });

        if (result.success) {
          // Biometric successful - we still need the phone for API calls
          // Show success and allow phone entry
          Alert.alert(
            'Welcome Back!',
            'Authentication successful',
            [{ text: 'OK' }]
          );
        }
      }, 500);

      return () => clearTimeout(timer);
    };

    if (!checkingBiometric) {
      tryBiometric();
    }
  }, [checkingBiometric, biometricStatus.isEnabled, canUseBiometric, authenticate]);

  const getBiometricIcon = () => {
    switch (biometricStatus.biometricType) {
      case 'Face ID':
        return '👤';
      case 'Touch ID':
        return '👆';
      default:
        return '🔐';
    }
  };

  const handleBiometricPress = useCallback(async () => {
    if (!canUseBiometric()) {
      Alert.alert(
        'Biometric Unavailable',
        'Please set up biometric authentication in your device settings first.'
      );
      return;
    }

    const result = await authenticate({
      promptMessage: 'Sign in to Do',
    });

    if (!result.success) {
      if (result.error && !result.error.includes('cancel')) {
        Alert.alert('Authentication Failed', result.error);
      }
    }
  }, [canUseBiometric, authenticate]);

  const handleContinue = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await rezApi.sendOTP(phone);
      if (result.success) {
        onSubmit(phone);
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.label }]}>
            Welcome to Do
          </Text>
          <Text style={[styles.subtitle, { color: colors.labelSecondary }]}>
            Enter your phone number to continue
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            placeholder="Enter phone number"
          />
        </View>

        <View style={styles.terms}>
          <Text style={[styles.termsText, { color: colors.labelTertiary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Biometric Quick Login */}
        {biometricStatus.isEnabled && canUseBiometric() && (
          <TouchableOpacity
            style={[styles.biometricButton, { backgroundColor: colors.secondaryFill }]}
            onPress={handleBiometricPress}
            disabled={loading}
          >
            <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
            <Text style={[styles.biometricText, { color: colors.label }]}>
              Use {biometricStatus.biometricType}
            </Text>
          </TouchableOpacity>
        )}

        <Button
          onPress={handleContinue}
          loading={loading}
          disabled={phone.length !== 10}
          fullWidth
          size="large"
        >
          Continue
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
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  terms: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
