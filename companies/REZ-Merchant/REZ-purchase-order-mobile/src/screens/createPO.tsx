import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, addDays, parseISO } from 'date-fns';
import { usePOStore } from '../contexts/store';
import { purchaseOrderApi, supplierApi, productApi } from '../services/api';
import { syncQueue } from '../services/api';
import {
  QuantitySelector,
  LoadingSpinner,
  ConfirmModal,
  SectionHeader,
} from '../components/common';
import {
  RootStackParamList,
  Supplier,
  ProductSearchResult,
  CreatePOItem,
  POItem,
  Address,
} from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'CreatePO'>;

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

interface LineItem extends CreatePOItem {
  key: string;
}

export const CreatePOScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const { selectedSupplier, setSelectedSupplier, isOnline } = usePOStore();

  // Form state
  const [supplier, setSupplier] = useState<Supplier | null>(selectedSupplier);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Address state
  const [deliveryAddress, setDeliveryAddress] = useState<Omit<Address, 'id'>>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    landmark: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState<Supplier[]>([]);
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingSupplier, setIsSearchingSupplier] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Initialize with route params
  useEffect(() => {
    if (route.params?.supplierId && !supplier) {
      loadSupplier(route.params.supplierId);
    }
  }, [route.params?.supplierId]);

  const loadSupplier = async (supplierId: string) => {
    const response = await supplierApi.getSupplier(supplierId);
    if (response.success && response.data) {
      setSupplier(response.data);
    }
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const totalDiscount = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice * (item.discount || 0)) / 100;
  }, 0);

  const totalTax = lineItems.reduce((sum, item) => {
    const taxableAmount = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
    return sum + (taxableAmount * (item.taxRate || 18)) / 100;
  }, 0);

  const grandTotal = subtotal - totalDiscount + totalTax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Supplier search
  const searchSuppliers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSupplierResults([]);
      return;
    }
    setIsSearchingSupplier(true);
    const response = await supplierApi.searchSuppliers(query);
    if (response.success && response.data) {
      setSupplierResults(response.data.suppliers);
    }
    setIsSearchingSupplier(false);
  }, []);

  // Product search
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProductResults([]);
      return;
    }
    if (!supplier) {
      Alert.alert('Error', 'Please select a supplier first');
      return;
    }
    setIsSearchingProduct(true);
    const response = await productApi.searchProducts(query);
    if (response.success && response.data) {
      setProductResults(response.data.products || []);
    }
    setIsSearchingProduct(false);
  }, [supplier]);

  // Add line item
  const addLineItem = useCallback((product: ProductSearchResult) => {
    const newItem: LineItem = {
      key: `item-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unit: product.unit,
      unitPrice: product.avgPrice,
      discount: 0,
      taxRate: 18,
    };
    setLineItems((prev) => [...prev, newItem]);
    setShowProductModal(false);
    setProductSearchQuery('');
    setProductResults([]);
  }, []);

  // Update line item
  const updateLineItem = useCallback((key: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...updates } : item))
    );
  }, []);

  // Remove line item
  const removeLineItem = useCallback((key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  // Add tag
  const addTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // Select supplier
  const selectSupplier = useCallback((selectedSupplier: Supplier) => {
    setSupplier(selectedSupplier);
    setSelectedSupplier(selectedSupplier);
    setShowSupplierModal(false);
    setSupplierSearchQuery('');
    setSupplierResults([]);
  }, [setSelectedSupplier]);

  // Validate form
  const validateForm = useCallback(() => {
    if (!supplier) {
      Alert.alert('Validation Error', 'Please select a supplier');
      return false;
    }
    if (lineItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item');
      return false;
    }
    if (!deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.pincode) {
      Alert.alert('Validation Error', 'Please fill in the delivery address');
      return false;
    }
    return true;
  }, [supplier, lineItems, deliveryAddress]);

  // Submit form
  const handleSubmit = useCallback(async (saveAsDraft = false) => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const poData = {
      supplierId: supplier!.id,
      items: lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
      expectedDeliveryDate,
      notes: notes || undefined,
      deliveryAddress,
      priority,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      if (isOnline) {
        const response = await purchaseOrderApi.createPurchaseOrder(poData);
        if (response.success && response.data) {
          Alert.alert(
            'Success',
            `Purchase Order ${response.data.poNumber} created successfully`,
            [
              {
                text: 'View PO',
                onPress: () => navigation.replace('PODetail', { poId: response.data!.id }),
              },
              { text: 'OK', onPress: () => navigation.goBack() },
            ]
          );
        } else {
          throw new Error(response.error?.message || 'Failed to create purchase order');
        }
      } else {
        // Queue for offline sync
        await syncQueue.add({
          type: 'create',
          entity: 'purchaseOrder',
          data: poData,
        });
        Alert.alert(
          'Saved Offline',
          'Purchase order saved and will be synced when you are back online',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, supplier, lineItems, expectedDeliveryDate, notes, deliveryAddress, priority, tags, isOnline, navigation]);

  // Render line item
  const renderLineItem = (item: LineItem, index: number) => {
    const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);

    return (
      <View key={item.key} style={styles.lineItem}>
        <View style={styles.lineItemHeader}>
          <View style={styles.lineItemInfo}>
            <Text style={styles.lineItemName}>{item.productName}</Text>
            <Text style={styles.lineItemSku}>SKU: {item.sku}</Text>
          </View>
          <TouchableOpacity onPress={() => removeLineItem(item.key)}>
            <MaterialCommunityIcons name="close-circle" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
        <View style={styles.lineItemDetails}>
          <View style={styles.lineItemRow}>
            <Text style={styles.lineItemLabel}>Quantity</Text>
            <QuantitySelector
              value={item.quantity}
              onChange={(qty) => updateLineItem(item.key, { quantity: qty })}
              min={1}
              max={9999}
            />
          </View>
          <View style={styles.lineItemRow}>
            <Text style={styles.lineItemLabel}>Unit Price</Text>
            <TextInput
              style={styles.priceInput}
              value={item.unitPrice.toString()}
              onChangeText={(text) => updateLineItem(item.key, { unitPrice: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
          <View style={styles.lineItemRow}>
            <Text style={styles.lineItemLabel}>Discount %</Text>
            <TextInput
              style={styles.discountInput}
              value={item.discount?.toString() || '0'}
              onChangeText={(text) => updateLineItem(item.key, { discount: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          <View style={styles.lineItemTotal}>
            <Text style={styles.lineItemTotalLabel}>Total</Text>
            <Text style={styles.lineItemTotalValue}>{formatCurrency(itemTotal)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Purchase Order</Text>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => setShowPreview(true)}
          disabled={lineItems.length === 0}
        >
          <MaterialCommunityIcons
            name="eye"
            size={24}
            color={lineItems.length === 0 ? '#CCC' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Supplier Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supplier</Text>
            <TouchableOpacity
              style={styles.supplierCard}
              onPress={() => setShowSupplierModal(true)}
            >
              {supplier ? (
                <View style={styles.supplierInfo}>
                  <View style={styles.supplierHeader}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    {supplier.isVerified && (
                      <MaterialCommunityIcons name="check-decagram" size={16} color="#4CAF50" />
                    )}
                  </View>
                  <Text style={styles.supplierCity}>{supplier.city}, {supplier.state}</Text>
                  {supplier.rating && (
                    <View style={styles.supplierRating}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                      <Text style={styles.ratingText}>{supplier.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.supplierEmpty}>
                  <MaterialCommunityIcons name="domain-plus" size={32} color="#999" />
                  <Text style={styles.supplierEmptyText}>Select Supplier</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
            </TouchableOpacity>
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => setShowProductModal(true)}
                disabled={!supplier}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={supplier ? '#2196F3' : '#CCC'}
                />
                <Text style={[styles.addItemText, !supplier && styles.addItemTextDisabled]}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>

            {lineItems.length === 0 ? (
              <View style={styles.emptyItems}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#CCC" />
                <Text style={styles.emptyItemsText}>No items added yet</Text>
              </View>
            ) : (
              lineItems.map(renderLineItem)
            )}
          </View>

          {/* Delivery Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expected Delivery</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={24} color="#666" />
              <Text style={styles.dateText}>
                {format(parseISO(expectedDeliveryDate), 'MMMM dd, yyyy')}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Priority */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.priorityOptions}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityOption, priority === p && styles.priorityOptionSelected]}
                  onPress={() => setPriority(p)}
                >
                  <MaterialCommunityIcons
                    name={
                      p === 'urgent'
                        ? 'alert'
                        : p === 'high'
                        ? 'arrow-up'
                        : p === 'medium'
                        ? 'minus'
                        : 'arrow-down'
                    }
                    size={18}
                    color={priority === p ? '#FFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p && styles.priorityTextSelected,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressForm}>
              <TextInput
                style={styles.addressInput}
                value={deliveryAddress.line1}
                onChangeText={(text) => setDeliveryAddress((prev) => ({ ...prev, line1: text }))}
                placeholder="Address Line 1 *"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.addressInput}
                value={deliveryAddress.line2}
                onChangeText={(text) => setDeliveryAddress((prev) => ({ ...prev, line2: text }))}
                placeholder="Address Line 2"
                placeholderTextColor="#999"
              />
              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.addressInput, styles.cityInput]}
                  value={deliveryAddress.city}
                  onChangeText={(text) => setDeliveryAddress((prev) => ({ ...prev, city: text }))}
                  placeholder="City *"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.addressInput, styles.stateInput]}
                  value={deliveryAddress.state}
                  onChangeText={(text) => setDeliveryAddress((prev) => ({ ...prev, state: text }))}
                  placeholder="State *"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.addressInput, styles.pincodeInput]}
                  value={deliveryAddress.pincode}
                  onChangeText={(text) => setDeliveryAddress((prev) => ({ ...prev, pincode: text }))}
                  placeholder="Pincode *"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TextInput
                  style={[styles.addressInput, styles.landmarkInput]}
                  value={deliveryAddress.landmark}
                  onChangeText={(text) => setDeliveryAddress((prev) => ({ ...prev, landmark: text }))}
                  placeholder="Landmark"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add unknown special instructions or notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TouchableOpacity key={tag} style={styles.tag} onPress={() => removeTag(tag)}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <MaterialCommunityIcons name="close" size={14} color="#666" />
                </TouchableOpacity>
              ))}
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add tag..."
                  placeholderTextColor="#999"
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity onPress={addTag} disabled={!newTag.trim()}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={newTag.trim() ? '#2196F3' : '#CCC'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.draftButton}
          onPress={() => handleSubmit(true)}
          disabled={isSubmitting}
        >
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => handleSubmit(false)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Create PO</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Supplier Selection Modal */}
      <Modal visible={showSupplierModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSupplierModal(false)}>
          <View style={[styles.modalContent, { height: '80%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                value={supplierSearchQuery}
                onChangeText={(text) => {
                  setSupplierSearchQuery(text);
                  searchSuppliers(text);
                }}
                placeholder="Search suppliers..."
                placeholderTextColor="#999"
                autoFocus
              />
            </View>
            <ScrollView style={styles.modalScroll}>
              {supplierResults.length === 0 && supplierSearchQuery ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No suppliers found</Text>
                </View>
              ) : (
                supplierResults.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.supplierResult}
                    onPress={() => selectSupplier(s)}
                  >
                    <View style={styles.supplierResultInfo}>
                      <Text style={styles.supplierResultName}>{s.name}</Text>
                      <Text style={styles.supplierResultLocation}>{s.city}, {s.state}</Text>
                    </View>
                    {s.rating && (
                      <View style={styles.supplierResultRating}>
                        <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                        <Text style={styles.ratingText}>{s.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowProductModal(false)}>
          <View style={[styles.modalContent, { height: '80%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                value={productSearchQuery}
                onChangeText={(text) => {
                  setProductSearchQuery(text);
                  searchProducts(text);
                }}
                placeholder="Search products..."
                placeholderTextColor="#999"
                autoFocus
              />
            </View>
            <ScrollView style={styles.modalScroll}>
              {productResults.length === 0 && productSearchQuery ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No products found</Text>
                </View>
              ) : (
                productResults.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.productResult}
                    onPress={() => addLineItem(p)}
                  >
                    <View style={styles.productResultInfo}>
                      <Text style={styles.productResultName}>{p.name}</Text>
                      <Text style={styles.productResultSku}>SKU: {p.sku}</Text>
                    </View>
                    <View style={styles.productResultPrice}>
                      <Text style={styles.productPrice}>{formatCurrency(p.avgPrice)}</Text>
                      <Text style={styles.productUnit}>/{p.unit}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPreview(false)}>
          <View style={[styles.modalContent, { height: '90%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Supplier</Text>
                <Text style={styles.previewValue}>{supplier?.name || '-'}</Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Expected Delivery</Text>
                <Text style={styles.previewValue}>
                  {format(parseISO(expectedDeliveryDate), 'MMMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Priority</Text>
                <Text style={styles.previewValue}>{priority.toUpperCase()}</Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Items</Text>
                {lineItems.map((item) => (
                  <View key={item.key} style={styles.previewItem}>
                    <Text style={styles.previewItemName}>{item.productName}</Text>
                    <Text style={styles.previewItemQty}>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.previewTotals}>
                <View style={styles.previewTotalRow}>
                  <Text style={styles.previewTotalLabel}>Subtotal</Text>
                  <Text style={styles.previewTotalValue}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.previewTotalRow}>
                  <Text style={styles.previewTotalLabel}>Discount</Text>
                  <Text style={[styles.previewTotalValue, { color: '#4CAF50' }]}>
                    -{formatCurrency(totalDiscount)}
                  </Text>
                </View>
                <View style={styles.previewTotalRow}>
                  <Text style={styles.previewTotalLabel}>Tax</Text>
                  <Text style={styles.previewTotalValue}>{formatCurrency(totalTax)}</Text>
                </View>
                <View style={[styles.previewTotalRow, styles.previewGrandTotal]}>
                  <Text style={styles.previewGrandTotalLabel}>Grand Total</Text>
                  <Text style={styles.previewGrandTotalValue}>{formatCurrency(grandTotal)}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  previewButton: {
    padding: 8,
    marginRight: -8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  supplierCity: {
    fontSize: 13,
    color: '#666',
  },
  supplierRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
  },
  supplierEmpty: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  supplierEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  addItemTextDisabled: {
    color: '#CCC',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  lineItem: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  lineItemSku: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lineItemDetails: {
    gap: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    textAlign: 'right',
    fontSize: 14,
    color: '#1A1A1A',
  },
  discountInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'right',
    fontSize: 14,
    color: '#1A1A1A',
  },
  lineItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  lineItemTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  lineItemTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  priorityOptionSelected: {
    backgroundColor: '#2196F3',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priorityTextSelected: {
    color: '#FFF',
  },
  addressForm: {
    gap: 12,
  },
  addressInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cityInput: {
    flex: 1,
  },
  stateInput: {
    flex: 1,
  },
  pincodeInput: {
    flex: 1,
  },
  landmarkInput: {
    flex: 2,
  },
  notesInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagInput: {
    minWidth: 80,
    fontSize: 13,
    color: '#1A1A1A',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalScroll: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
  },
  supplierResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  supplierResultInfo: {
    flex: 1,
  },
  supplierResultName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  supplierResultLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  supplierResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productResultInfo: {
    flex: 1,
  },
  productResultName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  productResultSku: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productResultPrice: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  productUnit: {
    fontSize: 12,
    color: '#999',
  },
  previewSection: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  previewItemName: {
    fontSize: 14,
    color: '#333',
  },
  previewItemQty: {
    fontSize: 14,
    color: '#666',
  },
  previewTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#1A1A1A',
  },
  previewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  previewTotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  previewTotalValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  previewGrandTotal: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewGrandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  previewGrandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

export default CreatePOScreen;
