// ==========================================
// MyTalent - Compensation Screen
// Employee Compensation & Benefits Overview
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

interface CompensationPackage {
  id: string;
  effectiveDate: string;
  ctc: number;
  fixed: number;
  variable: number;
  benefits: number;
  currency: string;
  change?: number;
  changePercent?: number;
}

interface Benefit {
  id: string;
  name: string;
  icon: string;
  value: number;
  type: 'allowance' | 'insurance' | 'retirement' | 'perquisite';
  frequency: 'monthly' | 'annually' | 'one-time';
  taxable: boolean;
  description: string;
}

interface CompensationStats {
  totalCTC: number;
  fixedSalary: number;
  variablePay: number;
  totalBenefits: number;
  ctcChange: number;
  ctcChangePercent: number;
}

export default function CompensationScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'benefits' | 'history'>('overview');
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  const mockStats: CompensationStats = {
    totalCTC: 1800000,
    fixedSalary: 1080000,
    variablePay: 540000,
    totalBenefits: 180000,
    ctcChange: 200000,
    ctcChangePercent: 12.5,
  };

  const mockCurrentPackage: CompensationPackage = {
    id: '1',
    effectiveDate: '2026-04-01',
    ctc: 1800000,
    fixed: 1080000,
    variable: 540000,
    benefits: 180000,
    currency: 'INR',
    change: 200000,
    changePercent: 12.5,
  };

  const mockBenefits: Benefit[] = [
    {
      id: '1',
      name: 'Health Insurance',
      icon: '🏥',
      value: 60000,
      type: 'insurance',
      frequency: 'annually',
      taxable: false,
      description: 'Comprehensive health coverage for employee and family',
    },
    {
      id: '2',
      name: 'Life Insurance',
      icon: '🛡️',
      value: 24000,
      type: 'insurance',
      frequency: 'annually',
      taxable: false,
      description: 'Term life insurance coverage',
    },
    {
      id: '3',
      name: 'Provident Fund',
      icon: '🏦',
      value: 86400,
      type: 'retirement',
      frequency: 'annually',
      taxable: false,
      description: 'Employee contribution to EPF (12% of basic)',
    },
    {
      id: '4',
      name: 'Gratuity',
      icon: '💰',
      value: 43200,
      type: 'retirement',
      frequency: 'annually',
      taxable: false,
      description: 'Statutory gratuity contribution',
    },
    {
      id: '5',
      name: 'Meal Allowance',
      icon: '🍽️',
      value: 24000,
      type: 'allowance',
      frequency: 'annually',
      taxable: true,
      description: 'Monthly meal coupons or allowance',
    },
    {
      id: '6',
      name: 'Transport Allowance',
      icon: '🚗',
      value: 36000,
      type: 'allowance',
      frequency: 'annually',
      taxable: true,
      description: 'Commute allowance or company transport',
    },
    {
      id: '7',
      name: 'Phone Allowance',
      icon: '📱',
      value: 18000,
      type: 'allowance',
      frequency: 'annually',
      taxable: true,
      description: 'Monthly phone and data allowance',
    },
    {
      id: '8',
      name: 'Learning & Development',
      icon: '📚',
      value: 50000,
      type: 'perquisite',
      frequency: 'annually',
      taxable: false,
      description: 'Annual L&D budget for courses and certifications',
    },
    {
      id: '9',
      name: ' Wellness Allowance',
      icon: '🧘',
      value: 12000,
      type: 'allowance',
      frequency: 'annually',
      taxable: false,
      description: 'Gym, yoga, mental wellness programs',
    },
    {
      id: '10',
      name: 'Internet Allowance',
      icon: '🌐',
      value: 12000,
      type: 'allowance',
      frequency: 'annually',
      taxable: true,
      description: 'Home internet expense reimbursement',
    },
  ];

  const mockHistory: CompensationPackage[] = [
    {
      id: '2',
      effectiveDate: '2025-04-01',
      ctc: 1600000,
      fixed: 960000,
      variable: 480000,
      benefits: 160000,
      currency: 'INR',
      change: 200000,
      changePercent: 14.3,
    },
    {
      id: '3',
      effectiveDate: '2024-04-01',
      ctc: 1400000,
      fixed: 840000,
      variable: 420000,
      benefits: 140000,
      currency: 'INR',
      change: 150000,
      changePercent: 12.0,
    },
    {
      id: '4',
      effectiveDate: '2023-04-01',
      ctc: 1250000,
      fixed: 750000,
      variable: 375000,
      benefits: 125000,
      currency: 'INR',
      change: 250000,
      changePercent: 25.0,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // API call would go here
      // const response = await compensationService.getCompensationPackage(employeeId);
    } catch (error) {
      logger.error('Failed to load compensation data:', error);
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

  const formatCompact = (amount: number) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)} L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)} K`;
    }
    return amount.toString();
  };

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'insurance':
        return '🏥';
      case 'retirement':
        return '🏦';
      case 'allowance':
        return '💵';
      case 'perquisite':
        return '🎁';
      default:
        return '📋';
    }
  };

  const handleViewBenefit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
  };

  const handleRequestRevision = () => {
    Alert.alert(
      'Compensation Revision Request',
      'This will open the compensation revision request form. Your manager will be notified.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading compensation data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compensation</Text>
        <Text style={styles.headerSubtitle}>Your total rewards package</Text>
      </View>

      {/* Main CTC Card */}
      <View style={styles.ctcCard}>
        <Text style={styles.ctcLabel}>Annual Cost to Company</Text>
        <Text style={styles.ctcAmount}>{formatCompact(mockStats.totalCTC)}</Text>
        <View style={styles.ctcChange}>
          <Text style={styles.ctcChangeIcon}>📈</Text>
          <Text style={styles.ctcChangeText}>
            +{formatCompact(mockStats.ctcChange)} ({mockStats.ctcChangePercent}% increase)
          </Text>
        </View>
        <Text style={styles.ctcEffective}>
          Effective from {new Date(mockCurrentPackage.effectiveDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Fixed</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {formatCompact(mockStats.fixedSalary)}
          </Text>
          <Text style={styles.statSubtext}>/year</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Variable</Text>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {formatCompact(mockStats.variablePay)}
          </Text>
          <Text style={styles.statSubtext}>/year</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Benefits</Text>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
            {formatCompact(mockStats.totalBenefits)}
          </Text>
          <Text style={styles.statSubtext}>/year</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'benefits' && styles.tabActive]}
          onPress={() => setActiveTab('benefits')}
        >
          <Text style={[styles.tabText, activeTab === 'benefits' && styles.tabTextActive]}>
            Benefits
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
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && (
          <>
            {/* Compensation Breakdown */}
            <Text style={styles.sectionTitle}>Compensation Breakdown</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownIcon}>💵</Text>
                  <View>
                    <Text style={styles.breakdownLabel}>Fixed Salary</Text>
                    <Text style={styles.breakdownDesc}>Base + HRA + Allowances</Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownAmount}>{formatCurrency(mockStats.fixedSalary)}</Text>
                  <Text style={styles.breakdownPercent}>60%</Text>
                </View>
              </View>

              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: '60%', backgroundColor: '#10b981' }]} />
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownIcon}>🎯</Text>
                  <View>
                    <Text style={styles.breakdownLabel}>Variable Pay</Text>
                    <Text style={styles.breakdownDesc}>Performance bonus</Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownAmount}>{formatCurrency(mockStats.variablePay)}</Text>
                  <Text style={styles.breakdownPercent}>30%</Text>
                </View>
              </View>

              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: '30%', backgroundColor: '#f59e0b' }]} />
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownIcon}>🎁</Text>
                  <View>
                    <Text style={styles.breakdownLabel}>Benefits & Perks</Text>
                    <Text style={styles.breakdownDesc}>Insurance + Retiral + Allowances</Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownAmount}>{formatCurrency(mockStats.totalBenefits)}</Text>
                  <Text style={styles.breakdownPercent}>10%</Text>
                </View>
              </View>

              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: '10%', backgroundColor: '#8b5cf6' }]} />
              </View>
            </View>

            {/* Monthly Take Home */}
            <Text style={styles.sectionTitle}>Monthly Take Home</Text>
            <View style={styles.takeHomeCard}>
              <Text style={styles.takeHomeLabel}>Estimated Net Salary</Text>
              <Text style={styles.takeHomeAmount}>{formatCurrency(Math.round(mockStats.fixedSalary / 12))}</Text>
              <Text style={styles.takeHomeNote}>After deductions (TDS, PF, etc.)</Text>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleRequestRevision}>
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionTitle}>Request Revision</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => Alert.alert('Tax Statement', 'Opening tax statement...')}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionTitle}>Tax Statement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => Alert.alert('CTC Letter', 'Opening CTC letter...')}
              >
                <Text style={styles.actionIcon}>📄</Text>
                <Text style={styles.actionTitle}>CTC Letter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => Alert.alert('Benefits Guide', 'Opening benefits guide...')}
              >
                <Text style={styles.actionIcon}>📖</Text>
                <Text style={styles.actionTitle}>Benefits Guide</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'benefits' && (
          <>
            <Text style={styles.sectionTitle}>All Benefits</Text>
            {mockBenefits.map((benefit) => (
              <TouchableOpacity
                key={benefit.id}
                style={styles.benefitCard}
                onPress={() => handleViewBenefit(benefit)}
              >
                <View style={styles.benefitLeft}>
                  <View style={styles.benefitIcon}>
                    <Text style={styles.benefitEmoji}>{benefit.icon}</Text>
                  </View>
                  <View style={styles.benefitInfo}>
                    <Text style={styles.benefitName}>{benefit.name}</Text>
                    <View style={styles.benefitMeta}>
                      <Text style={styles.benefitFrequency}>
                        {benefit.frequency === 'monthly'
                          ? 'Monthly'
                          : benefit.frequency === 'annually'
                          ? 'Annual'
                          : 'One-time'}
                      </Text>
                      {benefit.taxable ? (
                        <View style={styles.taxableBadge}>
                          <Text style={styles.taxableText}>Taxable</Text>
                        </View>
                      ) : (
                        <View style={styles.taxFreeBadge}>
                          <Text style={styles.taxFreeText}>Tax-Free</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.benefitAmount}>{formatCurrency(benefit.value)}</Text>
              </TouchableOpacity>
            ))}

            {/* Total Benefits */}
            <View style={styles.totalBenefitsCard}>
              <Text style={styles.totalBenefitsLabel}>Total Annual Benefits</Text>
              <Text style={styles.totalBenefitsAmount}>
                {formatCurrency(mockStats.totalBenefits)}
              </Text>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text style={styles.sectionTitle}>Compensation History</Text>

            {/* Current */}
            <View style={[styles.historyCard, styles.historyCardCurrent]}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyLabel}>Current</Text>
                  <Text style={styles.historyDate}>
                    Since {new Date(mockCurrentPackage.effectiveDate).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Active</Text>
                </View>
              </View>
              <View style={styles.historyAmounts}>
                <View style={styles.historyAmountItem}>
                  <Text style={styles.historyAmountLabel}>CTC</Text>
                  <Text style={[styles.historyAmountValue, { color: '#8b5cf6' }]}>
                    {formatCompact(mockCurrentPackage.ctc)}
                  </Text>
                </View>
                <View style={styles.historyAmountItem}>
                  <Text style={styles.historyAmountLabel}>Change</Text>
                  <Text style={[styles.historyAmountValue, { color: '#10b981' }]}>
                    +{mockCurrentPackage.changePercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Previous */}
            {mockHistory.map((pkg) => (
              <View key={pkg.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={styles.historyLabel}>Previous</Text>
                    <Text style={styles.historyDate}>
                      {new Date(pkg.effectiveDate).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyAmounts}>
                  <View style={styles.historyAmountItem}>
                    <Text style={styles.historyAmountLabel}>CTC</Text>
                    <Text style={styles.historyAmountValue}>
                      {formatCompact(pkg.ctc)}
                    </Text>
                  </View>
                  <View style={styles.historyAmountItem}>
                    <Text style={styles.historyAmountLabel}>Change</Text>
                    <Text style={[styles.historyAmountValue, { color: '#10b981' }]}>
                      +{pkg.changePercent}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Growth Chart Placeholder */}
            <Text style={styles.sectionTitle}>CTC Growth</Text>
            <View style={styles.growthCard}>
              <View style={styles.growthBars}>
                {[
                  { year: '2023', ctc: 12.5, percent: 25 },
                  { year: '2024', ctc: 14.0, percent: 12 },
                  { year: '2025', ctc: 16.0, percent: 14.3 },
                  { year: '2026', ctc: 18.0, percent: 12.5 },
                ].map((item, index) => (
                  <View key={item.year} style={styles.growthBarContainer}>
                    <View style={styles.growthBarWrapper}>
                      <View
                        style={[
                          styles.growthBar,
                          {
                            height: `${item.percent * 3}%`,
                            backgroundColor: index === 3 ? '#8b5cf6' : '#10b981',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.growthYear}>{item.year}</Text>
                    <Text style={styles.growthValue}>{item.ctc}L</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Benefit Detail Modal */}
      <Modal
        visible={!!selectedBenefit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBenefit(null)}
      >
        {selectedBenefit && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Benefit Details</Text>
              <TouchableOpacity onPress={() => setSelectedBenefit(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.benefitDetailCard}>
                <Text style={styles.benefitDetailIcon}>{selectedBenefit.icon}</Text>
                <Text style={styles.benefitDetailName}>{selectedBenefit.name}</Text>
                <Text style={styles.benefitDetailAmount}>
                  {formatCurrency(selectedBenefit.value)}
                </Text>
                <Text style={styles.benefitDetailFrequency}>
                  {selectedBenefit.frequency === 'monthly'
                    ? 'Per month'
                    : selectedBenefit.frequency === 'annually'
                    ? 'Per year'
                    : 'One-time'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Description</Text>
                <Text style={styles.detailSectionText}>{selectedBenefit.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedBenefit.type.charAt(0).toUpperCase() +
                      selectedBenefit.type.slice(1)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>
                    {selectedBenefit.frequency === 'monthly'
                      ? 'Monthly'
                      : selectedBenefit.frequency === 'annually'
                      ? 'Annually'
                      : 'One-time'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tax Treatment</Text>
                  <View
                    style={[
                      styles.detailBadge,
                      {
                        backgroundColor: selectedBenefit.taxable ? '#fee2e2' : '#dcfce7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailBadgeText,
                        {
                          color: selectedBenefit.taxable ? '#dc2626' : '#15803d',
                        },
                      ]}
                    >
                      {selectedBenefit.taxable ? 'Taxable' : 'Tax-Free'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  Alert.alert('More Info', 'Opening benefits documentation...');
                }}
              >
                <Text style={styles.modalButtonText}>View Full Documentation</Text>
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
    backgroundColor: '#8b5cf6',
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
  ctcCard: {
    backgroundColor: '#8b5cf6',
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctcLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  ctcAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctcChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  ctcChangeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ctcChangeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ctcEffective: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
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
    fontSize: 18,
    fontWeight: '700',
  },
  statSubtext: {
    fontSize: 10,
    color: Colors.textMuted,
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
    backgroundColor: '#8b5cf6',
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
  breakdownCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  breakdownDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  breakdownPercent: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  breakdownBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  takeHomeCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  takeHomeLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  takeHomeAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  takeHomeNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  benefitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  benefitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  benefitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  benefitFrequency: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  taxableBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taxableText: {
    fontSize: 9,
    color: '#dc2626',
    fontWeight: '600',
  },
  taxFreeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taxFreeText: {
    fontSize: 9,
    color: '#15803d',
    fontWeight: '600',
  },
  benefitAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  totalBenefitsCard: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  totalBenefitsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  totalBenefitsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyCardCurrent: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  currentBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyAmounts: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  historyAmountItem: {
    flex: 1,
  },
  historyAmountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  historyAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  growthCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  growthBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  growthBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  growthBarWrapper: {
    width: 40,
    height: 80,
    justifyContent: 'flex-end',
  },
  growthBar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 20,
  },
  growthYear: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  growthValue: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
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
    color: '#8b5cf6',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  benefitDetailCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitDetailIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  benefitDetailName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  benefitDetailAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  benefitDetailFrequency: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  detailSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  detailSectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
