// ==========================================
// MyTalent - Payroll Screen
// Employee Payroll & Compensation Management
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Colors } from '../../src/components/Badge';

interface PayrollRecord {
  id: string;
  period: string;
  year: number;
  month: number;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  status: 'processed' | 'pending' | 'disbursed';
  paymentDate?: string;
  components: {
    basic: number;
    hra: number;
    allowances: number;
    bonuses: number;
    tax: number;
    pf: number;
    insurance: number;
    otherDeductions: number;
  };
}

interface PayrollStats {
  annualGross: number;
  annualNet: number;
  monthlyAvg: number;
  ytdEarnings: number;
  ytdDeductions: number;
}

export default function PayrollScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'components'>('summary');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  const mockStats: PayrollStats = {
    annualGross: 1800000,
    annualNet: 1452000,
    monthlyAvg: 121000,
    ytdEarnings: 600000,
    ytdDeductions: 120000,
  };

  const mockPayrollHistory: PayrollRecord[] = [
    {
      id: '1',
      period: 'May 2026',
      year: 2026,
      month: 5,
      grossSalary: 150000,
      netSalary: 121000,
      deductions: 29000,
      status: 'disbursed',
      paymentDate: 'May 30, 2026',
      components: {
        basic: 60000,
        hra: 30000,
        allowances: 25000,
        bonuses: 35000,
        tax: 15000,
        pf: 7200,
        insurance: 3000,
        otherDeductions: 3800,
      },
    },
    {
      id: '2',
      period: 'April 2026',
      year: 2026,
      month: 4,
      grossSalary: 150000,
      netSalary: 121000,
      deductions: 29000,
      status: 'disbursed',
      paymentDate: 'April 30, 2026',
      components: {
        basic: 60000,
        hra: 30000,
        allowances: 25000,
        bonuses: 35000,
        tax: 15000,
        pf: 7200,
        insurance: 3000,
        otherDeductions: 3800,
      },
    },
    {
      id: '3',
      period: 'March 2026',
      year: 2026,
      month: 3,
      grossSalary: 150000,
      netSalary: 121000,
      deductions: 29000,
      status: 'disbursed',
      paymentDate: 'March 31, 2026',
      components: {
        basic: 60000,
        hra: 30000,
        allowances: 25000,
        bonuses: 35000,
        tax: 15000,
        pf: 7200,
        insurance: 3000,
        otherDeductions: 3800,
      },
    },
    {
      id: '4',
      period: 'February 2026',
      year: 2026,
      month: 2,
      grossSalary: 150000,
      netSalary: 121000,
      deductions: 29000,
      status: 'disbursed',
      paymentDate: 'February 28, 2026',
      components: {
        basic: 60000,
        hra: 30000,
        allowances: 25000,
        bonuses: 35000,
        tax: 15000,
        pf: 7200,
        insurance: 3000,
        otherDeductions: 3800,
      },
    },
    {
      id: '5',
      period: 'January 2026',
      year: 2026,
      month: 1,
      grossSalary: 150000,
      netSalary: 121000,
      deductions: 29000,
      status: 'disbursed',
      paymentDate: 'January 31, 2026',
      components: {
        basic: 60000,
        hra: 30000,
        allowances: 25000,
        bonuses: 35000,
        tax: 15000,
        pf: 7200,
        insurance: 3000,
        otherDeductions: 3800,
      },
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // API call would go here
      // const response = await payrollService.getPayrollHistory(employeeId);
    } catch (error) {
      logger.error('Failed to load payroll data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disbursed':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'processed':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'pending':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const getEarningsPercentage = (amount: number, gross: number) => {
    return Math.round((amount / gross) * 100);
  };

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedRecord(record);
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    Alert.alert(
      'Download Payslip',
      `Downloading payslip for ${record.period}...`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payroll data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payroll</Text>
        <Text style={styles.headerSubtitle}>Your salary & compensation</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Monthly Gross</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {formatCurrency(mockStats.monthlyAvg)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>YTD Earnings</Text>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
            {formatCurrency(mockStats.ytdEarnings)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>YTD Deductions</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {formatCurrency(mockStats.ytdDeductions)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'components' && styles.tabActive]}
          onPress={() => setActiveTab('components')}
        >
          <Text style={[styles.tabText, activeTab === 'components' && styles.tabTextActive]}>
            Components
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'summary' && (
          <>
            {/* Annual Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Annual Summary (FY 2025-26)</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Annual Gross</Text>
                  <Text style={[styles.summaryAmount, { color: '#10b981' }]}>
                    {formatCurrency(mockStats.annualGross)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Annual Net</Text>
                  <Text style={[styles.summaryAmount, { color: '#8b5cf6' }]}>
                    {formatCurrency(mockStats.annualNet)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Deductions</Text>
                  <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>
                    {formatCurrency(mockStats.annualGross - mockStats.annualNet)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Effective Rate</Text>
                  <Text style={[styles.summaryAmount, { color: '#6b7280' }]}>
                    {Math.round(((mockStats.annualGross - mockStats.annualNet) / mockStats.annualGross) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>💰</Text>
                <Text style={styles.actionTitle}>Latest Payslip</Text>
                <Text style={styles.actionSubtitle}>May 2026</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionTitle}>Tax Declaration</Text>
                <Text style={styles.actionSubtitle}>Update now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>🏦</Text>
                <Text style={styles.actionTitle}>Bank Details</Text>
                <Text style={styles.actionSubtitle}>HDFC ****4521</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📄</Text>
                <Text style={styles.actionTitle}>Form 16</Text>
                <Text style={styles.actionSubtitle}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text style={styles.sectionTitle}>Payroll History</Text>
            {mockPayrollHistory.map((record) => {
              const statusStyle = getStatusColor(record.status);
              return (
                <View key={record.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyPeriod}>{record.period}</Text>
                      {record.paymentDate && (
                        <Text style={styles.historyPaymentDate}>
                          Paid on {record.paymentDate}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {record.status === 'disbursed' ? 'Paid' : record.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyAmounts}>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Gross</Text>
                      <Text style={[styles.amountValue, { color: '#10b981' }]}>
                        {formatCurrency(record.grossSalary)}
                      </Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Deductions</Text>
                      <Text style={[styles.amountValue, { color: '#ef4444' }]}>
                        -{formatCurrency(record.deductions)}
                      </Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Net Pay</Text>
                      <Text style={[styles.amountValue, { color: '#8b5cf6' }]}>
                        {formatCurrency(record.netSalary)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewPayslip(record)}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => handleDownloadPayslip(record)}
                    >
                      <Text style={styles.downloadButtonText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'components' && (
          <>
            <Text style={styles.sectionTitle}>Salary Components</Text>

            {/* Earnings */}
            <View style={styles.componentsCard}>
              <Text style={styles.componentsTitle}>Earnings</Text>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🏠</Text>
                  <View>
                    <Text style={styles.componentName}>Basic Salary</Text>
                    <Text style={styles.componentPercent}>40% of gross</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#10b981' }]}>
                  {formatCurrency(60000)}
                </Text>
              </View>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🏢</Text>
                  <View>
                    <Text style={styles.componentName}>House Rent Allowance</Text>
                    <Text style={styles.componentPercent}>20% of gross</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#10b981' }]}>
                  {formatCurrency(30000)}
                </Text>
              </View>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🎁</Text>
                  <View>
                    <Text style={styles.componentName}>Allowances</Text>
                    <Text style={styles.componentPercent}>Transport, Medical, etc.</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#10b981' }]}>
                  {formatCurrency(25000)}
                </Text>
              </View>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🎯</Text>
                  <View>
                    <Text style={styles.componentName}>Performance Bonus</Text>
                    <Text style={styles.componentPercent}>Variable</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#10b981' }]}>
                  {formatCurrency(35000)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Earnings</Text>
                <Text style={[styles.totalAmount, { color: '#10b981' }]}>
                  {formatCurrency(150000)}
                </Text>
              </View>
            </View>

            {/* Deductions */}
            <View style={styles.componentsCard}>
              <Text style={styles.componentsTitle}>Deductions</Text>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🏛️</Text>
                  <View>
                    <Text style={styles.componentName}>Income Tax (TDS)</Text>
                    <Text style={styles.componentPercent}>As per slab</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#ef4444' }]}>
                  -{formatCurrency(15000)}
                </Text>
              </View>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🏦</Text>
                  <View>
                    <Text style={styles.componentName}>Provident Fund</Text>
                    <Text style={styles.componentPercent}>12% of basic</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#ef4444' }]}>
                  -{formatCurrency(7200)}
                </Text>
              </View>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>🏥</Text>
                  <View>
                    <Text style={styles.componentName}>Health Insurance</Text>
                    <Text style={styles.componentPercent}>Premium deduction</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#ef4444' }]}>
                  -{formatCurrency(3000)}
                </Text>
              </View>
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentIcon}>📌</Text>
                  <View>
                    <Text style={styles.componentName}>Other Deductions</Text>
                    <Text style={styles.componentPercent}>Professional tax, etc.</Text>
                  </View>
                </View>
                <Text style={[styles.componentAmount, { color: '#ef4444' }]}>
                  -{formatCurrency(3800)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Deductions</Text>
                <Text style={[styles.totalAmount, { color: '#ef4444' }]}>
                  -{formatCurrency(29000)}
                </Text>
              </View>
            </View>

            {/* Net Pay Summary */}
            <View style={[styles.componentsCard, styles.netPayCard]}>
              <Text style={styles.netPayLabel}>Net Pay</Text>
              <Text style={styles.netPayAmount}>{formatCurrency(121000)}</Text>
              <Text style={styles.netPayNote}>Per month after all deductions</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Payslip Detail Modal */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRecord(null)}
      >
        {selectedRecord && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payslip - {selectedRecord.period}</Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.payslipSection}>
                <Text style={styles.payslipSectionTitle}>Earnings</Text>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Basic Salary</Text>
                  <Text style={styles.payslipValue}>
                    {formatCurrency(selectedRecord.components.basic)}
                  </Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>HRA</Text>
                  <Text style={styles.payslipValue}>
                    {formatCurrency(selectedRecord.components.hra)}
                  </Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Allowances</Text>
                  <Text style={styles.payslipValue}>
                    {formatCurrency(selectedRecord.components.allowances)}
                  </Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Bonuses</Text>
                  <Text style={styles.payslipValue}>
                    {formatCurrency(selectedRecord.components.bonuses)}
                  </Text>
                </View>
                <View style={[styles.payslipRow, styles.payslipTotal]}>
                  <Text style={styles.payslipTotalLabel}>Gross Salary</Text>
                  <Text style={[styles.payslipTotalValue, { color: '#10b981' }]}>
                    {formatCurrency(selectedRecord.grossSalary)}
                  </Text>
                </View>
              </View>

              <View style={styles.payslipSection}>
                <Text style={styles.payslipSectionTitle}>Deductions</Text>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Income Tax</Text>
                  <Text style={styles.payslipValue}>
                    -{formatCurrency(selectedRecord.components.tax)}
                  </Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Provident Fund</Text>
                  <Text style={styles.payslipValue}>
                    -{formatCurrency(selectedRecord.components.pf)}
                  </Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Health Insurance</Text>
                  <Text style={styles.payslipValue}>
                    -{formatCurrency(selectedRecord.components.insurance)}
                  </Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipLabel}>Other</Text>
                  <Text style={styles.payslipValue}>
                    -{formatCurrency(selectedRecord.components.otherDeductions)}
                  </Text>
                </View>
                <View style={[styles.payslipRow, styles.payslipTotal]}>
                  <Text style={styles.payslipTotalLabel}>Total Deductions</Text>
                  <Text style={[styles.payslipTotalValue, { color: '#ef4444' }]}>
                    -{formatCurrency(selectedRecord.deductions)}
                  </Text>
                </View>
              </View>

              <View style={[styles.payslipSection, styles.payslipNetSection]}>
                <Text style={styles.payslipNetLabel}>Net Pay</Text>
                <Text style={styles.payslipNetValue}>
                  {formatCurrency(selectedRecord.netSalary)}
                </Text>
                {selectedRecord.paymentDate && (
                  <Text style={styles.payslipNetNote}>
                    Disbursed on {selectedRecord.paymentDate}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.modalDownloadButton}
                onPress={() => {
                  Alert.alert('Download', 'Downloading payslip...');
                  setSelectedRecord(null);
                }}
              >
                <Text style={styles.modalDownloadText}>Download Payslip PDF</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    backgroundColor: '#10b981',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  historyPaymentDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyAmounts: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  componentsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  componentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  componentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  componentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  componentName: {
    fontSize: 14,
    color: Colors.text,
  },
  componentPercent: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  componentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  netPayCard: {
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  netPayLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  netPayAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  netPayNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  payslipSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  payslipSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  payslipLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  payslipValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  payslipTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 4,
  },
  payslipTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  payslipTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  payslipNetSection: {
    backgroundColor: '#10b981',
    alignItems: 'center',
    marginBottom: 24,
  },
  payslipNetLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  payslipNetValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  payslipNetNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  modalDownloadButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  modalDownloadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
