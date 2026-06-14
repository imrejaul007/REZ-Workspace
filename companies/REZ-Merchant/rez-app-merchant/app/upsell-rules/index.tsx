import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { upsellRulesService, UpsellRule, CreateUpsellRuleData } from '@/services/api/upsellRules';
import { platformAlertSimple } from '@/utils/platformAlert';
import { showAlert } from '@/utils/alert';

const TRIGGER_TYPES = [
  { id: 'unknown' as const, label: 'Any Order', icon: 'cart-outline' },
  { id: 'product' as const, label: 'Specific Product', icon: 'cube-outline' },
  { id: 'category' as const, label: 'Category', icon: 'grid-outline' },
  { id: 'cart_value' as const, label: 'Cart Value', icon: 'cash-outline' },
];

export default function UpsellRulesScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<CreateUpsellRuleData>>({
    triggerType: 'unknown',
    priority: 1,
  });

  const fetchRules = useCallback(
    async (isRefreshing = false) => {
      if (!storeId) return;
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        const data = await upsellRulesService.getRules(storeId);
        setRules(data);
      } catch (err) {
        platformAlertSimple('Error', err.message || 'Failed to load upsell rules');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (rule: UpsellRule) => {
    try {
      await upsellRulesService.toggleRule(rule._id, !rule.isActive);
      setRules((prev) =>
        prev.map((r) => (r._id === rule._id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch (err) {
      platformAlertSimple('Error', err.message);
    }
  };

  const handleDelete = (rule: UpsellRule) => {
    showAlert('Delete Rule', `Delete "${rule.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await upsellRulesService.deleteRule(rule._id);
            setRules((prev) => prev.filter((r) => r._id !== rule._id));
          } catch (err) {
            platformAlertSimple('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    if (
      !form.name?.trim() ||
      !form.suggestedProductName?.trim() ||
      form.suggestedProductPrice == null
    ) {
      platformAlertSimple('Validation', 'Name, suggested product name, and price are required.');
      return;
    }
    if (!storeId) return;
    try {
      setSubmitting(true);
      const newRule = await upsellRulesService.createRule({
        ...form,
        storeId,
        name: form.name?.trim() ?? '',
        triggerType: form.triggerType || 'unknown',
        suggestedProductId: form.suggestedProductId || 'manual',
        suggestedProductName: form.suggestedProductName?.trim() ?? '',
        suggestedProductPrice: form.suggestedProductPrice ?? 0,
      });
      setRules((prev) => [newRule, ...prev]);
      setShowCreateModal(false);
      setForm({ triggerType: 'unknown', priority: 1 });
    } catch (err) {
      platformAlertSimple('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRule = ({ item }: { item: UpsellRule }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ruleName}>{item.name}</Text>
          <Text style={styles.ruleType}>
            {TRIGGER_TYPES.find((t) => t.id === item.triggerType)?.label || item.triggerType}
          </Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggle(item)}
          trackColor={{ true: Colors.light.primary }}
        />
      </View>
      <View style={styles.ruleSuggestion}>
        <Ionicons name="arrow-forward-circle" size={16} color={Colors.light.primary} />
        <Text style={styles.suggestionText}>
          Suggest: {item.suggestedProductName} — ₹{item.suggestedProductPrice}
        </Text>
        {item.discountPercent && item.discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discountPercent}% off</Text>
          </View>
        )}
      </View>
      {item.badgeText && <Text style={styles.badgeText}>{item.badgeText}</Text>}
      <View style={styles.ruleFooter}>
        <Text style={styles.priorityText}>Priority: {item.priority}</Text>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.light.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Upsell Rules</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(item) => item._id}
          renderItem={renderRule}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchRules(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No upsell rules yet</Text>
              <Text style={styles.emptySubtitle}>
                Create rules to automatically suggest add-ons when customers order.
              </Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.createBtnText}>Create First Rule</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Rule Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Upsell Rule</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Rule Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Add dessert with main course"
                placeholderTextColor={Colors.light.textSecondary}
                value={form.name || ''}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              <Text style={styles.fieldLabel}>Trigger Type</Text>
              <View style={styles.triggerRow}>
                {TRIGGER_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.triggerChip,
                      form.triggerType === t.id && styles.triggerChipActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, triggerType: t.id }))}
                  >
                    <Ionicons
                      name={t.icon as unknown as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={form.triggerType === t.id ? '#fff' : Colors.light.textSecondary}
                    />
                    <Text
                      style={[
                        styles.triggerChipText,
                        form.triggerType === t.id && { color: '#fff' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Suggested Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chocolate Brownie"
                placeholderTextColor={Colors.light.textSecondary}
                value={form.suggestedProductName || ''}
                onChangeText={(v) => setForm((f) => ({ ...f, suggestedProductName: v }))}
              />

              <Text style={styles.fieldLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 149"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="decimal-pad"
                value={form.suggestedProductPrice?.toString() || ''}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, suggestedProductPrice: parseFloat(v) || 0 }))
                }
              />

              <Text style={styles.fieldLabel}>Discount % (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="number-pad"
                value={form.discountPercent?.toString() || ''}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, discountPercent: parseInt(v) || undefined }))
                }
              />

              <Text style={styles.fieldLabel}>Badge Text (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Popular Add-on"
                placeholderTextColor={Colors.light.textSecondary}
                value={form.badgeText || ''}
                onChangeText={(v) => setForm((f) => ({ ...f, badgeText: v }))}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Rule</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  addBtn: { padding: 4 },
  list: { padding: 14, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ruleCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ruleName: { fontSize: 15, fontWeight: '700', color: Colors.light.textHeading },
  ruleType: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  ruleSuggestion: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  suggestionText: { fontSize: 13, color: Colors.light.text, flex: 1 },
  discountBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  badgeText: { fontSize: 11, color: Colors.light.primary, fontStyle: 'italic', marginBottom: 6 },
  ruleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priorityText: { fontSize: 11, color: Colors.light.textSecondary },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  createBtn: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  triggerChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  triggerChipText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  submitBtn: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
