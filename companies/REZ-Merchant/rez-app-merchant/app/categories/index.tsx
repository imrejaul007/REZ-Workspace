import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { showAlert } from '@/utils/alert';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { catalogService } from '@/services/api/catalogService';
import { serviceManagementService, ServiceCategory } from '@/services/api/services';
import { logger } from '@/utils/logger';

interface CategoryWithStats {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  parentCategory?: string;
  isActive: boolean;
  productCount: number;
  sortOrder?: number;
  subcategories: CategoryWithStats[];
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoriesScreen() {
  const { token } = useAuth();
  const { activeStore, stores } = useStore();
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStore?._id || '');
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCategories = useCallback(
    async (isRefresh = false) => {
      if (!token) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : '';

        // Try catalog service first for categories
        let catResponse = null;
        try {
          catResponse = await catalogService.getCategories();
        } catch (catalogError) {
          logger.warn('Catalog service unavailable for categories, using merchant service:', catalogError);
          // Fallback to merchant service
          catResponse = await apiClient.get(`merchant/categories${storeParam}`);
        }

        const [svcCategories] = await Promise.all([
          serviceManagementService.getCategories().catch(() => [] as ServiceCategory[]),
        ]);
        setServiceCategories(svcCategories);

        // Handle both catalog and merchant API responses
        const rawCategories = catResponse?.success !== false
          ? Array.isArray(catResponse?.categories)
            ? catResponse.categories
            : Array.isArray(catResponse?.data)
              ? catResponse.data
              : []
          : [];

        const categoriesWithStats: CategoryWithStats[] = rawCategories.map((cat) => ({
          id: cat._id || cat.id || '',
          _id: cat._id,
          name: cat.name || 'Unnamed',
          description: cat.description || '',
          image: cat.image,
          icon: cat.icon,
          parentCategory: cat.parentCategory,
          isActive: cat.isActive !== false,
          productCount: cat.productCount || 0,
          sortOrder: cat.sortOrder || 0,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          subcategories: (cat.subcategories || []).map((sub) => ({
            id: sub._id || sub.id || '',
            _id: sub._id,
            name: sub.name || '',
            description: sub.description || '',
            isActive: sub.isActive !== false,
            productCount: sub.productCount || 0,
            subcategories: [],
          })),
        }));

        setCategories(categoriesWithStats);
      } catch (error) {
        logger.error('Error fetching categories:', error);
        showAlert('Error', 'Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, selectedStoreId]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const handleCategoryPress = (category: CategoryWithStats) => {
    if (isSelectionMode) {
      toggleCategorySelection(category.id);
    } else {
      router.push(`/products?category=${encodeURIComponent(category.name)}`);
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showAlert('Error', 'Please enter a category name.');
      return;
    }
    const storeId = selectedStoreId || activeStore?._id;
    if (!storeId) {
      showAlert('Error', 'Please select a store first.');
      return;
    }
    try {
      setCreating(true);
      const result = await apiClient.post('merchant/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        storeId,
      });
      if (!result.success) throw new Error(result.message || 'Failed to create category');
      setShowCreateModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      fetchCategories(true);
      showAlert('Success', `Category "${newCategoryName.trim()}" created.`);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to create category.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = (category: CategoryWithStats) => {
    showAlert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? Products will be moved to "Uncategorized".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiClient.delete(`merchant/categories/${category.id}`);
              if (!result.success) throw new Error(result.message);
              fetchCategories(true);
            } catch (error) {
              showAlert('Error', error.message || 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCategories.length === 0) {
      showAlert('No Selection', 'Please select categories first.');
      return;
    }
    switch (action) {
      case 'auto_categorize':
        showAlert(
          'Feature Coming Soon',
          'Auto-categorization will be available in a future update.'
        );
        setIsSelectionMode(false);
        setSelectedCategories([]);
        break;
      case 'export': {
        const exportData = {
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            productCount: cat.productCount,
            isActive: cat.isActive,
          })),
          exportedAt: new Date().toISOString(),
          totalCategories: categories.length,
        };
        logger.debug('Categories Export:', JSON.stringify(exportData, null, 2));
        showAlert('Export Complete', `Exported ${categories.length} categories.`);
        break;
      }
      default:
        showAlert('Action', `${action} action for ${selectedCategories.length} categories`);
    }
  };

