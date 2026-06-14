/**
 * TDS/TCS Screen
 *
 * Manage Tax Deducted at Source and Tax Collected at Source
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
import { useStore } from '@/contexts/StoreContext';
import {
  getTDSRecords,
  getTDSQuarterlySummary,
  calculateTDS,
  depositTDS,
  generateTDSCertificate,
  TDSRecord,
  TDSStatus,
  TDSRateType,
} from '@/services/api/b2bApi';

type TabType = 'records' | 'summary' | 'calculator';
type QuarterType = string;

function getCurrentQuarter(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}-${(year + 1).toString().slice(-2)}Q${quarter}`;
}

const TDS_SECTIONS: Record<TDSRateType, { rate: number; threshold: number; description: string }> = {
  '193J': { rate: 10, threshold: 5000, description: 'Interest on securities' },
  '194': { rate: 10, threshold: 10000, description: 'Dividends' },
  '194A': { rate: 10, threshold: 40000, description: 'Interest (other)' },
  '194C': { rate: 2, threshold: 30000, description: 'Contractor/HC' },
  '194D': { rate: 5, threshold: 15000, description: 'Insurance commission' },
  '194H': { rate: 5, threshold: 15000, description: 'Commission/Brokerage' },
  '194I': { rate: 2, threshold: 180000, description: 'Rent' },
  '194J': { rate: 10, threshold: 30000, description: 'Professional fees' },
  '194Q': { rate: 0.1, threshold: 500000, description: 'Purchase of goods' },
};

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = [2024, 2025, 2026];

export default function TDSScreen() {
  const { activeStore } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [records, setRecords] = useState<TDSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterType>(getCurrentQuarter());
  const [summary, setSummary] = useState<unknown>(null);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState('');
  const [calcSection, setCalcSection] = useState<TDSRateType>('194C');
  const [calcResult, setCalcResult] = useState<{ tdsAmount: number; taxableAmount: number; isApplicable: boolean } | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!activeStore?._id) return;
    try {
      const response = await getTDSRecords(activeStore._id);
      setRecords(response.data || []);
    } catch (error) {
      console.error('Failed to load TDS records', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getTDSQuarterlySummary(selectedQuarter);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary', error);
    }
  }, [selectedQuarter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary();
    }
  }, [activeTab, fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const handleCalculate = async () => {
    const amount = parseFloat(calcAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const result = await calculateTDS(amount, calcSection);
      setCalcResult({
        tdsAmount: result.tdsAmount,
        taxableAmount: result.taxableAmount,
        isApplicable: result.isTdsApplicable,
      });
    } catch (error) {
      Alert.alert('Error', 'Calculation failed');
    }
  };

  const handleDeposit = async (recordIds: string[], amount: number) => {
    Alert.prompt(
      'TDS Deposit',
      'Enter challan details',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit',
          onPress: async (challanNo) => {
            if (!challanNo) return;
            try {
              await depositTDS(recordIds, {
                challanNumber: challanNo,
                bsrCode: '1234567',
                depositDate: new Date().toISOString(),
                amount,
              });
              Alert.alert('Success', 'TDS deposited successfully');
              fetchRecords();
            } catch (error) {
              Alert.alert('Error', 'Deposit failed');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleGenerateCertificate = async (recordId: string) => {
    try {
      const cert = await generateTDSCertificate(recordId);
      Alert.alert('Certificate Generated', `Certificate No: ${cert.certificateNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Certificate generation failed');
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: TDSStatus) => {
    switch (status) {
      case 'deposited': return Colors.green[500];
      case 'pending': return Colors.orange[500];
      case 'filed': return Colors.blue[500];
      case 'cancelled': return Colors.red[500];
      default: return Colors.gray[500];
    }
  };

  const [year, quarterPart] = selectedQuarter.split(/([0-9]{2}Q[0-9])/);
  const currentYear = parseInt('20' + year);
  const currentQuarter = quarterPart?.slice(-2);

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
          <Text style={styles.headerTitle}>TDS/TCS</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['records', 'summary', 'calculator'] as TabType[]).map((tab) => (
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
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'records' && (
            <Animated.View entering={FadeInDown}>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{records.length}</Text>
                    <Text style={styles.summaryLabel}>Total Records</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: Colors.green[600] }]}>
                      {formatCurrency(records.reduce((sum, r) => sum + r.tdsAmount, 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Total TDS</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: Colors.orange[600] }]}>
                      {formatCurrency(records.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.tdsAmount, 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                  </View>
                </View>
              </View>

              {/* Records List */}
              {records.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={64} color={Colors.gray[300]} />
                  <Text style={styles.emptyTitle}>No TDS Records</Text>
                  <Text style={styles.emptyText}>TDS records will appear here when payments are processed</Text>
                </View>
              ) : (
                records.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View>
                        <Text style={styles.recordRef}>{record.referenceNumber}</Text>
                        <Text style={styles.recordSection}>Section {record.section}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                          {record.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recordDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Deductee</Text>
                        <Text style={styles.detailValue}>{record.deducteeName}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Amount</Text>
                        <Text style={styles.detailValue}>{formatCurrency(record.paymentAmount)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>TDS Amount</Text>
                        <Text style={[styles.detailValue, styles.tdsAmount]}>{formatCurrency(record.tdsAmount)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Rate</Text>
                        <Text style={styles.detailValue}>{record.tdsRate}%</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Date</Text>
                        <Text style={styles.detailValue}>{formatDate(record.paymentDate)}</Text>
                      </View>
                    </View>

                    {record.status === 'pending' && (
                      <View style={styles.recordActions}>
                        <TouchableOpacity
                          style={styles.depositButton}
                          onPress={() => handleDeposit([record.id], record.tdsAmount)}
                        >
                          <Ionicons name="card-outline" size={16} color={Colors.white} />
                          <Text style={styles.depositButtonText}>Deposit</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {record.status === 'deposited' && !record.certificateNumber && (
                      <View style={styles.recordActions}>
                        <TouchableOpacity
                          style={styles.certButton}
                          onPress={() => handleGenerateCertificate(record.id)}
                        >
                          <Ionicons name="document-text-outline" size={16} color={Colors.blue[500]} />
                          <Text style={styles.certButtonText}>Generate Certificate</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {record.certificateNumber && (
                      <View style={styles.certInfo}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.green[500]} />
                        <Text style={styles.certText}>Certificate: {record.certificateNumber}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </Animated.View>
          )}

          {activeTab === 'summary' && (
            <Animated.View entering={FadeInDown}>
              {/* Quarter Selector */}
              <View style={styles.quarterSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.quarterRow}>
                    {YEARS.map((y) =>
                      QUARTERS.map((q, i) => {
                        const qStr = `${y.toString().slice(-2)}Q${i + 1}`;
                        return (
                          <TouchableOpacity
                            key={`${y}-${q}`}
                            style={[styles.quarterChip, selectedQuarter.includes(qStr) && styles.quarterChipActive]}
                            onPress={() => setSelectedQuarter(`${y}-${qStr}`)}
                          >
                            <Text style={[styles.quarterChipText, selectedQuarter.includes(qStr) && styles.quarterChipTextActive]}>
                              Q{i + 1} {y}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </ScrollView>
              </View>

              {/* Summary */}
              {summary ? (
                <>
                  <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>{selectedQuarter} Summary</Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.totalTdsDeducted)}</Text>
                        <Text style={styles.summaryLabel}>TDS Deducted</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.green[600] }]}>
                          {formatCurrency(summary.totalTdsDeposited)}
                        </Text>
                        <Text style={styles.summaryLabel}>Deposited</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.red[600] }]}>
                          {formatCurrency(summary.totalTdsPending)}
                        </Text>
                        <Text style={styles.summaryLabel}>Pending</Text>
                      </View>
                    </View>
                  </View>

                  {/* By Section */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Breakdown by Section</Text>
                    {Object.entries(summary.bySection || {}).map(([section, data]: [string, unknown]) => (
                      <View key={section} style={styles.sectionRow}>
                        <View>
                          <Text style={styles.sectionName}>Section {section}</Text>
                          <Text style={styles.sectionDesc}>{TDS_SECTIONS[section as TDSRateType]?.description || ''}</Text>
                        </View>
                        <View style={styles.sectionAmounts}>
                          <Text style={styles.sectionCount}>{data.count} payments</Text>
                          <Text style={styles.sectionTds}>{formatCurrency(data.tds)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Certificates */}
                  <View style={styles.certSummary}>
                    <View style={styles.certItem}>
                      <Text style={styles.certValue}>{summary.certificatesIssued}</Text>
                      <Text style={styles.certLabel}>Certificates Issued</Text>
                    </View>
                    <View style={styles.certItem}>
                      <Text style={styles.certValue}>{summary.certificatesPending}</Text>
                      <Text style={styles.certLabel}>Pending</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No summary data for this quarter</Text>
                </View>
              )}
            </Animated.View>
          )}

          {activeTab === 'calculator' && (
            <Animated.View entering={FadeInDown}>
              <View style={styles.calculatorCard}>
                <Text style={styles.sectionTitle}>TDS Calculator</Text>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Amount</Text>
                  <View style={styles.amountInput}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.amountText}>
                      {calcAmount || '0'}
                    </Text>
                  </View>
                  <View style={styles.quickAmounts}>
                    {[10000, 50000, 100000, 500000].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={styles.quickAmount}
                        onPress={() => setCalcAmount(amt.toString())}
                      >
                        <Text style={styles.quickAmountText}>₹{(amt / 1000).toShortString()}K</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Section Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>TDS Section</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.sectionChips}>
                      {Object.entries(TDS_SECTIONS).map(([section, info]) => (
                        <TouchableOpacity
                          key={section}
                          style={[styles.sectionChip, calcSection === section && styles.sectionChipActive]}
                          onPress={() => {
                            setCalcSection(section as TDSRateType);
                            setCalcResult(null);
                          }}
                        >
                          <Text style={[styles.sectionChipName]}>Sec {section}</Text>
                          <Text style={[styles.sectionChipRate]}>{info.rate}%</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={styles.sectionDescription}>{TDS_SECTIONS[calcSection]?.description}</Text>
                  <Text style={styles.thresholdInfo}>
                    Threshold: ₹{TDS_SECTIONS[calcSection]?.threshold.toLocaleString('en-IN')} | Rate: {TDS_SECTIONS[calcSection]?.rate}%
                  </Text>
                </View>

                {/* Calculate Button */}
                <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                  <Text style={styles.calculateButtonText}>Calculate TDS</Text>
                </TouchableOpacity>

                {/* Result */}
                {calcResult && (
                  <View style={styles.resultCard}>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>TDS Applicable</Text>
                      <Text style={[styles.resultValue, { color: calcResult.isApplicable ? Colors.green[600] : Colors.red[500] }]}>
                        {calcResult.isApplicable ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    {calcResult.isApplicable && (
                      <>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Taxable Amount</Text>
                          <Text style={styles.resultValue}>{formatCurrency(calcResult.taxableAmount)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>TDS Amount</Text>
                          <Text style={[styles.resultValue, styles.tdsResultAmount]}>
                            {formatCurrency(calcResult.tdsAmount)}
                          </Text>
                        </View>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Net Payment</Text>
                          <Text style={styles.resultValue}>
                            {formatCurrency(parseFloat(calcAmount) - calcResult.tdsAmount)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: Colors.white },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary[500] },
  tabText: { fontSize: 14, color: Colors.gray[500] },
  tabTextActive: { color: Colors.primary[500], fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  summaryCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  summaryLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: Colors.gray[500], marginTop: 8, textAlign: 'center' },
  recordCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  recordRef: { fontSize: 15, fontWeight: '600', color: Colors.gray[900] },
  recordSection: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  recordDetails: { borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: Colors.gray[500] },
  detailValue: { fontSize: 13, color: Colors.gray[800], fontWeight: '500' },
  tdsAmount: { color: Colors.blue[600] },
  recordActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  depositButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.green[500], gap: 6 },
  depositButtonText: { fontSize: 13, fontWeight: '600', color: Colors.white },
  certButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.blue[300], gap: 6 },
  certButtonText: { fontSize: 13, fontWeight: '500', color: Colors.blue[500] },
  certInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  certText: { fontSize: 12, color: Colors.green[600] },
  quarterSelector: { marginBottom: 16 },
  quarterRow: { flexDirection: 'row', gap: 8 },
  quarterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.gray[100] },
  quarterChipActive: { backgroundColor: Colors.primary[500] },
  quarterChipText: { fontSize: 13, color: Colors.gray[700] },
  quarterChipTextActive: { color: Colors.white, fontWeight: '600' },
  sectionCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.gray[900], marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  sectionName: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  sectionDesc: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  sectionAmounts: { alignItems: 'flex-end' },
  sectionCount: { fontSize: 12, color: Colors.gray[500] },
  sectionTds: { fontSize: 14, fontWeight: '600', color: Colors.blue[600], marginTop: 2 },
  certSummary: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 12, padding: 16, gap: 16 },
  certItem: { flex: 1, alignItems: 'center' },
  certValue: { fontSize: 28, fontWeight: '700', color: Colors.green[600] },
  certLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  calculatorCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: Colors.gray[700], marginBottom: 8 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray[50], borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14 },
  currencySymbol: { fontSize: 24, color: Colors.gray[400], marginRight: 4 },
  amountText: { fontSize: 24, fontWeight: '600', color: Colors.gray[900], flex: 1 },
  quickAmounts: { flexDirection: 'row', marginTop: 12, gap: 8 },
  quickAmount: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.gray[100] },
  quickAmountText: { fontSize: 12, color: Colors.gray[700] },
  sectionChips: { flexDirection: 'row', gap: 8 },
  sectionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.gray[100] },
  sectionChipActive: { backgroundColor: Colors.primary[500] },
  sectionChipName: { fontSize: 12, fontWeight: '600', color: Colors.gray[800] },
  sectionChipRate: { fontSize: 11, color: Colors.gray[500] },
  sectionDescription: { fontSize: 13, color: Colors.gray[600], marginTop: 12 },
  thresholdInfo: { fontSize: 12, color: Colors.gray[400], marginTop: 4 },
  calculateButton: { backgroundColor: Colors.primary[500], paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  calculateButtonText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  resultCard: { marginTop: 16, backgroundColor: Colors.gray[50], borderRadius: 12, padding: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel: { fontSize: 14, color: Colors.gray[600] },
  resultValue: { fontSize: 14, fontWeight: '600', color: Colors.gray[900] },
  tdsResultAmount: { color: Colors.blue[600], fontSize: 18 },
});
