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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!token) {
      showAlert('Error', 'Invalid or missing reset token. Please request a new reset link.');
      return;
    }
    if (!password.trim()) {
      showAlert('Error', 'Please enter a new password');
      return;
    }
    if (password.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('merchant/auth/reset-password', {
        token,
        newPassword: password,
      });
      if (response.success) {
        setSuccess(true);
      } else {
        showAlert(
          'Error',
          response.message || 'Failed to reset password. The link may have expired.'
        );
      }
    } catch (err) {
      showAlert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        </View>
        <Text style={styles.title}>Password Reset</Text>
        <Text style={styles.subtitle}>
          Your password has been successfully reset. You can now log in with your new password.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        Enter your new password below. Make sure it's at least 8 characters.
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1a3a52" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
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
    marginBottom: 16,
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
  eyeBtn: {
    padding: 8,
  },
  button: {
    backgroundColor: '#ffcd57',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