  const renderCategoryItem = useCallback(
    ({ item }: { item: CategoryWithStats }) => (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          isSelectionMode && selectedCategories.includes(item.id) && styles.selectedCard,
        ]}
        onPress={() => handleCategoryPress(item)}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedCategories([item.id]);
          }
        }}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
            <ThemedText style={styles.productCount}>
              {item.productCount} {item.productCount === 1 ? 'product' : 'products'}
            </ThemedText>
            {!item.isActive && (
              <ThemedText style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                Inactive
              </ThemedText>
            )}
          </View>

          <View style={styles.categoryActions}>
            {isSelectionMode && (
              <View
                style={[styles.checkbox, selectedCategories.includes(item.id) && styles.checkedBox]}
              >
                {selectedCategories.includes(item.id) && (
                  <Ionicons name="checkmark" size={16} color={Colors.light.background} />
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/categories/edit/${item.id}`)}
            >
              <Ionicons name="pencil" size={16} color={Colors.light.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteCategory(item)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.light.error || '#EF4444'} />
            </TouchableOpacity>
          </View>
        </View>

        {item.subcategories && item.subcategories.length > 0 && (
          <View style={styles.subcategoriesContainer}>
            <ThemedText style={styles.subcategoriesTitle}>Subcategories:</ThemedText>
            <View style={styles.subcategoriesList}>
              {item.subcategories.map((subcat) => (
                <TouchableOpacity
                  key={subcat.id}
                  style={styles.subcategoryChip}
                  onPress={() =>
                    router.push(
                      `/products?category=${encodeURIComponent(item.name)}&subcategory=${encodeURIComponent(subcat.name)}`
                    )
                  }
                >
                  <ThemedText style={styles.subcategoryText}>
                    {subcat.name} ({subcat.productCount})
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    ),
    [isSelectionMode, selectedCategories, stores, selectedStoreId]
  );

  const renderStatsCard = useCallback(() => {
    const totalProduct = categories.length;
    const totalService = serviceCategories.length;
    const totalActive =
      categories.filter((c) => c.isActive).length +
      serviceCategories.filter((s) => s.isActive).length;

    return (
      <View style={styles.statsContainer}>
        <ThemedText style={styles.sectionTitle}>Category Overview</ThemedText>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{totalProduct}</ThemedText>
            <ThemedText style={styles.statLabel}>Product</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statNumber, { color: '#0EA5E9' }]}>
              {totalService}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Service</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{totalProduct + totalService}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statNumber, { color: '#10B981' }]}>{totalActive}</ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>
        </View>

        {(categories.length > 0 || serviceCategories.length > 0) && (
          <View style={styles.topCategoriesContainer}>
            <ThemedText style={styles.subsectionTitle}>All Categories</ThemedText>
            {categories.slice(0, 5).map((cat, index) => (
              <View key={cat.id} style={styles.topCategoryItem}>
                <View style={styles.topCategoryRank}>
                  <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                </View>
                <View style={styles.topCategoryInfo}>
                  <ThemedText style={styles.topCategoryName}>{cat.name}</ThemedText>
                  <ThemedText style={styles.topCategoryStats}>
                    {cat.productCount} products
                  </ThemedText>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: '#F3F4F6' }]}>
                  <ThemedText style={[styles.typeBadgeText, { color: Colors.light.primary }]}>
                    Product
                  </ThemedText>
                </View>
              </View>
            ))}
            {serviceCategories.slice(0, 5).map((svc, index) => (
              <View key={svc._id} style={styles.topCategoryItem}>
                <View style={[styles.topCategoryRank, { backgroundColor: '#0EA5E9' }]}>
                  <ThemedText style={styles.rankNumber}>{categories.length + index + 1}</ThemedText>
                </View>
                <View style={styles.topCategoryInfo}>
                  <ThemedText style={styles.topCategoryName}>{svc.name}</ThemedText>
                  <ThemedText style={styles.topCategoryStats}>
                    {svc.serviceCount || 0} services
                  </ThemedText>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: '#F0F9FF' }]}>
                  <ThemedText style={[styles.typeBadgeText, { color: '#0EA5E9' }]}>
                    Service
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }, [categories, serviceCategories]);

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="file-tray-outline" size={64} color={Colors.light.textSecondary} />
        <ThemedText style={styles.emptyTitle}>No categories found</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          {searchQuery
            ? 'Try adjusting your search terms'
            : 'Categories will appear here as you add products'}
        </ThemedText>
      </View>
    ),
    [searchQuery]
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View>
              <ThemedText type="title" style={styles.title}>
                Categories
              </ThemedText>
              <ThemedText style={styles.subtitle}>Organize your product catalog</ThemedText>
            </View>
          </View>

          <View style={styles.headerActions}>
            {isSelectionMode ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedCategories([]);
                }}
              >
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add" size={24} color={Colors.light.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Store Filter */}
        {stores.length > 1 && (
          <View style={styles.storeFilterContainer}>
            <ThemedText style={styles.storeFilterLabel}>Filter by Store:</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.storeFilterScroll}
              contentContainerStyle={styles.storeFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.storeFilterButton,
                  !selectedStoreId && styles.storeFilterButtonActive,
                ]}
                onPress={() => setSelectedStoreId('')}
              >
                <ThemedText
                  style={[styles.storeFilterText, !selectedStoreId && styles.storeFilterTextActive]}
                >
                  All Stores
                </ThemedText>
              </TouchableOpacity>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store._id}
                  style={[
                    styles.storeFilterButton,
                    selectedStoreId === store._id && styles.storeFilterButtonActive,
                  ]}
                  onPress={() => setSelectedStoreId(store._id)}
                >
                  <ThemedText
                    style={[
                      styles.storeFilterText,
                      selectedStoreId === store._id && styles.storeFilterTextActive,
                    ]}
                  >
                    {store.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.light.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selection Actions */}
        {isSelectionMode && selectedCategories.length > 0 && (
          <View style={styles.selectionActions}>
            <ThemedText style={styles.selectionCount}>
              {selectedCategories.length} selected
            </ThemedText>
            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={styles.bulkActionButton}
                onPress={() => handleBulkAction('export')}
              >
                <Ionicons name="download" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.bulkActionText}>Export</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      {loading && categories.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading categories...</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.light.primary]}
            />
          }
        >
          {renderStatsCard()}

          {serviceCategories.length > 0 && (
            <View style={styles.categoriesContainer}>
              <View style={styles.categoriesHeader}>
                <ThemedText style={styles.sectionTitle}>Service Categories</ThemedText>
                <TouchableOpacity
                  style={styles.organizeButton}
                  onPress={() => router.push('/services')}
                >
                  <Ionicons name="briefcase-outline" size={18} color="#0EA5E9" />
                  <ThemedText style={[styles.organizeText, { color: '#0EA5E9' }]}>
                    Manage
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {serviceCategories.map((svc) => (
                <TouchableOpacity
                  key={svc._id}
                  style={styles.serviceCategoryCard}
                  onPress={() => router.push(`/services?category=${svc._id}`)}
                >
                  <View style={styles.serviceCategoryIcon}>
                    <ThemedText style={{ fontSize: 20 }}>{svc.icon || '📦'}</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.categoryName}>{svc.name}</ThemedText>
                    <ThemedText style={styles.productCount}>
                      {svc.serviceCount || 0} services
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.svcStatusDot,
                      { backgroundColor: svc.isActive ? '#10B981' : '#9CA3AF' },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Product Categories */}
          <View style={styles.categoriesContainer}>
            <View style={styles.categoriesHeader}>
              <ThemedText style={styles.sectionTitle}>Product Categories</ThemedText>
              <TouchableOpacity
                style={styles.organizeButton}
                onPress={() => router.push('/categories/organize')}
              >
                <Ionicons name="reorder-three" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.organizeText}>Organize</ThemedText>
              </TouchableOpacity>
            </View>
            {(() => {
              const filtered = searchQuery
                ? categories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : categories;
              return filtered.length === 0 ? (
                renderEmptyState()
              ) : (
                <FlatList
                  data={filtered}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              );
            })()}
          </View>
        </ScrollView>
      )}

      {/* Create Category Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>New Category</ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Category Name *</ThemedText>
                <TextInput
                  style={styles.formInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="e.g. Beverages, Starters..."
                  placeholderTextColor={Colors.light.textSecondary}
                  autoFocus
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Description</ThemedText>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  value={newCategoryDescription}
                  onChangeText={setNewCategoryDescription}
                  placeholder="Optional description..."
                  placeholderTextColor={Colors.light.textSecondary}
                  multiline
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                }}
              >
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateButton, creating && { opacity: 0.6 }]}
                onPress={handleCreateCategory}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={Colors.light.background} />
                ) : (
                  <ThemedText style={styles.modalCreateText}>Create</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    backgroundColor: Colors.light.background,
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { color: Colors.light.text, marginBottom: 4 },
  subtitle: { color: Colors.light.textSecondary, fontSize: 14 },
  headerActions: { flexDirection: 'row', gap: 8 },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  cancelText: { color: Colors.light.text, fontSize: 14, fontWeight: '500' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.light.text },
  clearButton: { padding: 4 },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
  },
  selectionCount: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  bulkActions: { flexDirection: 'row', gap: 8 },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
    gap: 4,
  },
  bulkActionText: { fontSize: 12, color: Colors.light.primary, fontWeight: '500' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: Colors.light.textSecondary },
  statsContainer: {
    backgroundColor: Colors.light.background,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: '700', color: Colors.light.primary },
  statLabel: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  topCategoriesContainer: { marginTop: 8 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 12 },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  topCategoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: { fontSize: 12, fontWeight: '600', color: Colors.light.background },
  topCategoryInfo: { flex: 1 },
  topCategoryName: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  topCategoryStats: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  categoriesContainer: {
    backgroundColor: Colors.light.background,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  organizeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  organizeText: { fontSize: 14, color: Colors.light.primary, fontWeight: '500' },
  categoryCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedCard: { borderWidth: 2, borderColor: Colors.light.primary },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  productCount: { fontSize: 14, color: Colors.light.textSecondary },
  categoryActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  actionButton: { padding: 8, borderRadius: 6, backgroundColor: Colors.light.background },
  subcategoriesContainer: { marginTop: 8 },
  subcategoriesTitle: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 8 },
  subcategoriesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subcategoryChip: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subcategoryText: { fontSize: 12, color: Colors.light.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.light.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' },
  storeFilterContainer: { marginBottom: 12 },
  storeFilterLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  storeFilterScroll: { maxHeight: 40 },
  storeFilterContent: { gap: 8, paddingRight: 16 },
  storeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  storeFilterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  storeFilterText: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '500' },
  storeFilterTextActive: { color: Colors.light.background, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  serviceCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  serviceCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svcStatusDot: { width: 8, height: 8, borderRadius: 4 },
  // Create Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.light.text },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '500', color: Colors.light.text, marginBottom: 8 },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, color: Colors.light.text },
  modalCreateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  modalCreateText: { fontSize: 16, fontWeight: '600', color: Colors.light.background },
});
