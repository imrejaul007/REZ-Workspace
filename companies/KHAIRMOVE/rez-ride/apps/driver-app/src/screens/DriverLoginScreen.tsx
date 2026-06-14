import { logger } from '../../shared/logger';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../api/client';
import { biometricService } from '../services/biometric.service';
import { secureStorage } from '../services/secure-storage';
import { driverApi } from '../services/api.service';

interface DriverLoginScreenProps {
  onPhoneSubmitted: (phone: string) => void;
}

export const DriverLoginScreen: React.FC<DriverLoginScreenProps> = ({ onPhoneSubmitted }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [checkingBiometric, setCheckingBiometric] = useState(true);

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const userData = await secureStorage.getUserData();
        if (userData?.phone) {
          setSavedPhone(userData.phone);
        }
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

  const attemptBiometricAuth = async () => {
    if (!biometricAvailable || !savedPhone) return;

    try {
      const result = await biometricService.authenticate({
        promptMessage: 'Sign in to ReZ Ride Driver',
        fallbackLabel: 'Use phone instead',
      });

      if (result.success && savedPhone) {
        setPhone(savedPhone.replace('91', ''));
        await handleLogin(savedPhone);
      }
    } catch (error) {
      logger.error('Biometric auth error:', error);
    }
  };

  useEffect(() => {
    if (!checkingBiometric && biometricAvailable && savedPhone) {
      const timer = setTimeout(attemptBiometricAuth, 500);
      return () => clearTimeout(timer);
    }
  }, [checkingBiometric, biometricAvailable, savedPhone]);

  const handleLogin = async (phoneToUse?: string) => {
    const targetPhone = phoneToUse || phone;
    if (targetPhone.length !== 10) {
      Alert.alert('Error', 'Enter valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await driverApi.requestOTP(`91${targetPhone}`);
      await secureStorage.setUserData({ phone: `91${targetPhone}` });
      onPhoneSubmitted(`91${targetPhone}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please check your connection.');
    }
    setLoading(false);
  };

  if (checkingBiometric) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>ReZ Ride</Text>
        <Text style={styles.subtitle}>Driver App</Text>
        <ActivityIndicator size="large" color="#6B4EFF" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ReZ Ride</Text>
      <Text style={styles.subtitle}>Driver App</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => handleLogin()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
      </TouchableOpacity>

      {biometricAvailable && savedPhone && (
        <TouchableOpacity style={styles.biometricButton} onPress={attemptBiometricAuth}>
          <Text style={styles.biometricButtonText}>
            Use {biometricService.getBiometricName()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1a1a2e' },
  logo: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#6B4EFF' },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#fff', marginTop: 8, marginBottom: 48 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d44', borderRadius: 12, paddingHorizontal: 16 },
  prefix: { fontSize: 18, color: '#fff' },
  input: { flex: 1, color: '#fff', padding: 16, fontSize: 18, marginLeft: 8 },
  button: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 16 },
  buttonDisabled: { backgroundColor: '#4a4a6a' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  biometricButton: { marginTop: 20, padding: 16, alignItems: 'center' },
  biometricButtonText: { color: '#6B4EFF', fontSize: 16, fontWeight: '500' },
});

export default DriverLoginScreen;
