/**
 * Product Variants Management Screen
 * Displays all variants for a specific product with management options
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { productsService } from '@/services';
import { Product } from '@/shared/types';
import { ProductVariant } from '@/types/variants';
import { apiClient } from '@/services/api/client';

interface Variant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  salePrice?: number;
  inventory: {
    quantity: number;
    trackQuantity: boolean;
  };
  attributes: Array<{
    name: string;
    value: string;
  }>;
  image?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export default function ProductVariantsScreen() {
  const params = useLocalSearchParams();
  const { productId } = params;
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Variant combination generator state
  const [generatorVisible, setGeneratorVisible] = useState(false);
  const [axes, setAxes] = useState<Array<{ name: string; values: string[] }>>([]);
  const [currentAxisName, setCurrentAxisName] = useState('');
  const [currentAxisValue, setCurrentAxisValue] = useState('');
  const [combinations, setCombinations] = useState<unknown[]>([]);
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [savingCombos, setSavingCombos] = useState(false);

  const canEdit = hasPermission('products:edit');

  // Generate all combinations from variant axes
  function generateCombinations(variantAxes: Array<{ name: string; values: string[] }>): Array<{
    label: string;
    combination: Record<string, string>;
    price: number;
    stock: number;
  }> {
    if (!variantAxes.length) return [];

    const result: unknown[] = [];

    function recurse(idx: number, current: Record<string, string>) {
      if (idx === variantAxes.length) {
        const label = Object.entries(current)
          .map(([_, v]) => v)
          .join(' / ');
        result.push({
          label,
          combination: { ...current },
          price: 0,
          stock: 0,
        });
        return;
      }
      for (const val of variantAxes[idx].values) {
        recurse(idx + 1, { ...current, [variantAxes[idx].name]: val });
      }
    }

    recurse(0, {});
    return result;
  }

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const productIdStr = Array.isArray(productId) ? productId[0] : productId;

      const [productData, variantsData] = await Promise.all([
        productsService.getProduct(productIdStr),
        productsService.getProductVariants(productIdStr),
      ]);

      setProduct(productData);
      const rawVariants = (variantsData as unknown as { variants?: ProductVariant[] })?.variants || (variantsData as unknown as ProductVariant[]) || [];
      const mappedVariants: Variant[] = rawVariants.map((v: ProductVariant) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.pricing?.finalPrice,
        salePrice: v.pricing?.compareAtPrice,
        inventory: { quantity: v.inventory?.stock ?? 0, trackQuantity: v.inventory?.trackInventory ?? true },
        attributes: v.attributes.map(a => ({ name: a.name, value: a.value })),
        image: v.images?.[0]?.url,
        isDefault: v.isDefault ?? false,
        status: (v.isActive === false ? 'inactive' : 'active') as 'active' | 'inactive',
      }));
      setVariants(mappedVariants);
    } catch (error) {
      logger.error('Error loading data:', error);
      showAlert('Error', error.message || 'Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [productId]);

  const handleAddVariant = () => {
    const productIdStr = Array.isArray(productId) ? productId[0] : productId;
    router.push(`/products/variants/add/${productIdStr}`);
  };

  const handleEditVariant = (variantId: string) => {
    router.push(`/products/variants/edit/${variantId}`);
  };

  const handleDeleteVariant = (variantId: string) => {
    showAlert(
      'Delete Variant',
      'Are you sure you want to delete this variant? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const productIdStr = Array.isArray(productId) ? productId[0] : (productId as string);
              await productsService.deleteVariant(productIdStr, variantId);
              showAlert('Success', 'Variant deleted successfully');
              loadData();
            } catch (error) {
              showAlert('Error', error.message || 'Failed to delete variant');
            }
          },
        },
      ]
    );
  };

  const toggleVariantSelection = (variantId: string) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedVariants(newSelected);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedVariants.size === 0) {
      showAlert('No Selection', 'Please select at least one variant');
      return;
    }

    const actionText =
      action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'delete';

    showAlert(
      `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedVariants.size} variant(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setBulkActionLoading(true);
              const result = await (productsService as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>).bulkVariantAction(
                action,
                Array.from(selectedVariants)
              ) as { successful: number; failed: number };

              showAlert(
                'Success',
                `${result?.successful ?? 0} variant(s) ${actionText}d successfully${
                  (result?.failed ?? 0) > 0 ? `, ${result.failed} failed` : ''
                }`
              );

              setSelectedVariants(new Set());
              loadData();
            } catch (error) {
              showAlert('Error', error.message || 'Failed to perform bulk action');
            } finally {
              setBulkActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGenerateCombinations = () => {
    setGeneratorVisible(true);
  };

  const addAxis = () => {
    if (!currentAxisName.trim()) {
      platformAlertSimple('Validation', 'Please enter an axis name (e.g., Size, Color)');
      return;
    }
    const newAxis = { name: currentAxisName, values: [] };
    setAxes([...axes, newAxis]);
    setCurrentAxisName('');
  };

  const addAxisValue = (axisIdx: number) => {
    if (!currentAxisValue.trim()) {
      platformAlertSimple('Validation', 'Please enter a value');
      return;
    }
    const updatedAxes = [...axes];
    updatedAxes[axisIdx].values.push(currentAxisValue.trim());
    setAxes(updatedAxes);
    setCurrentAxisValue('');
  };

  const removeAxisValue = (axisIdx: number, valueIdx: number) => {
    const updatedAxes = [...axes];
    updatedAxes[axisIdx].values.splice(valueIdx, 1);
    setAxes(updatedAxes);
  };

  const removeAxis = (axisIdx: number) => {
    setAxes(axes.filter((_, i) => i !== axisIdx));
  };

  const doGenerate = () => {
    if (axes.length === 0) {
      platformAlertSimple('Validation', 'Please add at least one axis');
      return;
    }
    for (const axis of axes) {
      if (axis.values.length === 0) {
        platformAlertSimple('Validation', `Axis "${axis.name}" has no values`);
        return;
      }
    }
    setGeneratorLoading(true);
    const combos = generateCombinations(axes);
    const withDefaults = combos.map((c) => ({
      ...c,
      price: product?.price || 0,
      stock: 10,
    }));
    setCombinations(withDefaults);
    setGeneratorLoading(false);
  };

  const saveCombinations = async () => {
    if (combinations.length === 0) {
      platformAlertSimple('Validation', 'Please generate combinations first');
      return;
    }
    try {
      setSavingCombos(true);
      const productIdStr = Array.isArray(productId) ? productId[0] : productId;
      const payload = {
        variants: combinations.map((c) => ({
          name: c.label,
          attributes: Object.entries(c.combination).map(([k, v]) => ({
            name: k,
            value: v,
          })),
          price: c.price,
          inventory: { quantity: c.stock, trackQuantity: true },
        })),
      };
      await apiClient.post(`merchant/products/${productIdStr}/variants/batch`, payload);
      platformAlertSimple('Success', `${combinations.length} variants created successfully`);
      setGeneratorVisible(false);
      setAxes([]);
      setCombinations([]);
      loadData();
    } catch (error) {
      platformAlertSimple('Error', error?.response?.data?.message || 'Failed to save variants');
    } finally {
      setSavingCombos(false);
    }
  };

  const updateComboPrice = (idx: number, price: string) => {
    const updated = [...combinations];
    updated[idx].price = parseFloat(price) || 0;
    setCombinations(updated);
  };

  const updateComboStock = (idx: number, stock: string) => {
    const updated = [...combinations];
    updated[idx].stock = parseInt(stock) || 0;
    setCombinations(updated);
  };

  const renderVariantCard = (variant: Variant) => {
    const isSelected = selectedVariants.has(variant.id);

    return (
      <TouchableOpacity
        key={variant.id}
        style={[styles.variantCard, isSelected && styles.variantCardSelected]}
        onPress={() => canEdit && handleEditVariant(variant.id)}
        onLongPress={() => canEdit && toggleVariantSelection(variant.id)}
        activeOpacity={0.7}
      >
        <View style={styles.variantHeader}>
          <TouchableOpacity
            onPress={() => canEdit && toggleVariantSelection(variant.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? Colors.light.primary : Colors.light.textSecondary}
            />
          </TouchableOpacity>

          {variant.image && <Image source={{ uri: variant.image }} style={styles.variantImage} />}

          <View style={styles.variantInfo}>
            <ThemedText style={styles.variantName}>{variant.name}</ThemedText>
            {variant.sku && <ThemedText style={styles.variantSku}>SKU: {variant.sku}</ThemedText>}
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: variant.status === 'active' ? '#DEF7EC' : '#FEF3C7' },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                { color: variant.status === 'active' ? '#03543F' : '#92400E' },
              ]}
            >
              {variant.status.charAt(0).toUpperCase() + variant.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.variantAttributes}>
          {variant.attributes.map((attr, index) => (
            <View key={index} style={styles.attributeChip}>
              <ThemedText style={styles.attributeText}>
                {attr.name}: {attr.value}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.variantFooter}>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.priceLabel}>Price:</ThemedText>
            {variant.salePrice && variant.salePrice < (variant.price || 0) ? (
              <>
                <ThemedText style={styles.salePrice}>₹{variant.salePrice}</ThemedText>
                <ThemedText style={styles.regularPrice}>₹{variant.price}</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.price}>₹{variant.price || 'N/A'}</ThemedText>
            )}
          </View>

          <View style={styles.stockContainer}>
            <ThemedText style={styles.stockLabel}>Stock:</ThemedText>
            <ThemedText
              style={[
                styles.stockValue,
                {
                  color:
                    variant.inventory.quantity === 0
                      ? Colors.light.destructive
                      : variant.inventory.quantity < 10
                        ? '#F59E0B'
                        : Colors.light.success,
                },
              ]}
            >
              {variant.inventory.quantity}
            </ThemedText>
          </View>

          {canEdit && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditVariant(variant.id)}
              >
                <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteVariant(variant.id)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.light.destructive} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Product Variants
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.loadingText}>Loading variants...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.title}>
              Variants
            </ThemedText>
            {product && <ThemedText style={styles.productName}>{product.name}</ThemedText>}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{variants.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {variants.filter((v) => v.status === 'active').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {variants.filter((v) => v.inventory.quantity === 0).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Out of Stock</ThemedText>
          </View>
        </View>

        {/* Bulk Actions Bar */}
        {selectedVariants.size > 0 && canEdit && (
          <View style={styles.bulkActionsBar}>
            <ThemedText style={styles.bulkActionsText}>{selectedVariants.size} selected</ThemedText>
            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.activateButton]}
                onPress={() => handleBulkAction('activate')}
                disabled={bulkActionLoading}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.bulkActionText}>Activate</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.deactivateButton]}
                onPress={() => handleBulkAction('deactivate')}
                disabled={bulkActionLoading}
              >
                <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.bulkActionText}>Deactivate</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.deleteAllButton]}
                onPress={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
              >
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.bulkActionText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Variants List */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {variants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No Variants</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Add variants to manage different versions of this product
              </ThemedText>
              {canEdit && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddVariant}>
                  <ThemedText style={styles.emptyButtonText}>Add First Variant</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.variantsList}>
              {variants.map((variant) => renderVariantCard(variant))}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Buttons */}
        {canEdit && (
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={[styles.fab, styles.fabSecondary]}
              onPress={handleGenerateCombinations}
            >
              <Ionicons name="grid-outline" size={24} color={Colors.light.background} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.fab} onPress={handleAddVariant}>
              <Ionicons name="add" size={28} color={Colors.light.background} />
            </TouchableOpacity>
          </View>
        )}

        {/* Variant Generator Modal */}
        <Modal visible={generatorVisible} transparent animationType="slide">
          <SafeAreaView style={styles.generatorOverlay}>
            <View style={styles.generatorHeader}>
              <TouchableOpacity onPress={() => setGeneratorVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.generatorTitle}>
                Generate Variants
              </ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.generatorContent}>
              {/* Axis Builder */}
              <View style={styles.generatorSection}>
                <ThemedText type="subtitle" style={styles.sectionLabel}>
                  Define Variant Axes
                </ThemedText>
                <ThemedText style={styles.sectionHelper}>
                  E.g., Size (S, M, L) + Color (Red, Blue) = 6 combinations
                </ThemedText>

                {/* Add new axis */}
                <View style={styles.axisInputRow}>
                  <TextInput
                    placeholder="Axis name (Size, Color, etc.)"
                    value={currentAxisName}
                    onChangeText={setCurrentAxisName}
                    style={[styles.axisInput, { flex: 1 }]}
                    placeholderTextColor={Colors.light.textSecondary}
                  />
                  <TouchableOpacity onPress={addAxis} style={styles.axisAddBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Display axes */}
                {axes.map((axis, axisIdx) => (
                  <View key={axisIdx} style={styles.axisCard}>
                    <View style={styles.axisCardHeader}>
                      <ThemedText style={styles.axisName}>{axis.name}</ThemedText>
                      <TouchableOpacity onPress={() => removeAxis(axisIdx)}>
                        <Ionicons name="trash-outline" size={18} color={Colors.light.destructive} />
                      </TouchableOpacity>
                    </View>

                    {/* Values pills */}
                    <View style={styles.valuesPill}>
                      {axis.values.map((val, valIdx) => (
                        <View key={valIdx} style={styles.valuePill}>
                          <ThemedText style={styles.valuePillText}>{val}</ThemedText>
                          <TouchableOpacity
                            onPress={() => removeAxisValue(axisIdx, valIdx)}
                            style={styles.valuePillX}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>

                    {/* Add value input */}
                    <View style={styles.axisValueInputRow}>
                      <TextInput
                        placeholder="Add value..."
                        value={currentAxisValue}
                        onChangeText={setCurrentAxisValue}
                        style={[styles.axisInput, { flex: 1 }]}
                        placeholderTextColor={Colors.light.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => addAxisValue(axisIdx)}
                        style={styles.axisAddValueBtn}
                      >
                        <Ionicons name="add" size={18} color={Colors.light.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Generate Button */}
              {axes.length > 0 && (
                <TouchableOpacity
                  onPress={doGenerate}
                  disabled={generatorLoading}
                  style={[styles.generateBtn, generatorLoading && { opacity: 0.6 }]}
                >
                  {generatorLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flash-outline" size={18} color="#fff" />
                      <ThemedText style={styles.generateBtnText}>
                        Generate ({axes.reduce((acc, a) => acc * a.values.length, 1)} combos)
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Generated Combinations */}
              {combinations.length > 0 && (
                <View style={styles.generatorSection}>
                  <ThemedText type="subtitle" style={styles.sectionLabel}>
                    Generated Variants ({combinations.length})
                  </ThemedText>

                  {combinations.map((combo, idx) => (
                    <View key={idx} style={styles.comboCard}>
                      <View style={styles.comboHeader}>
                        <ThemedText style={styles.comboLabel}>{combo.label}</ThemedText>
                      </View>
                      <View style={styles.comboRow}>
                        <View style={styles.comboInput}>
                          <ThemedText style={styles.comboInputLabel}>Price</ThemedText>
                          <TextInput
                            value={combo.price.toString()}
                            onChangeText={(v) => updateComboPrice(idx, v)}
                            keyboardType="decimal-pad"
                            style={styles.comboInputField}
                            placeholderTextColor={Colors.light.textSecondary}
                          />
                        </View>
                        <View style={styles.comboInput}>
                          <ThemedText style={styles.comboInputLabel}>Stock</ThemedText>
                          <TextInput
                            value={combo.stock.toString()}
                            onChangeText={(v) => updateComboStock(idx, v)}
                            keyboardType="number-pad"
                            style={styles.comboInputField}
                            placeholderTextColor={Colors.light.textSecondary}
                          />
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* Save All Button */}
                  <TouchableOpacity
                    onPress={saveCombinations}
                    disabled={savingCombos}
                    style={[styles.saveAllBtn, savingCombos && { opacity: 0.6 }]}
                  >
                    {savingCombos ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={18} color="#fff" />
                        <ThemedText style={styles.saveAllBtnText}>
                          Save {combinations.length} Variants
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setCombinations([])} style={styles.clearBtn}>
                    <ThemedText style={styles.clearBtnText}>Clear & Start Over</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: Colors.light.text,
  },
  productName: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.light.textSecondary,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  bulkActionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activateButton: {
    backgroundColor: Colors.light.success,
  },
  deactivateButton: {
    backgroundColor: '#F59E0B',
  },
  deleteAllButton: {
    backgroundColor: Colors.light.destructive,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.background,
  },
  content: {
    flex: 1,
  },
  variantsList: {
    padding: 16,
    gap: 12,
  },
  variantCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  variantCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EFF6FF',
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  variantImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  variantSku: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  variantAttributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  attributeChip: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attributeText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  variantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.destructive,
  },
  regularPrice: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.textSecondary,
  },
  generatorOverlay: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  generatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  generatorTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.light.text,
  },
  generatorContent: {
    flex: 1,
    padding: 16,
  },
  generatorSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionHelper: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  axisInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  axisInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
  },
  axisAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  axisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  axisName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  valuesPill: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  valuePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  valuePillX: {
    padding: 2,
  },
  axisValueInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  axisAddValueBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  comboCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  comboHeader: {
    marginBottom: 10,
  },
  comboLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  comboRow: {
    flexDirection: 'row',
    gap: 12,
  },
  comboInput: {
    flex: 1,
  },
  comboInputLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  comboInputField: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.text,
  },
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  clearBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.destructive,
  },
});
