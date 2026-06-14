import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking';
  label: string;
  value: string;
  isDefault: boolean;
  lastUsed?: string;
}

const DUMMY_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'upi',
    label: 'UPI ID',
    value: 'rejaul@okhdfcbank',
    isDefault: true,
    lastUsed: '2 days ago',
  },
  {
    id: '2',
    type: 'card',
    label: 'Visa Card',
    value: '**** **** **** 4242',
    isDefault: false,
    lastUsed: '1 week ago',
  },
  {
    id: '3',
    type: 'netbanking',
    label: 'ICICI NetBanking',
    value: 'ICICI Bank - Internet Banking',
    isDefault: false,
    lastUsed: '3 weeks ago',
  },
];

// CD-TS-05 FIX: Wrap with ErrorBoundary to prevent crashes from killing the entire screen
function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DUMMY_PAYMENT_METHODS);

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === id,
      })),
    );
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'upi':
        return 'phone-portrait';
      case 'card':
        return 'card';
      case 'netbanking':
        return 'business';
      default:
        return 'wallet';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'upi':
        return 'UPI';
      case 'card':
        return 'Credit/Debit Card';
      case 'netbanking':
        return 'Net Banking';
      default:
        return 'Payment Method';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add-circle" size={24} color="#1a3a52" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No payment methods added</Text>
            <Text style={styles.emptySubtext}>Add a payment method to get started</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={getIconName(method.type)} size={24} color="#1a3a52" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardType}>{getTypeLabel(method.type)}</Text>
                    <Text style={styles.cardValue}>{method.value}</Text>
                    {method.lastUsed && <Text style={styles.cardSubtext}>Last used {method.lastUsed}</Text>}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addMethodBtn}>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addMethodText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  addBtn: { marginLeft: 12 },
  content: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center', marginVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  cardInfo: { flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  cardValue: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardSubtext: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: { backgroundColor: '#e8f0f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  defaultText: { fontSize: 12, fontWeight: '600', color: '#1a3a52' },
  moreBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addMethodBtn: {
    backgroundColor: '#1a3a52',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  addMethodText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default withErrorBoundary(PaymentMethodsScreen, 'AccountPayment');
