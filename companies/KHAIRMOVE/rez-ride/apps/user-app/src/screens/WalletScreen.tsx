import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export const WalletScreen: React.FC = () => {
  const balance = 500;
  const transactions = [
    { id: '1', type: 'credit', amount: 50, desc: 'Cashback from ride', date: 'May 15' },
    { id: '2', type: 'debit', amount: 150, desc: 'Ride to MG Road', date: 'May 14' },
    { id: '3', type: 'credit', amount: 100, desc: 'Referral bonus', date: 'May 12' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>ReZ Wallet Balance</Text>
        <Text style={styles.balanceAmount}>₹{balance}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.methodsCard}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.methodRow}>
          <Text style={styles.methodIcon}>💳</Text>
          <Text style={styles.methodName}>Add UPI / Card</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <View>
              <Text style={styles.transactionDesc}>{item.desc}</Text>
              <Text style={styles.transactionDate}>{item.date}</Text>
            </View>
            <Text style={[styles.transactionAmount, item.type === 'credit' ? styles.credit : styles.debit]}>
              {item.type === 'credit' ? '+' : '-'}₹{item.amount}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  balanceCard: { backgroundColor: '#6B4EFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  balanceLabel: { color: '#fff', opacity: 0.8 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginTop: 8 },
  balanceActions: { marginTop: 16 },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  addButtonText: { color: '#6B4EFF', fontWeight: '600' },
  methodsCard: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 12 },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12 },
  methodIcon: { fontSize: 24 },
  methodName: { marginLeft: 12, fontSize: 16 },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  transactionDesc: { fontSize: 16 },
  transactionDate: { fontSize: 12, color: '#666', marginTop: 4 },
  transactionAmount: { fontSize: 18, fontWeight: '600' },
  credit: { color: '#22c55e' },
  debit: { color: '#333' },
});

export default WalletScreen;
