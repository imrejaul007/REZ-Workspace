import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_BASE_URL } from '../services/api';

export const OTPScreen: React.FC<{ phone: string; onVerified: () => void }> = ({ phone, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Enter 4-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `91${phone}`, otp }),
      });
      const data = await response.json();
      if (data.success) {
        onVerified();
      } else {
        Alert.alert('Error', data.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>Sent to +91 {phone}</Text>

      <TextInput
        style={styles.input}
        placeholder="____"
        keyboardType="number-pad"
        maxLength={4}
        value={otp}
        onChangeText={setOtp}
        textAlign="center"
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: { fontSize: 32, letterSpacing: 16, textAlign: 'center', borderBottomWidth: 2, borderColor: '#6B4EFF', paddingVertical: 16 },
  button: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 32 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default OTPScreen;
