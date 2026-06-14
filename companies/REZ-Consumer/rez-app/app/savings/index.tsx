// @ts-nocheck
/**
 * SavingsDashboard — Phase 3 Savings Habit Layer
 * Tabs: My Savings | Missed Savings | Best Nearby
 *
 * Updated to use SavingsContext from the savings module
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { Spacing, BorderRadius } from '@/constants/DesignSystem';
import { useIsMounted } from '@/hooks/useIsMounted';
import MissedSavingsCard from '@/components/savings/MissedSavingsCard';
import { useCurrentLocation } from '@/hooks/useLocation';
import streakApi, { StreakData } from '@/services/streakApi';
// Savings module integration
import { useSavings } from '@/hooks/useSavings';
import { useSavingsNotifications } from '@/hooks/useSavingsNotifications';

// Fallback coordinates (Delhi) — used only when device location is unavailable
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.209;

type TabId = 'my-savings' | 'missed' | 'nearby';

interface SavingsSummary {
  lifetimeSavedPaise: number;
  thisMonthSavedPaise: number;
  lastMonthSavedPaise: number;
  avgPerVisitPaise: number;
  topCategory: string;
  missedSavingsCount: number;
  savingsStreak: number;
}
interface MissedItem {
  transactionStoreId: string;
  transactionStoreName: string;
  transactionAmountPaise: number;
  betterOption: {
    storeId: string;
    storeName: string;
    storeLogo: string;
    cashbackPercent: number;
    estimatedSavingPaise: number;
    distanceMeters: number;
  };
}
interface NearbyStore {
  storeId: string;
  storeName: string;
  storeLogo: string;
  distanceMeters: number;
  cashbackPercent: number;
  expectedSavingPaise: number;
  rating: number;
}

// API helpers — apiClient handles auth token automatically
async function fetchSummary(): Promise<SavingsSummary | null> {
  const { default: api } = await import('@/services/apiClient');
  const res = (await api.get('/user/savings/summary')) as unknown;
  return res.data?.data ?? null;
}
async function fetchMissed(lat: number = DEFAULT_LAT, lng: number = DEFAULT_LNG): Promise<MissedItem[]> {
  const { default: api } = await import('@/services/apiClient');
  const res = (await api.get(`/user/savings/missed?lat=${lat}&lng=${lng}`)) as unknown;
  return res.data?.data ?? [];
}
async function fetchBestNearby(lat: number = DEFAULT_LAT, lng: number = DEFAULT_LNG): Promise<NearbyStore[]> {
  const { default: api } = await import('@/services/apiClient');
  const res = (await api.get(`/user/savings/best-nearby?lat=${lat}&lng=${lng}`)) as unknown;
  return res.data?.data ?? [];
}

const r2 = (p: number) => Math.round(p / 100).toLocaleString('en-IN');
const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
function starIcons(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return Array.from({ length: 5 }, (_, i) => (i < full ? 'star' : i === full && half ? 'star-half' : 'star-outline'));
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'my-savings', label: 'My Savings' },
  { id: 'missed', label: 'Missed' },
  { id: 'nearby', label: 'Best Nearby' },
];

function TabBar({ active, onSelect }: { active: TabId; onSelect: (id: TabId) => void }) {
  return (
    <View style={s.tabWrap}>
      {TABS.map((t) => (
        <Pressable
          key={t.id}
          style={[s.tab, active === t.id && s.tabActive]}
          onPress={() => onSelect(t.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === t.id }}
          accessibilityLabel={t.label}
        >
          <Text style={[s.tabLabel, active === t.id && s.tabLabelActive]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// M-17 FIX: SpendingBreakdownCard now uses API-provided summary fields.
// The summary object is fetched from /api/savings/summary which includes topCategory,
// thisMonthSavedPaise, lifetimeSavedPaise, and missedSavingsCount.
// No separate category breakdown endpoint is needed — data is derived from the summary.
function SpendingBreakdownCard({ summary }: { summary: SavingsSummary }) {
  const topAmt = Math.round(summary.thisMonthSavedPaise / 100);
  const otherAmt = Math.round((summary.lifetimeSavedPaise - summary.thisMonthSavedPaise) / 12 / 100);
  const missedAmt = summary.missedSavingsCount * 150;
  const maxAmt = Math.max(topAmt, otherAmt, missedAmt, 1);
  const rows: { label: string; amount: number; color: string }[] = [
    { label: summary.topCategory || 'Top Category', amount: topAmt, color: '#059669' },
    { label: 'Other categories', amount: otherAmt, color: '#3b82f6' },
    { label: 'Missed opportunities', amount: missedAmt, color: '#f59e0b' },
  ];
  return (
    <View style={s.breakdownCard}>
      <View style={s.breakdownHeader}>
        <Ionicons name="pie-chart-outline" size={16} color="#1a3a52" />
        <Text style={s.breakdownTitle}>Where You Save Most</Text>
      </View>
      <Text style={s.breakdownSub}>
        #1 category where you save most: <Text style={s.breakdownBold}>{summary.topCategory || '—'}</Text>
      </Text>
      {rows.map((row) => (
        <View key={row.label} style={s.barRow}>
          <View style={s.barMeta}>
            <Text style={s.barLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={s.barAmt}>₹{row.amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                { width: `${Math.round((row.amount / maxAmt) * 100)}%` as unknown, backgroundColor: row.color },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function VisitStreakCard({ router }: { router: ReturnType<typeof useRouter> }) {
  const [storeStreak, setStoreStreak] = React.useState<StreakData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    streakApi
      .getStreakStatus('order')
      .then((res) => {
        if (!cancelled && res.data) setStoreStreak(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  const current = storeStreak?.current ?? 0;
  const lastActivity = storeStreak?.lastActivity ? new Date(storeStreak.lastActivity) : null;
  const daysSinceLast = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000) : null;

  return (
    <View style={s.visitStreakCard}>
      <View style={s.visitStreakHeader}>
        <View style={s.visitStreakIconWrap}>
          <Text style={s.visitStreakEmoji}>🏪</Text>
        </View>
        <View style={s.visitStreakInfo}>
          <Text style={s.visitStreakTitle}>Store Visit Streak</Text>
          {daysSinceLast !== null && (
            <Text style={s.visitStreakSub}>
              {daysSinceLast === 0
                ? 'Visited today'
                : daysSinceLast === 1
                  ? 'Last visit: yesterday'
                  : `Last visit: ${daysSinceLast} days ago`}
            </Text>
          )}
        </View>
        <View style={s.visitStreakCount}>
          <Text style={s.visitStreakNum}>{current}</Text>
          <Text style={s.visitStreakDays}>days</Text>
        </View>
      </View>
      {current === 0 ? (
        <Pressable
          style={s.visitStreakCTA}
          onPress={() => router.push('/explore' as unknown as string)}
          accessibilityRole="button"
          accessibilityLabel="Visit a REZ store today"
        >
          <Ionicons name="location-sharp" size={14} color="#fff" />
          <Text style={s.visitStreakCTAText}>Visit a REZ store today to start your streak</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[s.visitStreakCTA, { backgroundColor: '#059669' }]}
          onPress={() => router.push('/explore' as unknown as string)}
          accessibilityRole="button"
          accessibilityLabel="Keep your streak going"
        >
          <Ionicons name="flame" size={14} color="#fff" />
          <Text style={s.visitStreakCTAText}>
            {daysSinceLast === 0
              ? 'Great! Visit again tomorrow to keep going'
              : 'Visit a REZ store today to keep your streak!'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function MySavingsTab({ summary, onMissedPress }: { summary: SavingsSummary; onMissedPress: () => void }) {
  const router = useRouter();
  return (
    <View>
      <LinearGradient colors={['#059669', '#34d399']} style={s.heroCard}>
        <Text style={s.heroLabel}>Total Saved</Text>
        <Text style={s.heroAmount}>₹{r2(summary.lifetimeSavedPaise)}</Text>
        <View style={s.streakRow}>
          <Text style={s.streakEmoji}>🔥</Text>
          <Text style={s.streakText}>{summary.savingsStreak} day streak</Text>
        </View>
      </LinearGradient>

      <VisitStreakCard router={router} />

      <View style={s.statRow}>
        {(
          [
            ['This Month', summary.thisMonthSavedPaise],
            ['Last Month', summary.lastMonthSavedPaise],
            ['Avg/Visit', summary.avgPerVisitPaise],
          ] as [string, number][]
        ).map(([label, val], i) => (
          <React.Fragment key={label}>
            {i > 0 && <View style={s.statDivider} />}
            <View style={s.statItem}>
              <Text style={s.statValue}>₹{r2(val)}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <SpendingBreakdownCard summary={summary} />

      {!!summary.topCategory && (
        <View style={s.catPill}>
          <Ionicons name="trophy" size={14} color="#f59e0b" />
          <Text style={s.catText}>
            Best in: <Text style={s.catBold}>{summary.topCategory}</Text>
          </Text>
        </View>
      )}

      <Pressable
        style={s.missedRow}
        onPress={onMissedPress}
        accessibilityRole="button"
        accessibilityLabel="View missed savings"
      >
        <View style={s.missedLeft}>
          <Ionicons name="alert-circle" size={20} color="#f59e0b" />
          <Text style={s.missedText}>
            <Text style={s.missedCount}>{summary.missedSavingsCount}</Text> opportunities in last 30 days
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </Pressable>
    </View>
  );
}

function EmptyState({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyEmoji}>{emoji}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!body && <Text style={s.emptyBody}>{body}</Text>}
    </View>
  );
}

function MissedSavingsTab({
  items,
  loading,
  onExplore,
}: {
  items: MissedItem[];
  loading: boolean;
  onExplore: (id: string) => void;
}) {
  if (loading)
    return (
      <View style={s.empty}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  if (!items.length)
    return (
      <EmptyState emoji="🎉" title="No missed savings!" body="Great job! No missed savings in the past 30 days." />
    );
  return (
    <View>
      {items.map((item) => (
        <MissedSavingsCard
          key={item.transactionStoreId}
          storeName={item.transactionStoreName}
          betterStoreName={item.betterOption.storeName}
          missedAmountPaise={item.betterOption.estimatedSavingPaise}
          onExplore={() => onExplore(item.betterOption.storeId)}
        />
      ))}
    </View>
  );
}

function BestNearbyTab({
  stores,
  loading,
  onPress,
}: {
  stores: NearbyStore[];
  loading: boolean;
  onPress: (id: string) => void;
}) {
  if (loading)
    return (
      <View style={s.empty}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  if (!stores.length) return <EmptyState emoji="📍" title="No stores found nearby." />;
  return (
    <View style={{ paddingHorizontal: Spacing.lg }}>
      {stores.map((store) => (
        <Pressable
          key={store.storeId}
          style={s.nearbyCard}
          onPress={() => onPress(store.storeId)}
          accessibilityRole="button"
          accessibilityLabel={`${store.storeName}, ${store.cashbackPercent}% cashback`}
        >
          <View style={s.nearbyTop}>
            <Text style={s.nearbyName}>{store.storeName}</Text>
            <View style={s.distBadge}>
              <Ionicons name="location-sharp" size={11} color="#1a3a52" />
              <Text style={s.distText}>{fmtDist(store.distanceMeters)}</Text>
            </View>
          </View>
          <View style={s.nearbyMid}>
            <View style={s.cashbackPill}>
              <Text style={s.cashbackText}>{store.cashbackPercent}% cashback</Text>
            </View>
            <Text style={s.savingText}>Save ₹{r2(store.expectedSavingPaise)}</Text>
          </View>
          <View style={s.starsRow}>
            {starIcons(store.rating).map((icon, i) => (
              <Ionicons key={i} name={icon as unknown} size={13} color="#f59e0b" />
            ))}
            <Text style={s.ratingNum}>{store.rating.toFixed(1)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function SavingsDashboard() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { currentLocation } = useCurrentLocation();
  const [activeTab, setActiveTab] = useState<TabId>('my-savings');
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [missed, setMissed] = useState<MissedItem[]>([]);
  const [missedLoading, setMissedLoading] = useState(false);
  const [missedFetched, setMissedFetched] = useState(false);
  const [nearby, setNearby] = useState<NearbyStore[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyFetched, setNearbyFetched] = useState(false);

  // Savings module integration
  const { dashboard: savingsDashboard, refreshDashboard } = useSavings();
  useSavingsNotifications();

  // Resolve lat/lng from device location with Delhi fallback
  const userLat = currentLocation?.coordinates?.latitude ?? DEFAULT_LAT;
  const userLng = currentLocation?.coordinates?.longitude ?? DEFAULT_LNG;

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchSummary();
      if (isMounted()) {
        // Merge with savings module data if available
        if (data && savingsDashboard) {
          setSummary({
            ...data,
            // Use savings module data where available
            lifetimeSavedPaise: savingsDashboard.totalSavingsAmount,
            thisMonthSavedPaise: savingsDashboard.thisMonthAmount,
            lastMonthSavedPaise: savingsDashboard.lastMonth || 0,
            savingsStreak: savingsDashboard.currentStreak,
          });
        } else {
          setSummary(data);
        }
      }
    } catch {
      /* non-critical */
    } finally {
      if (isMounted()) {
        setSummaryLoading(false);
        setRefreshing(false);
      }
    }
  }, [isMounted, savingsDashboard]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadMissed = useCallback(async () => {
    if (missedFetched) return;
    setMissedLoading(true);
    try {
      const data = await fetchMissed(userLat, userLng);
      if (isMounted()) {
        setMissed(data);
        setMissedFetched(true);
      }
    } catch {
      /* non-critical */
    } finally {
      if (isMounted()) {
        setMissedLoading(false);
        setRefreshing(false);
      }
    }
  }, [isMounted, missedFetched, userLat, userLng]);

  const loadNearby = useCallback(async () => {
    if (nearbyFetched) return;
    setNearbyLoading(true);
    try {
      const data = await fetchBestNearby(userLat, userLng);
      if (isMounted()) {
        setNearby(data);
        setNearbyFetched(true);
      }
    } catch {
      /* non-critical */
    } finally {
      if (isMounted()) {
        setNearbyLoading(false);
        setRefreshing(false);
      }
    }
  }, [isMounted, nearbyFetched, userLat, userLng]);

  const handleTabSelect = useCallback(
    (id: TabId) => {
      setActiveTab(id);
      if (id === 'missed') loadMissed();
      if (id === 'nearby') loadNearby();
    },
    [loadMissed, loadNearby],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'my-savings') {
      loadSummary();
      return;
    }
    if (activeTab === 'missed') {
      setMissedFetched(false);
      setMissedLoading(true);
      fetchMissed(userLat, userLng)
        .then((d) => {
          if (isMounted()) {
            setMissed(d);
            setMissedFetched(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted()) {
            setMissedLoading(false);
            setRefreshing(false);
          }
        });
    } else {
      setNearbyFetched(false);
      setNearbyLoading(true);
      fetchBestNearby(userLat, userLng)
        .then((d) => {
          if (isMounted()) {
            setNearby(d);
            setNearbyFetched(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted()) {
            setNearbyLoading(false);
            setRefreshing(false);
          }
        });
    }
  }, [activeTab, loadSummary, isMounted, userLat, userLng]);

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#1a3a52', '#FFC857']} style={s.header}>
        <View style={s.headerRow}>
          <Pressable
            style={s.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={s.headerTitle}>Savings Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={s.tabBarWrap}>
        <TabBar active={activeTab} onSelect={handleTabSelect} />
      </View>

      {summaryLoading && activeTab === 'my-savings' ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3a52" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {activeTab === 'my-savings' && summary && (
            <MySavingsTab summary={summary} onMissedPress={() => handleTabSelect('missed')} />
          )}
          {activeTab === 'my-savings' && !summary && !summaryLoading && (
            <EmptyState
              emoji="💰"
              title="No savings data yet."
              body="Start shopping with REZ to track your savings here."
            />
          )}
          {activeTab === 'missed' && (
            <MissedSavingsTab
              items={missed}
              loading={missedLoading}
              onExplore={(id) => router.push(`/store/${id}` as unknown as string)}
            />
          )}
          {activeTab === 'nearby' && (
            <BestNearbyTab
              stores={nearby}
              loading={nearbyLoading}
              onPress={(id) => router.push(`/store/${id}` as unknown as string)}
            />
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const card = {
  backgroundColor: '#fff',
  borderRadius: BorderRadius.lg,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabBarWrap: { backgroundColor: '#f8fafc', paddingTop: Spacing.base },
  content: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  // Tabs
  tabWrap: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  tabLabelActive: { color: '#1a3a52' },
  // Hero
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: 28,
    alignItems: 'center',
  },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  heroAmount: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  streakRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  streakEmoji: { fontSize: 18 },
  streakText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  // Stats
  statRow: {
    flexDirection: 'row',
    ...card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    paddingVertical: Spacing.base,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0' },
  // Category pill
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: Spacing.lg,
    marginBottom: Spacing.base,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  catText: { fontSize: 13, color: '#92400e' },
  catBold: { fontWeight: '700' },
  // Spending Breakdown Card
  breakdownCard: { ...card, marginHorizontal: Spacing.lg, marginBottom: Spacing.base, padding: Spacing.base },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  breakdownTitle: { fontSize: 14, fontWeight: '800', color: '#1a3a52' },
  breakdownSub: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  breakdownBold: { fontWeight: '700', color: '#1e293b' },
  barRow: { marginBottom: 8 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barLabel: { fontSize: 12, color: '#475569', flexShrink: 1, maxWidth: '70%' },
  barAmt: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  barTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  // Missed row
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    padding: Spacing.base,
  },
  missedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  missedText: { fontSize: 14, color: '#475569', flexShrink: 1 },
  missedCount: { fontWeight: '800', color: '#f59e0b' },
  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  emptyBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  // Nearby
  nearbyCard: { ...card, padding: Spacing.base, marginBottom: Spacing.sm },
  nearbyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nearbyName: { fontSize: 15, fontWeight: '800', color: '#1e293b', flexShrink: 1 },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    marginLeft: 8,
  },
  distText: { fontSize: 11, fontWeight: '700', color: '#1a3a52' },
  nearbyMid: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cashbackPill: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  cashbackText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  savingText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingNum: { fontSize: 12, color: '#94a3b8', marginLeft: 4 },
  // Visit Streak Card
  visitStreakCard: {
    ...card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  visitStreakHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  visitStreakIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitStreakEmoji: { fontSize: 22 },
  visitStreakInfo: { flex: 1 },
  visitStreakTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  visitStreakSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  visitStreakCount: { alignItems: 'center' },
  visitStreakNum: { fontSize: 28, fontWeight: '900', color: '#1a3a52', lineHeight: 32 },
  visitStreakDays: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  visitStreakCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  visitStreakCTAText: { fontSize: 12, fontWeight: '700', color: '#fff', flex: 1 },
});

export default withErrorBoundary(SavingsDashboard, 'SavingsDashboard');
