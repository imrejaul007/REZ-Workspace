/**
 * Suppliers Screen
 * Supplier list with search, filter by credit status, add/edit supplier
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, Supplier, CreateSupplierData } from '@/services/b2bApi';
import { SupplierCard } from '@/components/b2b';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';

const ITEMS_PER_PAGE = 20;

type CreditFilter = 'all' | 'active' | 'blocked' | 'pending';

export default function SuppliersScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creditFilter, setCreditFilter] = useState<CreditFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Add/Edit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    creditLimit: undefined,
  });

  // Fetch suppliers
  const fetchSuppliers = useCallback(async (page = 1, append = false) => {
    if (!merchantId) return;

    try {
      setError(null);
      const response = await getSuppliers(merchantId, {
        page,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        creditStatus: creditFilter !== 'all' ? creditFilter as Supplier['creditStatus'] : undefined,
      });

      if (append) {
        setSuppliers(prev => [...prev, ...response.data]);
      } else {
        setSuppliers(response.data);
      }
      setTotalPages(response.totalPages);
      setHasMore(page < response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    }
  }, [merchantId, searchQuery, creditFilter]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchSuppliers(1);
      setLoading(false);
    };
    load();
  }, [fetchSuppliers]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchSuppliers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, creditFilter]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchSuppliers(1);
    setRefreshing(false);
  }, [fetchSuppliers]);

  // Load more
  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchSuppliers(nextPage, true);
  }, [hasMore, loading, currentPage, fetchSuppliers]);

  // Open add modal
  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      creditLimit: undefined,
    });
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      creditLimit: supplier.creditLimit,
    });
    setModalVisible(true);
  };

  // Save supplier
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setModalVisible(false);
      fetchSuppliers(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  // Delete supplier
  const handleDelete = async (supplier: Supplier) => {
    try {
      await deleteSupplier(supplier.id);
      fetchSuppliers(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  };

  // Stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.creditStatus === 'active').length;
  const blockedSuppliers = suppliers.filter(s => s.creditStatus === 'blocked').length;

  // Filter tabs
  const filterTabs: { key: CreditFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: totalSuppliers },
    { key: 'active', label: 'Active', count: activeSuppliers },
    { key: 'blocked', label: 'Blocked', count: blockedSuppliers },
    { key: 'pending', label: 'Pending' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Suppliers</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddModal}
        accessibilityRole="button"
        accessibilityLabel="Add supplier"
      >
        <Text style={styles.addButtonText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              creditFilter === tab.key && styles.filterTabActive,
            ]}
            onPress={() => {
              setCreditFilter(tab.key);
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                creditFilter === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count !== undefined && (
              <View
                style={[
                  styles.filterBadge,
                  creditFilter === tab.key && styles.filterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    creditFilter === tab.key && styles.filterBadgeTextActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <SupplierCard
      supplier={item}
      onPress={() => openEditModal(item)}
      onEdit={() => openEditModal(item)}
      style={styles.supplierCard}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <LoadingSpinner fullScreen message="Loading suppliers..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchSuppliers(1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={suppliers}
        renderItem={renderSupplier}
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
            title="No suppliers found"
            message={searchQuery ? "Try a different search term" : "Add your first supplier to get started"}
            actionLabel={searchQuery ? "Clear Search" : "Add Supplier"}
            onAction={searchQuery ? () => setSearchQuery('') : openAddModal}
          />
        }
        ListFooterComponent={
          loading && suppliers.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Supplier name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Phone number"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email address"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Address"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Credit Limit</Text>
              <TextInput
                style={styles.formInput}
                value={formData.creditLimit?.toString() || ''}
                onChangeText={(text) => setFormData({
                  ...formData,
                  creditLimit: text ? parseInt(text, 10) : undefined,
                })}
                placeholder="Credit limit (optional)"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            {editingSupplier && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setModalVisible(false);
                  setTimeout(() => {
                    if (confirm('Are you sure you want to delete this supplier?')) {
                      handleDelete(editingSupplier);
                    }
                  }, 100);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete Supplier</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  addButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  filtersContainer: {
    backgroundColor: colors.surface.primary,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  } as ViewStyle,
  searchInput: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  } as TextStyle,
  filterTabs: {
    paddingHorizontal: spacing.base,
  } as ViewStyle,
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  } as ViewStyle,
  filterTabActive: {
    backgroundColor: colors.primary[500],
  } as ViewStyle,
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  filterTabTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  filterBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  } as ViewStyle,
  filterBadgeActive: {
    backgroundColor: colors.primary[400],
  } as ViewStyle,
  filterBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  } as TextStyle,
  filterBadgeTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  supplierCard: {
    marginBottom: spacing.md,
  } as ViewStyle,
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
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  } as TextStyle,
  deleteButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.error[50],
    marginBottom: spacing['2xl'],
  } as ViewStyle,
  deleteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[600],
  } as TextStyle,
});
