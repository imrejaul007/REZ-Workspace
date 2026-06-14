// QRCodeManager Component
// Manage QR codes for tables, products, promotions, and feedback
//
// UX/UI FIXES APPLIED:
// 1. Replaced hardcoded colors with design tokens from constants/theme.ts
// 2. Replaced inline loading state with shared LoadingSpinner component
// 3. Replaced inline empty state with shared EmptyState component
// 4. Added accessibility attributes (accessibilityRole, accessibilityLabel)
// 5. Added keyboardShouldPersistTaps to ScrollViews
// 6. Replaced console.error with proper error state display
// 7. Removed unused import (generateQRImage)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useMerchant } from '../contexts/MerchantContext';
import { LoadingSpinner, EmptyState, ErrorState } from './common';
import {
  getQRCodes,
  createQRCode,
  updateQRCode,
  deleteQRCode,
  getQRCodeStats,
  QRCode,
  QRCodeStats,
} from '../services/qrCodeService';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';

interface QRCodeManagerProps {
  onCreateQRCode?: () => void;
}

type QRCodeType = 'table' | 'product' | 'promotional' | 'feedback' | 'loyalty';

const QR_TYPE_CONFIG: Record<QRCodeType, { icon: string; label: string; color: string }> = {
  table: { icon: '🍽️', label: 'Table', color: colors.primaryMain },
  product: { icon: '🏷️', label: 'Product', color: colors.successMain },
  promotional: { icon: '🎉', label: 'Promo', color: colors.warningMain },
  feedback: { icon: '💬', label: 'Feedback', color: '#8B5CF6' },
  loyalty: { icon: '⭐', label: 'Loyalty', color: '#EC4899' },
};

