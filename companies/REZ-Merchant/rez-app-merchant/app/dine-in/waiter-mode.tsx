/**
 * Waiter Mode Screen
 * Restricted waiter interface for taking table orders
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import dineInService, { TableStatus } from '@/services/api/dineIn';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';
import { Colors, Shadows, Spacing } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');
const GRID_COLS = 2;
const TABLE_SIZE = (width - Spacing.lg * 2 - Spacing.md) / GRID_COLS;

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

// E4: Guard JSON.parse of the selectedTable route param — a malformed
// URI (e.g. truncated deep-link, stale history) previously crashed the
// screen on mount inside useState, losing any active order state.
function parseSelectedTable(raw?: string): TableStatus | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TableStatus;
  } catch {
    if (__DEV__) console.warn('[WaiterMode] malformed selectedTable param, ignoring');
    return null;
  }
}

export default function WaiterModeScreen() {
  const { selectedTable: selectedTableParam } = useLocalSearchParams<{ selectedTable: string }>();
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableStatus | null>(
    parseSelectedTable(selectedTableParam)
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<unknown[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    loadWaiterInfo();
    loadTables();
    loadProducts();
  }, []);

  const loadWaiterInfo = async () => {
    try {
      const merchantData = await storageService.getMerchantData<unknown>();
      setStaffName(merchantData?.staffName || merchantData?.name || 'Waiter');
    } catch (error) {
      if (__DEV__) console.error('[Waiter Mode] Failed to load staff info:', error);
    }
  };

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;

      if (!storeId) {
        setLoading(false);
        return;
      }

      const response = await dineInService.getTableStatus(storeId);
      setTables(response.tables);
    } catch (error) {
      if (__DEV__) console.error('[Waiter Mode] Failed to load tables:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;

      if (!storeId) return;

      const response = await apiClient.get(`/merchant/products?storeId=${storeId}`);
      if (response.success && response.data?.products) {
        setAllProducts(response.data.products);
      }
    } catch (error) {
      if (__DEV__) console.error('[Waiter Mode] Failed to load products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTables();
  }, [loadTables]);

  const handleSelectTable = (table: TableStatus) => {
    setSelectedTable(table);
    setOrderItems([]);
  };

  const handleAddItem = (product) => {
    const existingItem = orderItems.find((item) => item.productId === product._id);

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: product._id,
          name: product.name,
          quantity: 1,
          price: product.price || 0,
        },
      ]);
    }
    setSearchQuery('');
    setSearchModalVisible(false);
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.productId !== productId));
  };

  const handleReduceQuantity = (productId: string) => {
    setOrderItems(
      orderItems
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable || orderItems.length === 0) {
      platformAlertSimple('Error', 'Please select a table and add items');
      return;
    }

    try {
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;

      const response = await apiClient.post('/merchant/kds/fire', {
        storeId,
        tableId: selectedTable.tableId,
        tableNumber: selectedTable.tableNumber,
        items: orderItems,
        sentBy: staffName,
        sentAt: new Date().toISOString(),
      });

      if (response.success) {
        platformAlert('Success', `Order sent to kitchen for Table ${selectedTable.tableNumber}`, [
          {
            text: 'OK',
            onPress: () => {
              setOrderItems([]);
              setSelectedTable(null);
            },
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to send order');
      }
    } catch (error) {
      platformAlertSimple('Error', error?.message || 'Failed to send order to kitchen');
    }
  };

  const handleBillReady = async () => {
    if (!selectedTable) {
      platformAlertSimple('Error', 'Please select a table');
      return;
    }

    try {
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;

      router.push({
        pathname: '/pos',
        params: {
          tableId: selectedTable.tableId,
          tableNumber: selectedTable.tableNumber,
          mode: 'dine-in',
        },
      });
    } catch (error) {
      platformAlertSimple('Error', 'Failed to navigate to payment');
    }
  };

  const filteredProducts = allProducts.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Waiter Mode</Text>
              <Text style={styles.headerSubtitle}>{staffName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="person-circle" size={32} color={Colors.primary[600]} />
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Table Grid Section */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.tablesSection}>
            <Text style={styles.sectionTitle}>Select Table</Text>
            <View style={styles.tablesGrid}>
              {tables.map((table) => (
                <TouchableOpacity
                  key={table.tableId}
                  style={[
                    styles.tableCard,
                    {
                      width: TABLE_SIZE,
                      backgroundColor:
                        selectedTable?.tableId === table.tableId
                          ? Colors.primary[50]
                          : table.status === 'occupied'
                            ? Colors.error[50]
                            : Colors.success[50],
                      borderColor:
                        selectedTable?.tableId === table.tableId
                          ? Colors.primary[600]
                          : table.status === 'occupied'
                            ? Colors.error[600]
                            : Colors.success[600],
                    },
                  ]}
                  onPress={() => handleSelectTable(table)}
                >
                  <View
                    style={[
                      styles.tableStatusDot,
                      {
                        backgroundColor:
                          selectedTable?.tableId === table.tableId
                            ? Colors.primary[600]
                            : table.status === 'occupied'
                              ? Colors.error[600]
                              : Colors.success[600],
                      },
                    ]}
                  />
                  <Text style={styles.tableNumber}>T{table.tableNumber}</Text>
                  <Text style={styles.tableCapacity}>
                    {table.capacity} {table.capacity === 1 ? 'seat' : 'seats'}
                  </Text>
                  {table.status === 'occupied' && (
                    <Text style={styles.tableGuests}>{table.guestCount || 0} guests</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Selected Table Panel */}
          {selectedTable && (
            <Animated.View entering={ZoomIn.delay(300)} style={styles.tablePanel}>
              <View style={styles.tablePanelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Table {selectedTable.tableNumber}</Text>
                  <Text style={styles.panelSubtitle}>
                    {selectedTable.capacity} capacity · {selectedTable.guestCount || 0} guests
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleSelectTable(selectedTable)}>
                  <Ionicons name="close-circle" size={28} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              {/* Order Items */}
              <View style={styles.orderSection}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderTitle}>
                    {orderItems.length === 0 ? 'No items added' : `${orderItems.length} items`}
                  </Text>
                  {orderItems.length > 0 && (
                    <Text style={styles.orderAmount}>
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  )}
                </View>

                {orderItems.length > 0 && (
                  <View style={styles.itemsList}>
                    {orderItems.map((item) => (
                      <View key={item.productId} style={styles.orderItem}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>
                            ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} x{' '}
                            {item.quantity}
                          </Text>
                        </View>
                        <View style={styles.itemControls}>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => handleReduceQuantity(item.productId)}
                          >
                            <Ionicons name="remove" size={18} color={Colors.primary[600]} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => {
                              const product = allProducts.find((p) => p._id === item.productId);
                              if (product) handleAddItem(product);
                            }}
                          >
                            <Ionicons name="add" size={18} color={Colors.primary[600]} />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveItem(item.productId)}>
                          <Ionicons name="trash" size={18} color={Colors.error[600]} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Add Item Button */}
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => setSearchModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              {orderItems.length > 0 && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendToKitchen}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="send" size={18} color="white" />
                    <Text style={styles.sendButtonText}>Send to Kitchen</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedTable.status === 'occupied' && (
                <TouchableOpacity
                  style={styles.billButton}
                  onPress={handleBillReady}
                  activeOpacity={0.85}
                >
                  <Ionicons name="receipt" size={18} color={Colors.primary[600]} />
                  <Text style={styles.billButtonText}>Bill Ready</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </View>

      {/* Product Search Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalSafeArea}>
          <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSearchModalVisible(false)}
              style={styles.modalBackButton}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Item</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[600]} />
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productRow}
                  onPress={() => handleAddItem(item)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productCategory}>{item.category || 'Uncategorized'}</Text>
                  </View>
                  <Text style={styles.productPrice}>
                    ₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.productList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.emptyText}>No products found</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    padding: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  tablesSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'flex-start',
  },
  tableCard: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    ...Shadows.sm,
  },
  tableStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tableCapacity: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  tableGuests: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  tablePanel: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    ...Shadows.md,
  },
  tablePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  panelSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  orderSection: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  itemsList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemPrice: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 20,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary[600],
    marginBottom: 12,
  },
  addItemButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 10,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.success[600],
  },
  sendButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  billButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary[50],
    borderWidth: 1.5,
    borderColor: Colors.primary[600],
    marginTop: 10,
  },
  billButtonText: {
    color: Colors.primary[600],
    fontSize: 15,
    fontWeight: '600',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalPlaceholder: {
    width: 40,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  productList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
