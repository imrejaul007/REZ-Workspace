// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function EarningsScreen() {
  const router = useRouter();

  const earnings = [
    { id: '1', amount: 500, status: 'paid', date: 'May 28, 2026' },
    { id: '2', amount: 350, status: 'pending', date: 'May 30, 2026' },
  ];

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Available</Text>
            <Text style={styles.summaryValue}>{formatCurrency(350)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>{formatCurrency(850)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatCurrency(8500)}</Text>
          </View>
        </View>

        {/* Withdraw */}
        <TouchableOpacity style={styles.withdrawButton}>
          <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
        </TouchableOpacity>

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {earnings.map((item) => (
            <View key={item.id} style={styles.transaction}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.transactionDate}>{item.date}</Text>
              </View>
              <View style={[styles.statusBadge, item.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={[styles.statusText, item.status === 'paid' ? styles.paidText : styles.pendingText]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 60, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { fontSize: 16, color: '#6366F1', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  scrollView: { flex: 1 },
  summary: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#6B7280' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  withdrawButton: { marginHorizontal: 16, backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' },
  withdrawButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  historySection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  transaction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  transactionLeft: {},
  transactionAmount: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  transactionDate: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  paidBadge: { backgroundColor: '#ECFDF5' },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '500' },
  paidText: { color: '#059669' },
  pendingText: { color: '#D97706' },
});
