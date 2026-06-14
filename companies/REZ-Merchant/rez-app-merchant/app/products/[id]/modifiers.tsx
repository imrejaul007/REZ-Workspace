import React, { useState, useEffect } from 'react';
import { Colors } from '@/constants/DesignTokens';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  platformAlertSimple,
  platformAlertDestructive,
  platformAlert,
} from '@/utils/platformAlert';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services';

interface ModifierOption {
  label: string;
  price: number;
  isDefault: boolean;
}

interface Modifier {
  _id?: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export default function ProductModifiersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<unknown>(null);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await apiClient.get(`merchant/products/${id}`);
      const p = response.data?.data || response.data;
      setProduct(p);
      setModifiers(p.modifiers || []);
    } catch (error) {
      platformAlertSimple('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addModifier = () => {
    setModifiers((prev) => [
      ...prev,
      {
        name: '',
        required: false,
        multiSelect: false,
        options: [{ label: '', price: 0, isDefault: false }],
      },
    ]);
  };

  const removeModifier = (index: number) => {
    platformAlertDestructive(
      'Remove Modifier',
      'Are you sure?',
      () => {
        setModifiers((prev) => prev.filter((_, i) => i !== index));
      },
      'Remove'
    );
  };

  const updateModifier = (index: number, field: keyof Modifier, value) => {
    setModifiers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addOption = (modIndex: number) => {
    setModifiers((prev) =>
      prev.map((m, i) =>
        i === modIndex
          ? { ...m, options: [...m.options, { label: '', price: 0, isDefault: false }] }
          : m
      )
    );
  };

  const updateOption = (
    modIndex: number,
    optIndex: number,
    field: keyof ModifierOption,
    value: unknown
  ) => {
    setModifiers((prev) =>
      prev.map((m, mi) =>
        mi !== modIndex
          ? m
          : {
              ...m,
              options: m.options.map((o, oi) => (oi === optIndex ? { ...o, [field]: value } : o)),
            }
      )
    );
  };

  const removeOption = (modIndex: number, optIndex: number) => {
    setModifiers((prev) =>
      prev.map((m, mi) =>
        mi !== modIndex
          ? m
          : {
              ...m,
              options: m.options.filter((_, oi) => oi !== optIndex),
            }
      )
    );
  };

  const saveModifiers = async () => {
    // Validate
    for (const mod of modifiers) {
      if (!mod.name.trim()) {
        platformAlertSimple('Validation', 'All modifiers must have a name');
        return;
      }
      for (const opt of mod.options) {
        if (!opt.label.trim()) {
          platformAlertSimple('Validation', `All options in "${mod.name}" must have a label`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      await apiClient.put(`merchant/products/${id}`, { modifiers });
      platformAlert('Saved', 'Modifiers updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      platformAlertSimple('Error', 'Failed to save modifiers');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Modifiers</Text>
          {product && <Text style={styles.productName}>{product.name}</Text>}
        </View>
        <TouchableOpacity onPress={saveModifiers} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Modifiers let customers customize their order (e.g. "Add Cheese +₹50", "No Onion", "Size:
          Small/Medium/Large").
        </Text>

        {modifiers.map((modifier, modIndex) => (
          <View key={modIndex} style={styles.modifierCard}>
            <View style={styles.modifierHeader}>
              <TextInput
                style={styles.modifierNameInput}
                value={modifier.name}
                onChangeText={(v) => updateModifier(modIndex, 'name', v)}
                placeholder="Modifier name (e.g. Add Cheese)"
                placeholderTextColor={Colors.text.disabled}
              />
              <TouchableOpacity onPress={() => removeModifier(modIndex)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.error[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggle, modifier.required && styles.toggleActive]}
                onPress={() => updateModifier(modIndex, 'required', !modifier.required)}
              >
                <Text style={[styles.toggleText, modifier.required && styles.toggleTextActive]}>
                  Required
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, modifier.multiSelect && styles.toggleActive]}
                onPress={() => updateModifier(modIndex, 'multiSelect', !modifier.multiSelect)}
              >
                <Text style={[styles.toggleText, modifier.multiSelect && styles.toggleTextActive]}>
                  Multi-select
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.optionsLabel}>Options</Text>
            {modifier.options.map((option, optIndex) => (
              <View key={optIndex} style={styles.optionRow}>
                <TextInput
                  style={[styles.optionInput, { flex: 2 }]}
                  value={option.label}
                  onChangeText={(v) => updateOption(modIndex, optIndex, 'label', v)}
                  placeholder="Label (e.g. Yes, Small)"
                  placeholderTextColor={Colors.text.disabled}
                />
                <TextInput
                  style={[styles.optionInput, { width: 70 }]}
                  value={option.price > 0 ? String(option.price) : ''}
                  onChangeText={(v) =>
                    updateOption(modIndex, optIndex, 'price', parseFloat(v) || 0)
                  }
                  placeholder="+₹0"
                  placeholderTextColor={Colors.text.disabled}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.defaultBtn, option.isDefault && styles.defaultBtnActive]}
                  onPress={() => updateOption(modIndex, optIndex, 'isDefault', !option.isDefault)}
                >
                  <Ionicons
                    name={option.isDefault ? 'checkmark-circle' : 'radio-button-off'}
                    size={18}
                    color={option.isDefault ? Colors.primary[500] : Colors.text.disabled}
                  />
                </TouchableOpacity>
                {modifier.options.length > 1 && (
                  <TouchableOpacity onPress={() => removeOption(modIndex, optIndex)}>
                    <Ionicons name="close-circle-outline" size={18} color={Colors.error[500]} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addOptionBtn} onPress={() => addOption(modIndex)}>
              <Ionicons name="add" size={16} color={Colors.primary[500]} />
              <Text style={styles.addOptionText}>Add Option</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addModifierBtn} onPress={addModifier}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary[500]} />
          <Text style={styles.addModifierText}>Add Modifier Group</Text>
        </TouchableOpacity>

        {modifiers.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="options-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No modifiers yet</Text>
            <Text style={styles.emptyHint}>Tap "Add Modifier Group" to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  productName: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.primary[500] },
  content: { padding: 16, paddingBottom: 40 },
  hint: {
    fontSize: 13,
    color: Colors.text.tertiary,
    backgroundColor: Colors.primary[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  modifierCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modifierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modifierNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border.default,
    paddingBottom: 4,
    marginRight: 8,
  },
  removeBtn: { padding: 4 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
  },
  toggleActive: { backgroundColor: Colors.primary[100], borderColor: Colors.primary[500] },
  toggleText: { fontSize: 12, color: Colors.text.tertiary, fontWeight: '500' },
  toggleTextActive: { color: Colors.primary[500] },
  optionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  optionInput: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },
  defaultBtn: { padding: 4 },
  defaultBtnActive: {},
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, padding: 8 },
  addOptionText: { fontSize: 13, color: Colors.primary[500], fontWeight: '600' },
  addModifierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.primary[500],
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  addModifierText: { fontSize: 15, color: Colors.primary[500], fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text.secondary, marginTop: 8 },
  emptyHint: { fontSize: 13, color: Colors.text.disabled, textAlign: 'center' },
});
