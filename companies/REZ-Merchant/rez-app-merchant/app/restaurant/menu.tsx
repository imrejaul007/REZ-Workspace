/**
 * Restaurant Menu Management
 * Create, edit, and organize menu items and categories
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { storageService } from '@/services/storage';
import { logger } from '@/utils/logger';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number; // minutes
  allergens?: string[];
  options?: Array<{
    name: string;
    choices: Array<{ name: string; price: number }>;
  }>;
}

interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  isActive: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },
  tabActive: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
  },
  categoryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  categoryDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  categoryMeta: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  itemsList: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[500],
    marginTop: Spacing.sm,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success[700],
  },
  itemUnavailable: {
    backgroundColor: Colors.error[100],
  },
  itemUnavailableText: {
    color: Colors.error[700],
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  availabilityToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.success[500],
  },
  availabilityToggleOff: {
    backgroundColor: Colors.gray[200],
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  availabilityTextOff: {
    color: Colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalClose: {
    padding: Spacing.sm,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  formTextArea: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formCol: {
    flex: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[500],
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type TabType = 'items' | 'categories';

export default function RestaurantMenu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '15',
    allergens: '',
  });

  const loadMenuData = useCallback(async () => {
    try {
      // In production, these would be API calls
      // For now, using mock data
      const mockCategories: Category[] = [
        { id: '1', name: 'Starters', description: 'Appetizers and small plates', itemCount: 8, isActive: true },
        { id: '2', name: 'Main Course', description: 'Full meals and entrees', itemCount: 12, isActive: true },
        { id: '3', name: 'Desserts', description: 'Sweet treats and desserts', itemCount: 6, isActive: true },
        { id: '4', name: 'Beverages', description: 'Drinks and refreshments', itemCount: 10, isActive: true },
        { id: '5', name: 'Specials', description: "Today's special items", itemCount: 3, isActive: false },
      ];

      const mockItems: MenuItem[] = [
        {
          id: '1',
          name: 'Paneer Tikka',
          description: 'Grilled cottage cheese marinated in spices',
          price: 250,
          category: 'Starters',
          isAvailable: true,
          isFeatured: true,
          preparationTime: 20,
          allergens: ['dairy'],
        },
        {
          id: '2',
          name: 'Butter Chicken',
          description: 'Creamy tomato-based curry with tender chicken',
          price: 350,
          category: 'Main Course',
          isAvailable: true,
          isFeatured: true,
          preparationTime: 25,
          allergens: ['dairy', 'gluten'],
        },
        {
          id: '3',
          name: 'Veg Biryani',
          description: 'Fragrant rice layered with vegetables and spices',
          price: 280,
          category: 'Main Course',
          isAvailable: true,
          isFeatured: false,
          preparationTime: 30,
        },
        {
          id: '4',
          name: 'Gulab Jamun',
          description: 'Sweet milk dumplings in rose syrup',
          price: 120,
          category: 'Desserts',
          isAvailable: true,
          isFeatured: false,
          preparationTime: 10,
          allergens: ['dairy', 'nuts'],
        },
        {
          id: '5',
          name: 'Masala Chai',
          description: 'Traditional spiced Indian tea',
          price: 50,
          category: 'Beverages',
          isAvailable: true,
          isFeatured: false,
          preparationTime: 5,
        },
        {
          id: '6',
          name: 'Tandoori Roti',
          description: 'Wood-fired bread',
          price: 30,
          category: 'Main Course',
          isAvailable: false,
          isFeatured: false,
          preparationTime: 8,
          allergens: ['gluten'],
        },
      ];

      setCategories(mockCategories);
      setItems(mockItems);
    } catch (error) {
      logger.error('[Menu] Failed to load menu data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Filter items based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [items, searchQuery]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMenuData();
  }, [loadMenuData]);

  const handleToggleAvailability = useCallback((item: MenuItem) => {
    setItems(prev =>
      prev.map(i =>
        i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
      )
    );
  }, []);

  const handleEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      preparationTime: String(item.preparationTime),
      allergens: item.allergens?.join(', ') || '',
    });
    setShowAddModal(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories[0]?.name || '',
      preparationTime: '15',
      allergens: '',
    });
    setShowAddModal(true);
  }, [categories]);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.price.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const itemData: MenuItem = {
      id: editingItem?.id || `new-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      category: formData.category || categories[0]?.name || 'Uncategorized',
      preparationTime: parseInt(formData.preparationTime, 10) || 15,
      allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()).filter(Boolean) : undefined,
      isAvailable: editingItem?.isAvailable ?? true,
      isFeatured: editingItem?.isFeatured ?? false,
    };

    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? itemData : i));
    } else {
      setItems(prev => [itemData, ...prev]);
    }

    setShowAddModal(false);
    Alert.alert('Success', editingItem ? 'Item updated successfully' : 'Item added successfully');
  }, [formData, editingItem, categories]);

  const handleDeleteItem = useCallback((item: MenuItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setItems(prev => prev.filter(i => i.id !== item.id)),
        },
      ]
    );
  }, []);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    filteredItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [filteredItems]);

  const stats = useMemo(() => ({
    totalItems: items.length,
    available: items.filter(i => i.isAvailable).length,
    categories: categories.filter(c => c.isActive).length,
  }), [items, categories]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddNew}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.headerButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success[500] }]}>{stats.available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.categories}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.tabActive]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
            Items ({filteredItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.tabActive]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
            Categories ({categories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'categories' ? (
        <ScrollView
          contentContainerStyle={[styles.categoriesList, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {categories.map(category => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.primary[100] }]}>
                <Ionicons name="restaurant" size={24} color={Colors.primary[500]} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <Text style={styles.categoryMeta}>{category.itemCount} items</Text>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="pencil" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.itemsList, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {Object.keys(itemsByCategory).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={Colors.gray[300]} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first menu item to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.primaryButton} onPress={handleAddNew}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Add First Item</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
              <View key={categoryName}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{categoryName}</Text>
                  <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
                    {categoryItems.length} items
                  </Text>
                </View>
                {categoryItems.map(item => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemImage}>
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="restaurant-outline" size={32} color={Colors.gray[400]} />
                      </View>
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {Colors.typography.price.display({ value: item.price })}
                      </Text>
                      <View style={styles.itemMeta}>
                        {item.isFeatured && (
                          <View style={styles.itemBadge}>
                            <Ionicons name="star" size={12} color={Colors.warning[500]} />
                            <Text style={styles.itemBadgeText}>Featured</Text>
                          </View>
                        )}
                        {item.allergens && item.allergens.length > 0 && (
                          <View style={[styles.itemBadge, { backgroundColor: Colors.warning[100] }]}>
                            <Ionicons name="warning" size={12} color={Colors.warning[700]} />
                            <Text style={[styles.itemBadgeText, { color: Colors.warning[700] }]}>
                              {item.allergens.length} allergens
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[
                          styles.availabilityToggle,
                          !item.isAvailable && styles.availabilityToggleOff,
                        ]}
                        onPress={() => handleToggleAvailability(item)}
                      >
                        <Text style={!item.isAvailable ? styles.availabilityTextOff : styles.availabilityText}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                        <TouchableOpacity onPress={() => handleEditItem(item)}>
                          <Ionicons name="pencil" size={20} color={Colors.text.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteItem(item)}>
                          <Ionicons name="trash-outline" size={20} color={Colors.error[500]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add Menu Item'}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Butter Chicken"
                  placeholderTextColor={Colors.text.tertiary}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.formTextArea}
                  placeholder="Describe the dish..."
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Price *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                    value={formData.price}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Prep Time (min)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="15"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="number-pad"
                    value={formData.preparationTime}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, preparationTime: text }))}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          formData.category === cat.name && styles.categoryChipActive,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            formData.category === cat.name && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Allergens (comma-separated)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., dairy, nuts, gluten"
                  placeholderTextColor={Colors.text.tertiary}
                  value={formData.allergens}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, allergens: text }))}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
