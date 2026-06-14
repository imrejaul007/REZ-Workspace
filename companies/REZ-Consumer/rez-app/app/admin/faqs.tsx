import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthUser, useIsAuthenticated, useAuthLoading } from '@/stores/selectors';

const FAQS = [
  {
    q: 'How do I earn REZ coins?',
    a: 'You earn REZ coins by shopping at partner stores, paying utility bills, completing challenges, and referring friends. Coins are credited to your wallet within 24 hours of a successful transaction.',
  },
  {
    q: 'How do I pay utility bills?',
    a: 'Go to the Bill Payment section from your home screen. Select your bill type (electricity, water, gas, etc.), choose your provider, enter your consumer number, and pay securely using your preferred payment method.',
  },
  {
    q: 'When do my coins expire?',
    a: 'REZ coins are valid for 12 months from the date of credit. Branded coins (store-specific) may have different expiry dates shown in your wallet.',
  },
  {
    q: 'How do I refer a friend?',
    a: 'Go to your Profile > Refer & Earn. Share your unique referral code or link. You earn bonus coins when your friend completes their first purchase.',
  },
  {
    q: 'Can I transfer coins to another user?',
    a: 'Yes, you can transfer REZ coins to unknown registered REZ user from the Wallet section. A small fee may apply for transfers.',
  },
  {
    q: 'What is Privé?',
    a: 'Privé is our premium cashback program where you earn exclusive cashback by posting about your purchases on social media. Join campaigns from your favourite brands and earn rewards.',
  },
  {
    q: 'How do I track my bill payment?',
    a: 'All your bill payment history is available under Wallet > Bill History. You can filter by bill type and date range.',
  },
  {
    q: 'What happens if my payment fails?',
    a: 'If a payment fails, the amount is automatically refunded to your original payment method within 5-7 business days. REZ coins used are credited back immediately.',
  },
  {
    q: 'How do I contact customer support?',
    a: 'You can reach us via the Help section in the app, or email support@rez.money. Our support team is available 9 AM - 9 PM IST, Monday to Saturday.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store your card details on our servers.',
  },
];

export default function FaqScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Frequently Asked Questions</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <Text style={styles.question}>{faq.q}</Text>
              <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
            </View>
            {expanded === i && <Text style={styles.answer}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  questionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  question: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a', lineHeight: 22 },
  answer: { marginTop: 12, fontSize: 14, color: '#6b7280', lineHeight: 22 },
});
