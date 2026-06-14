/**
 * InsightCampus - Login Screen
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';

export default function LoginScreen({ navigation }: any) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🎓</Text>
          <Text variant="headlineMedium" style={styles.title}>InsightCampus</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Your Campus Intelligence</Text>
        </View>

        <Surface style={styles.form}>
          <Text variant="titleLarge" style={styles.formTitle}>Student Login</Text>
          <TextInput mode="outlined" label="University Email" keyboardType="email-address" style={styles.input} />
          <TextInput mode="outlined" label="Password" secureTextEntry style={styles.input} />
          <Button mode="text" style={styles.forgotBtn} labelStyle={{ color: '#10b981' }}>Forgot Password?</Button>
          <Button mode="contained" style={styles.loginBtn} onPress={() => navigation.replace('Main')}>
            Sign In
          </Button>
          <Button mode="outlined" icon="microsoft" style={styles.socialBtn}>Sign in with University SSO</Button>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 64 },
  title: { fontWeight: 'bold', color: '#10b981', marginTop: 8 },
  subtitle: { color: '#64748b', marginTop: 4 },
  form: { padding: 24, borderRadius: 20, backgroundColor: '#fff', elevation: 2 },
  formTitle: { textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  forgotBtn: { alignSelf: 'flex-end' },
  loginBtn: { marginTop: 8, backgroundColor: '#10b981' },
  socialBtn: { marginTop: 16 },
});