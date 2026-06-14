import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  issuedTo?: string;
  validUntil: string;
  status: 'active' | 'fully_used' | 'expired';
  remainingBalance: number;
  usedAmount: number;
}

interface GiftCardStats {
  activeCards: number;
  activeAmount: number;
  redeemedCards: number;
  redeemedAmount: number;
}

export default function GiftCardsScreen() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [stats, setStats] = useState<GiftCardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    amount: '',
    phone: '',
    validityMonths: '12',
  });
  const [redeemForm, setRedeemForm] = useState({
    code: '',
    amount: '',
  });
  const [redeemResult, setRedeemResult] = useState<{
    cardCode: string;
    amountRedeemed: number;
    remainingBalance: number;
  } | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const [cardsRes, statsRes] = await Promise.all([
        apiClient.get<GiftCard[]>('/merchant/gift-cards'),
        apiClient.get<GiftCardStats>('/merchant/gift-cards/stats'),
      ]);

      if (cardsRes.success && cardsRes.data) {
        setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      logger.error('Error fetching gift cards:', error);
      showAlert('Error', error?.message || 'Failed to load gift cards');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeemCard = async () => {
    if (!redeemForm.code.trim() || !redeemForm.amount) {
      showAlert('Validation', 'Enter the gift card code and redemption amount');
      return;
    }
    const amount = parseFloat(redeemForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Validation', 'Amount must be greater than 0');
      return;
    }
    try {
      const response = await apiClient.post<{
        cardCode: string;
        amountRedeemed: number;
        remainingBalance: number;
      }>('/merchant/gift-cards/redeem', {
        code: redeemForm.code.trim().toUpperCase(),
        amount,
      });
      if (response.success && response.data) {
        setRedeemResult(response.data);
        setRedeemForm({ code: '', amount: '' });
        await fetchData();
      } else {
        showAlert('Error', (response as unknown as { message?: string }).message || 'Redemption failed');
      }
    } catch (error) {
      logger.error('Error redeeming gift card:', error);
      showAlert('Error', error?.message || 'Redemption failed');
    }
  };

  const handleIssueCard = async () => {
    if (!issueForm.amount || !issueForm.phone) {
      showAlert('Validation', 'Please fill all required fields');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(issueForm.amount),
        phone: issueForm.phone,
        validityMonths: parseInt(issueForm.validityMonths),
      };

      const response = await apiClient.post('/merchant/gift-cards', payload);
      if (response.success) {
        showAlert('Success', 'Gift card issued successfully');
        setIssueForm({ amount: '', phone: '', validityMonths: '12' });
        setShowIssueModal(false);
        await fetchData();
      } else {
        showAlert('Error', response.message || 'Failed to issue card');
      }
    } catch (error) {
      logger.error('Error issuing gift card:', error);
      showAlert('Error', error?.message || 'Failed to issue card');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return Colors.light.success;
      case 'fully_used':
        return Colors.light.icon;
      case 'expired':
        return Colors.light.error;
      default:
        return Colors.light.icon;
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading gift cards...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Gift Cards</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        {stats && (
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryValue}>{stats.activeCards}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Active cards</ThemedText>
              <ThemedText style={styles.summarySubvalue}>
                ₹{stats.activeAmount.toLocaleString()}
              </ThemedText>
            </View>

            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryValue}>{stats.redeemedCards}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Redeemed</ThemedText>
              <ThemedText style={styles.summarySubvalue}>
                ₹{stats.redeemedAmount.toLocaleString()}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Recent Redemptions */}
        {cards.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Recent redemptions</ThemedText>
            <FlatList
              data={cards.slice(0, 10)}
              renderItem={({ item }) => (
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <ThemedText style={styles.cardCode}>{item.code}</ThemedText>
                    <ThemedText style={styles.cardMeta}>
                      ₹{item.amount} · Valid until {item.validUntil}
                    </ThemedText>
                  </View>
                  <View style={styles.cardStatus}>
                    <ThemedText style={styles.cardAmount}>
                      Remaining: ₹{item.remainingBalance}
                    </ThemedText>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}20` },
                      ]}
                    >
                      <ThemedText
                        style={[styles.statusText, { color: getStatusColor(item.status) }]}
                      >
                        {item.status === 'fully_used' ? 'Used' : item.status}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {cards.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="gift" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyStateTitle}>No gift cards yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Create gift cards to boost customer engagement
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.issueButton, styles.actionButtonHalf]}
          onPress={() => setShowIssueModal(true)}
        >
          <Ionicons name="add" size={20} color={Colors.light.card} />
          <ThemedText style={styles.issueButtonText}>Issue Card</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.issueButton, styles.redeemButton, styles.actionButtonHalf]}
          onPress={() => {
            setRedeemResult(null);
            setShowRedeemModal(true);
          }}
        >
          <Ionicons name="scan-outline" size={20} color={Colors.light.card} />
          <ThemedText style={styles.issueButtonText}>Redeem Card</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Redeem Modal */}
      <Modal
        visible={showRedeemModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRedeemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Redeem Gift Card</ThemedText>
              <TouchableOpacity onPress={() => setShowRedeemModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {redeemResult ? (
              <View style={styles.redeemSuccess}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.light.success} />
                <ThemedText style={styles.redeemSuccessTitle}>Redeemed!</ThemedText>
                <ThemedText style={styles.redeemSuccessLine}>
                  ₹{redeemResult.amountRedeemed} redeemed from {redeemResult.cardCode}
                </ThemedText>
                <ThemedText style={styles.redeemSuccessLine}>
                  Remaining balance: ₹{redeemResult.remainingBalance}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.submitButton, { marginTop: 20 }]}
                  onPress={() => {
                    setRedeemResult(null);
                    setShowRedeemModal(false);
                  }}
                >
                  <ThemedText style={styles.submitButtonText}>Done</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Gift Card Code</ThemedText>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="XXXX-XXXX-XXXX"
                    placeholderTextColor={Colors.light.icon}
                    autoCapitalize="characters"
                    value={redeemForm.code}
                    onChangeText={(text) => setRedeemForm({ ...redeemForm, code: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Amount to Redeem (₹)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={Colors.light.icon}
                    keyboardType="decimal-pad"
                    value={redeemForm.amount}
                    onChangeText={(text) => setRedeemForm({ ...redeemForm, amount: text })}
                  />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleRedeemCard}>
                  <ThemedText style={styles.submitButtonText}>Confirm Redemption</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Issue Modal */}
      <Modal
        visible={showIssueModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIssueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Issue Gift Card</ThemedText>
              <TouchableOpacity onPress={() => setShowIssueModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Amount (₹)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="500"
                placeholderTextColor={Colors.light.icon}
                keyboardType="decimal-pad"
                value={issueForm.amount}
                onChangeText={(text) => setIssueForm({ ...issueForm, amount: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>For Customer (Phone)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="98765 43210 or leave blank"
                placeholderTextColor={Colors.light.icon}
                keyboardType="phone-pad"
                value={issueForm.phone}
                onChangeText={(text) => setIssueForm({ ...issueForm, phone: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Valid for</ThemedText>
              <View style={styles.validityOptions}>
                {['6', '12', '24'].map((months) => (
                  <TouchableOpacity
                    key={months}
                    style={[
                      styles.validityButton,
                      issueForm.validityMonths === months && styles.validityButtonActive,
                    ]}
                    onPress={() => setIssueForm({ ...issueForm, validityMonths: months })}
                  >
                    <ThemedText
                      style={[
                        styles.validityButtonText,
                        issueForm.validityMonths === months && styles.validityButtonTextActive,
                      ]}
                    >
                      {months}m
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleIssueCard}>
              <ThemedText style={styles.submitButtonText}>Generate Card</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  summarySubvalue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardInfo: {
    flex: 1,
  },
  cardCode: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cardMeta: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  cardStatus: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  actionButtonHalf: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  redeemButton: {
    backgroundColor: Colors.light.success,
  },
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  codeInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  redeemSuccess: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  redeemSuccessTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    color: Colors.light.success,
  },
  redeemSuccessLine: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  issueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  validityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  validityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  validityButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  validityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  validityButtonTextActive: {
    color: Colors.light.card,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
