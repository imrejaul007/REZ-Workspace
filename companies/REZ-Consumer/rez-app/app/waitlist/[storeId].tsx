// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import apiClient from '@/services/apiClient';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { platformAlertSimple } from '@/utils/platformAlert';

function WaitlistScreen() {
  const { storeId } = useLocalSearchParams<unknown>();
  const router = useRouter();
  const { colors } = useTheme();
  const [serviceType, setServiceType] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!storeId) {
      platformAlertSimple('Error', 'Invalid store. Please go back and try again.');
      return;
    }
    if (!serviceType.trim()) {
      platformAlertSimple('Required', 'Please enter the service you need');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/consumer/waitlist', {
        storeId,
        serviceType,
        preferredDate,
        notes,
      });
      if (response) {
        setJoined(true);
      }
    } catch (e) {
      platformAlertSimple('Error', e?.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background.primary },
        header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 48 },
        title: { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginLeft: 12 },
        section: { padding: 16 },
        label: { fontSize: 14, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 },
        input: {
          borderWidth: 1,
          borderColor: colors.border.default,
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          color: colors.text.primary,
          backgroundColor: colors.background.secondary,
          marginBottom: 16,
        },
        btn: { margin: 16, backgroundColor: colors.primary[500], borderRadius: 12, padding: 16, alignItems: 'center' },
        btnText: { fontSize: 16, fontWeight: '700', color: colors.text.inverse },
        successCard: { margin: 32, padding: 24, alignItems: 'center' },
        successIcon: { fontSize: 64, marginBottom: 16 },
        successTitle: { fontSize: 22, fontWeight: '800', color: colors.text.primary, marginBottom: 8 },
        successSub: { fontSize: 15, color: colors.text.secondary, textAlign: 'center' },
      }),
    [colors],
  );

  if (joined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>You're on the waitlist!</Text>
          <Text style={styles.successSub}>We'll notify you as soon as a slot opens up for {serviceType}.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Join Waitlist</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Service needed *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Haircut, Facial, Massage"
            placeholderTextColor={colors.text.tertiary}
            value={serviceType}
            onChangeText={setServiceType}
          />

          <Text style={styles.label}>Preferred date (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. This weekend, Next Monday"
            placeholderTextColor={colors.text.tertiary}
            value={preferredDate}
            onChangeText={setPreferredDate}
          />

          <Text style={styles.label}>Additional notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Any specific requirements..."
            placeholderTextColor={colors.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleJoin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Joining...' : 'Join Waitlist'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default withErrorBoundary(WaitlistScreen, 'WaitlistStoreId');
