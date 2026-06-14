/**
 * RFQ List Screen
 * RFQ list with create, quote comparison
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getRFQs,
  createRFQ,
  getQuotes,
  RequestForQuote,
  Quote,
  QuoteStatus,
} from '@/services/b2bApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';

const ITEMS_PER_PAGE = 20;

export default function RFQListScreen(): React.JSX.Element {
  const { merchantId } = useAuth();
  const router = useRouter();

  // State
  const [rfqs, setRFQs] = useState<RequestForQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Create modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createItems, setCreateItems] = useState<Array<{ name: string; quantity: string; unit: string }>>([
    { name: '', quantity: '', unit: 'pcs' },
  ]);
  const [saving, setSaving] = useState(false);

  // Quote comparison modal
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RequestForQuote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Fetch RFQs
  const fetchRFQs = useCallback(async (page = 1, append = false) => {
    if (!merchantId) return;

    try {
      setError(null);
      const response = await getRFQs(merchantId, { page, limit: ITEMS_PER_PAGE });

      if (append) {
        setRFQs(prev => [...prev, ...response.data]);
      } else {
        setRFQs(response.data);
      }
      setTotalPages(response.totalPages);
      setHasMore(page < response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RFQs');
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRFQs(1);
      setLoading(false);
    };
    load();
  }, [fetchRFQs]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchRFQs(1);
    setRefreshing(false);
  }, [fetchRFQs]);

  // Load more
  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchRFQs(nextPage, true);
  }, [hasMore, loading, currentPage, fetchRFQs]);

  // Add item field
  const handleAddItem = () => {
    setCreateItems([...createItems, { name: '', quantity: '', unit: 'pcs' }]);
  };

  // Remove item field
  const handleRemoveItem = (index: number) => {
    if (createItems.length > 1) {
      setCreateItems(createItems.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const handleUpdateItem = (index: number, field: string, value: string) => {
    const updated = [...createItems];
    updated[index] = { ...updated[index], [field]: value };
    setCreateItems(updated);
  };

  // Create RFQ
  const handleCreateRFQ = async () => {
    if (!createTitle.trim() || createItems.every((item) => !item.name.trim())) {
      alert('Please enter RFQ title and at least one item');
      return;
    }

    const validItems = createItems.filter((item) => item.name.trim());

    setSaving(true);
    try {
      await createRFQ({
        title: createTitle.trim(),
        items: validItems.map((item) => ({
          itemId: `temp_${Date.now()}`,
          itemName: item.name.trim(),
          quantity: parseInt(item.quantity, 10) || 1,
          unit: item.unit,
        })),
        supplierIds: [],
      });

      setCreateModalVisible(false);
      setCreateTitle('');
      setCreateItems([{ name: '', quantity: '', unit: 'pcs' }]);
      fetchRFQs(1);
      Alert.alert('Success', 'RFQ created successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create RFQ');
    } finally {
      setSaving(false);
    }
  };

  // View quotes
  const handleViewQuotes = async (rfq: RequestForQuote) => {
    setSelectedRFQ(rfq);
    setComparisonModalVisible(true);
    setLoadingQuotes(true);

    try {
      const quotesData = await getQuotes(rfq.id);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
      setQuotes([]);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const STATUS_CONFIG: Record<QuoteStatus, { variant: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    sent: { variant: 'info', label: 'Sent' },
    quoted: { variant: 'warning', label: 'Quoted' },
    accepted: { variant: 'success', label: 'Accepted' },
    rejected: { variant: 'error', label: 'Rejected' },
    expired: { variant: 'default', label: 'Expired' },
  };

  // RFQ item
  const renderRFQItem = ({ item }: { item: RequestForQuote }) => {
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <TouchableOpacity
        style={styles.rfqCard}
        onPress={() => handleViewQuotes(item)}
      >
        <View style={styles.rfqHeader}>
          <View>
            <Text style={styles.rfqNumber}>{item.rfqNumber}</Text>
            <Text style={styles.rfqTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Badge label={statusConfig.label} variant={statusConfig.variant} />
        </View>

        <View style={styles.rfqDetails}>
          <View style={styles.rfqDetail}>
            <Text style={styles.rfqDetailLabel}>Items</Text>
            <Text style={styles.rfqDetailValue}>{item.items.length}</Text>
          </View>
          <View style={styles.rfqDetail}>
            <Text style={styles.rfqDetailLabel}>Suppliers</Text>
            <Text style={styles.rfqDetailValue}>{item.supplierIds.length}</Text>
          </View>
          <View style={styles.rfqDetail}>
            <Text style={styles.rfqDetailLabel}>Created</Text>
            <Text style={styles.rfqDetailValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.rfqActions}>
          <TouchableOpacity
            style={styles.viewQuotesButton}
            onPress={() => handleViewQuotes(item)}
          >
            <Text style={styles.viewQuotesButtonText}>View Quotes</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen message="Loading RFQs..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Request for Quote</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ New RFQ</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchRFQs(1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={rfqs}
        renderItem={renderRFQItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryMain]}
            tintColor={colors.primaryMain}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            title="No RFQs"
            message="Create your first RFQ to get quotes from suppliers"
            actionLabel="Create RFQ"
            onAction={() => setCreateModalVisible(true)}
          />
        }
        ListFooterComponent={
          loading && rfqs.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
      />

      {/* Create RFQ Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New RFQ</Text>
            <TouchableOpacity onPress={handleCreateRFQ} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                value={createTitle}
                onChangeText={setCreateTitle}
                placeholder="e.g., Bulk order for widgets"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <Text style={styles.sectionLabel}>Items</Text>

            {createItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <TextInput
                  style={[styles.formInput, styles.itemNameInput]}
                  value={item.name}
                  onChangeText={(value) => handleUpdateItem(index, 'name', value)}
                  placeholder="Item name"
                  placeholderTextColor={colors.text.tertiary}
                />
                <TextInput
                  style={[styles.formInput, styles.itemQuantityInput]}
                  value={item.quantity}
                  onChangeText={(value) => handleUpdateItem(index, 'quantity', value)}
                  placeholder="Qty"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.formInput, styles.itemUnitInput]}
                  value={item.unit}
                  onChangeText={(value) => handleUpdateItem(index, 'unit', value)}
                  placeholder="Unit"
                  placeholderTextColor={colors.text.tertiary}
                />
                {createItems.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Text style={styles.removeItemText}>X</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Text style={styles.addItemText}>+ Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Quote Comparison Modal */}
      <Modal
        visible={comparisonModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComparisonModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setComparisonModalVisible(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quote Comparison</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.comparisonContent}>
            {selectedRFQ && (
              <View style={styles.rfqInfo}>
                <Text style={styles.rfqInfoTitle}>{selectedRFQ.title}</Text>
                <Text style={styles.rfqInfoNumber}>{selectedRFQ.rfqNumber}</Text>
              </View>
            )}

            {loadingQuotes ? (
              <LoadingSpinner message="Loading quotes..." />
            ) : quotes.length === 0 ? (
              <EmptyState
                title="No quotes yet"
                message="Suppliers haven't submitted quotes for this RFQ"
              />
            ) : (
              <FlatList
                data={quotes}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.quoteCard}
                    onPress={() => {
                      setComparisonModalVisible(false);
                      router.push(`/quotes/${item.id}`);
                    }}
                  >
                    <View style={styles.quoteHeader}>
                      <Text style={styles.quoteSupplier}>{item.supplierName}</Text>
                      <Badge
                        label={STATUS_CONFIG[item.status].label}
                        variant={STATUS_CONFIG[item.status].variant}
                      />
                    </View>
                    <Text style={styles.quoteAmount}>
                      {formatCurrency(item.totalAmount)}
                    </Text>
                    <Text style={styles.quoteItems}>
                      {item.items.length} items
                    </Text>
                    <Text style={styles.quoteDate}>
                      Received: {formatDate(item.receivedAt)}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.quotesListContent}
              />
            )}
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
  createButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  createButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  rfqCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  } as ViewStyle,
  rfqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  } as ViewStyle,
  rfqNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  rfqTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: 2,
    maxWidth: 200,
  } as TextStyle,
  rfqDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as ViewStyle,
  rfqDetail: {
    alignItems: 'center',
  } as ViewStyle,
  rfqDetailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  rfqDetailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: 2,
  } as TextStyle,
  rfqActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  } as ViewStyle,
  viewQuotesButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  } as ViewStyle,
  viewQuotesButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  loadingFooter: {
    padding: spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    flex: 1,
  } as TextStyle,
  retryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    marginLeft: spacing.md,
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
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  itemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  } as ViewStyle,
  itemNameInput: {
    flex: 2,
  } as TextStyle,
  itemQuantityInput: {
    flex: 1,
  } as TextStyle,
  itemUnitInput: {
    flex: 1,
  } as TextStyle,
  removeItemButton: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
  } as ViewStyle,
  removeItemText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.error[600],
  } as TextStyle,
  addItemButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  } as ViewStyle,
  addItemText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  // Comparison styles
  comparisonContent: {
    flex: 1,
    padding: spacing.base,
  } as ViewStyle,
  rfqInfo: {
    backgroundColor: colors.surface.primary,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  } as ViewStyle,
  rfqInfoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  rfqInfoNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  } as TextStyle,
  quotesListContent: {
    gap: spacing.md,
  } as ViewStyle,
  quoteCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  } as ViewStyle,
  quoteSupplier: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  quoteAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  } as TextStyle,
  quoteItems: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  } as TextStyle,
  quoteDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  } as TextStyle,
});
