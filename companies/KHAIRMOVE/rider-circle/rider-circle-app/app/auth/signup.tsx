/**
 * Signup Screen
 */

import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../services/api';

export default function SignupScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    phone: '',
    name: '',
    email: '',
    bloodGroup: '',
    ridingStyle: 'tourer',
  });

  const ridingStyles = [
    { id: 'commuter', label: 'Commuter', icon: '🏙️' },
    { id: 'tourer', label: 'Tourer', icon: '🛣️' },
    { id: 'adventure', label: 'Adventure', icon: '🏔️' },
    { id: 'sport', label: 'Sport', icon: '🏁' },
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async () => {
    if (!form.phone || !form.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Create rider profile via API
      const rider = await api.createRider({
        displayName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        bloodGroup: form.bloodGroup || undefined,
        ridingStyle: form.ridingStyle as any,
        emergencyContacts: [],
      });

      // Simulate login
      await login(form.phone, 'demo');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the RiderCircle community</Text>

      <Input
        label="Full Name *"
        placeholder="Enter your name"
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
        leftIcon={<Text style={styles.inputIcon}>👤</Text>}
      />

      <Input
        label="Phone Number *"
        placeholder="+91 9876543210"
        value={form.phone}
        onChangeText={(text) => setForm({ ...form, phone: text })}
        keyboardType="phone-pad"
        leftIcon={<Text style={styles.inputIcon}>📱</Text>}
      />

      <Input
        label="Email (optional)"
        placeholder="your@email.com"
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
        keyboardType="email-address"
        leftIcon={<Text style={styles.inputIcon}>✉️</Text>}
      />

      <Button
        title="Continue"
        onPress={() => setStep(2)}
        disabled={!form.name || !form.phone}
        fullWidth
        style={styles.button}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Riding Style</Text>
      <Text style={styles.subtitle}>How do you primarily ride?</Text>

      <View style={styles.styleGrid}>
        {ridingStyles.map((style) => (
          <View
            key={style.id}
            style={[
              styles.styleCard,
              form.ridingStyle === style.id && styles.styleCardSelected,
            ]}
          >
            <Button
              title={`${style.icon}\n${style.label}`}
              variant={form.ridingStyle === style.id ? 'primary' : 'secondary'}
              onPress={() => setForm({ ...form, ridingStyle: style.id })}
              style={styles.styleButton}
              textStyle={styles.styleButtonText}
            />
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Blood Group (optional)</Text>
      <View style={styles.bloodGroupGrid}>
        {bloodGroups.map((bg) => (
          <Button
            key={bg}
            title={bg}
            variant={form.bloodGroup === bg ? 'primary' : 'outline'}
            onPress={() => setForm({ ...form, bloodGroup: bg })}
            style={styles.bloodButton}
            size="small"
          />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(1)}
          style={styles.backButton}
        />
        <Button
          title="Create Account"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepIndicator}>
          Step {step} of 2
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${step * 50}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text
            style={styles.footerLink}
            onPress={() => router.push('/auth/login')}
          >
            Login
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  inputIcon: {
    fontSize: 18,
  },
  button: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  styleCard: {
    width: '47%',
  },
  styleCardSelected: {},
  styleButton: {
    height: 80,
  },
  styleButtonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  bloodButton: {
    minWidth: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 48,
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
  footerLink: {
    color: '#e94560',
    fontWeight: '600',
  },
});