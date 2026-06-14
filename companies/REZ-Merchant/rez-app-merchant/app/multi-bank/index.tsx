/**
 * Multi-Bank Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

interface BankAccount {
  id: string;
  provider: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  isPrimary: boolean;
}

export default function MultiBankScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchAccounts = useCallback(async () => {
    // Mock data
    const mockAccounts: BankAccount[] = [
      { id: '1', provider: 'HDFC', accountNumber: '50200012345678', accountType: 'Current', balance: 854000, isPrimary: true },
      { id: '2', provider: 'ICICI', accountNumber: '000405012345', accountType: 'Savings', balance: 325000, isPrimary: false },
      { id: '3', provider: 'SBI', accountNumber: '12345678901', accountType: 'Current', balance: 156000, isPrimary: false },
    ];
    setAccounts(mockAccounts);
    setTotalBalance(mockAccounts.reduce((sum, acc) => sum + acc.balance, 0));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const getBankColor = (provider: string) => {
    const colors: Record<string, string> = {
      HDFC: '#004C8F',
      ICICI: '#2E8B57',
      SBI: '#1E4D8C',
      AXIS: '#1A1F71',
      KOTAK: '#E31837',
    };
    return colors[provider] || Colors.gray[600];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Multi-Bank</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Total Balance */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.totalAccounts}>{accounts.length} accounts connected</Text>
        </View>

        {/* Accounts */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {accounts.map((account) => (
            <Animated.View key={account.id} entering={FadeInDown}>
              <View style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={[styles.bankBadge, { backgroundColor: getBankColor(account.provider) }]}>
                    <Text style={styles.bankInitial}>{account.provider[0]}</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName}>{account.provider}</Text>
                      {account.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountNumber}>****{account.accountNumber.slice(-4)}</Text>
                  </View>
                  <Text style={styles.accountType}>{account.accountType}</Text>
                </View>
                <View style={styles.accountBalance}>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(account.balance)}</Text>
                </View>
                <View style={styles.accountActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="sync-outline" size={18} color={Colors.blue[500]} />
                    <Text style={styles.actionText}>Sync</Text>
                  </TouchableOpacity>
                  {!account.isPrimary && (
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="star-outline" size={18} color={Colors.gray[500]} />
                      <Text style={styles.actionText}>Set Primary</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="settings-outline" size={18} color={Colors.gray[500]} />
                    <Text style={styles.actionText}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))}

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.green[600] }]}>+{formatCurrency(1250000)}</Text>
                <Text style={styles.statLabel}>Total Credits</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.red[600] }]}>-{formatCurrency(980000)}</Text>
                <Text style={styles.statLabel}>Total Debits</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray[50] },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[500], justifyContent: 'center', alignItems: 'center' },
  totalCard: { backgroundColor: Colors.primary[500], padding: 20, margin: 16, borderRadius: 16, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: Colors.white, opacity: 0.8 },
  totalValue: { fontSize: 32, fontWeight: '700', color: Colors.white, marginVertical: 8 },
  totalAccounts: { fontSize: 13, color: Colors.white, opacity: 0.7 },
  content: { flex: 1, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.gray[900] },
  accountCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bankBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  bankInitial: { fontSize: 18, fontWeight: '700', color: Colors.white },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountName: { fontSize: 16, fontWeight: '600', color: Colors.gray[900] },
  primaryBadge: { backgroundColor: Colors.green[100], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  primaryText: { fontSize: 10, fontWeight: '600', color: Colors.green[700] },
  accountNumber: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  accountType: { fontSize: 12, color: Colors.gray[500], backgroundColor: Colors.gray[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  accountBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.gray[100] },
  balanceLabel: { fontSize: 13, color: Colors.gray[500] },
  balanceValue: { fontSize: 18, fontWeight: '700', color: Colors.gray[900] },
  accountActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.gray[50], gap: 4 },
  actionText: { fontSize: 12, color: Colors.gray[600] },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
});
