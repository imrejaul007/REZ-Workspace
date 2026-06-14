// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Store Gift Cards Screen
 * Shows gift cards issued by merchants/stores — distinct from generic wallet gift cards.
 * Accessible from wallet tab.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import apiClient, { ApiResponse } from '@/services/apiClient';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type GiftCardStatus = 'active' | 'used' | 'expired';

interface StoreInfo {
  id: string;
  name: string;
  logo: string | null;
}

interface StoreGiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  status: GiftCardStatus;
  expiresAt: string;
  store: StoreInfo | null;
  redemptionCount: number;
  isGiftedToMe: boolean;
}

type FilterTab = 'active' | 'used' | 'expired';

const FILTER_TABS: FilterTab[] = ['active', 'used', 'expired'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpiringSoon(expiresAt: string) {
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 7;
}

// ─── Card Component ───────────────────────────────────────────────────────────

function GiftCardItem({ card, onCopyCode }: { card: StoreGiftCard; onCopyCode: (code: string) => void }) {
  const isDark = false;
  const isActive = card.status === 'active';
  const balancePct = card.amount > 0 ? (card.balance / card.amount) * 100 : 0;

  const gradientColors: [string, string] = isActive
    ? ['#1a3a52', '#FFC857']
    : card.status === 'used'
      ? ['#374151', '#1F2937']
      : ['#6B7280', '#4B5563'];

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.storeName}>{card.store?.name || 'Store Gift Card'}</Text>
            {card.isGiftedToMe && (
              <View style={styles.giftBadge}>
                <Ionicons name="gift" size={10} color="#fff" />
                <Text style={styles.giftBadgeText}>Gifted to you</Text>
              </View>
            )}
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }]}
          >
            <Text style={styles.statusText}>{card.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(card.balance)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.balanceLabel}>Face Value</Text>
            <Text style={styles.faceValue}>{formatCurrency(card.amount)}</Text>
          </View>
        </View>

        {/* Progress bar (balance remaining) */}
        {isActive && (
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.max(3, balancePct)}%` }]} />
          </View>
        )}

        {/* Code + expiry row */}
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.codeRow} onPress={() => onCopyCode(card.code)} activeOpacity={0.7}>
            <Text style={styles.codeText}>{card.code}</Text>
            <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <View>
            {isExpiringSoon(card.expiresAt) && isActive && <Text style={styles.expiryWarning}>Expires soon!</Text>}
            <Text style={styles.expiryText}>Valid till {formatDate(card.expiresAt)}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
  const messages: Record<FilterTab, { icon: string; title: string; body: string }> = {
    active: {
      icon: 'gift-outline',
      title: 'No active gift cards',
      body: 'Visit your favourite stores and ask them to issue a gift card for you.',
    },
    used: {
      icon: 'checkmark-circle-outline',
      title: 'No used cards',
      body: 'Your redeemed gift cards will appear here.',
    },
    expired: {
      icon: 'time-outline',
      title: 'No expired cards',
      body: 'Cards that have passed their validity date show up here.',
    },
  };
  const m = messages[tab];
  return (
    <View style={styles.emptyState}>
      <Ionicons name={m.icon as unknown} size={48} color={(colors as unknown).textMuted || '#9CA3AF'} />
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptyBody}>{m.body}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function StoreGiftCardsScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();

  const [cards, setCards] = useState<StoreGiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('active');

  const fetchCards = useCallback(
    async (isRefresh = false) => {
      try {
        // eslint-disable-next-line no-unused-expressions
        isRefresh ? setRefreshing(true) : setLoading(true);
        const res = await apiClient.get<{ giftCards: StoreGiftCard[] }>('/user/store-gift-cards?status=all');
        if (!isMounted()) return;
        if (res.success && res.data?.giftCards) {
          setCards(res.data.giftCards);
        }
      } catch (err) {
        // silently handle
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards]),
  );

  const handleCopyCode = useCallback((code: string) => {
    Clipboard.setString(code);
    platformAlertSimple('Copied!', `Gift card code ${code} copied to clipboard.`);
  }, []);

  const filteredCards = cards.filter((c) => c.status === activeTab);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={(colors.text as unknown) || '#111827'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Gift Cards</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {FILTER_TABS.map((tab) => {
          const count = cards.filter((c) => c.status === tab).length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab ? styles.tabActive : null]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.nileBlue || '#1a3a52'} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCards(true)} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredCards.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            filteredCards.map((card) => <GiftCardItem key={card.id} card={card} onCopyCode={handleCopyCode} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#1a3a52' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 16, paddingBottom: 40 },

  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  card: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  storeName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  giftBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  giftBadgeText: { fontSize: 10, color: '#fff', opacity: 0.85 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  balanceAmount: { fontSize: 28, fontWeight: '800', color: '#fff' },
  faceValue: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: 'monospace' },
  expiryWarning: { fontSize: 10, color: '#FCD34D', fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  expiryText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});

export default withErrorBoundary(StoreGiftCardsScreen, 'StoreGiftCards');
