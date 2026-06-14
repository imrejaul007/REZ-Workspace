/**
 * TalentAI - Login Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🎯</Text>
          <Text variant="headlineMedium" style={styles.title}>TalentAI</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Your AI Career Companion</Text>
        </View>

        {/* Form */}
        <Surface style={styles.form}>
          <Text variant="titleLarge" style={styles.formTitle}>Welcome Back</Text>

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          <Button
            mode="text"
            style={styles.forgotButton}
            labelStyle={{ color: '#6366f1' }}
          >
            Forgot Password?
          </Button>

          <Button
            mode="contained"
            style={styles.loginButton}
            onPress={() => navigation.replace('Main')}
          >
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="outlined"
            icon="google"
            style={styles.socialButton}
          >
            Continue with Google
          </Button>

          <Button
            mode="outlined"
            icon="apple"
            style={styles.socialButton}
          >
            Continue with Apple
          </Button>
        </Surface>

        {/* Register */}
        <View style={styles.registerContainer}>
          <Text variant="bodyMedium">Don't have an account? </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            labelStyle={{ color: '#6366f1' }}
          >
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 64,
  },
  title: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginTop: 8,
  },
  subtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  form: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#64748b',
  },
  socialButton: {
    marginBottom: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});