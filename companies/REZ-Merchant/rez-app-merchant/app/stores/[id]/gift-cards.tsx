/**
 * Gift Cards Management Screen
 * Issue and manage gift cards for the store
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Modal,
  FlatList,
  Share,
  Dimensions,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';
import { Colors, Shadows, Spacing } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  remaining: number;
  issuedDate: string;
  expiryDate: string;
  status: 'active' | 'fully-used' | 'expired';
  customerPhone?: string;
}

interface GiftCardStats {
  activeCards: number;
  totalOutstanding: number;
  totalSold: number;
  totalRevenue: number;
}

const { width } = Dimensions.get('window');

export default function GiftCardsScreen() {
  const { id: storeId } = useLocalSearchParams<{ id: string }>();
  const [stats, setStats] = useState<GiftCardStats>({
    activeCards: 47,
    totalOutstanding: 23500,
    totalSold: 156,
    totalRevenue: 78000,
  });
  const [giftCards, setGiftCards] = useState<GiftCard[]>([
    {
      id: '1',
      code: 'BREW-XKYZ-8421',
      amount: 500,
      remaining: 300,
      issuedDate: '2024-01-15',
      expiryDate: '2025-01-15',
      status: 'active',
    },
    {
      id: '2',
      code: 'BREW-ABCD-1234',
      amount: 1000,
      remaining: 0,
      issuedDate: '2023-12-28',
      expiryDate: '2024-12-28',
      status: 'fully-used',
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [issueAmount, setIssueAmount] = useState('');
  const [issueValidity, setIssueValidity] = useState('1-year');
  const [issuePhone, setIssuePhone] = useState('');
  const [issuingLoading, setIssuingLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGiftCards();
    }, [storeId])
  );

  const loadGiftCards = async () => {
    try {
      setLoading(true);
      if (!storeId) return;

      const statsResponse = await apiClient.get(`/merchant/gift-cards/stats?storeId=${storeId}`);
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      const cardsResponse = await apiClient.get(`/merchant/gift-cards?storeId=${storeId}`);
      if (cardsResponse.success && cardsResponse.data?.giftCards) {
        setGiftCards(cardsResponse.data.giftCards);
      }
    } catch (error) {
      logger.error('[Gift Cards] Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateGiftCard = async () => {
    if (!issueAmount.trim()) {
      platformAlertSimple('Required', 'Please enter a gift card amount');
      return;
    }

    const amount = parseFloat(issueAmount);
    if (isNaN(amount) || amount <= 0) {
      platformAlertSimple('Invalid', 'Please enter a valid amount');
      return;
    }

    setIssuingLoading(true);
    try {
      if (!storeId) throw new Error('Store ID not found');

      const response = await apiClient.post('/merchant/gift-cards', {
        storeId,
        amount,
        validityDays: issueValidity === '1-year' ? 365 : issueValidity === '6-month' ? 180 : 90,
        customerPhone: issuePhone.trim() || null,
      });

      if (response.success && response.data?.giftCardCode) {
        setGeneratedCode(response.data.giftCardCode);
      } else {
        throw new Error(response.message || 'Failed to generate gift card');
      }
    } catch (error) {
      platformAlertSimple('Error', error?.message || 'Failed to generate gift card');
    } finally {
      setIssuingLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      Share.share({
        message: `Gift Card Code: ${generatedCode}\n\nAmount: ₹${issueAmount}\n\nShare this code with the recipient!`,
        title: 'Share Gift Card Code',
      });
    }
  };

  const handleCloseIssueModal = () => {
    setIssueModalVisible(false);
    setIssueAmount('');
    setIssueValidity('1-year');
    setIssuePhone('');
    setGeneratedCode(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success[600];
      case 'fully-used':
        return Colors.success[700];
      case 'expired':
        return Colors.error[600];
      default:
        return Colors.text.secondary;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'fully-used':
        return 'Fully Used';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Cards</Text>
        <TouchableOpacity
          style={styles.issueButton}
          onPress={() => setIssueModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={24} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadGiftCards} />}
      >
        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <LinearGradient
                colors={[Colors.success[100], Colors.success[50]]}
                style={styles.iconGradient}
              >
                <Ionicons name="gift" size={24} color={Colors.success[600]} />
              </LinearGradient>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Active Cards</Text>
              <Text style={styles.statValue}>{stats.activeCards}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <LinearGradient
                colors={[Colors.primary[100], Colors.primary[50]]}
                style={styles.iconGradient}
              >
                <Ionicons name="cash" size={24} color={Colors.primary[600]} />
              </LinearGradient>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Outstanding</Text>
              <Text style={styles.statAmount}>
                ₹{stats.totalOutstanding.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <LinearGradient colors={['#DBEAFE', '#F0F9FF']} style={styles.iconGradient}>
                <Ionicons name="bar-chart" size={24} color="#3B82F6" />
              </LinearGradient>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Sold</Text>
              <Text style={styles.statValue}>{stats.totalSold} cards</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <LinearGradient colors={['#FEF3C7', '#FEF08A']} style={styles.iconGradient}>
                <Ionicons name="trending-up" size={24} color="#D97706" />
              </LinearGradient>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Text style={styles.statAmount}>₹{stats.totalRevenue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Redemptions */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Redemptions</Text>
            <Text style={styles.sectionSubtitle}>{giftCards.length} cards</Text>
          </View>

          {giftCards.length > 0 ? (
            <View style={styles.cardsList}>
              {giftCards.map((card) => (
                <Animated.View
                  key={card.id}
                  entering={ZoomIn.delay(250)}
                  style={styles.redemptionCard}
                >
                  <View style={styles.cardCodeSection}>
                    <Text style={styles.cardCode}>{card.code}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor(card.status) + '20' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor(card.status) }]}>
                        {statusLabel(card.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDetailsRow}>
                    <View style={styles.cardDetail}>
                      <Text style={styles.cardDetailLabel}>Value</Text>
                      <Text style={styles.cardDetailValue}>
                        ₹{card.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.cardDetail}>
                      <Text style={styles.cardDetailLabel}>Remaining</Text>
                      <Text
                        style={[
                          styles.cardDetailValue,
                          card.remaining === 0 && styles.fullyUsedText,
                        ]}
                      >
                        {card.remaining === 0
                          ? 'Fully Used'
                          : `₹${card.remaining.toLocaleString('en-IN')}`}
                      </Text>
                    </View>
                    <View style={styles.cardDetail}>
                      <Text style={styles.cardDetailLabel}>Issued</Text>
                      <Text style={styles.cardDetailValue}>
                        {new Date(card.issuedDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>No gift cards issued yet</Text>
              <Text style={styles.emptySubtext}>Issue your first gift card to get started</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Issue Gift Card Modal */}
      <Modal visible={issueModalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalSafeArea}>
          <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />

          <View style={styles.modalHeaderBar}>
            <TouchableOpacity onPress={handleCloseIssueModal} style={styles.modalBackButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Issue Gift Card</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {!generatedCode ? (
              <>
                {/* Amount Section */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Amount (₹)</Text>
                  <View style={styles.amountInputWrapper}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="500"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      value={issueAmount}
                      onChangeText={setIssueAmount}
                    />
                  </View>
                </View>

                {/* Validity Section */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Valid For</Text>
                  <View style={styles.validityOptions}>
                    {[
                      { label: '3 Months', value: '3-month' },
                      { label: '6 Months', value: '6-month' },
                      { label: '1 Year', value: '1-year' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          issueValidity === option.value && styles.optionButtonActive,
                        ]}
                        onPress={() => setIssueValidity(option.value)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            issueValidity === option.value && styles.optionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Customer Phone Section */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Customer Phone (Optional)</Text>
                  <View style={styles.phoneInputWrapper}>
                    <Text style={styles.phonePrefix}>+91</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="9876543210"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="phone-pad"
                      value={issuePhone}
                      onChangeText={setIssuePhone}
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                  style={[styles.generateButton, issuingLoading && styles.disabledButton]}
                  onPress={handleGenerateGiftCard}
                  disabled={issuingLoading}
                  activeOpacity={0.85}
                >
                  {issuingLoading ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.generateButtonText}>Generating...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="white" />
                      <Text style={styles.generateButtonText}>Generate Gift Card</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Success State
              <>
                <View style={styles.successSection}>
                  <LinearGradient
                    colors={[Colors.success[100], Colors.success[50]]}
                    style={styles.successIcon}
                  >
                    <Ionicons name="checkmark-circle" size={64} color={Colors.success[600]} />
                  </LinearGradient>

                  <Text style={styles.successTitle}>Gift Card Created!</Text>
                  <Text style={styles.successSubtitle}>Share this code with the customer</Text>

                  {/* Generated Code Display */}
                  <View style={styles.codeDisplayCard}>
                    <Text style={styles.codeLabel}>Gift Card Code</Text>
                    <Text style={styles.codeDisplay}>{generatedCode}</Text>
                    <TouchableOpacity
                      style={styles.copyCodeButton}
                      onPress={handleCopyCode}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="copy" size={16} color="white" />
                      <Text style={styles.copyCodeText}>Copy & Share</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Amount Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Amount</Text>
                      <Text style={styles.summaryValue}>
                        ₹{parseFloat(issueAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Valid Until</Text>
                      <Text style={styles.summaryValue}>
                        {new Date(
                          Date.now() +
                            (issueValidity === '1-year'
                              ? 365
                              : issueValidity === '6-month'
                                ? 180
                                : 90) *
                              24 *
                              60 *
                              60 *
                              1000
                        ).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Issue Another Button */}
                  <TouchableOpacity
                    style={styles.anotherButton}
                    onPress={() => {
                      setGeneratedCode(null);
                      setIssueAmount('');
                      setIssueValidity('1-year');
                      setIssuePhone('');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={18} color={Colors.primary[600]} />
                    <Text style={styles.anotherButtonText}>Issue Another</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleCloseIssueModal}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  issueButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: 40,
  },
  statsSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  statIcon: {
    padding: 2,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[600],
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  cardsList: {
    gap: 12,
  },
  redemptionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardCodeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardDetail: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  fullyUsedText: {
    color: Colors.success[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 10,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[600],
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  validityOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  optionTextActive: {
    color: Colors.primary[600],
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
  },
  phonePrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    marginBottom: 20,
    ...Shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  codeDisplayCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary[200],
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  codeDisplay: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[600],
    fontFamily: 'monospace',
    marginBottom: 14,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary[600],
  },
  copyCodeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  anotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  anotherButtonText: {
    color: Colors.primary[600],
    fontSize: 15,
    fontWeight: '700',
  },
  doneButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