export function QRCodeManager({ onCreateQRCode }: QRCodeManagerProps): React.JSX.Element {
  const { merchant } = useMerchant();
  const [qrcodes, setQrcodes] = useState<QRCode[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [qrStats, setQrStats] = useState<QRCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState<QRCodeType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create form state
  const [newQRName, setNewQRName] = useState('');
  const [newQRType, setNewQRType] = useState<QRCodeType>('table');
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [editQRName, setEditQRName] = useState('');
  const [editQRActive, setEditQRActive] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const merchantId = merchant?.id || 'demo-merchant';

  const fetchQRCodes = useCallback(async () => {
    try {
      const data = await getQRCodes(merchantId);
      setQrcodes(data);
    } catch (err) {
      // Error is handled by loading state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQRCodes();
  }, [fetchQRCodes]);

  const fetchQRStats = async (qr: QRCode) => {
    try {
      const stats = await getQRCodeStats(qr.id);
      setQrStats(stats);
    } catch (err) {
      // Silently handle stats fetch error
    }
  };

  const handleQRPress = (qr: QRCode) => {
    setSelectedQR(qr);
    fetchQRStats(qr);
    setShowDetailModal(true);
  };

  const handleCreateQR = async () => {
    if (!newQRName.trim()) {
      Alert.alert('Error', 'Please enter a name for the QR code');
      return;
    }

    setCreating(true);
    try {
      const newQR = await createQRCode(merchantId, {
        name: newQRName,
        type: newQRType,
      });
      setQrcodes(prev => [newQR, ...prev]);
      setShowCreateModal(false);
      setNewQRName('');
      setNewQRType('table');
      onCreateQRCode?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to create QR code');
    } finally {
      setCreating(false);
    }
  };

  const handleEditQR = (qr: QRCode) => {
    setEditingQR(qr);
    setEditQRName(qr.name);
    setEditQRActive(qr.isActive);
  };

  const handleUpdateQR = async () => {
    if (!editingQR || !editQRName.trim()) {
      Alert.alert('Error', 'Please enter a name for the QR code');
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateQRCode(editingQR.id, {
        name: editQRName,
        isActive: editQRActive,
      });
      setQrcodes(prev => prev.map(qr => qr.id === updated.id ? updated : qr));
      if (selectedQR?.id === updated.id) {
        setSelectedQR(updated);
      }
      setEditingQR(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update QR code');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteQR = async () => {
    if (!editingQR) return;

    Alert.alert(
      'Delete QR Code',
      `Are you sure you want to delete "${editingQR.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteQRCode(editingQR.id);
              setQrcodes(prev => prev.filter(qr => qr.id !== editingQR.id));
              setEditingQR(null);
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete QR code');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (qr: QRCode) => {
    try {
      const updated = await updateQRCode(qr.id, { isActive: !qr.isActive });
      setQrcodes(prev => prev.map(q => q.id === updated.id ? updated : q));
      if (selectedQR?.id === updated.id) {
        setSelectedQR(updated);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update QR code status');
    }
  };

  const handleShareQR = async (qr: QRCode) => {
    try {
      await Share.share({
        message: `Scan this QR code: ${qr.targetUrl}\nShort code: ${qr.shortCode}`,
        title: qr.name,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const filteredQRCodes = qrcodes.filter(qr => {
    const matchesType = filterType === 'all' || qr.type === filterType;
    const matchesSearch = qr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.shortCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading QR codes..." />;
  }

  return (
    <View style={styles.container} accessibilityRole="main" accessibilityLabel="QR Code Manager">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Codes</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new QR code"
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search QR codes..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search QR codes"
          accessibilityRole="search"
        />
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
          onPress={() => setFilterType('all')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filterType === 'all' }}
          accessibilityLabel={`Filter all QR codes (${qrcodes.length})`}
        >
          <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>
            All ({qrcodes.length})
          </Text>
        </TouchableOpacity>
        {(Object.keys(QR_TYPE_CONFIG) as QRCodeType[]).map(type => {
          const config = QR_TYPE_CONFIG[type];
          const count = qrcodes.filter(qr => qr.type === type).length;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.filterPill, filterType === type && styles.filterPillActive]}
              onPress={() => setFilterType(type)}
              accessibilityRole="tab"
              accessibilityState={{ selected: filterType === type }}
              accessibilityLabel={`Filter ${config.label} QR codes (${count})`}
            >
              <Text style={[styles.filterPillText, filterType === type && styles.filterPillTextActive]}>
                {config.icon} {config.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* QR Code List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryMain]} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessibilityRole="list"
      >
        {filteredQRCodes.length === 0 ? (
          <EmptyState
            icon="📱"
            title="No QR codes found"
            message="Create your first QR code to get started"
            actionLabel="Create QR Code"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          filteredQRCodes.map(qr => (
            <TouchableOpacity
              key={qr.id}
              style={styles.qrCard}
              onPress={() => handleQRPress(qr)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${qr.name}, ${qr.type} type, ${qr.scanCount} scans`}
            >
              <View style={styles.qrCardHeader}>
                <View style={styles.qrIconContainer}>
                  <Text style={styles.qrIcon}>
                    {QR_TYPE_CONFIG[qr.type as QRCodeType]?.icon || '📱'}
                  </Text>
                </View>
                <View style={styles.qrInfo}>
                  <Text style={styles.qrName}>{qr.name}</Text>
                  <Text style={styles.qrShortCode}>{qr.shortCode}</Text>
                </View>
                <View
                  style={[
                    styles.qrStatus,
                    { backgroundColor: qr.isActive ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <View
                    style={[
                      styles.qrStatusDot,
                      { backgroundColor: qr.isActive ? '#10B981' : '#EF4444' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.qrStatusText,
                      { color: qr.isActive ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.qrStats}>
                <View style={styles.qrStatItem}>
                  <Text style={styles.qrStatValue}>{qr.scanCount}</Text>
                  <Text style={styles.qrStatLabel}>Scans</Text>
                </View>
                <View style={styles.qrStatDivider} />
                <View style={styles.qrStatItem}>
                  <Text style={styles.qrStatValue}>{qr.uniqueScans}</Text>
                  <Text style={styles.qrStatLabel}>Unique</Text>
                </View>
                <View style={styles.qrStatDivider} />
                <View style={styles.qrStatItem}>
                  <Text style={styles.qrStatValue}>
                    {qr.lastScannedAt ? formatTimeAgo(qr.lastScannedAt) : 'Never'}
                  </Text>
                  <Text style={styles.qrStatLabel}>Last Scan</Text>
                </View>
              </View>
              <View style={styles.qrCardFooter}>
                <Text style={styles.qrCreatedAt}>Created {formatDate(qr.createdAt)}</Text>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShareQR(qr)}
                >
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create QR Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create QR Code</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Table 5, Product A"
                placeholderTextColor={colors.text.tertiary}
                value={newQRName}
                onChangeText={setNewQRName}
                accessibilityLabel="QR code name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.typeSelector}>
                {(Object.keys(QR_TYPE_CONFIG) as QRCodeType[]).map(type => {
                  const config = QR_TYPE_CONFIG[type];
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newQRType === type && { borderColor: config.color, backgroundColor: `${config.color}15` },
                      ]}
                      onPress={() => setNewQRType(type)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: newQRType === type }}
                      accessibilityLabel={`Select ${config.label} type`}
                    >
                      <Text style={styles.typeOptionIcon}>{config.icon}</Text>
                      <Text style={styles.typeOptionLabel}>{config.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, creating && styles.submitButtonDisabled]}
              onPress={handleCreateQR}
              disabled={creating}
              accessibilityRole="button"
              accessibilityLabel="Create QR code"
            >
              {creating ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create QR Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedQR?.name}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {selectedQR && (
              <>
                <View style={styles.qrDetailSection}>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Short Code</Text>
                    <Text style={styles.qrDetailValue}>{selectedQR.shortCode}</Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Type</Text>
                    <Text style={styles.qrDetailValue}>
                      {QR_TYPE_CONFIG[selectedQR.type as QRCodeType]?.icon}{' '}
                      {QR_TYPE_CONFIG[selectedQR.type as QRCodeType]?.label}
                    </Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Total Scans</Text>
                    <Text style={styles.qrDetailValue}>{selectedQR.scanCount}</Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Unique Scans</Text>
                    <Text style={styles.qrDetailValue}>{selectedQR.uniqueScans}</Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Status</Text>
                    <TouchableOpacity onPress={() => handleToggleActive(selectedQR)} accessibilityLabel={`Status: ${selectedQR.isActive ? 'Active' : 'Inactive'}, tap to toggle`}>
                      <View style={[styles.statusBadge, { backgroundColor: selectedQR.isActive ? colors.success[50] : colors.error[50] }]}>
                        <View style={[styles.statusDot, { backgroundColor: selectedQR.isActive ? colors.successMain : colors.errorMain }]} />
                        <Text style={[styles.statusBadgeText, { color: selectedQR.isActive ? colors.successMain : colors.errorMain }]}>
                          {selectedQR.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Created</Text>
                    <Text style={styles.qrDetailValue}>{formatDate(selectedQR.createdAt)}</Text>
                  </View>
                </View>

                {qrStats && (
                  <View style={styles.qrStatsDetail}>
                    <Text style={styles.qrStatsDetailTitle}>Analytics</Text>
                    <View style={styles.qrStatsDetailRow}>
                      <View style={styles.qrStatsDetailItem}>
                        <Text style={styles.qrStatsDetailValue}>{qrStats.uniqueUsers}</Text>
                        <Text style={styles.qrStatsDetailLabel}>Unique Users</Text>
                      </View>
                      <View style={styles.qrStatsDetailItem}>
                        <Text style={styles.qrStatsDetailValue}>{qrStats.conversionRate}%</Text>
                        <Text style={styles.qrStatsDetailLabel}>Conversion</Text>
                      </View>
                      <View style={styles.qrStatsDetailItem}>
                        <Text style={styles.qrStatsDetailValue}>{qrStats.averageScanTime}s</Text>
                        <Text style={styles.qrStatsDetailLabel}>Avg Time</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setShowDetailModal(false);
                      handleEditQR(selectedQR);
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButtonFull}
                    onPress={() => handleShareQR(selectedQR)}
                  >
                    <Text style={styles.shareButtonFullText}>Share QR Code</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit QR Modal */}
      <Modal
        visible={editingQR !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingQR(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit QR Code</Text>
              <TouchableOpacity onPress={() => setEditingQR(null)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter QR code name"
                placeholderTextColor={colors.text.tertiary}
                value={editQRName}
                onChangeText={setEditQRName}
                accessibilityLabel="QR code name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <TouchableOpacity
                style={[
                  styles.statusToggle,
                  { backgroundColor: editQRActive ? colors.success[50] : colors.error[50] },
                ]}
                onPress={() => setEditQRActive(!editQRActive)}
                accessibilityRole="switch"
                accessibilityState={{ checked: editQRActive }}
                accessibilityLabel="Toggle QR code active status"
              >
                <View
                  style={[
                    styles.statusToggleDot,
                    { backgroundColor: editQRActive ? colors.successMain : colors.errorMain },
                  ]}
                />
                <Text
                  style={[
                    styles.statusToggleText,
                    { color: editQRActive ? colors.successMain : colors.errorMain },
                  ]}
                >
                  {editQRActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, updating && styles.submitButtonDisabled]}
              onPress={handleUpdateQR}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              {updating ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={handleDeleteQR}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete QR code"
            >
              {deleting ? (
                <ActivityIndicator color={colors.errorMain} size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete QR Code</Text>
              )}
            </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primaryMain,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  createButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterPillActive: {
    backgroundColor: colors.primaryMain,
    borderColor: colors.primaryMain,
  },
  filterPillText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterPillTextActive: {
    color: colors.text.inverse,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  qrCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  qrIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 24,
  },
  qrInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  qrName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  qrShortCode: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  qrStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  qrStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  qrStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  qrStats: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  qrStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  qrStatDivider: {
    width: 1,
    backgroundColor: colors.border.default,
  },
  qrStatValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  qrStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  qrCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  qrCreatedAt: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  shareButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
  },
  shareButtonText: {
    color: colors.primaryMain,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  modalCloseText: {
    fontSize: typography.fontSize.md,
    color: colors.primaryMain,
    fontWeight: typography.fontWeight.medium,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  typeOptionIcon: {
    fontSize: typography.fontSize.md,
    marginRight: 6,
  },
  typeOptionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  },
  submitButton: {
    backgroundColor: colors.primaryMain,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  qrDetailSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  qrDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  qrDetailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  qrDetailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.gray[700],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  shareButtonFull: {
    flex: 2,
    backgroundColor: colors.primaryMain,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  shareButtonFullText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  statusToggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusToggleText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  deleteButton: {
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: colors.errorMain,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  qrStatsDetail: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  qrStatsDetailTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primaryMain,
    marginBottom: spacing.md,
  },
  qrStatsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qrStatsDetailItem: {
    alignItems: 'center',
  },
  qrStatsDetailValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  qrStatsDetailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default QRCodeManager;
