import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showAlert('Error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('merchant/auth/forgot-password', { email: trimmed });
      if (response.success) {
        setSent(true);
      } else {
        showAlert('Error', response.message || 'Failed to send reset email');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons name="mail-outline" size={48} color="#ffcd57" />
        </View>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          If an account exists for {email.trim()}, you will receive a password reset link shortly.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#1a3a52" />
      </TouchableOpacity>

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the email address linked to your merchant account and we'll send you a reset link.
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1a3a52" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 28,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
    padding: 8,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1a3a52',
  },
  button: {
    backgroundColor: '#ffcd57',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a52',
  },
});
