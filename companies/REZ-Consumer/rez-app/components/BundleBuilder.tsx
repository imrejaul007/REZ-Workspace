// @ts-nocheck
/**
 * BundleBuilder Component
 * Interactive combo/meal builder
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { MenuItem } from '../services';

interface BundleOption {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  maxSelections?: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    available: boolean;
  }>;
}

interface BundleBuilderProps {
  storeSlug: string;
  baseItems: MenuItem[];
  bundles?: BundleOption[];
  onBundleSelect?: (
    selectedItems: Map<string, Array<{ id: string; name: string; price: number }>>,
    total: number
  ) => void;
  style?: object;
}

export default function BundleBuilder({
  storeSlug,
  baseItems,
  bundles,
  onBundleSelect,
  style,
}: BundleBuilderProps) {
  const [selections, setSelections] = useState<
    Map<string, Array<{ id: string; name: string; price: number }>>
  >(new Map());
  const [expanded, setExpanded] = useState(true);

  const defaultBundles: BundleOption[] = useMemo(() => {
    const mains = baseItems.filter((item) =>
      item.category?.toLowerCase().includes('main') ||
      item.category?.toLowerCase().includes('curry')
    );
    const sides = baseItems.filter((item) =>
      ['bread', 'rice', 'naan', 'roti', 'side'].some((s) =>
        item.category?.toLowerCase().includes(s)
      )
    );
    const drinks = baseItems.filter((item) =>
      ['drink', 'beverage', 'lassi', 'tea', 'coffee'].some((d) =>
        item.category?.toLowerCase().includes(d)
      )
    );
    const desserts = baseItems.filter((item) =>
      ['dessert', 'sweet', 'ice cream'].some((d) =>
        item.category?.toLowerCase().includes(d)
      )
    );

    const options: BundleOption[] = [];

    if (mains.length > 0) {
      options.push({
        id: 'mains',
        name: 'Choose Your Main Course',
        required: true,
        multiSelect: false,
        items: mains.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available ?? true,
        })),
      });
    }

    if (sides.length > 0) {
      options.push({
        id: 'sides',
        name: 'Add a Side',
        required: false,
        multiSelect: true,
        maxSelections: 2,
        items: sides.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available ?? true,
        })),
      });
    }

    if (drinks.length > 0) {
      options.push({
        id: 'drinks',
        name: 'Beverage',
        required: false,
        multiSelect: false,
        items: drinks.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available ?? true,
        })),
      });
    }

    return options;
  }, [baseItems]);

  const activeBundles = bundles || defaultBundles;

  const handleSelect = (
    bundleId: string,
    item: { id: string; name: string; price: number }
  ) => {
    setSelections((prev) => {
      const newSelections = new Map(prev);
      const bundle = activeBundles.find((b) => b.id === bundleId);

      if (bundle?.multiSelect) {
        const current = newSelections.get(bundleId) || [];
        const existingIndex = current.findIndex((i) => i.id === item.id);

        if (existingIndex >= 0) {
          newSelections.set(
            bundleId,
            current.filter((i) => i.id !== item.id)
          );
        } else {
          if (bundle.maxSelections && current.length >= bundle.maxSelections) {
            newSelections.set(bundleId, [...current.slice(1), item]);
          } else {
            newSelections.set(bundleId, [...current, item]);
          }
        }
      } else {
        newSelections.set(bundleId, [item]);
      }

      let total = 0;
      newSelections.forEach((items) => {
        items.forEach((i) => (total += i.price));
      });

      onBundleSelect?.(newSelections, total);
      return newSelections;
    });
  };

  const total = useMemo(() => {
    let sum = 0;
    selections.forEach((items) => {
      items.forEach((i) => (sum += i.price));
    });
    return sum;
  }, [selections]);

  const isRequiredComplete = useMemo(() => {
    return activeBundles
      .filter((b) => b.required)
      .every((bundle) => {
        const selected = selections.get(bundle.id);
        return selected && selected.length > 0;
      });
  }, [activeBundles, selections]);

  const savings = useMemo(() => {
    const itemTotal = activeBundles
      .filter((b) => b.required)
      .reduce((sum, bundle) => {
        const selected = selections.get(bundle.id);
        return sum + (selected?.reduce((s, i) => s + i.price, 0) || 0);
      }, 0);
    return itemTotal * 0.15;
  }, [activeBundles, selections]);

  if (activeBundles.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🎁</Text>
          <Text style={styles.headerTitle}>Build Your Combo</Text>
        </View>
        <View style={styles.headerRight}>
          {isRequiredComplete && (
            <Text style={styles.savings}>
              {savings > 0 ? `Save ₹${savings.toFixed(0)}!` : ''}
            </Text>
          )}
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeBundles.map((bundle) => (
            <View key={bundle.id} style={styles.bundle}>
              <View style={styles.bundleHeader}>
                <Text style={styles.bundleName}>{bundle.name}</Text>
                {bundle.required && (
                  <Text style={styles.required}>Required</Text>
                )}
                {bundle.multiSelect && bundle.maxSelections && (
                  <Text style={styles.maxSelect}>
                    Select up to {bundle.maxSelections}
                  </Text>
                )}
              </View>

              {bundle.items.map((item) => {
                const isSelected = selections
                  .get(bundle.id)
                  ?.some((i) => i.id === item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.item,
                      isSelected && styles.itemSelected,
                      !item.available && styles.itemDisabled,
                    ]}
                    onPress={() => handleSelect(bundle.id, item)}
                    disabled={!item.available}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkbox}>
                      <View
                        style={[
                          styles.checkboxInner,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {item.price > 0 ? `+₹${item.price}` : 'Included'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.total}>
            <Text style={styles.totalLabel}>Combo Total</Text>
            <View style={styles.totalRight}>
              <Text style={styles.totalPrice}>₹{total.toFixed(0)}</Text>
              {savings > 0 && (
                <Text style={styles.savingsAmount}>
                  (Save ₹{savings.toFixed(0)})
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              !isRequiredComplete && styles.addButtonDisabled,
            ]}
            disabled={!isRequiredComplete}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.addButtonText,
                !isRequiredComplete && styles.addButtonTextDisabled,
              ]}
            >
              {isRequiredComplete ? 'Add Combo to Order' : 'Complete your selections'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            💡 Bundles are 15% cheaper than ordering items separately
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0FF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savings: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  chevron: {
    fontSize: 12,
    color: '#8E8E93',
  },
  content: {
    marginTop: 16,
  },
  bundle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bundleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bundleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  required: {
    fontSize: 11,
    color: '#FF3B30',
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  maxSelect: {
    fontSize: 11,
    color: '#8E8E93',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 6,
  },
  itemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F4FF',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemName: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5856D6',
  },
  savingsAmount: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
});
