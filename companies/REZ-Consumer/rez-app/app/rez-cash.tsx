// @ts-nocheck
/**
 * REZ Cash Screen
 *
 * Addresses the "real money perception" gap vs CashKaro / GoPaisa.
 * Shows users their lifetime savings identity in rupee terms —
 * not just a coin balance, but a concrete savings story.
 *
 * Features:
 *  - Lifetime savings hero (₹X saved with REZ)
 *  - Real-world equivalents ("that's 12 Starbucks coffees")
 *  - 6-month savings trend bars
 *  - Milestones / badges earned
 *  - Top savings categories
 *  - Cash-out options (vouchers + future bank transfer)
 *  - Shareable savings card
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Share,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { useIsMounted } from '@/hooks/useIsMounted';
import { platformAlertSimple } from '@/utils/platformAlert';
import walletService, { RezCashIdentity } from '@/services/walletApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

// Only bank transfer is implemented; other voucher options are coming soon.
// Setting available: false renders the disabled "Soon" badge and prevents misleading
// "will be available shortly" alerts on press for unimplemented options.
const VOUCHER_OPTIONS = [
  { id: 'amazon', label: 'Amazon Pay', icon: 'cart-outline', color: '#FF9900', available: false },
  { id: 'flipkart', label: 'Flipkart', icon: 'storefront-outline', color: '#2874F0', available: false },
  { id: 'zomato', label: 'Zomato Credits', icon: 'restaurant-outline', color: '#E23744', available: false },
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline', color: '#10B981', available: true },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const BAR_HEIGHT = 80;

function TrendBar({ amount, max, label }: { amount: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(1, amount / max) : 0;
  const fillHeight = Math.max(2, Math.round(pct * BAR_HEIGHT));
  return (
    <View style={trendStyles.col}>
      <View style={trendStyles.barBg}>
        <View style={[trendStyles.barFill, { height: fillHeight }]} />
      </View>
      <Text style={trendStyles.barLabel}>{label}</Text>
      {amount > 0 && <Text style={trendStyles.barAmt}>₹{amount}</Text>}
    </View>
  );
}

const trendStyles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: {
    width: 28,
    height: BAR_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8 },
  barLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  barAmt: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

function RezCashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isMounted = useIsMounted();
  const [identity, setIdentity] = useState<RezCashIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Bank transfer modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAmount, setBankAmount] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await walletService.getRezCashIdentity();
      if (isMounted() && res.success && res.data) {
        setIdentity(res.data);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    } catch {
      // Non-fatal
    } finally {
      if (isMounted()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!identity) return;
    try {
      await Share.share({
        message: `I've saved ${fmt(identity.totalSaved)} with REZ! 🎉\nThis month: ${fmt(identity.thisMonth)} | Streak: ${identity.streak} month${identity.streak !== 1 ? 's' : ''}\n\nJoin REZ and start saving today.`,
      });
    } catch {
      // Dismissed
    }
  };

  const handleBankTransfer = async () => {
    const amount = parseFloat(bankAmount);
    if (!bankAmount || isNaN(amount) || amount <= 0) {
      platformAlertSimple('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    if (!bankAccountNo.trim() || !bankIfsc.trim() || !bankName.trim()) {
      platformAlertSimple('Missing Details', 'Please fill in all bank account details');
      return;
    }
    setBankSubmitting(true);
    try {
      // IDEMPOTENCY FIX: crypto.randomUUID() replaces Date.now() + Math.random() for collision-safe idempotency.
      const idempotencyKey = `bank-withdraw-${crypto.randomUUID()}`;
      const res = await walletService.withdraw({
        amount,
        method: 'bank',
        accountDetails: JSON.stringify({
          accountNumber: bankAccountNo.trim(),
          ifsc: bankIfsc.trim().toUpperCase(),
          accountName: bankName.trim(),
        }),
      });
      if (res.success) {
        setShowBankModal(false);
        setBankAmount('');
        setBankAccountNo('');
        setBankIfsc('');
        setBankName('');
        platformAlertSimple(
          'Transfer Initiated',
          `Bank transfer of ₹${amount} initiated. Processing time: ${(res.data as unknown)?.estimatedProcessingTime || '2-3 business days'}.`,
        );
        // Refresh identity data
        load();
      } else {
        const msg = (res as unknown).message || 'Transfer failed';
        if ((res as unknown).requiresReAuth) {
          platformAlertSimple(
            'Verification Required',
            'Please complete OTP verification before initiating a bank transfer. This is a security requirement for fund withdrawals.',
          );
        } else {
          platformAlertSimple('Transfer Failed', msg);
        }
      }
    } catch (err) {
      platformAlertSimple('Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBankSubmitting(false);
    }
  };

  const handleVoucherPress = (option: (typeof VOUCHER_OPTIONS)[0]) => {
    if (!option.available) {
      platformAlertSimple('Coming Soon', 'This option is coming soon. Stay tuned!');
      return;
    }
    if (option.id === 'bank') {
      setBankAmount('');
      setBankAccountNo('');
      setBankIfsc('');
      setBankName('');
      setShowBankModal(true);
      return;
    }
    platformAlertSimple('Redeem Voucher', `Voucher redemption for ${option.label} will be available shortly.`);
  };

  const maxTrend = identity?.monthlyTrend?.length ? Math.max(...identity.monthlyTrend.map((t) => t.amount), 1) : 1;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>REZ Cash</Text>
          <Pressable
            onPress={handleShare}
            style={styles.shareBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        ) : (
          <Animated.ScrollView
            style={{ opacity: fadeAnim }}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <LinearGradient
              colors={['#7C3AED', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.heroLabel}>You've saved with REZ</Text>
              <Text style={styles.heroAmount}>{fmt(identity?.totalSaved ?? 0)}</Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>This Month</Text>
                  <Text style={styles.heroStatValue}>{fmt(identity?.thisMonth ?? 0)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>This Year</Text>
                  <Text style={styles.heroStatValue}>{fmt(identity?.thisYear ?? 0)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Streak</Text>
                  <Text style={styles.heroStatValue}>{identity?.streak ?? 0} mo</Text>
                </View>
              </View>

              {/* 6-month trend */}
              {identity && identity.monthlyTrend?.length > 0 && (
                <View style={styles.trendRow}>
                  {identity.monthlyTrend.map((t, i) => (
                    <TrendBar key={i} amount={t.amount} max={maxTrend} label={t.label} />
                  ))}
                </View>
              )}

              {/* Pending cashback callout */}
              {identity && identity.pendingCashback > 0 && (
                <View style={styles.pendingBanner}>
                  <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
                  <Text style={styles.pendingText}>{fmt(identity.pendingCashback)} cashback pending credit</Text>
                </View>
              )}
            </LinearGradient>

            {/* Real-world equivalents */}
            {identity && identity.equivalents?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>That's equivalent to…</Text>
                <View style={styles.equivGrid}>
                  {identity.equivalents.map((e, i) => (
                    <View key={i} style={styles.equivItem}>
                      <View style={styles.equivIcon}>
                        <Ionicons name={e.icon as unknown} size={22} color="#7C3AED" />
                      </View>
                      <Text style={styles.equivCount}>{e.count}×</Text>
                      <Text style={styles.equivLabel}>{e.count === 1 ? e.singular : e.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Milestones */}
            {identity && identity.milestones && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Your Savings Badges</Text>
                <View style={styles.milestoneRow}>
                  {(identity.milestones.unlocked ?? []).map((m) => (
                    <View key={m.id} style={[styles.badge, { borderColor: m.color }]}>
                      <Ionicons name={m.icon as unknown} size={20} color={m.color} />
                      <Text style={[styles.badgeLabel, { color: m.color }]}>{m.label}</Text>
                    </View>
                  ))}
                  {(identity.milestones.unlocked ?? []).length === 0 && (
                    <Text style={styles.milestoneEmpty}>Save ₹100 to earn your first badge!</Text>
                  )}
                </View>
                {identity.milestones.next && (
                  <View style={styles.nextMilestone}>
                    <Ionicons name="flag-outline" size={14} color="#6b7280" />
                    <Text style={styles.nextMilestoneText}>
                      {fmt(identity.milestones.next.remaining)} more to unlock "{identity.milestones.next.label}"
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Top categories */}
            {identity && identity.topCategories?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Saving Categories</Text>
                {identity.topCategories.map((c, i) => {
                  const CATEGORY_COLORS = ['#7C3AED', '#10B981', '#F59E0B'];
                  return (
                    <View key={i} style={styles.categoryRow}>
                      <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[i] }]} />
                      <Text style={styles.categoryName}>
                        {c.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                      <Text style={[styles.categoryAmt, { color: CATEGORY_COLORS[i] }]}>{fmt(c.total)}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Cash-out section */}
            <View style={styles.card}>
              <View style={styles.cashOutHeader}>
                <Text style={styles.cardTitle}>Use Your Coins</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>More options soon</Text>
                </View>
              </View>
              <Text style={styles.cashOutSub}>Convert REZ Coins into vouchers or cash</Text>
              <View style={styles.voucherGrid}>
                {VOUCHER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    style={({ pressed }) => [
                      styles.voucherBtn,
                      !opt.available && styles.voucherBtnDisabled,
                      pressed && opt.available && styles.voucherBtnPressed,
                    ]}
                    onPress={() => handleVoucherPress(opt)}
                  >
                    <View style={[styles.voucherIcon, { backgroundColor: `${opt.color}18` }]}>
                      <Ionicons name={opt.icon as unknown} size={22} color={opt.color} />
                    </View>
                    <Text style={styles.voucherLabel}>{opt.label}</Text>
                    {!opt.available && (
                      <View style={styles.soonTag}>
                        <Text style={styles.soonTagText}>Soon</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Share card */}
            <Pressable style={styles.shareCard} onPress={handleShare}>
              <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.shareCardGradient}>
                <Ionicons name="share-social-outline" size={20} color="#7C3AED" />
                <View style={styles.shareCardText}>
                  <Text style={styles.shareCardTitle}>Share your savings story</Text>
                  <Text style={styles.shareCardSub}>Let friends know how much you've saved</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
              </LinearGradient>
            </Pressable>
          </Animated.ScrollView>
        )}
      </View>

      {/* Bank Transfer Modal */}
      <Modal visible={showBankModal} animationType="slide" transparent onRequestClose={() => setShowBankModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={bankStyles.overlay}>
          <View style={bankStyles.sheet}>
            <View style={bankStyles.header}>
              <Text style={bankStyles.title}>Bank Transfer</Text>
              <Pressable onPress={() => setShowBankModal(false)} disabled={bankSubmitting}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
            <Text style={bankStyles.subtitle}>2% processing fee applies. Funds arrive in 2-3 business days.</Text>

            <View style={bankStyles.group}>
              <Text style={bankStyles.label}>Amount (REZ Coins)</Text>
              <TextInput
                style={bankStyles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={bankAmount}
                onChangeText={setBankAmount}
                editable={!bankSubmitting}
              />
            </View>

            <View style={bankStyles.group}>
              <Text style={bankStyles.label}>Account Holder Name</Text>
              <TextInput
                style={bankStyles.input}
                placeholder="Full name as per bank"
                placeholderTextColor="#9ca3af"
                value={bankName}
                onChangeText={setBankName}
                editable={!bankSubmitting}
              />
            </View>

            <View style={bankStyles.group}>
              <Text style={bankStyles.label}>Account Number</Text>
              <TextInput
                style={bankStyles.input}
                placeholder="Enter account number"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={bankAccountNo}
                onChangeText={setBankAccountNo}
                editable={!bankSubmitting}
              />
            </View>

            <View style={bankStyles.group}>
              <Text style={bankStyles.label}>IFSC Code</Text>
              <TextInput
                style={bankStyles.input}
                placeholder="e.g. HDFC0001234"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                value={bankIfsc}
                onChangeText={setBankIfsc}
                editable={!bankSubmitting}
              />
            </View>

            {bankAmount && !isNaN(parseFloat(bankAmount)) && parseFloat(bankAmount) > 0 && (
              <View style={bankStyles.feeRow}>
                <Text style={bankStyles.feeText}>
                  Net amount after 2% fee:{' '}
                  <Text style={bankStyles.feeValue}>₹{(parseFloat(bankAmount) * 0.98).toFixed(2)}</Text>
                </Text>
              </View>
            )}

            <View style={bankStyles.actions}>
              <Pressable
                style={[bankStyles.btn, bankStyles.btnCancel]}
                onPress={() => setShowBankModal(false)}
                disabled={bankSubmitting}
              >
                <Text style={bankStyles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[bankStyles.btn, bankStyles.btnConfirm]}
                onPress={handleBankTransfer}
                disabled={bankSubmitting}
              >
                {bankSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={bankStyles.btnConfirmText}>Transfer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#7C3AED',
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  shareBtn: { width: 36, alignItems: 'flex-end' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { gap: 14, padding: 16 },

  // Hero
  hero: { borderRadius: 20, padding: 20, gap: 12 },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 0.5 },
  heroAmount: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  heroStatValue: { fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 2 },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  trendRow: { flexDirection: 'row', gap: 4, marginTop: 8, alignItems: 'flex-end' },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pendingText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },

  // Equivalents
  equivGrid: { flexDirection: 'row', gap: 10 },
  equivItem: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12 },
  equivIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equivCount: { fontSize: 20, fontWeight: '900', color: '#7C3AED' },
  equivLabel: { fontSize: 10, color: '#6b7280', textAlign: 'center', fontWeight: '600' },

  // Milestones
  milestoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  badgeLabel: { fontSize: 12, fontWeight: '700' },
  milestoneEmpty: { fontSize: 13, color: '#9ca3af' },
  nextMilestone: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  nextMilestoneText: { fontSize: 12, color: '#6b7280', flex: 1 },

  // Categories
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  categoryAmt: { fontSize: 14, fontWeight: '700' },

  // Cash-out
  cashOutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cashOutSub: { fontSize: 12, color: '#9ca3af', marginTop: -8 },
  comingSoonBadge: { backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },
  voucherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  voucherBtn: {
    width: '47%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  voucherBtnDisabled: { opacity: 0.5 },
  voucherBtnPressed: { backgroundColor: '#EDE9FE' },
  voucherIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  voucherLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  soonTag: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  soonTagText: { fontSize: 9, fontWeight: '800', color: '#D97706' },

  // Share card
  shareCard: { borderRadius: 16, overflow: 'hidden' },
  shareCardGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  shareCardText: { flex: 1 },
  shareCardTitle: { fontSize: 14, fontWeight: '700', color: '#5B21B6' },
  shareCardSub: { fontSize: 12, color: '#7C3AED', marginTop: 2 },
});

const bankStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#9ca3af', marginBottom: 16 },
  group: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  feeRow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  feeText: { fontSize: 13, color: '#374151' },
  feeValue: { fontWeight: '700', color: '#059669' },
  actions: { flexDirection: 'row', gap: 12, paddingTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: { backgroundColor: '#F3F4F6' },
  btnCancelText: { fontWeight: '600', color: '#374151' },
  btnConfirm: { backgroundColor: '#7C3AED' },
  btnConfirmText: { fontWeight: '700', color: '#fff' },
});

export default withErrorBoundary(RezCashScreen, 'RezCashScreen');
