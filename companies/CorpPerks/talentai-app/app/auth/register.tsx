/**
 * TalentAI - Register Screen
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';

export default function RegisterScreen({ navigation }: any) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Start your AI-powered career journey</Text>

          <Surface style={styles.form}>
            <TextInput mode="outlined" label="Full Name" style={styles.input} />
            <TextInput mode="outlined" label="Email" keyboardType="email-address" style={styles.input} />
            <TextInput mode="outlined" label="Phone" keyboardType="phone-pad" style={styles.input} />
            <TextInput mode="outlined" label="Password" secureTextEntry style={styles.input} />

            <Button mode="contained" style={styles.registerButton}>
              Create Account
            </Button>

            <Text variant="bodySmall" style={styles.terms}>
              By signing up, you agree to our Terms & Privacy Policy
            </Text>
          </Surface>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium">Already have an account? </Text>
            <Button mode="text" onPress={() => navigation.goBack()} labelStyle={{ color: '#6366f1' }}>
              Sign In
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 24 },
  title: { fontWeight: 'bold', color: '#6366f1', textAlign: 'center' },
  subtitle: { color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  form: { padding: 24, borderRadius: 20, backgroundColor: '#fff', elevation: 2 },
  input: { marginBottom: 12 },
  registerButton: { marginTop: 8, backgroundColor: '#6366f1' },
  terms: { textAlign: 'center', color: '#64748b', marginTop: 16 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
});