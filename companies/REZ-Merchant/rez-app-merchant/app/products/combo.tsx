import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';

interface ComboItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Combo {
  _id: string;
  id: string;
  name: string;
  items: ComboItem[];
  comboPrice: number;
  discountPercentage?: number;
  individualTotal?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ComboProductsScreen() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    items: [] as ComboItem[],
    comboPrice: '',
    validFrom: '',
    validTo: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const [combosRes, productsRes] = await Promise.all([
        apiClient.get<Combo[]>('/merchant/bundles'),
        apiClient.get<Product[]>('/merchant/products?limit=100'),
      ]);

      if (combosRes.success && combosRes.data) {
        setCombos(Array.isArray(combosRes.data) ? combosRes.data : []);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      }
    } catch (error) {
      logger.error('Error fetching combos:', error);
      showAlert('Error', error?.message || 'Failed to load combos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = () => {
    if (!selectedProduct || !selectedQuantity) {
      showAlert('Validation', 'Select product and quantity');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(selectedQuantity);
    const subtotal = product.price * qty;

    const newItem: ComboItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price: product.price,
      subtotal,
    };

    const updatedItems = [...formData.items, newItem];
    const individualTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

    setFormData({
      ...formData,
      items: updatedItems,
    });

    setSelectedProduct('');
    setSelectedQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleCreateCombo = async () => {
    if (!formData.name.trim()) {
      showAlert('Validation', 'Please enter combo name');
      return;
    }
    if (formData.items.length === 0) {
      showAlert('Validation', 'Please add at least one product');
      return;
    }
    if (!formData.comboPrice) {
      showAlert('Validation', 'Please enter combo price');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        items: formData.items,
        comboPrice: parseFloat(formData.comboPrice),
        validFrom: formData.validFrom || null,
        validTo: formData.validTo || null,
      };

      const response = await apiClient.post('/merchant/bundles', payload);
      if (response.success) {
        showAlert('Success', 'Combo created successfully');
        setFormData({
          name: '',
          items: [],
          comboPrice: '',
          validFrom: '',
          validTo: '',
        });
        setShowCreateModal(false);
        await fetchData();
      } else {
        showAlert('Error', response.message || 'Failed to create combo');
      }
    } catch (error) {
      logger.error('Error creating combo:', error);
      showAlert('Error', error?.message || 'Failed to create combo');
    }
  };

  const getIndividualTotal = (): number => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getSavings = (): number => {
    const individualTotal = getIndividualTotal();
    const comboPrice = parseFloat(formData.comboPrice) || 0;
    return individualTotal - comboPrice;
  };

  const getSavingsPercentage = (): number => {
    const individualTotal = getIndividualTotal();
    if (individualTotal === 0) return 0;
    return (getSavings() / individualTotal) * 100;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading combos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Build Combo</ThemedText>
        <TouchableOpacity style={styles.saveButton} onPress={handleCreateCombo}>
          <ThemedText style={styles.saveButtonText}>Save</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active Combos */}
        {combos.filter((c) => c.isActive).length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Active combos</ThemedText>
            <FlashList
              data={combos.filter((c) => c.isActive)}
              renderItem={({ item }: { item: Combo }) => (
                <View style={styles.comboCard}>
                  <View style={styles.comboHeader}>
                    <ThemedText style={styles.comboName}>{item.name}</ThemedText>
                    <View style={styles.discountBadge}>
                      <ThemedText style={styles.discountText}>
                        Save {item.discountPercentage}%
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.comboItems}>
                    {item.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                  </ThemedText>
                  <View style={styles.comboPricing}>
                    <View>
                      <ThemedText style={styles.pricingLabel}>Individual:</ThemedText>
                      <ThemedText style={styles.pricingValue}>₹{item.individualTotal}</ThemedText>
                    </View>
                    <View>
                      <ThemedText style={styles.pricingLabel}>Combo:</ThemedText>
                      <ThemedText style={styles.pricingValue}>₹{item.comboPrice}</ThemedText>
                    </View>
                  </View>
                </View>
              )}
              keyExtractor={(item: Combo) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Create Form */}
        <View style={styles.formSection}>
          <ThemedText style={styles.formTitle}>Create New Combo</ThemedText>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Combo Name</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Family Meal Deal"
              placeholderTextColor={Colors.light.icon}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Add Items */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Add items</ThemedText>
            <View style={styles.addItemRow}>
              <View style={styles.productSelect}>
                <TextInput
                  style={styles.selectInput}
                  placeholder="Select product..."
                  placeholderTextColor={Colors.light.icon}
                  value={
                    selectedProduct
                      ? products.find((p) => p.id === selectedProduct)?.name || ''
                      : ''
                  }
                  editable={false}
                />
                <TouchableOpacity style={styles.selectButton}>
                  <Ionicons name="chevron-down" size={20} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.quantityInput}
                placeholder="Qty"
                placeholderTextColor={Colors.light.icon}
                keyboardType="number-pad"
                value={selectedQuantity}
                onChangeText={setSelectedQuantity}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Ionicons name="add" size={24} color={Colors.light.card} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Items List */}
          {formData.items.length > 0 && (
            <View style={styles.itemsList}>
              <FlashList
                data={formData.items}
                renderItem={({ item, index }: { item: ComboItem; index: number }) => (
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <ThemedText style={styles.itemName}>
                        {item.quantity}× {item.productName}
                      </ThemedText>
                      <ThemedText style={styles.itemPrice}>
                        ₹{item.price} × {item.quantity} = ₹{item.subtotal}
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                      <Ionicons name="close-circle" size={20} color={Colors.light.error} />
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item: ComboItem) => `${item.productId}-${item.quantity}`}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Pricing */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <ThemedText style={styles.pricingLabel}>Individual total:</ThemedText>
              <ThemedText style={styles.pricingValue}>₹{getIndividualTotal()}</ThemedText>
            </View>

            <View style={styles.pricingRow}>
              <ThemedText style={styles.pricingLabel}>Combo price:</ThemedText>
              <TextInput
                style={styles.priceInput}
                placeholder="₹"
                placeholderTextColor={Colors.light.icon}
                keyboardType="decimal-pad"
                value={formData.comboPrice}
                onChangeText={(text) => setFormData({ ...formData, comboPrice: text })}
              />
            </View>

            {formData.comboPrice && (
              <View style={styles.savingsRow}>
                <ThemedText style={styles.savingsLabel}>Customer saves:</ThemedText>
                <ThemedText style={styles.savingsValue}>
                  ₹{getSavings().toFixed(0)} ({getSavingsPercentage().toFixed(0)}%)
                </ThemedText>
              </View>
            )}
          </View>

          {/* Date Range */}
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <ThemedText style={styles.label}>Valid from (optional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.icon}
                value={formData.validFrom}
                onChangeText={(text) => setFormData({ ...formData, validFrom: text })}
              />
            </View>
            <View style={styles.dateInput}>
              <ThemedText style={styles.label}>Valid to (optional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.icon}
                value={formData.validTo}
                onChangeText={(text) => setFormData({ ...formData, validTo: text })}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.card,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  comboCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  comboHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comboName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.success + '20',
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.success,
  },
  comboItems: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 8,
  },
  comboPricing: {
    flexDirection: 'row',
    gap: 16,
  },
  pricingLabel: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  pricingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  formSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  productSelect: {
    flex: 1,
    position: 'relative',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  selectButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
  },
  quantityInput: {
    width: 60,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    marginBottom: 6,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemPrice: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  pricingCard: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceInput: {
    width: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 4,
    fontSize: 14,
    color: Colors.light.text,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.success,
  },
  savingsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.success,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
});
