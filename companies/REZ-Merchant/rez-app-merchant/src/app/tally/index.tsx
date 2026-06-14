/**
 * Tally Screen
 * Tally sync status, manual export, sync history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getTallySyncConfig,
  updateTallySyncConfig,
  getSyncHistory,
  triggerSync,
  exportForTally,
  TallySyncConfig,
  TallySyncRecord,
  SyncEntity,
} from '@/services/b2bApi';
import { TallySyncStatus } from '@/components/b2b';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export default function TallyScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [config, setConfig] = useState<TallySyncConfig | null>(null);
  const [syncHistory, setSyncHistory] = useState<TallySyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingEntity, setSyncingEntity] = useState<SyncEntity | null>(null);
  const [currentSyncStatus, setCurrentSyncStatus] = useState<TallySyncRecord | null>(null);

  // Config modal
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configForm, setConfigForm] = useState({
    tallyUrl: '',
    tallyCompany: '',
    syncEnabled: true,
    autoSyncInterval: '30',
  });
  const [saving, setSaving] = useState(false);

  // Entities to sync
  const entities: { key: SyncEntity; label: string; description: string }[] = [
    { key: 'suppliers', label: 'Suppliers', description: 'Export supplier master data' },
    { key: 'orders', label: 'Purchase Orders', description: 'Export purchase orders' },
    { key: 'ledger', label: 'Ledger', description: 'Export ledger entries' },
    { key: 'inventory', label: 'Inventory', description: 'Export inventory items' },
  ];

  // Fetch config
  const fetchConfig = useCallback(async () => {
    if (!merchantId) return;

    try {
      const data = await getTallySyncConfig(merchantId);
      setConfig(data);
      setConfigForm({
        tallyUrl: data.tallyUrl || '',
        tallyCompany: data.tallyCompany || '',
        syncEnabled: data.syncEnabled,
        autoSyncInterval: (data.autoSyncInterval || 30).toString(),
      });
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  }, [merchantId]);

  // Fetch sync history
  const fetchSyncHistory = useCallback(async () => {
    if (!merchantId) return;

    try {
      const response = await getSyncHistory(merchantId);
      setSyncHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchConfig(), fetchSyncHistory()]);
      setLoading(false);
    };
    load();
  }, [fetchConfig, fetchSyncHistory]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchConfig(), fetchSyncHistory()]);
    setRefreshing(false);
  }, [fetchConfig, fetchSyncHistory]);

  // Trigger sync
  const handleSync = async (entity: SyncEntity) => {
    setSyncingEntity(entity);

    try {
      const result = await triggerSync(merchantId!, entity);
      setCurrentSyncStatus(result);
      fetchSyncHistory();
      Alert.alert('Sync Complete', `Successfully synced ${entities.find(e => e.key === entity)?.label}`);
    } catch (err) {
      Alert.alert('Sync Failed', err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setTimeout(() => {
        setSyncingEntity(null);
        setCurrentSyncStatus(null);
      }, 2000);
    }
  };

  // Export for Tally
  const handleExport = async (entity: SyncEntity, format: 'json' | 'csv') => {
    Alert.alert(
      'Export Data',
      `Export ${entities.find(e => e.key === entity)?.label} as ${format.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              const result = await exportForTally(merchantId!, entity, format);
              Alert.alert('Export Ready', `Download URL: ${result.downloadUrl}`);
            } catch (err) {
              Alert.alert('Export Failed', err instanceof Error ? err.message : 'Failed to export');
            }
          },
        },
      ]
    );
  };

  // Save config
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await updateTallySyncConfig(merchantId!, {
        tallyUrl: configForm.tallyUrl || undefined,
        tallyCompany: configForm.tallyCompany || undefined,
        syncEnabled: configForm.syncEnabled,
        autoSyncInterval: parseInt(configForm.autoSyncInterval, 10) || undefined,
      });
      setConfigModalVisible(false);
      fetchConfig();
      Alert.alert('Success', 'Configuration saved');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sync record item
  const renderSyncRecord = ({ item }: { item: TallySyncRecord }) => {
    const entityInfo = entities.find(e => e.key === item.entity);
    const statusColors = {
      pending: colors.warning[500],
      syncing: colors.primary[500],
      synced: colors.success[500],
      failed: colors.error[500],
    };

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyEntity}>{entityInfo?.label || item.entity}</Text>
          <View style={[styles.historyStatus, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.historyStatusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.historyDetails}>
          <Text style={styles.historyDate}>{formatDate(item.lastSyncAt || item.createdAt)}</Text>
          <Text style={styles.historyRecords}>
            {item.recordsProcessed} processed
            {item.recordsFailed > 0 && `, ${item.recordsFailed} failed`}
          </Text>
        </View>
        {item.errorMessage && (
          <Text style={styles.historyError}>{item.errorMessage}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading Tally sync..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tally Sync</Text>
        <TouchableOpacity
          style={styles.configButton}
          onPress={() => setConfigModalVisible(true)}
        >
          <Text style={styles.configButtonText}>Configure</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: config?.syncEnabled ? colors.success[500] : colors.gray[400] },
            ]}
          />
          <Text style={styles.statusText}>
            {config?.syncEnabled ? 'Connected to Tally' : 'Not Configured'}
          </Text>
        </View>
        {config?.tallyCompany && (
          <Text style={styles.companyName}>{config.tallyCompany}</Text>
        )}
      </View>

      {/* Sync Entities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Entities</Text>
        <View style={styles.entitiesGrid}>
          {entities.map((entity) => {
            const isSyncing = syncingEntity === entity.key;
            const syncRecord = currentSyncStatus?.entity === entity.key ? currentSyncStatus : null;

            return (
              <View key={entity.key} style={styles.entityCard}>
                <TallySyncStatus
                  entity={entity.key}
                  syncRecord={syncRecord}
                  lastSyncAt={config?.lastSyncAt}
                  onSync={() => handleSync(entity.key)}
                  isSyncing={isSyncing}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Sync History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync History</Text>
        <FlatList
          data={syncHistory.slice(0, 10)}
          renderItem={renderSyncRecord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primaryMain]}
              tintColor={colors.primaryMain}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No sync history"
              message="Your sync history will appear here"
            />
          }
        />
      </View>

      {/* Config Modal */}
      <Modal
        visible={configModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tally Configuration</Text>
            <TouchableOpacity onPress={handleSaveConfig} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tally URL</Text>
              <TextInput
                style={styles.formInput}
                value={configForm.tallyUrl}
                onChangeText={(text) => setConfigForm({ ...configForm, tallyUrl: text })}
                placeholder="e.g., http://localhost:9000"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Company Name</Text>
              <TextInput
                style={styles.formInput}
                value={configForm.tallyCompany}
                onChangeText={(text) => setConfigForm({ ...configForm, tallyCompany: text })}
                placeholder="Your Tally company name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Auto Sync Interval (minutes)</Text>
              <TextInput
                style={styles.formInput}
                value={configForm.autoSyncInterval}
                onChangeText={(text) => setConfigForm({ ...configForm, autoSyncInterval: text })}
                placeholder="30"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setConfigForm({ ...configForm, syncEnabled: !configForm.syncEnabled })}
              >
                <Text style={styles.formLabel}>Enable Auto Sync</Text>
                <View style={[styles.toggle, configForm.syncEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, configForm.syncEnabled && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  configButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  configButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  } as TextStyle,
  connectionStatus: {
    backgroundColor: colors.surface.primary,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  } as ViewStyle,
  statusText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
    marginLeft: 18,
  } as TextStyle,
  section: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    marginBottom: spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  entitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.md,
  } as ViewStyle,
  entityCard: {
    width: '47%',
  } as ViewStyle,
  historyList: {
    padding: spacing.base,
  } as ViewStyle,
  historyItem: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
  } as ViewStyle,
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  } as ViewStyle,
  historyEntity: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  historyStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  } as ViewStyle,
  historyStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  } as TextStyle,
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  historyDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  historyRecords: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  } as TextStyle,
  historyError: {
    fontSize: typography.fontSize.xs,
    color: colors.error[600],
    marginTop: spacing.xs,
  } as TextStyle,
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  } as TextStyle,
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  modalSave: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  modalSaveDisabled: {
    color: colors.text.tertiary,
  } as TextStyle,
  modalContent: {
    flex: 1,
    padding: spacing.base,
  } as ViewStyle,
  formGroup: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  } as TextStyle,
  formInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  } as TextStyle,
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[300],
    padding: 2,
  } as ViewStyle,
  toggleActive: {
    backgroundColor: colors.success[500],
  } as ViewStyle,
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface.primary,
  } as ViewStyle,
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  } as ViewStyle,
});
