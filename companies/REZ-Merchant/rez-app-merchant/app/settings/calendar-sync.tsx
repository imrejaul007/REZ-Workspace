/**
 * Calendar Sync Settings Screen
 * Allows merchants to connect Google or Apple Calendar so appointments
 * are automatically synced.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = 'google' | 'apple';

interface CalendarRecord {
  _id: string;
  provider: Provider;
  calendarId?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
}

interface ConnectModalState {
  visible: boolean;
  provider: Provider | null;
  calendarId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastSync(lastSyncAt?: string): string {
  if (!lastSyncAt) return 'Never synced';
  const d = new Date(lastSyncAt);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ─── Calendar Card ────────────────────────────────────────────────────────────

interface CalendarCardProps {
  provider: Provider;
  record: CalendarRecord | undefined;
  isSyncing: boolean;
  onConnect: (provider: Provider) => void;
  onDisconnect: (provider: Provider) => void;
  onToggle: (provider: Provider, value: boolean) => void;
  onSync: () => void;
}

function CalendarCard({
  provider,
  record,
  isSyncing,
  onConnect,
  onDisconnect,
  onToggle,
  onSync,
}: CalendarCardProps) {
  const isGoogle = provider === 'google';
  const providerLabel = isGoogle ? 'Google Calendar' : 'Apple Calendar';
  const iconName: keyof typeof Ionicons.glyphMap = isGoogle ? 'logo-google' : 'logo-apple';
  const accentColor = isGoogle ? '#4285F4' : '#1C1C1E';
  const isConnected = !!record;

  return (
    <View style={cardStyles.card}>
      {/* Card Header */}
      <View style={cardStyles.header}>
        <View style={[cardStyles.iconBg, { backgroundColor: `${accentColor}18` }]}>
          <Ionicons name={iconName} size={22} color={accentColor} />
        </View>
        <View style={cardStyles.headerText}>
          <Text style={cardStyles.providerName}>{providerLabel}</Text>
          <Text
            style={[
              cardStyles.statusBadge,
              isConnected ? cardStyles.connected : cardStyles.disconnected,
            ]}
          >
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
      </View>

      {isConnected && record ? (
        <>
          {/* Calendar ID row */}
          {record.calendarId ? (
            <View style={cardStyles.infoRow}>
              <Ionicons name="calendar-outline" size={15} color="#6B7280" />
              <Text style={cardStyles.infoText} numberOfLines={1}>
                {record.calendarId}
              </Text>
            </View>
          ) : null}

          {/* Last sync row */}
          <View style={cardStyles.infoRow}>
            <Ionicons name="time-outline" size={15} color="#6B7280" />
            <Text style={cardStyles.infoText}>Last sync: {formatLastSync(record.lastSyncAt)}</Text>
          </View>

          {/* Sync toggle */}
          <View style={cardStyles.toggleRow}>
            <Text style={cardStyles.toggleLabel}>Auto-sync enabled</Text>
            <Switch
              value={record.syncEnabled}
              onValueChange={(v) => onToggle(provider, v)}
              trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
              thumbColor={record.syncEnabled ? '#7C3AED' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Sync Now button */}
          <TouchableOpacity
            style={cardStyles.syncBtn}
            onPress={onSync}
            disabled={isSyncing}
            accessibilityRole="button"
            accessibilityLabel={`Sync ${providerLabel} now`}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <>
                <Ionicons name="sync-outline" size={16} color="#7C3AED" />
                <Text style={cardStyles.syncBtnText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Disconnect */}
          <TouchableOpacity
            style={cardStyles.disconnectBtn}
            onPress={() => onDisconnect(provider)}
            accessibilityRole="button"
            accessibilityLabel={`Disconnect ${providerLabel}`}
          >
            <Ionicons name="unlink-outline" size={15} color="#EF4444" />
            <Text style={cardStyles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[cardStyles.connectBtn, { borderColor: accentColor }]}
          onPress={() => onConnect(provider)}
          accessibilityRole="button"
          accessibilityLabel={`Connect ${providerLabel}`}
        >
          <Ionicons name="add-circle-outline" size={18} color={accentColor} />
          <Text style={[cardStyles.connectBtnText, { color: accentColor }]}>
            Connect {providerLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  connected: {
    color: '#10B981',
  },
  disconnected: {
    color: '#9CA3AF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  syncBtnText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 14,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF7F7',
  },
  disconnectText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  connectBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalendarSyncScreen() {
  const [records, setRecords] = useState<CalendarRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [modal, setModal] = useState<ConnectModalState>({
    visible: false,
    provider: null,
    calendarId: '',
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<CalendarRecord[]>('calendar-sync/status');
      setRecords(res.data ?? []);
    } catch {
      // Non-critical — fall through with empty list
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getRecord = (provider: Provider) => records.find((r) => r.provider === provider);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenConnect = (provider: Provider) => {
    setModal({ visible: true, provider, calendarId: '' });
  };

  const handleConnect = async () => {
    if (!modal.provider) return;
    const storeId = await storageService.getItem<string>('ACTIVE_STORE_ID');

    setIsConnecting(true);
    try {
      await apiClient.post('calendar-sync/connect', {
        provider: modal.provider,
        accessToken: 'simulated',
        ...(storeId ? { storeId } : {}),
        ...(modal.calendarId.trim() ? { calendarId: modal.calendarId.trim() } : {}),
      });
      setModal({ visible: false, provider: null, calendarId: '' });
      await loadStatus();
    } catch {
      Alert.alert('Error', 'Failed to connect calendar. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (provider: Provider) => {
    const label = provider === 'google' ? 'Google Calendar' : 'Apple Calendar';
    Alert.alert(
      'Disconnect Calendar',
      `Remove the ${label} connection? Appointments will no longer sync.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`calendar-sync/${provider}`);
              await loadStatus();
            } catch {
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (provider: Provider, value: boolean) => {
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) => (r.provider === provider ? { ...r, syncEnabled: value } : r))
    );
    try {
      await apiClient.patch(`calendar-sync/${provider}/toggle`, {});
    } catch {
      // Revert on failure
      setRecords((prev) =>
        prev.map((r) => (r.provider === provider ? { ...r, syncEnabled: !value } : r))
      );
      Alert.alert('Error', 'Failed to update sync setting.');
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await apiClient.post('calendar-sync/sync', {});
      await loadStatus();
    } catch {
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Calendar Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading calendar settings...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Subtitle */}
          <View style={styles.subtitleWrap}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.subtitleText}>
              Appointments are automatically synced when you connect a calendar
            </Text>
          </View>

          {/* Google Calendar card */}
          <CalendarCard
            provider="google"
            record={getRecord('google')}
            isSyncing={isSyncing}
            onConnect={handleOpenConnect}
            onDisconnect={handleDisconnect}
            onToggle={handleToggle}
            onSync={handleSync}
          />

          {/* Apple Calendar card */}
          <CalendarCard
            provider="apple"
            record={getRecord('apple')}
            isSyncing={isSyncing}
            onConnect={handleOpenConnect}
            onDisconnect={handleDisconnect}
            onToggle={handleToggle}
            onSync={handleSync}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Connect Modal */}
      <Modal
        visible={modal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setModal((m) => ({ ...m, visible: false }))}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Connect {modal.provider === 'google' ? 'Google' : 'Apple'} Calendar
              </Text>
              <TouchableOpacity
                onPress={() => setModal((m) => ({ ...m, visible: false }))}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Info note */}
            <View style={styles.modalNote}>
              <Ionicons name="information-circle" size={16} color="#3B82F6" />
              <Text style={styles.modalNoteText}>
                In production this opens an OAuth consent screen. For now the connection is
                simulated.
              </Text>
            </View>

            {/* Calendar ID input */}
            <Text style={styles.inputLabel}>Calendar ID (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. primary or your-email@gmail.com"
              placeholderTextColor="#9CA3AF"
              value={modal.calendarId}
              onChangeText={(v) => setModal((m) => ({ ...m, calendarId: v }))}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, isConnecting && styles.saveBtnDisabled]}
              onPress={handleConnect}
              disabled={isConnecting}
              accessibilityRole="button"
              accessibilityLabel="Save calendar connection"
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Connect Calendar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  subtitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  subtitleText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    lineHeight: 18,
  },
  // ── Modal styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  modalNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
