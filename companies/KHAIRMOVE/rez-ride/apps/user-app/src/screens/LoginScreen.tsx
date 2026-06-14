import { logger } from '../../shared/logger';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { biometricService } from '../services/biometric.service';
import { secureStorage } from '../services/secure-storage';
import { API_BASE_URL } from '../api/client';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  onBiometricAuth?: () => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onBiometricAuth }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [checkingBiometric, setCheckingBiometric] = useState(true);

  // Check for saved phone and biometric availability on mount
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        // Check if returning user with saved phone
        const userData = await secureStorage.getUserData();
        if (userData?.phone) {
          setSavedPhone(userData.phone);
        }

        // Check biometric availability
        const available = biometricService.isAvailable();
        setBiometricAvailable(available);
      } catch (error) {
        logger.error('Biometric check failed:', error);
      } finally {
        setCheckingBiometric(false);
      }
    };

    checkBiometric();
  }, []);

  // Attempt biometric auth for returning users
  const attemptBiometricAuth = useCallback(async () => {
    if (!biometricAvailable || !savedPhone) return false;

    try {
      const result = await biometricService.authenticate({
        promptMessage: 'Sign in to ReZ Ride',
        fallbackLabel: 'Use OTP instead',
      });

      if (result.success && savedPhone) {
        // Proceed with biometric auth - trigger OTP without manual entry
        setPhone(savedPhone.replace('91', ''));
        await handleSendOTP(savedPhone);
        return true;
      }

      if (result.error && result.error !== 'Authentication cancelled' && result.error !== 'User chose fallback') {
        Alert.alert('Authentication Failed', result.error);
      }
      return false;
    } catch (error) {
      logger.error('Biometric auth error:', error);
      return false;
    }
  }, [biometricAvailable, savedPhone, onBiometricAuth]);

  // Auto-trigger biometric if returning user
  useEffect(() => {
    if (!checkingBiometric && biometricAvailable && savedPhone) {
      // Small delay to let UI render first
      const timer = setTimeout(() => {
        attemptBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [checkingBiometric, biometricAvailable, savedPhone, attemptBiometricAuth]);

  const handleSendOTP = async (phoneToUse?: string) => {
    const targetPhone = phoneToUse || phone;
    if (targetPhone.length !== 10) {
      Alert.alert('Error', 'Enter valid 10-digit phone');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `91${targetPhone}`, type: 'login' }),
      });
      const data = await response.json();
      if (data.success) {
        navigation.navigate('OTP', { phone: `91${targetPhone}` });
      } else {
        Alert.alert('Error', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please check your connection.');
    }
    setLoading(false);
  };

  if (checkingBiometric) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>ReZ Ride</Text>
        <ActivityIndicator size="large" color="#6B4EFF" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ReZ Ride</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
          autoComplete="tel"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => handleSendOTP()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
      </TouchableOpacity>

      {biometricAvailable && savedPhone && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={attemptBiometricAuth}
        >
          <Text style={styles.biometricButtonText}>
            Use {biometricService.getBiometricName()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#6B4EFF' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginTop: 8, marginBottom: 32 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16 },
  prefix: { fontSize: 18, color: '#333' },
  input: { flex: 1, fontSize: 18, paddingVertical: 16, marginLeft: 8 },
  button: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 24 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  biometricButton: { marginTop: 20, padding: 16, alignItems: 'center' },
  biometricButtonText: { color: '#6B4EFF', fontSize: 16, fontWeight: '500' },
});

export default LoginScreen;
