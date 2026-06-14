/**
 * DLQ (Dead Letter Queue) Debug Screen
 * Shows failed offline actions that exceeded retry limits.
 * DEV ONLY — hidden in production builds.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { offlineService, DeadLetterAction } from '@/services/offline';
import { logger } from '@/utils/logger';

const ACTION_TYPE_LABELS: Record<string, string> = {
  CREATE_PRODUCT: 'Create Product',
  UPDATE_PRODUCT: 'Update Product',
  DELETE_PRODUCT: 'Delete Product',
  UPDATE_ORDER: 'Update Order',
  APPROVE_CASHBACK: 'Approve Cashback',
  REJECT_CASHBACK: 'Reject Cashback',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString();
}

function formatRetryCount(retryCount: number, maxRetries: number): string {
  return `${retryCount}/${maxRetries}`;
}

export default function DLQDebugScreen() {
  const [items, setItems] = useState<DeadLetterAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadDeadLetters = useCallback(async () => {
    setLoading(true);
    try {
      const deadLetters = await offlineService.getDeadLetterActions();
      setItems(deadLetters);
    } catch (err) {
      logger.error('[DLQ Debug] Failed to load dead letters', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeadLetters();
  }, [loadDeadLetters]);

  const handleRetryAll = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Retry All',
      `Re-queue all ${items.length} failed action(s) for retry on next sync?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry All',
          onPress: async () => {
            setActionInProgress(true);
            try {
              const result = await offlineService.retryAllDeadLetters();
              logger.info(
                `[DLQ Debug] Retry all: ${result.retried} retried, ${result.failed} failed`
              );
              await loadDeadLetters();
              Alert.alert('Done', `${result.retried} action(s) re-queued. ${result.failed} failed.`);
            } catch (err) {
              logger.error('[DLQ Debug] Retry all failed', err);
              Alert.alert('Error', 'Failed to retry actions. Check logs.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Clear All',
      `Permanently delete all ${items.length} failed action(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(true);
            try {
              await offlineService.clearDeadLetter();
              setItems([]);
              logger.info('[DLQ Debug] Dead letter queue cleared');
            } catch (err) {
              logger.error('[DLQ Debug] Clear failed', err);
              Alert.alert('Error', 'Failed to clear queue. Check logs.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ]
    );
  };

  const handleRetryItem = async (id: string) => {
    setActionInProgress(true);
    try {
      const result = await offlineService.retryDeadLetter(id);
      if (result.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        Alert.alert('Failed', 'Could not re-queue this action.');
      }
    } catch (err) {
      logger.error('[DLQ Debug] Retry item failed', err);
      Alert.alert('Error', 'Failed to retry action.');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Dead Letter Queue</ThemedText>
          <Text style={styles.headerSubtitle}>
            Failed offline actions that exceeded retry limits
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{items.length}</Text>
              <Text style={styles.summaryLabel}>Failed Actions</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButton, items.length === 0 && styles.disabledButton]}
            onPress={handleRetryAll}
            disabled={actionInProgress || items.length === 0}
          >
            {actionInProgress ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={18} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>Retry All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton, items.length === 0 && styles.disabledButton]}
            onPress={handleClearAll}
            disabled={actionInProgress || items.length === 0}
          >
            {actionInProgress ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Item List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.light.success} />
            <Text style={styles.emptyText}>No failed actions in the queue</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTypeTag}>
                    <Text style={styles.itemTypeText}>
                      {ACTION_TYPE_LABELS[item.type] ?? item.type}
                    </Text>
                  </View>
                  <Text style={styles.itemEndpoint}>
                    {item.method} {item.endpoint}
                  </Text>
                </View>

                <View style={styles.itemBody}>
                  <View style={styles.itemMeta}>
                    <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
                    <Text style={styles.itemMetaText}>Failed {formatTimestamp(item.failedAt)}</Text>
                  </View>
                  <View style={styles.itemMeta}>
                    <Ionicons name="repeat-outline" size={14} color={Colors.light.textSecondary} />
                    <Text style={styles.itemMetaText}>
                      Retries {formatRetryCount(item.retryCount, item.maxRetries)}
                    </Text>
                  </View>
                  {item.lastError && (
                    <View style={styles.itemErrorRow}>
                      <Ionicons name="warning-outline" size={14} color={Colors.light.error} />
                      <Text style={styles.itemErrorText}>{item.lastError}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.itemRetryButton}
                    onPress={() => handleRetryItem(item.id)}
                    disabled={actionInProgress}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.light.tint} />
                    <Text style={styles.itemRetryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  headerSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  summaryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { fontSize: 32, fontWeight: '700', color: Colors.light.tint },
  summaryLabel: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: { backgroundColor: Colors.light.tint },
  clearButton: { backgroundColor: Colors.light.error },
  disabledButton: { opacity: 0.5 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
  list: { gap: 12 },
  itemCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemTypeTag: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemTypeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  itemEndpoint: { fontSize: 12, color: Colors.light.textSecondary, flexShrink: 1 },
  itemBody: { gap: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemMetaText: { fontSize: 12, color: Colors.light.textSecondary },
  itemErrorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  itemErrorText: { fontSize: 12, color: Colors.light.error, flex: 1 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  itemRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  itemRetryText: { color: Colors.light.tint, fontSize: 12, marginLeft: 4, fontWeight: '600' },
});
