import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../App';

export default function HealthWalletScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹2,500</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>+ Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
            <Text style={[styles.actionText, styles.actionTextOutline]}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rewardsCard}>
        <Text style={styles.rewardsTitle}>💰 Health Coins</Text>
        <Text style={styles.coins}>1,250 coins</Text>
        <Text style={styles.rewardsSub}>Worth ₹125</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>💊</Text>
          <Text style={styles.quickText}>Medicine</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>🧪</Text>
          <Text style={styles.quickText}>Lab Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>👨‍⚕️</Text>
          <Text style={styles.quickText}>Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>🏥</Text>
          <Text style={styles.quickText}>Hospital</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {[
        { id: '1', title: 'Lab Test Payment', amount: -350, date: 'Today' },
        { id: '2', title: 'Doctor Consultation', amount: -500, date: 'Yesterday' },
        { id: '3', title: 'Added via UPI', amount: 1000, date: '2 days ago' },
      ].map((tx) => (
        <View key={tx.id} style={styles.txCard}>
          <View>
            <Text style={styles.txTitle}>{tx.title}</Text>
            <Text style={styles.txDate}>{tx.date}</Text>
          </View>
          <Text style={[styles.txAmount, tx.amount > 0 ? styles.txPositive : styles.txNegative]}>
            {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  balanceCard: { backgroundColor: COLORS.primary, margin: 20, padding: 25, borderRadius: 20 },
  balanceLabel: { color: COLORS.white, opacity: 0.8, fontSize: 14 },
  balanceAmount: { color: COLORS.white, fontSize: 40, fontWeight: 'bold', marginTop: 10 },
  actions: { flexDirection: 'row', marginTop: 20 },
  actionBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, marginRight: 10 },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.white },
  actionText: { color: COLORS.primary, fontWeight: '600' },
  actionTextOutline: { color: COLORS.white },
  rewardsCard: { backgroundColor: COLORS.white, marginHorizontal: 20, padding: 20, borderRadius: 15 },
  rewardsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  coins: { fontSize: 28, fontWeight: 'bold', color: COLORS.warning, marginTop: 10 },
  rewardsSub: { fontSize: 13, color: COLORS.textLight, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginHorizontal: 20, marginTop: 25, marginBottom: 15 },
  actionsGrid: { flexDirection: 'row', paddingHorizontal: 15 },
  quickAction: { flex: 1, backgroundColor: COLORS.white, margin: 5, padding: 15, borderRadius: 15, alignItems: 'center' },
  quickIcon: { fontSize: 30 },
  quickText: { fontSize: 12, color: COLORS.text, marginTop: 8 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 12 },
  txTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  txDate: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  txPositive: { color: COLORS.success },
  txNegative: { color: COLORS.danger },
});
