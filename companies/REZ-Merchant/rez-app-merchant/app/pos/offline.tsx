/**
 * Offline POS Screen — Queue bills locally when offline, sync when back online.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';

import { Colors, Shadows } from '@/constants/DesignTokens';
import { posService } from '@/services/api/pos';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { syncOfflineQueue } from '@/services/offlinePOSQueue';
import { offlineService, DeadLetterAction } from '@/services/offline';
import { logger } from '@/utils/logger';

// ─── Number Pad ───────────────────────────────────────────────────────────────

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

const NumberPad = ({ onKey }: { onKey: (k: string) => void }) => (
  <View style={padStyles.grid}>
    {PAD_KEYS.map((key) => (
      <TouchableOpacity
        key={key}
        style={[padStyles.key, key === '⌫' && padStyles.backKey]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onKey(key);
        }}
        activeOpacity={0.7}
      >
        {key === '⌫' ? (
          <Ionicons name="backspace-outline" size={22} color={Colors.error[600]} />
        ) : (
          <Text style={padStyles.keyText}>{key}</Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

const padStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border.light,
    backgroundColor: 'white',
  },
  backKey: { backgroundColor: Colors.error[50] },
  keyText: { fontSize: 22, fontWeight: '500', color: Colors.text.primary },
});

// ─── Queued Bill Card ──────────────────────────────────────────────────────────

interface QueuedBill {
  amount: number;
  description?: string;
  timestamp: string;
}

const QueuedBillCard = ({ bill, index }: { bill: QueuedBill; index: number }) => (
  <Animated.View entering={FadeInDown.delay(index * 60)} style={queuedStyles.card}>
    <View style={queuedStyles.left}>
      <Ionicons name="time-outline" size={18} color={Colors.warning[500]} />
      <View>
        <Text style={queuedStyles.amount}>
          ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
        {bill.description && <Text style={queuedStyles.desc}>{bill.description}</Text>}
      </View>
    </View>
    <Text style={queuedStyles.time}>
      {new Date(bill.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </Animated.View>
);

const queuedStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning[400],
    ...Shadows.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amount: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  desc: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  time: { fontSize: 12, color: Colors.text.tertiary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OfflinePOSScreen() {
  const { merchant } = useAuth();
  const { activeStore } = useStore();
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [queue, setQueue] = useState<QueuedBill[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deadLetters, setDeadLetters] = useState<DeadLetterAction[]>([]);
  const [showDeadLetters, setShowDeadLetters] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);

  const amount = parseFloat(amountStr) || 0;

  // ─── Network Listener ────────────────────────────────────────────────────

  useEffect(() => {
    let wasOnline: boolean | null = null;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const nowOnline = state.isConnected === true;
      setIsOnline(nowOnline);

      // Auto-sync when transitioning from offline → online
      if (nowOnline && wasOnline === false) {
        syncOfflineQueue(apiClient, activeStore?._id || '')
          .then(({ synced }) => {
            if (synced > 0) {
              if (__DEV__) logger.log(`[OfflineSync] ${synced} transactions synced`);
              setQueue(posService.getOfflineQueue());
            }
          })
          .catch((e) => console.warn('[POS] Offline order queue failed:', e));
      }
      // Refresh dead letter count
      offlineService
        .getDeadLetterActions()
        .then(setDeadLetters)
        .catch((e) => console.warn('[POS] Offline sync save failed:', e));
      wasOnline = nowOnline;
    });
    return unsubscribe;
  }, [activeStore]);

  // ─── Load Queue ──────────────────────────────────────────────────────────

  useEffect(() => {
    setQueue(posService.getOfflineQueue());
  }, []);

  // ─── Key Press ────────────────────────────────────────────────────────────

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.' && amountStr.includes('.')) return;
    const parts = amountStr.split('.');
    if (parts[1]?.length >= 2) return;
    if (amountStr === '' && key === '.') {
      setAmountStr('0.');
      return;
    }
    setAmountStr((prev) => prev + key);
  };

  // ─── Queue Bill ───────────────────────────────────────────────────────────

  const handleQueue = () => {
    if (amount <= 0) {
      platformAlertSimple('Invalid Amount', 'Please enter an amount.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    posService.addToOfflineQueue(amount, description.trim() || undefined);
    const newQueue = posService.getOfflineQueue();
    setQueue(newQueue);
    setAmountStr('');
    setDescription('');
    platformAlertSimple(
      'Saved Offline',
      `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} queued. Will sync when online.`
    );
  };

  // ─── Sync with Retry ──────────────────────────────────────────────────────

  const handleSync = async () => {
    if (!isOnline) {
      platformAlertSimple(
        'No Internet',
        'Cannot sync while offline. Please connect to the internet first.'
      );
      return;
    }
    setSyncing(true);
    const maxRetries = 3;
    let retryCount = 0;

    const attemptSync = async (): Promise<boolean> => {
      try {
        const { synced, conflicts } = await posService.syncOfflineQueue(activeStore?._id);
        const remaining = posService.getOfflineQueue();
        setQueue(remaining);
        const dead = await offlineService.getDeadLetterActions();
        setDeadLetters(dead);
        const conflictMsg =
          conflicts > 0
            ? `\n${conflicts} duplicate bill(s) detected — already processed on another device.`
            : '';
        const failedMsg =
          dead.length > 0 ? `\n${dead.length} failed action(s) moved to dead letter queue.` : '';
        platformAlertSimple(
          'Sync Complete',
          `${synced} bill(s) synced successfully.${conflictMsg}${failedMsg}${remaining.length > 0 ? `\n${remaining.length} pending retry.` : ''}`
        );
        if (conflicts > 0) setConflictCount((c) => c + conflicts);
        return true;
      } catch (e) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Exponential backoff: 500ms * 2^retryCount
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
          return attemptSync();
        } else {
          platformAlertSimple(
            'Sync Failed',
            `Could not sync after ${maxRetries} attempts. Queued bills will retry automatically when connection improves.`
          );
          return false;
        }
      }
    };

    try {
      await attemptSync();
    } finally {
      setSyncing(false);
    }
  };

  const displayAmount = amountStr
    ? `₹${parseFloat(amountStr || '0').toLocaleString('en-IN', {
        minimumFractionDigits: amountStr.includes('.')
          ? Math.min(amountStr.split('.')[1]?.length || 0, 2)
          : 0,
        maximumFractionDigits: 2,
      })}`
    : '₹0';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Offline Banner */}
      <Animated.View
        entering={FadeInDown.delay(50)}
        style={[styles.statusBanner, isOnline ? styles.onlineBanner : styles.offlineBanner]}
      >
        <Ionicons
          name={isOnline ? 'wifi' : 'cloud-offline-outline'}
          size={18}
          color={isOnline ? Colors.success[700] : Colors.error[700]}
        />
        <Text
          style={[styles.statusText, { color: isOnline ? Colors.success[700] : Colors.error[700] }]}
        >
          {isOnline ? 'Connected — bills saved immediately' : 'Offline — bills will queue locally'}
        </Text>
      </Animated.View>

      {/* Amount Display */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amountDisplay}>{displayAmount}</Text>
      </Animated.View>

      {/* Description field */}
      <Animated.View entering={FadeInDown.delay(120)} style={styles.descContainer}>
        <TextInputSimple
          value={description}
          onChange={setDescription}
          placeholder="Description (optional)"
        />
      </Animated.View>

      {/* Number Pad */}
      <View style={styles.padWrapper}>
        <NumberPad onKey={handleKey} />
      </View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.actions}>
        {isOnline ? (
          <TouchableOpacity
            style={[styles.primaryButton, amount <= 0 && styles.buttonDisabled]}
            onPress={() => {
              if (amount <= 0) return;
              // Online: hand off the amount (and description) the user
              // just keyed in here so quick-bill doesn't force them to
              // retype. Previously this pushed a bare route and the
              // amount was silently dropped.
              router.push({
                pathname: '/pos/quick-bill',
                params: {
                  amount: amountStr,
                  description: description.trim() || undefined,
                },
              });
            }}
            disabled={amount <= 0}
          >
            <Ionicons name="qr-code-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Generate QR Bill</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.offlineActionButton,
              amount <= 0 && styles.buttonDisabled,
            ]}
            onPress={handleQueue}
            disabled={amount <= 0}
          >
            <Ionicons name="save-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Save Offline — {displayAmount}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Offline Queue */}
      {queue.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300)} style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <View style={styles.queueHeaderLeft}>
              <Ionicons name="time-outline" size={18} color={Colors.warning[600]} />
              <Text style={styles.queueTitle}>{queue.length} Bills Queued</Text>
            </View>
            <TouchableOpacity
              style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
              onPress={handleSync}
              disabled={syncing || !isOnline}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={16} color="white" />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.queueTotal}>
            <Text style={styles.queueTotalLabel}>Total Queued</Text>
            <Text style={styles.queueTotalValue}>
              ₹
              {queue
                .reduce((s, b) => s + b.amount, 0)
                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {queue.map((bill, i) => (
            <QueuedBillCard key={`${bill.timestamp}-${i}`} bill={bill} index={i} />
          ))}
        </Animated.View>
      )}

      {/* Conflict Badge — MED-02 */}
      {conflictCount > 0 && (
        <Animated.View entering={FadeInDown.delay(350)} style={styles.conflictBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.warning[700]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.conflictTitle}>Duplicate Bills Detected</Text>
            <Text style={styles.conflictSub}>
              {conflictCount} bill(s) already processed on another device and were skipped. This is
              normal when multiple devices sync the same bill.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setConflictCount(0)}>
            <Ionicons name="close-circle" size={20} color={Colors.warning[600]} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Dead Letter Queue Panel — MED-01 */}
      {deadLetters.length > 0 && (
        <Animated.View entering={FadeInDown.delay(400)} style={styles.deadLetterSection}>
          <TouchableOpacity
            style={styles.deadLetterHeader}
            onPress={() => setShowDeadLetters((v) => !v)}
          >
            <View style={styles.queueHeaderLeft}>
              <Ionicons name="warning-outline" size={18} color={Colors.error[600]} />
              <Text style={styles.deadLetterTitle}>
                {deadLetters.length} Failed Action{deadLetters.length > 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons
              name={showDeadLetters ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.error[600]}
            />
          </TouchableOpacity>

          {showDeadLetters && (
            <>
              <View style={styles.deadLetterActions}>
                <TouchableOpacity
                  style={styles.retryAllButton}
                  onPress={async () => {
                    const { retried, failed } = await offlineService.retryAllDeadLetters();
                    const updated = await offlineService.getDeadLetterActions();
                    setDeadLetters(updated);
                    platformAlertSimple(
                      'Retry Complete',
                      `${retried} action(s) re-queued. ${failed} failed.`
                    );
                  }}
                >
                  <Ionicons name="refresh-outline" size={14} color="white" />
                  <Text style={styles.retryAllText}>Retry All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={async () => {
                    await offlineService.clearDeadLetter();
                    setDeadLetters([]);
                    platformAlertSimple('Cleared', 'All failed actions discarded.');
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.error[600]} />
                  <Text style={styles.clearText}>Discard All</Text>
                </TouchableOpacity>
              </View>

              {deadLetters.map((item) => (
                <View key={item.id} style={styles.deadLetterItem}>
                  <View style={styles.deadLetterItemLeft}>
                    <Text style={styles.deadLetterType}>{item.type}</Text>
                    <Text style={styles.deadLetterError} numberOfLines={1}>
                      {item.lastError || 'Unknown error'}
                    </Text>
                    <Text style={styles.deadLetterMeta}>
                      {new Date(item.failedAt).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.retrySingleButton}
                    onPress={async () => {
                      const ok = await offlineService.retryDeadLetter(item.id);
                      if (ok.success) {
                        const updated = await offlineService.getDeadLetterActions();
                        setDeadLetters(updated);
                      } else {
                        platformAlertSimple('Retry Failed', 'Could not re-queue this action.');
                      }
                    }}
                  >
                    <Ionicons name="refresh" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ─── Simple TextInput Wrapper ─────────────────────────────────────────────────

const TextInputSimple = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <TextInput
    style={inputStyles.input}
    value={value}
    onChangeText={onChange}
    placeholder={placeholder}
    placeholderTextColor={Colors.text.tertiary}
  />
);

const inputStyles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: 'white',
    marginHorizontal: 16,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  onlineBanner: {
    backgroundColor: Colors.success[50],
    borderWidth: 1,
    borderColor: Colors.success[200],
  },
  offlineBanner: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  amountContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountDisplay: {
    fontSize: 44,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: -1,
  },
  descContainer: {
    marginBottom: 8,
  },
  padWrapper: {
    backgroundColor: 'white',
    ...Shadows.sm,
  },
  actions: {
    padding: 16,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    ...Shadows.md,
  },
  offlineActionButton: {
    backgroundColor: Colors.warning[600],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  queueSection: {
    paddingHorizontal: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success[500],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  syncButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  queueTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.warning[200],
  },
  queueTotalLabel: {
    fontSize: 14,
    color: Colors.warning[700],
    fontWeight: '600',
  },
  queueTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.warning[700],
  },
  // MED-02: Conflict banner
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[200],
  },
  conflictTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning[800],
    marginBottom: 2,
  },
  conflictSub: {
    fontSize: 12,
    color: Colors.warning[700],
    lineHeight: 16,
  },
  // MED-01: Dead letter queue panel
  deadLetterSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.error[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error[200],
    overflow: 'hidden',
  },
  deadLetterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deadLetterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error[700],
  },
  deadLetterActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  retryAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warning[600],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  retryAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error[300],
  },
  clearText: {
    color: Colors.error[600],
    fontSize: 12,
    fontWeight: '600',
  },
  deadLetterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.error[100],
    gap: 10,
  },
  deadLetterItemLeft: { flex: 1 },
  deadLetterType: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error[800],
    textTransform: 'uppercase',
  },
  deadLetterError: {
    fontSize: 11,
    color: Colors.error[600],
    marginTop: 2,
  },
  deadLetterMeta: {
    fontSize: 10,
    color: Colors.error[400],
    marginTop: 2,
  },
  retrySingleButton: {
    backgroundColor: Colors.warning[500],
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
