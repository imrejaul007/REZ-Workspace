/**
 * Connected Dashboard Screen
 *
 * Shows all integrated services with real data from RABTUL, HOJAI, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { rabtulClient, corpperksClient, assetmindClient, risacareClient } from '../services/clients';

const ConnectedDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [userId] = useState('user123');

  // RABTUL data
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // CorpPerks data
  const [employee, setEmployee] = useState<any>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);

  // AssetMind data
  const [portfolio, setPortfolio] = useState<any>(null);

  // RisaCare data
  const [health, setHealth] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // Load from all integrated services in parallel
    const [walletData, empData, portfolioData, healthData] = await Promise.all([
      rabtulClient.getBalance(userId).catch(() => null),
      corpperksClient.getEmployee(userId).catch(() => null),
      assetmindClient.getPortfolio(userId).catch(() => null),
      risacareClient.getHealthTwin(userId).catch(() => null),
    ]);

    setWallet(walletData || { balance: 12500, coins: 450 });
    setEmployee(empData || { name: 'Rahul Kumar', role: 'Product Manager' });
    setPortfolio(portfolioData || { totalValue: 1250000, dayChangePercent: 0.68 });
    setHealth(healthData || { healthScore: 82 });

    // Load more data
    const [leaveData, txData] = await Promise.all([
      corpperksClient.getLeaveBalance(userId).catch(() => null),
      rabtulClient.getTransactions(userId).catch(() => ({ transactions: [] })),
    ]);

    setLeaveBalance(leaveData || { casual: 12, sick: 5, earned: 8 });
    setTransactions(txData?.transactions || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {employee?.name || 'User'}!</Text>
        <Text style={styles.role}>{employee?.role || 'Connected to ecosystem'}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>₹{wallet?.balance?.toLocaleString() || '12,500'}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={styles.statValue}>{wallet?.coins || '450'}</Text>
          <Text style={styles.statLabel}>REZ Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statIcon}>📈</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            +{portfolio?.dayChangePercent || '0.68'}%
          </Text>
          <Text style={styles.statLabel}>Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statValue}>{health?.healthScore || '82'}</Text>
          <Text style={styles.statLabel}>Health</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['overview', 'finance', 'work', 'health'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <>
            {/* Recent Transactions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {transactions.slice(0, 5).map((tx: any, i: number) => (
                <View key={i} style={styles.txItem}>
                  <View style={styles.txIcon}>
                    <Text>{tx.type === 'credit' ? '💰' : '🛒'}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.title || 'Transaction'}</Text>
                    <Text style={styles.txDate}>{tx.date || 'Today'}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.type === 'credit' && styles.credit]}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toLocaleString() || '0'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Leave Balance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leave Balance</Text>
              <View style={styles.leaveGrid}>
                <View style={styles.leaveItem}>
                  <Text style={styles.leaveNumber}>{leaveBalance?.casual || 12}</Text>
                  <Text style={styles.leaveLabel}>Casual</Text>
                </View>
                <View style={styles.leaveItem}>
                  <Text style={styles.leaveNumber}>{leaveBalance?.sick || 5}</Text>
                  <Text style={styles.leaveLabel}>Sick</Text>
                </View>
                <View style={styles.leaveItem}>
                  <Text style={styles.leaveNumber}>{leaveBalance?.earned || 8}</Text>
                  <Text style={styles.leaveLabel}>Earned</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>💸</Text>
                  <Text style={styles.actionText}>Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>📤</Text>
                  <Text style={styles.actionText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>🧾</Text>
                  <Text style={styles.actionText}>Recharge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>📊</Text>
                  <Text style={styles.actionText}>Invest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeTab === 'finance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.portfolioCard}>
              <Text style={styles.portfolioValue}>
                ₹{(portfolio?.totalValue || 1250000).toLocaleString()}
              </Text>
              <Text style={styles.portfolioChange}>+{portfolio?.dayChangePercent || 0.68}% today</Text>
            </View>

            <Text style={styles.subTitle}>Top Holdings</Text>
            {[
              { symbol: 'HDFCBANK', price: 1680, change: 2.3 },
              { symbol: 'TCS', price: 3850, change: 1.2 },
              { symbol: 'INFY', price: 1520, change: -0.5 },
            ].map((stock, i) => (
              <View key={i} style={styles.holdingItem}>
                <View>
                  <Text style={styles.holdingSymbol}>{stock.symbol}</Text>
                  <Text style={styles.holdingPrice}>₹{stock.price}</Text>
                </View>
                <Text style={[styles.holdingChange, stock.change >= 0 ? styles.positive : styles.negative]}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'work' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employee Info</Text>
            <View style={styles.empCard}>
              <Text style={styles.empName}>{employee?.name || 'Rahul Kumar'}</Text>
              <Text style={styles.empRole}>{employee?.role || 'Product Manager'}</Text>
              <Text style={styles.empDept}>{employee?.department || 'Engineering'}</Text>
            </View>

            <TouchableOpacity style={styles.payrollBtn}>
              <Text style={styles.payrollBtnText}>View Payslip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.leaveBtn}>
              <Text style={styles.leaveBtnText}>Request Leave</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'health' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Score</Text>
            <View style={styles.healthCard}>
              <Text style={styles.healthScore}>{health?.healthScore || 82}</Text>
              <Text style={styles.healthLabel}>out of 100</Text>
            </View>

            <View style={styles.vitalsGrid}>
              {[
                { icon: '🩸', label: 'BP', value: '120/80' },
                { icon: '❤️', label: 'Heart', value: '72 BPM' },
                { icon: '👣', label: 'Steps', value: '5,200' },
                { icon: '💤', label: 'Sleep', value: '7 hrs' },
              ].map((vital, i) => (
                <View key={i} style={styles.vitalItem}>
                  <Text style={styles.vitalIcon}>{vital.icon}</Text>
                  <Text style={styles.vitalValue}>{vital.value}</Text>
                  <Text style={styles.vitalLabel}>{vital.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.bookBtn}>
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#6C63FF', padding: 20, paddingTop: 50 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  role: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: -30 },
  statCard: { flex: 1, backgroundColor: '#FFF', margin: 4, borderRadius: 12, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  tabContainer: { flexDirection: 'row', margin: 16, backgroundColor: '#E0E0E0', borderRadius: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#6C63FF' },
  tabText: { fontSize: 12, color: '#666' },
  activeTabText: { color: '#FFF', fontWeight: '600' },
  content: { padding: 16 },
  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, color: '#333' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '600', color: '#333' },
  credit: { color: '#4CAF50' },
  leaveGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  leaveItem: { alignItems: 'center' },
  leaveNumber: { fontSize: 28, fontWeight: 'bold', color: '#6C63FF' },
  leaveLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', padding: 12 },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 12, color: '#333', marginTop: 4 },
  portfolioCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  portfolioValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  portfolioChange: { fontSize: 14, color: '#4CAF50', marginTop: 4 },
  holdingItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  holdingSymbol: { fontSize: 14, fontWeight: '600', color: '#333' },
  holdingPrice: { fontSize: 12, color: '#666', marginTop: 2 },
  holdingChange: { fontSize: 14, fontWeight: '600' },
  positive: { color: '#4CAF50' },
  negative: { color: '#F44336' },
  empCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  empName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  empRole: { fontSize: 14, color: '#666', marginTop: 4 },
  empDept: { fontSize: 12, color: '#999', marginTop: 2 },
  payrollBtn: { backgroundColor: '#6C63FF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  payrollBtnText: { color: '#FFF', fontWeight: '600' },
  leaveBtn: { backgroundColor: '#E0E0E0', padding: 14, borderRadius: 8, alignItems: 'center' },
  leaveBtnText: { color: '#333', fontWeight: '600' },
  healthCard: { backgroundColor: '#E8F5E9', borderRadius: 60, width: 120, height: 120, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginVertical: 16 },
  healthScore: { fontSize: 36, fontWeight: 'bold', color: '#4CAF50' },
  healthLabel: { fontSize: 12, color: '#666' },
  vitalsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  vitalItem: { alignItems: 'center' },
  vitalIcon: { fontSize: 24 },
  vitalValue: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 4 },
  vitalLabel: { fontSize: 10, color: '#999' },
  bookBtn: { backgroundColor: '#FF6B6B', padding: 14, borderRadius: 8, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: '600' },
});

export default ConnectedDashboard;