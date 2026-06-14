/**
 * TallySyncStatus Component
 * Displays sync progress indicator for Tally integration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { TallySyncRecord, SyncStatus, SyncEntity } from '@/services/b2bApi';

interface TallySyncStatusProps {
  syncRecord?: TallySyncRecord;
  entity: SyncEntity;
  lastSyncAt?: string;
  onSync?: () => void;
  isSyncing?: boolean;
  style?: ViewStyle;
}

const ENTITY_LABELS: Record<SyncEntity, string> = {
  suppliers: 'Suppliers',
  orders: 'Orders',
  ledger: 'Ledger',
  inventory: 'Inventory',
};

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string }> = {
  pending: { color: colors.warning[500], label: 'Pending' },
  syncing: { color: colors.primary[500], label: 'Syncing...' },
  synced: { color: colors.success[500], label: 'Synced' },
  failed: { color: colors.error[500], label: 'Failed' },
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Never synced';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
};

export function TallySyncStatus({
  syncRecord,
  entity,
  lastSyncAt,
  onSync,
  isSyncing = false,
  style,
}: TallySyncStatusProps): React.JSX.Element {
  const status = syncRecord?.status || (isSyncing ? 'syncing' : 'pending');
  const statusConfig = STATUS_CONFIG[status];
  const effectiveLastSync = syncRecord?.lastSyncAt || lastSyncAt;
  const recordsProcessed = syncRecord?.recordsProcessed || 0;
  const recordsFailed = syncRecord?.recordsFailed || 0;

  const getSyncProgress = (): number => {
    if (!syncRecord || syncRecord.recordsProcessed === 0) return 0;
    const total = syncRecord.recordsProcessed + syncRecord.recordsFailed;
    return Math.round((syncRecord.recordsProcessed / total) * 100);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.entityName}>{ENTITY_LABELS[entity]}</Text>
          <Text style={styles.lastSync}>
            {formatRelativeTime(effectiveLastSync)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {isSyncing || status === 'syncing' ? (
            <ActivityIndicator size="small" color={statusConfig.color} />
          ) : (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusConfig.color },
              ]}
            />
          )}
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {(isSyncing || status === 'syncing') && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getSyncProgress()}%`,
                  backgroundColor: statusConfig.color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Processing {recordsProcessed} records...
          </Text>
        </View>
      )}

      {status === 'synced' && recordsProcessed > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{recordsProcessed}</Text>
            <Text style={styles.statLabel}>Synced</Text>
          </View>
          {recordsFailed > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.failedValue]}>
                {recordsFailed}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          )}
        </View>
      )}

      {status === 'failed' && syncRecord?.errorMessage && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText} numberOfLines={2}>
            {syncRecord.errorMessage}
          </Text>
        </View>
      )}

      {onSync && (
        <TouchableOpacity
          style={[
            styles.syncButton,
            (isSyncing || status === 'syncing') && styles.syncButtonDisabled,
          ]}
          onPress={onSync}
          disabled={isSyncing || status === 'syncing'}
          accessibilityRole="button"
          accessibilityLabel={`Sync ${ENTITY_LABELS[entity]}`}
        >
          <Text
            style={[
              styles.syncButtonText,
              (isSyncing || status === 'syncing') && styles.syncButtonTextDisabled,
            ]}
          >
            {isSyncing || status === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last sync: {formatDate(effectiveLastSync)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  entityName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  lastSync: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  } as TextStyle,
  progressSection: {
    marginTop: spacing.md,
  } as ViewStyle,
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  } as ViewStyle,
  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  } as TextStyle,
  statsSection: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[600],
  } as TextStyle,
  failedValue: {
    color: colors.error[600],
  } as TextStyle,
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  } as TextStyle,
  errorSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
  } as ViewStyle,
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
  } as TextStyle,
  syncButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  } as ViewStyle,
  syncButtonDisabled: {
    backgroundColor: colors.gray[200],
  } as ViewStyle,
  syncButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  syncButtonTextDisabled: {
    color: colors.text.tertiary,
  } as TextStyle,
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
});

export default TallySyncStatus;
