import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';

const FAQS = [
  { q: 'How to cancel a ride?', a: 'Tap on the ride and select Cancel Ride.' },
  { q: 'How to add money to wallet?', a: 'Go to Wallet > Add Money > Choose payment method.' },
  { q: 'How to use a voucher?', a: 'Enter code at payment screen or go to Offers.' },
  { q: 'How to contact driver?', a: 'Tap the call button during an active ride.' },
];

export const SupportScreen: React.FC = () => {
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    // Submit ticket
    setTimeout(() => setSubmitting(false), 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>💬</Text>
          <Text style={styles.quickLabel}>Chat with Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>📞</Text>
          <Text style={styles.quickLabel}>Call Support</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Report an Issue</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your issue..."
        multiline
        value={issue}
        onChangeText={setIssue}
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>FAQs</Text>
      {FAQS.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <Text style={styles.faqQ}>{faq.q}</Text>
          <Text style={styles.faqA}>{faq.a}</Text>
        </View>
      ))}

      <View style={styles.emergency}>
        <Text style={styles.emergencyTitle}>Emergency</Text>
        <TouchableOpacity style={styles.sosButton}>
          <Text style={styles.sosIcon}>🆘</Text>
          <Text style={styles.sosText}>Emergency Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  quickAction: { alignItems: 'center', padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12, width: '45%' },
  quickIcon: { fontSize: 32 },
  quickLabel: { marginTop: 8, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, minHeight: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 16 },
  submitText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  faqItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  faqQ: { fontSize: 16, fontWeight: '600' },
  faqA: { fontSize: 14, color: '#666', marginTop: 4 },
  emergency: { marginTop: 32, padding: 20, backgroundColor: '#fef2f2', borderRadius: 12, alignItems: 'center' },
  emergencyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  sosButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  sosIcon: { fontSize: 24 },
  sosText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});

export default SupportScreen;
