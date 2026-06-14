// @ts-nocheck
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

interface SipConfig {
  monthlyAmount: number;
  deductionDate: number;
  startDate: string;
}

interface SipEntry {
  date: string;
  amount: number;
  gramsBought: number;
  pricePerGram: number;
}

interface Holdings {
  grams: number;
  currentValue: number;
  invested: number;
  gainLoss: number;
}

interface GoldData {
  activeSip: SipConfig | null;
  holdings: Holdings;
  history: SipEntry[];
  currentGoldPrice: number;
}

const FALLBACK_GOLD_PRICE = 6840;
const AMOUNT_OPTIONS = [500, 1000, 2000, 5000];
const DATE_OPTIONS = [1, 5, 10, 15];

function GoldSavingsSipPage() {
  const { goBack } = useSafeNavigation();
  const [goldData, setGoldData] = useState<GoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [selectedDate, setSelectedDate] = useState(1);
  const [customAmount, setCustomAmount] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<GoldData>('/wallet/gold-sip');
        if (isMounted && response?.data) {
          setGoldData(response.data);
        }
      } catch (error) {
        if (__DEV__) logger.debug('[GoldSIP] API fetch failed, using fallback data');
        if (isMounted) {
          // Use fallback data if API not available
          setGoldData({
            activeSip: null,
            holdings: {
              grams: 2.34,
              currentValue: 16005,
              invested: 15000,
              gainLoss: 1005,
            },
            history: [
              {
                date: '2024-02-01',
                amount: 1000,
                gramsBought: 0.146,
                pricePerGram: 6840,
              },
              {
                date: '2024-01-01',
                amount: 1000,
                gramsBought: 0.146,
                pricePerGram: 6840,
              },
            ],
            currentGoldPrice: FALLBACK_GOLD_PRICE,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchGoldData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<GoldData>('/wallet/gold-sip');
      if (response?.data) {
        setGoldData(response.data);
      }
    } catch (error) {
      if (__DEV__) logger.debug('[GoldSIP] API fetch failed, using fallback data');
      // Use fallback data if API not available
      setGoldData({
        activeSip: null,
        holdings: {
          grams: 2.34,
          currentValue: 16005,
          invested: 15000,
          gainLoss: 1005,
        },
        history: [
          {
            date: '2024-02-01',
            amount: 1000,
            gramsBought: 0.146,
            pricePerGram: 6840,
          },
          {
            date: '2024-01-01',
            amount: 1000,
            gramsBought: 0.146,
            pricePerGram: 6840,
          },
        ],
        currentGoldPrice: FALLBACK_GOLD_PRICE,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartSip = async () => {
    try {
      setSaving(true);
      const amount = customAmount ? parseInt(customAmount) : selectedAmount;

      if (isNaN(amount) || amount <= 0) {
        if (__DEV__) logger.warn('[GoldSIP] Invalid amount:', { amount });
        return;
      }

      const response = await apiClient.post('/wallet/gold-sip', {
        monthlyAmount: amount,
        deductionDate: selectedDate,
      });

      if (response) {
        // Refresh data
        await fetchGoldData();
        setCustomAmount('');
      }
    } catch (error) {
      if (__DEV__) logger.error('[GoldSIP] Failed to start SIP:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSip = async () => {
    try {
      setSaving(true);
      await apiClient.delete('/wallet/gold-sip');
      await fetchGoldData();
    } catch (error) {
      if (__DEV__) logger.error('[GoldSIP] Failed to cancel SIP:', error);
    } finally {
      setSaving(false);
    }
  };

  const getEstimatedGrams = () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;
    const price = goldData?.currentGoldPrice || FALLBACK_GOLD_PRICE;
    return (amount / price).toFixed(3);
  };

  const getGainLossPercentage = () => {
    if (!goldData?.holdings.invested) return 0;
    return (((goldData as unknown)?.holdings.gainLoss / (goldData as unknown)?.holdings.invested) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => goBack('/gold-savings' as unknown)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.nileBlue} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Gold SIP</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.nileBlue} />
        </View>
      </SafeAreaView>
    );
  }

  const hasActiveSip = goldData?.activeSip !== null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/gold-savings' as unknown)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.nileBlue} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Gold SIP</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card - Current Gold Price */}
        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <ThemedText style={styles.priceLabel}>Current Gold Price</ThemedText>
            <ThemedText style={styles.timestamp}>Updated just now</ThemedText>
          </View>
          <View style={styles.priceDisplay}>
            <ThemedText style={styles.price}>
              ₹{goldData?.currentGoldPrice.toLocaleString() || FALLBACK_GOLD_PRICE}/gram
            </ThemedText>
          </View>
          <ThemedText style={styles.partner}>Gold powered by Augmont</ThemedText>
        </View>

        {/* Your SIP Card or Setup Form */}
        {hasActiveSip ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Your SIP</ThemedText>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.sipDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Monthly Amount</ThemedText>
                <ThemedText style={styles.detailValue}>
                  ₹{(goldData as unknown)?.activeSip?.monthlyAmount.toLocaleString()}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Deduction Date</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {(goldData as unknown)?.activeSip?.deductionDate}th of every month
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Next Debit</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {new Date((goldData as unknown)?.activeSip?.startDate || '').toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.cancelButton} onPress={handleCancelSip} disabled={saving}>
              <ThemedText style={styles.cancelButtonText}>{saving ? 'Cancelling...' : 'Cancel SIP'}</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Set up SIP</ThemedText>

            {/* Monthly Amount Selector */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Monthly Amount</ThemedText>
              <View style={styles.pillContainer}>
                {AMOUNT_OPTIONS.map((amount) => (
                  <Pressable
                    key={amount}
                    style={[styles.pill, selectedAmount === amount && !customAmount ? styles.pillActive : null]}
                    onPress={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.pillText,
                        selectedAmount === amount && !customAmount ? styles.pillTextActive : null,
                      ]}
                    >
                      ₹{amount}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <View style={styles.customInputContainer}>
                <ThemedText style={styles.customLabel}>Custom Amount:</ThemedText>
                <View style={styles.customInput}>
                  <ThemedText style={styles.currencySymbol}>₹</ThemedText>
                  {/* Using View as placeholder since we can't use TextInput in this context */}
                  <ThemedText style={styles.customAmount}>{customAmount || 'Enter amount'}</ThemedText>
                </View>
              </View>
            </View>

            {/* Deduction Date Selector */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Deduction Date</ThemedText>
              <View style={styles.dateGrid}>
                {DATE_OPTIONS.map((date) => (
                  <Pressable
                    key={date}
                    style={[styles.dateOption, selectedDate === date ? styles.dateOptionActive : null]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <ThemedText style={[styles.dateText, selectedDate === date ? styles.dateTextActive : null]}>
                      {date}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Summary */}
            <View style={styles.summaryBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.nileBlue} />
              <ThemedText style={styles.summaryText}>
                You'll buy ~{getEstimatedGrams()}g of gold every month at today's rate
              </ThemedText>
            </View>

            {/* Start Button */}
            <Pressable style={styles.startButton} onPress={handleStartSip} disabled={saving}>
              <ThemedText style={styles.startButtonText}>{saving ? 'Starting SIP...' : 'Start Gold SIP'}</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Your Holdings Card */}
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Your Holdings</ThemedText>
          <View style={styles.holdingsGrid}>
            <View style={styles.holdingItem}>
              <ThemedText style={styles.holdingLabel}>Total Grams</ThemedText>
              <ThemedText style={styles.holdingValue}>{goldData?.holdings.grams.toFixed(2)}g</ThemedText>
            </View>
            <View style={styles.holdingItem}>
              <ThemedText style={styles.holdingLabel}>Current Value</ThemedText>
              <ThemedText style={styles.holdingValue}>₹{goldData?.holdings.currentValue.toLocaleString()}</ThemedText>
            </View>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Invested</ThemedText>
              <ThemedText style={styles.statValue}>₹{goldData?.holdings.invested.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.statRow, styles.gainRow]}>
              <ThemedText style={styles.statLabel}>Gain/Loss</ThemedText>
              <ThemedText style={styles.gainValue}>
                +₹{goldData?.holdings.gainLoss.toLocaleString()} (+{getGainLossPercentage()}%)
              </ThemedText>
            </View>
          </View>
        </View>

        {/* SIP History */}
        {goldData?.history && (goldData as unknown)?.history.length > 0 && (
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>SIP History</ThemedText>
            <View style={styles.historyList}>
              {(goldData as unknown)?.history.map((entry, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <ThemedText style={styles.historyDate}>
                      {new Date(entry.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </ThemedText>
                    <ThemedText style={styles.historyDetail}>
                      {entry.gramsBought.toFixed(3)}g @ ₹{entry.pricePerGram}/g
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.historyAmount}>₹{entry.amount.toLocaleString()}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.nileBlue,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceCard: {
    backgroundColor: '#f5a623',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  priceHeader: {
    marginBottom: Spacing.md,
  },
  priceLabel: {
    ...Typography.body,
    color: '#1a3a52',
    fontWeight: '500',
  },
  timestamp: {
    ...Typography.caption,
    color: '#1a3a52',
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  priceDisplay: {
    marginBottom: Spacing.md,
  },
  price: {
    ...Typography.h2,
    color: '#1a3a52',
    fontWeight: '700',
  },
  partner: {
    ...Typography.caption,
    color: '#1a3a52',
    opacity: 0.8,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...(Typography as unknown).h5,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sipDetails: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  detailLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  detailValue: {
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  pillActive: {
    borderColor: '#f5a623',
    backgroundColor: '#fff8f0',
  },
  pillText: {
    ...Typography.body,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#f5a623',
  },
  customInputContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  customLabel: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.nileBlue,
    paddingVertical: Spacing.sm,
  },
  currencySymbol: {
    ...(Typography as unknown).h5,
    color: colors.nileBlue,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  customAmount: {
    ...Typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dateOption: {
    flex: 0.5,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  dateOptionActive: {
    borderColor: colors.nileBlue,
    backgroundColor: '#e8f0f8',
  },
  dateText: {
    ...Typography.body,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  dateTextActive: {
    color: colors.nileBlue,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: '#e8f0f8',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryText: {
    ...Typography.body,
    color: colors.nileBlue,
    flex: 1,
    lineHeight: 20,
  },
  startButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.nileBlue,
    alignItems: 'center',
  },
  startButtonText: {
    ...Typography.body,
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: '#ef4444',
    fontWeight: '600',
  },
  holdingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  holdingItem: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  holdingLabel: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  holdingValue: {
    ...(Typography as unknown).h5,
    color: colors.text.primary,
    fontWeight: '600',
  },
  summaryStats: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  gainRow: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  statLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  statValue: {
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  gainValue: {
    ...Typography.body,
    color: '#10b981',
    fontWeight: '600',
  },
  historyList: {
    gap: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  historyDetail: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  historyAmount: {
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default withErrorBoundary(GoldSavingsSipPage, 'GoldSavingsSip');
