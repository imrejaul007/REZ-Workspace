/**
 * Bank Statements Screen
 *
 * Upload and parse bank statements, auto-reconcile transactions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import {
  parseBankStatement,
  reconcileBankStatement,
  ParsedTransaction,
  ReconciliationMatch,
} from '@/services/api/b2bApi';
import * as DocumentPicker from 'expo-document-picker';

type TabType = 'upload' | 'transactions' | 'reconciliation';

export default function BankStatementsScreen() {
  const { activeStore } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [summary, setSummary] = useState<{ total: number; matched: number; uncertain: number; unmatched: number } | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('auto');

  const banks = [
    { id: 'auto', name: 'Auto Detect' },
    { id: 'HDFC', name: 'HDFC Bank' },
    { id: 'ICICI', name: 'ICICI Bank' },
    { id: 'SBI', name: 'State Bank' },
    { id: 'AXIS', name: 'Axis Bank' },
  ];

  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const content = await response.text();

      setLoading(true);
      const parsed = await parseBankStatement(content, selectedBank === 'auto' ? undefined : selectedBank);
      setTransactions(parsed.transactions);

      if (parsed.transactions.length > 0) {
        setActiveTab('transactions');
      }

      Alert.alert('Success', `Parsed ${parsed.transactions.length} transactions`);
    } catch (error) {
      Alert.alert('Error', 'Failed to parse bank statement');
    } finally {
      setLoading(false);
    }
  }, [selectedBank]);

  const handleReconcile = useCallback(async () => {
    if (transactions.length === 0) return;

    setLoading(true);
    try {
      const result = await reconcileBankStatement(transactions);
      setMatches(result.matches);
      setSummary(result.summary);
      setActiveTab('reconciliation');
    } catch (error) {
      Alert.alert('Error', 'Reconciliation failed');
    } finally {
      setLoading(false);
    }
  }, [transactions]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return Colors.green[500];
    if (confidence >= 50) return Colors.yellow[500];
    return Colors.red[500];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {}} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Statements</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['upload', 'transactions', 'reconciliation'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'upload' && (
            <Animated.View entering={FadeInDown} style={styles.card}>
              <Text style={styles.sectionTitle}>Upload Bank Statement</Text>
              <Text style={styles.description}>
                Upload your bank's CSV statement to parse transactions and auto-reconcile with your orders.
              </Text>

              {/* Bank Selection */}
              <View style={styles.bankSelector}>
                <Text style={styles.label}>Select Bank</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {banks.map((bank) => (
                    <TouchableOpacity
                      key={bank.id}
                      style={[styles.bankChip, selectedBank === bank.id && styles.bankChipActive]}
                      onPress={() => setSelectedBank(bank.id)}
                    >
                      <Text style={[styles.bankChipText, selectedBank === bank.id && styles.bankChipTextActive]}>
                        {bank.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Upload Button */}
              <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color={Colors.white} />
                    <Text style={styles.uploadButtonText}>Choose CSV File</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Supported Formats */}
              <View style={styles.formatsContainer}>
                <Text style={styles.formatsTitle}>Supported Formats:</Text>
                <Text style={styles.formatsList}>HDFC, ICICI, SBI, Axis Bank CSV</Text>
              </View>
            </Animated.View>
          )}

          {activeTab === 'transactions' && (
            <Animated.View entering={FadeInDown}>
              <View style={styles.card}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{transactions.length}</Text>
                    <Text style={styles.summaryLabel}>Transactions</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(transactions.reduce((sum, t) => sum + (t.credit || t.debit || 0), 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.reconcileButton, transactions.length === 0 && styles.buttonDisabled]}
                  onPress={handleReconcile}
                  disabled={transactions.length === 0 || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="git-merge-outline" size={20} color={Colors.white} />
                      <Text style={styles.reconcileButtonText}>Auto-Reconcile</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Transaction List */}
              {transactions.slice(0, 20).map((txn, index) => (
                <View key={index} style={styles.transactionCard}>
                  <View style={styles.txnHeader}>
                    <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                    <Text style={[styles.txnAmount, txn.transactionType === 'credit' ? styles.credit : styles.debit]}>
                      {txn.transactionType === 'credit' ? '+' : '-'}
                      {formatCurrency(txn.credit || txn.debit || 0)}
                    </Text>
                  </View>
                  <Text style={styles.txnDescription} numberOfLines={2}>
                    {txn.description}
                  </Text>
                  {txn.reference && (
                    <Text style={styles.txnRef}>Ref: {txn.reference}</Text>
                  )}
                </View>
              ))}
            </Animated.View>
          )}

          {activeTab === 'reconciliation' && summary && (
            <Animated.View entering={FadeInDown}>
              {/* Summary Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Reconciliation Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryBox}>
                    <Text style={[styles.summaryBoxValue, { color: Colors.green[500] }]}>
                      {summary.matched}
                    </Text>
                    <Text style={styles.summaryBoxLabel}>Matched</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={[styles.summaryBoxValue, { color: Colors.yellow[500] }]}>
                      {summary.uncertain}
                    </Text>
                    <Text style={styles.summaryBoxLabel}>Uncertain</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={[styles.summaryBoxValue, { color: Colors.red[500] }]}>
                      {summary.unmatched}
                    </Text>
                    <Text style={styles.summaryBoxLabel}>Unmatched</Text>
                  </View>
                </View>
              </View>

              {/* Match Results */}
              {matches.map((match, index) => (
                <View key={index} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(match.matchConfidence) }]}>
                      <Text style={styles.confidenceText}>{match.matchConfidence}%</Text>
                    </View>
                    <Text style={styles.matchReason}>{match.matchReason}</Text>
                  </View>
                  <View style={styles.txnRow}>
                    <Text style={styles.txnDate}>{formatDate(match.transaction.date)}</Text>
                    <Text style={styles.txnAmount}>
                      {formatCurrency(match.transaction.credit || match.transaction.debit || 0)}
                    </Text>
                  </View>
                  <Text style={styles.txnDescription} numberOfLines={1}>
                    {match.transaction.description}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray[50] },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.white },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary[500] },
  tabText: { fontSize: 14, color: Colors.gray[500] },
  tabTextActive: { color: Colors.primary[500], fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.gray[900], marginBottom: 8 },
  description: { fontSize: 14, color: Colors.gray[500], marginBottom: 16, lineHeight: 20 },
  bankSelector: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.gray[700], marginBottom: 8 },
  bankChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.gray[100], marginRight: 8 },
  bankChipActive: { backgroundColor: Colors.primary[500] },
  bankChipText: { fontSize: 13, color: Colors.gray[700] },
  bankChipTextActive: { color: Colors.white, fontWeight: '500' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary[500], paddingVertical: 14, borderRadius: 10, gap: 8 },
  uploadButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  formatsContainer: { marginTop: 16, padding: 12, backgroundColor: Colors.gray[50], borderRadius: 8 },
  formatsTitle: { fontSize: 12, fontWeight: '600', color: Colors.gray[500], marginBottom: 4 },
  formatsList: { fontSize: 13, color: Colors.gray[600] },
  summaryRow: { flexDirection: 'row', marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: Colors.gray[900] },
  summaryLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  reconcileButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary[500], paddingVertical: 12, borderRadius: 8, gap: 8 },
  reconcileButtonText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  buttonDisabled: { backgroundColor: Colors.gray[300] },
  transactionCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  txnDate: { fontSize: 13, color: Colors.gray[500] },
  txnAmount: { fontSize: 16, fontWeight: '600' },
  credit: { color: Colors.green[600] },
  debit: { color: Colors.red[600] },
  txnDescription: { fontSize: 14, color: Colors.gray[700], lineHeight: 20 },
  txnRef: { fontSize: 12, color: Colors.gray[400], marginTop: 4 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  summaryBox: { alignItems: 'center' },
  summaryBoxValue: { fontSize: 28, fontWeight: '700' },
  summaryBoxLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  matchCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  matchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  matchReason: { fontSize: 13, color: Colors.gray[600], flex: 1 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});
