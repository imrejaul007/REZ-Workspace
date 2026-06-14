// @ts-nocheck
/**
 * Redeem Coins Screen
 *
 * Allows users to redeem their REZ coins for a rupee discount.
 * Rate: 1 coin = ₹0.10 discount.
 * Min redemption: 50 coins. Max: min(available, 500) coins.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import walletApi from '@/services/walletApi';
import { generateIdempotencyKey } from '@/utils/idempotencyKey';
import { colors } from '@/constants/theme';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

// ============================================================================
// CONSTANTS
// ============================================================================

// Default rate — overridden by live backend rate fetched on mount.
// Matches the wallet-service default COIN_TO_RUPEE_RATE.
const DEFAULT_COIN_TO_RUPEE_RATE = 0.5;
const MIN_REDEMPTION = 50;
const MAX_REDEMPTION_CAP = 500;
const PRIMARY = '#7C3AED';
const PRIMARY_LIGHT = '#EDE9FE';

// ============================================================================
// HELPERS
// ============================================================================

function coinsToRupees(coins: number, rate: number): number {
  return Math.round(coins * rate * 100) / 100;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function RedeemCoinsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [coinRate, setCoinRate] = useState(DEFAULT_COIN_TO_RUPEE_RATE);

  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    newBalance: number;
    discountApplied: number;
    redeemedCoins: number;
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey('redeem-coins'));

  // Fetch current coin balance and live conversion rate on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingBalance(true);
    walletApi
      .getBalance()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const rezCoin = res.data.coins?.find((c) => c.type === 'rez');
          setBalance(rezCoin?.amount ?? res.data.balance?.available ?? 0);
        } else {
          setBalanceError('Could not load your coin balance.');
        }
      })
      .catch(() => {
        if (!cancelled) setBalanceError('Could not load your coin balance.');
      })
      .finally(() => {
        if (!cancelled) setLoadingBalance(false);
      });
    // Fetch live conversion rate — fall back to DEFAULT_COIN_TO_RUPEE_RATE if unavailable
    walletApi.getConversionRate().then((res) => {
      if (!cancelled && res?.coinToRupeeRate) setCoinRate(res.coinToRupeeRate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxRedeemable = useMemo(
    () => (balance !== null ? Math.min(balance, MAX_REDEMPTION_CAP) : MAX_REDEMPTION_CAP),
    [balance],
  );

  const parsedCoins = useMemo(() => {
    const n = parseInt(inputValue, 10);
    return isNaN(n) ? 0 : n;
  }, [inputValue]);

  const rupeeDiscount = useMemo(() => coinsToRupees(parsedCoins, coinRate), [parsedCoins, coinRate]);

  const validationError = useMemo((): string | null => {
    if (parsedCoins === 0) return null;
    if (balance !== null && parsedCoins > balance) return `You only have ${balance} coins available.`;
    if (parsedCoins < MIN_REDEMPTION) return `Minimum redemption is ${MIN_REDEMPTION} coins.`;
    if (parsedCoins > MAX_REDEMPTION_CAP) return `Maximum redemption per transaction is ${MAX_REDEMPTION_CAP} coins.`;
    return null;
  }, [parsedCoins, balance]);

  const canSubmit = parsedCoins >= MIN_REDEMPTION && parsedCoins <= maxRedeemable && !validationError;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await walletApi.redeemCoins({ amount: parsedCoins, idempotencyKey });
      if (res.success && res.data) {
        setSuccessData({
          newBalance: res.data.newBalance,
          discountApplied: res.data.discountApplied,
          redeemedCoins: parsedCoins,
        });
      } else {
        setSubmitError(res.message || 'Redemption failed. Please try again.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Redemption failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, submitting, parsedCoins]);

  // ── Success view ──────────────────────────────────────────────────────────

  if (successData) {
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[PRIMARY, '#6D28D9']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Coins Redeemed</Text>
            <View style={{ width: 30 }} />
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color={PRIMARY} />
          </View>
          <Text style={styles.successTitle}>Redemption Successful!</Text>
          <Text style={styles.successSubtitle}>
            {successData.redeemedCoins} coins redeemed for a{' '}
            <Text style={styles.successAmount}>₹{successData.discountApplied.toFixed(2)}</Text> discount.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Coins Redeemed</Text>
              <Text style={styles.successRowValue}>{successData.redeemedCoins} coins</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Discount Applied</Text>
              <Text style={[styles.successRowValue, { color: '#16A34A' }]}>
                ₹{successData.discountApplied.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>New Coin Balance</Text>
              <Text style={styles.successRowValue}>{successData.newBalance} coins</Text>
            </View>
          </View>

          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <LinearGradient colors={[PRIMARY, '#6D28D9']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Redeem Coins</Text>
            <View style={{ width: 30 }} />
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            {loadingBalance ? (
              <ActivityIndicator color={PRIMARY} size="small" />
            ) : balanceError ? (
              <Text style={styles.errorText}>{balanceError}</Text>
            ) : (
              <>
                <Ionicons name="wallet-outline" size={28} color={PRIMARY} style={{ marginBottom: 8 }} />
                <Text style={styles.balanceLabel}>Your REZ Coin Balance</Text>
                <Text style={styles.balanceValue}>{balance ?? 0}</Text>
                <Text style={styles.balanceSub}>coins available</Text>
              </>
            )}
          </View>

          {/* Rate info */}
          <View style={styles.rateCard}>
            <Ionicons name="information-circle-outline" size={18} color={PRIMARY} />
            <Text style={styles.rateText}>
              Conversion rate: <Text style={styles.rateHighlight}>1 coin = ₹{coinRate.toFixed(2)}</Text>
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>How many coins do you want to redeem?</Text>
            <Text style={styles.inputHint}>
              Min {MIN_REDEMPTION} coins · Max {maxRedeemable} coins per transaction
            </Text>

            <View style={[styles.inputWrapper, validationError ? styles.inputWrapperError : null]}>
              <Ionicons
                name="logo-bitcoin"
                size={20}
                color={validationError ? colors.error : PRIMARY}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="number-pad"
                placeholder={`${MIN_REDEMPTION} – ${maxRedeemable}`}
                placeholderTextColor={colors.gray[400]}
                maxLength={4}
                accessibilityLabel="Enter number of coins to redeem"
              />
              {inputValue.length > 0 && (
                <Pressable onPress={() => setInputValue('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
                </Pressable>
              )}
            </View>

            {validationError ? <Text style={styles.validationError}>{validationError}</Text> : null}
          </View>

          {/* Quick select chips */}
          <View style={styles.chipsRow}>
            {[50, 100, 200, 500]
              .filter((v) => v <= maxRedeemable)
              .map((v) => (
                <Pressable
                  key={v}
                  style={[styles.chip, parsedCoins === v && styles.chipActive]}
                  onPress={() => setInputValue(String(v))}
                  accessibilityLabel={`Redeem ${v} coins`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipText, parsedCoins === v && styles.chipTextActive]}>{v}</Text>
                </Pressable>
              ))}
          </View>

          {/* Conversion preview */}
          {parsedCoins >= MIN_REDEMPTION && !validationError && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>You will receive a discount of</Text>
              <Text style={styles.previewAmount}>₹{rupeeDiscount.toFixed(2)}</Text>
              <Text style={styles.previewSub}>
                {parsedCoins} coins × ₹{coinRate.toFixed(2)} = ₹{rupeeDiscount.toFixed(2)} off
              </Text>
            </View>
          )}

          {/* Submit error */}
          {submitError && (
            <View style={styles.submitErrorWrap}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          )}

          {/* CTA Button */}
          <Pressable
            style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            accessibilityLabel="Apply redemption"
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Apply Redemption</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_LIGHT,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '900',
    color: PRIMARY,
    lineHeight: 56,
    marginTop: 4,
  },
  balanceSub: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rateText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  rateHighlight: {
    fontWeight: '700',
    color: PRIMARY,
  },
  inputSection: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inputHint: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
  },
  validationError: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PRIMARY_LIGHT,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  chipTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  previewLabel: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  previewAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 4,
  },
  previewSub: {
    fontSize: 12,
    color: '#4B7A5F',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  submitErrorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  submitErrorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  // Success styles
  successContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconWrap: {
    marginTop: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successAmount: {
    fontWeight: '800',
    color: '#16A34A',
  },
  successCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: PRIMARY_LIGHT,
    gap: 12,
    marginTop: 8,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successRowLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  successRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
  },
  doneButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginTop: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
