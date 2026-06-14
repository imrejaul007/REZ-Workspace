// @ts-nocheck
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// P2P Coin Transfer Page
// Send REZ Coins to other users

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { UnifiedQrScanner } from '@/components/qr/UnifiedQrScanner';
import { parseQrPayload } from '@/utils/qr/qrPayload';
import type { QrPayload } from '@/utils/qr/qrPayload';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Gradients } from '@/constants/DesignSystem';
import { useRezBalance, useRefreshWallet } from '@/stores/selectors';
import walletApi from '@/services/walletApi';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { generateIdempotencyKey } from '@/utils/idempotencyKey';
import { promptTransactionPin, canPromptTransactionPin } from '@/utils/promptTransactionPin';
import { handleWalletError, parseWalletError } from '@/utils/walletErrorHandler';
import { BRAND } from '@/constants/brand';

const rezCoinImage = BRAND.COIN_IMAGE;

interface RecentRecipient {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

const QUICK_AMOUNTS = [50, 100, 250, 500];

function TransferPage() {
  const router = useRouter();

  const rezBalance = useRezBalance();
  const refreshWallet = useRefreshWallet();
  const { authenticateWithBiometric, biometricAvailable, biometricEnrolled } = useSecurity();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<'recipient' | 'amount' | 'otp' | 'success'>('recipient');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<RecentRecipient | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [recipients, setRecipients] = useState<RecentRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingTransferId, setPendingTransferId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey('transfer'));
  const submittingRef = useRef(false);
  const submittingOtpRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch recent recipients (and re-fetch on search)
  // Also accepts userId to look up a single user by ID (Phase I wallet-transfer flow).
  const fetchRecipients = useCallback(async (search?: string, userId?: string) => {
    setRecipientsLoading(true);
    try {
      let list: unknown[];
      if (userId) {
        // Phase I wallet-transfer: look up a specific user by ID.
        // If the API supports it, call getUserById; otherwise fall back to recent recipients
        // and select the matching one.
        const res = await walletApi.getRecentRecipients(undefined);
        list = (res.data?.recipients || []).filter((r) => (r._id || r.id) === userId);
      } else {
        const res = await walletApi.getRecentRecipients(search || undefined);
        list = res.data?.recipients || [];
      }
      const mapped = list.map((r) => ({
        id: r._id || r.id,
        name: r.fullName || r.name || r.phoneNumber || r.phone || 'User',
        phone: r.phoneNumber || r.phone || '',
        avatar: r.avatar,
      }));
      setRecipients(mapped);
      // Auto-select if we looked up by userId and found exactly one match.
      if (userId && mapped.length === 1) {
        setSelectedRecipient(mapped[0]);
        setStep('amount');
      }
    } catch {
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  }, []);

  // Initial load of recent recipients
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleQRScan = async () => {
    if (Platform.OS === 'web') {
      // Web does not support CameraView — show manual QR input instead
      setShowScanner(true);
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        platformAlertSimple('Camera Permission', 'Camera access is needed to scan QR codes.');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleWalletQrScan = async (data: string) => {
    setShowScanner(false);

    // Phase I wallet-transfer payload: pre-fill recipient and amount.
    const parsed = parseQrPayload(data);
    if (parsed.ok && parsed.payload.intent !== 'short-url' && 'toUserId' in (parsed.payload as QrPayload)) {
      const payload = parsed.payload as QrPayload & { toUserId: string; amount?: number };
      if (payload.amount) setAmount(payload.amount.toString());
      await fetchRecipients(undefined, payload.toUserId);
      return;
    }

    // Legacy REZ user/pay QR formats.
    try {
      if (data.startsWith('rez://user/')) {
        const userId = data.replace('rez://user/', '');
        await fetchRecipients(userId);
      } else if (data.startsWith('rez://pay/')) {
        const phone = data.replace('rez://pay/', '');
        setSelectedRecipient({ id: phone, name: phone, phone });
        setStep('amount');
      } else if (/^\d{10}$/.test(data)) {
        setSelectedRecipient({ id: data, name: data, phone: data });
        setStep('amount');
      } else {
        platformAlertSimple('Invalid QR', 'This QR code is not a valid REZ payment QR.');
      }
    } catch {
      platformAlertSimple('Scan Error', 'Could not read QR code. Please try again.');
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchRecipients(searchQuery);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, fetchRecipients]);

  // Refresh wallet balance (after successful transfer)
  const refreshBalance = useCallback(async () => {
    await refreshWallet();
  }, [refreshWallet]);

  const handleSelectRecipient = (recipient: RecentRecipient) => {
    setSelectedRecipient(recipient);
    setStep('amount');
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleSend = () => {
    const numAmount = Number(amount);
    if (!selectedRecipient || !amount || isNaN(numAmount) || numAmount <= 0) return;
    if (submittingRef.current) return;
    if (numAmount > rezBalance) {
      platformAlertSimple('Insufficient Balance', `You only have ${rezBalance} ${BRAND.CURRENCY_CODE} available.`);
      return;
    }

    const recipientName = selectedRecipient.name || 'this user';
    platformAlertConfirm(
      'Confirm Transfer',
      `Send ${numAmount.toLocaleString()} ${BRAND.CURRENCY_CODE} to ${recipientName}?`,
      () => {
        executeTransfer();
      },
      'Send',
      'Cancel',
    );
  };

  const executeTransfer = async () => {
    if (!selectedRecipient) return;
    const numAmount = Number(amount);

    // Step-up authentication before transfer. If biometrics are unavailable or not
    // enrolled, fall back to the transaction PIN (same PIN set during onboarding).
    let authenticated = false;
    if (biometricAvailable && biometricEnrolled) {
      authenticated = await authenticateWithBiometric();
    } else if (canPromptTransactionPin()) {
      authenticated = await promptTransactionPin(
        'Confirm Transfer',
        'Enter your 4-digit PIN to authorise this transfer.',
      );
    } else {
      platformAlertSimple('Authentication Required', 'Please enable biometric authentication to send coins.');
      return;
    }
    if (!authenticated) {
      platformAlertSimple('Authentication Required', 'Authentication is required to send coins.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await walletApi.initiateTransfer({
        recipientId: selectedRecipient.id,
        recipientPhone: selectedRecipient.phone,
        amount: numAmount,
        coinType: 'rez',
        note: note || undefined,
        idempotencyKey,
      });

      const data = res.data;
      if (!data) {
        platformAlertSimple('Transfer Failed', 'Unexpected response from server.');
        return;
      }

      if (!mountedRef.current) return;
      if (data.requiresOtp) {
        setPendingTransferId(data.transferId);
        setStep('otp');
      } else {
        setTransactionId(data.transferId);
        setIdempotencyKey(generateIdempotencyKey('transfer'));
        refreshBalance();
        setStep('success');
      }
    } catch (error) {
      if (!mountedRef.current) return;
      // Regenerate idempotency key on failure so retry creates a fresh transfer
      setIdempotencyKey(generateIdempotencyKey('transfer'));
      const parsed = parseWalletError(error);
      if (parsed.code === 'REAUTH_REQUIRED') {
        setPendingTransferId('');
        setStep('otp');
        platformAlertSimple(
          'Verification Required',
          `Transfers above ${parsed.threshold || 5000} ${BRAND.CURRENCY_CODE} require OTP verification.`,
        );
      } else {
        handleWalletError(error, 'Transfer Failed');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleConfirmOtp = async () => {
    if (!otp || otp.length < 6) {
      platformAlertSimple('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }

    // Guard against double-tap: a second Confirm call would re-submit the same
    // OTP and surface a misleading "OTP already used" error even when the first
    // call succeeded.
    if (submittingOtpRef.current) return;
    submittingOtpRef.current = true;

    setLoading(true);
    try {
      if (!pendingTransferId) {
        if (!selectedRecipient) return;
        const res = await walletApi.initiateTransfer({
          recipientId: selectedRecipient.id,
          recipientPhone: selectedRecipient.phone,
          amount: Number(amount),
          coinType: 'rez',
          note: note || undefined,
          idempotencyKey,
        });
        if (!mountedRef.current) return;
        const data = res.data;
        if (data?.requiresOtp) {
          const confirmRes = await walletApi.confirmTransfer({ transferId: data.transferId, otp, idempotencyKey });
          if (!mountedRef.current) return;
          setTransactionId(confirmRes.data?.transferId || data.transferId);
        } else {
          setTransactionId(data?.transferId || '');
        }
        setIdempotencyKey(generateIdempotencyKey('transfer'));
        refreshBalance();
        setStep('success');
      } else {
        const res = await walletApi.confirmTransfer({
          transferId: pendingTransferId,
          otp,
          idempotencyKey,
        });
        if (!mountedRef.current) return;
        const data = res.data;
        setTransactionId(data?.transferId || pendingTransferId);
        setIdempotencyKey(generateIdempotencyKey('transfer'));
        refreshBalance();
        setStep('success');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'OTP verification failed. Please try again.';
      platformAlertSimple('Verification Failed', message);
    } finally {
      if (mountedRef.current) setLoading(false);
      submittingOtpRef.current = false;
    }
  };

  const handleDone = () => {
    // eslint-disable-next-line no-unused-expressions
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const numAmount = Number(amount) || 0;
  const isAmountValid = numAmount > 0 && numAmount <= rezBalance;

  const renderRecipientStep = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by phone or name"
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      {/* Recent Recipients */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>{searchQuery ? 'Results' : 'Recent'}</ThemedText>
        {recipientsLoading ? (
          <ActivityIndicator color={Colors.primary[600]} style={{ marginVertical: Spacing.lg }} />
        ) : recipients.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={colors.text.tertiary} />
            <ThemedText style={styles.emptyText}>{searchQuery ? 'No users found' : 'No recent recipients'}</ThemedText>
          </View>
        ) : (
          recipients.map((recipient) => (
            <Pressable key={recipient.id} style={styles.recipientCard} onPress={() => handleSelectRecipient(recipient)}>
              <View style={styles.recipientAvatar}>
                <ThemedText style={styles.avatarText}>{(recipient.name || '?').charAt(0).toUpperCase()}</ThemedText>
              </View>
              <View style={styles.recipientInfo}>
                <ThemedText style={styles.recipientName}>{recipient.name}</ThemedText>
                {recipient.phone ? <ThemedText style={styles.recipientPhone}>{recipient.phone}</ThemedText> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </Pressable>
          ))
        )}
      </View>

      {/* Scan QR Code */}
      <Pressable style={styles.qrButton} onPress={handleQRScan}>
        <Ionicons name="qr-code" size={22} color={colors.nileBlue} />
        <ThemedText style={styles.qrButtonText}>Scan QR Code</ThemedText>
      </Pressable>

      {/* QR Scanner Modal */}
      {showScanner && (
        <Modal visible animationType="slide">
          <SafeAreaView
            style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#fff' : '#000' }}
            edges={['top', 'bottom']}
          >
            {Platform.OS !== 'web' ? (
              <UnifiedQrScanner
                onRawScan={handleWalletQrScan}
                onClose={() => setShowScanner(false)}
              />
            ) : (
              /* Web fallback: manual QR code / phone number entry */
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <ThemedText style={{ fontSize: 22, fontWeight: '700', color: '#1a3a52', marginBottom: 12 }}>
                  Enter QR Code Manually
                </ThemedText>
                <ThemedText style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
                  Camera scanning is not available on web. Paste the REZ QR code value or enter a 10-digit phone number.
                </ThemedText>
                <TextInput
                  style={{
                    width: '100%',
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1.5,
                    borderColor: '#D1D5DB',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: '#111827',
                    marginBottom: 16,
                  }}
                  placeholder="rez://pay/9876543210 or 10-digit number"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  onSubmitEditing={(e) => handleWalletQrScan(e.nativeEvent.text.trim())}
                  returnKeyType="go"
                />
                <Pressable
                  onPress={() => setShowScanner(false)}
                  style={{ backgroundColor: '#ffcd57', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 }}
                >
                  <ThemedText style={{ color: '#1a3a52', fontWeight: '700' }}>Cancel</ThemedText>
                </Pressable>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}
    </>
  );

  const renderAmountStep = () => (
    <>
      {/* Selected Recipient */}
      <View style={styles.selectedRecipient}>
        <View style={styles.recipientAvatarLarge}>
          <ThemedText style={styles.avatarTextLarge}>
            {(selectedRecipient?.name || '?').charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={styles.selectedName}>{selectedRecipient?.name}</ThemedText>
        {selectedRecipient?.phone ? (
          <ThemedText style={styles.selectedPhone}>{selectedRecipient.phone}</ThemedText>
        ) : null}
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <CachedImage source={rezCoinImage} style={styles.coinImage} />
        <View style={styles.balanceInfo}>
          <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
          <ThemedText style={styles.balanceValue}>
            {rezBalance.toLocaleString()} {BRAND.CURRENCY_CODE}
          </ThemedText>
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <View style={styles.amountInputContainer}>
          <ThemedText style={styles.currencySymbol}>{BRAND.CURRENCY_CODE}</ThemedText>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.text.tertiary}
            autoFocus
          />
        </View>
      </View>

      {/* Quick Amounts */}
      <View style={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((quickAmount) => (
          <Pressable
            key={quickAmount}
            style={[styles.quickAmountButton, amount === quickAmount.toString() && styles.quickAmountButtonSelected]}
            onPress={() => handleQuickAmount(quickAmount)}
          >
            <ThemedText
              style={[styles.quickAmountText, amount === quickAmount.toString() && styles.quickAmountTextSelected]}
            >
              {quickAmount}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Note Input */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Add a note (optional)</ThemedText>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Thanks for dinner!"
          placeholderTextColor={colors.text.tertiary}
          multiline
        />
      </View>

      {/* Insufficient balance warning */}
      {numAmount > 0 && numAmount > rezBalance && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color={Colors.error} />
          <ThemedText style={styles.warningText}>
            Insufficient balance. You have {rezBalance.toLocaleString()} {BRAND.CURRENCY_CODE} available.
          </ThemedText>
        </View>
      )}

      {/* Send Button */}
      <Pressable
        style={[styles.sendButton, !isAmountValid ? styles.sendButtonDisabled : null]}
        onPress={handleSend}
        disabled={!isAmountValid || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background.primary} />
        ) : (
          <View style={styles.sendButtonContent}>
            <CachedImage source={rezCoinImage} style={styles.sendButtonIcon} />
            <ThemedText style={styles.sendButtonText}>
              Send {numAmount > 0 ? `${numAmount.toLocaleString()} ${BRAND.CURRENCY_CODE}` : ''}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </>
  );

  const renderOtpStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, justifyContent: 'center' }}
    >
      <View style={styles.otpContainer}>
        <View style={styles.otpIconContainer}>
          <Ionicons name="shield-checkmark" size={48} color={colors.nileBlue} />
        </View>
        <ThemedText style={styles.otpTitle}>Verify Transfer</ThemedText>
        <ThemedText style={styles.otpSubtitle}>
          Enter the 6-digit code sent to your phone to confirm this transfer
        </ThemedText>
        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          placeholder="------"
          placeholderTextColor={colors.text.tertiary}
          maxLength={6}
          autoFocus
        />
        <Pressable
          style={[styles.sendButton, (!otp || otp.length < 6) && styles.sendButtonDisabled]}
          onPress={handleConfirmOtp}
          disabled={!otp || otp.length < 6 || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.primary} />
          ) : (
            <ThemedText style={styles.sendButtonText}>Verify & Send</ThemedText>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconContainer}>
        <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
      </View>
      <ThemedText style={styles.successTitle}>
        {Number(amount).toLocaleString()} {BRAND.CURRENCY_CODE} Sent!
      </ThemedText>
      <ThemedText style={styles.successSubtitle}>To {selectedRecipient?.name}</ThemedText>
      {selectedRecipient?.phone ? <ThemedText style={styles.successPhone}>{selectedRecipient.phone}</ThemedText> : null}

      <View style={styles.transactionCard}>
        <View style={styles.transactionRow}>
          <ThemedText style={styles.transactionLabel}>Transaction ID</ThemedText>
          <ThemedText style={styles.transactionValue} numberOfLines={1}>
            {transactionId ? `${transactionId.slice(0, 16)}${transactionId.length > 16 ? '...' : ''}` : 'Processing...'}
          </ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.transactionRow}>
          <ThemedText style={styles.transactionLabel}>Amount</ThemedText>
          <View style={styles.transactionAmountRow}>
            <CachedImage source={rezCoinImage} style={styles.transactionCoinIcon} />
            <ThemedText style={styles.transactionValue}>
              {Number(amount).toLocaleString()} {BRAND.CURRENCY_CODE}
            </ThemedText>
          </View>
        </View>
        {note ? (
          <>
            <View style={styles.divider} />
            <View style={styles.transactionRow}>
              <ThemedText style={styles.transactionLabel}>Note</ThemedText>
              <ThemedText style={[styles.transactionValue, { flex: 1, textAlign: 'right' }]}>{note}</ThemedText>
            </View>
          </>
        ) : null}
      </View>

      <Pressable
        style={styles.shareButton}
        onPress={async () => {
          try {
            await Share.share({
              message: `I sent ${amount} ${BRAND.CURRENCY_CODE} to ${selectedRecipient?.name}${note ? ` — "${note}"` : ''}. Transaction ID: ${transactionId}`,
            });
          } catch {
            // User cancelled or share failed
          }
        }}
      >
        <Ionicons name="share-outline" size={18} color={colors.nileBlue} />
        <ThemedText style={styles.shareButtonText}>Share Receipt</ThemedText>
      </Pressable>

      <Pressable style={styles.doneButton} onPress={handleDone}>
        <ThemedText style={styles.doneButtonText}>Done</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />

      {/* Header */}
      <LinearGradient colors={Gradients.nileBlue} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              step === 'amount'
                ? setStep('recipient')
                : step === 'otp'
                  ? setStep('amount')
                  : router.canGoBack()
                    ? router.back()
                    : router.replace('/(tabs)')
            }
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {step === 'success' ? 'Transfer Complete' : step === 'otp' ? 'Verify Transfer' : 'Send Coins'}
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 'recipient' && renderRecipientStep()}
          {step === 'amount' && renderAmountStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'success' && renderSuccessStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.inverse,
    textAlign: 'center',
    marginRight: 40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.base,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recipientPhone: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  qrButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  selectedRecipient: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  recipientAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarTextLarge: {
    ...Typography.h2,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  selectedName: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
  },
  selectedPhone: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  coinImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  balanceValue: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.subtle,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.nileBlue,
    marginRight: Spacing.sm,
  },
  amountInput: {
    ...Typography.display,
    fontWeight: '700',
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.medium,
  },
  quickAmountButtonSelected: {
    backgroundColor: colors.nileBlue,
    borderColor: colors.nileBlue,
  },
  quickAmountText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  quickAmountTextSelected: {
    color: colors.text.inverse,
  },
  noteInput: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    fontSize: 15,
    color: colors.text.primary,
    minHeight: 72,
    textAlignVertical: 'top',
    ...Shadows.subtle,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  warningText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
  },
  sendButton: {
    backgroundColor: colors.nileBlue,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sendButtonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sendButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  successIconContainer: {
    marginBottom: Spacing.base,
  },
  successTitle: {
    ...Typography.h2,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  successPhone: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: Spacing.xl,
  },
  transactionCard: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.subtle,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  transactionAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  transactionCoinIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
  },
  transactionLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  transactionValue: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary[50],
    marginBottom: Spacing.base,
  },
  shareButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.nileBlue,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  doneButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  otpContainer: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  otpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  otpSubtitle: {
    ...Typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  otpInput: {
    width: '80%',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: Spacing.xl,
    ...Shadows.subtle,
  },
});

export default withErrorBoundary(TransferPage, 'WalletTransfer');
