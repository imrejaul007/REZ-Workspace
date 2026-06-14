import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';

type WaitlistStatus = 'waiting' | 'notified' | 'expired';

interface WaitlistEntry {
  _id: string;
  customerName: string;
  customerPhone: string;
  desiredService: string;
  preferredDate?: string;
  preferredTime?: string;
  addedAt: string;
  status: WaitlistStatus;
}

const TAB_LABELS: { key: WaitlistStatus; label: string }[] = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'notified', label: 'Notified' },
  { key: 'expired', label: 'Expired' },
];

function timeOnWaitlist(addedAt: string): string {
  const diff = Date.now() - new Date(addedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function WaitlistScreen() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WaitlistStatus>('waiting');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const md = await storageService.getMerchantData<unknown>();
      const sid = md?.activeStoreId || md?.storeId || md?.id;
      setStoreId(sid);
    })();
  }, []);

  const fetchEntries = useCallback(
    async (isRefreshing = false) => {
      if (!storeId) return;
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        const res = await apiClient.get<unknown>(`waitlist/store/${storeId}?status=${activeTab}`);
        setEntries(res.data?.entries || res.data || []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, activeTab]
  );

  useEffect(() => {
    if (storeId) fetchEntries();
  }, [storeId, fetchEntries]);

  const handleNotify = async (entry: WaitlistEntry) => {
    setActionId(entry._id);
    try {
      await apiClient.put(`waitlist/${entry._id}/notify`, {});
      setEntries((prev) => prev.filter((e) => e._id !== entry._id));
      Toast.show({ type: 'success', text1: 'Slot available notification sent' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Failed to notify customer' });
    } finally {
      setActionId(null);
    }
  };

  const handleBookNow = (entry: WaitlistEntry) => {
    router.push({
      pathname: '/appointments/new',
      params: {
        prefillName: entry.customerName,
        prefillPhone: entry.customerPhone,
        prefillService: entry.desiredService,
      },
    });
  };

  const handleRemove = async (entry: WaitlistEntry) => {
    setActionId(entry._id);
    try {
      await apiClient.delete(`waitlist/${entry._id}`);
      setEntries((prev) => prev.filter((e) => e._id !== entry._id));
      Toast.show({ type: 'success', text1: 'Entry removed from waitlist' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Failed to remove entry' });
    } finally {
      setActionId(null);
    }
  };

  const totalWaiting = entries.length;

  const renderEntry = ({ item }: { item: WaitlistEntry }) => {
    const isActing = actionId === item._id;
    return (
      <View style={styles.card}>
        {isActing && (
          <View style={styles.cardOverlay}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
          </View>
        )}
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
          <View style={styles.timeBadge}>
            <ThemedText style={styles.timeBadgeText}>{timeOnWaitlist(item.addedAt)}</ThemedText>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color={Colors.light.textSecondary} />
          <ThemedText style={styles.infoText}>{item.customerPhone}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cut-outline" size={14} color={Colors.light.textSecondary} />
          <ThemedText style={styles.infoText}>{item.desiredService}</ThemedText>
        </View>
        {(item.preferredDate || item.preferredTime) && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
            <ThemedText style={styles.infoText}>
              {[item.preferredDate, item.preferredTime].filter(Boolean).join(' at ')}
            </ThemedText>
          </View>
        )}
        {activeTab === 'waiting' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.notifyBtn]}
              onPress={() => handleNotify(item)}
              disabled={isActing}
            >
              <Ionicons name="notifications-outline" size={14} color="#fff" />
              <ThemedText style={styles.actionBtnText}>Notify</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.bookBtn]}
              onPress={() => handleBookNow(item)}
              disabled={isActing}
            >
              <Ionicons name="calendar-outline" size={14} color="#fff" />
              <ThemedText style={styles.actionBtnText}>Book Now</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.removeBtn]}
              onPress={() => handleRemove(item)}
              disabled={isActing}
            >
              <Ionicons name="trash-outline" size={14} color="#fff" />
              <ThemedText style={styles.actionBtnText}>Remove</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        {activeTab !== 'waiting' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.removeBtn]}
              onPress={() => handleRemove(item)}
              disabled={isActing}
            >
              <Ionicons name="trash-outline" size={14} color="#fff" />
              <ThemedText style={styles.actionBtnText}>Remove</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.title}>Waitlist</ThemedText>
          {activeTab === 'waiting' && totalWaiting > 0 && (
            <View style={styles.countBadge}>
              <ThemedText style={styles.countBadgeText}>{totalWaiting}</ThemedText>
            </View>
          )}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabs}>
        {TAB_LABELS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <ThemedText style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item._id}
          renderItem={renderEntry}
          contentContainerStyle={entries.length === 0 ? styles.center : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchEntries(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No one on the waitlist</ThemedText>
              <ThemedText style={styles.emptyText}>
                Customers who request to be added will appear here.
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  countBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.light.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  tabTextActive: { color: Colors.light.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  customerName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.light.text },
  timeBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.light.text, flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 8,
  },
  notifyBtn: { backgroundColor: '#3B82F6' },
  bookBtn: { backgroundColor: '#10B981' },
  removeBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.light.text, marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },
});
