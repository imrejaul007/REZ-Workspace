/**
 * Multi-Location Store Management Screen
 * List store locations, switch active store, add new locations
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

const ACTIVE_STORE_KEY = 'rez_active_store';

interface StoreStats {
  dailyVisits: number;
  monthlyRevenue: number;
}

interface LocationStore {
  _id: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
  stats: StoreStats;
}

interface AddStoreForm {
  name: string;
  address: string;
  city: string;
  phone: string;
}

const EMPTY_FORM: AddStoreForm = { name: '', address: '', city: '', phone: '' };

function formatRevenue(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
}

export default function LocationsScreen() {
  const [stores, setStores] = useState<LocationStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AddStoreForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const res = await apiClient.get<unknown>('merchant/stores');
      const raw: unknown[] = res?.data?.data ?? res?.data ?? [];
      const parsed: LocationStore[] = (Array.isArray(raw) ? raw : []).map((s) => ({
        _id: s._id ?? s.id ?? '',
        name: s.name ?? 'Unnamed Store',
        address: s.location?.address ?? s.address ?? '',
        city: s.location?.city ?? s.city ?? '',
        isActive: s.isActive ?? false,
        stats: {
          dailyVisits: s.stats?.dailyVisits ?? s.dailyVisits ?? 0,
          monthlyRevenue: s.stats?.monthlyRevenue ?? s.monthlyRevenue ?? 0,
        },
      }));
      setStores(parsed);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadActiveStore = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_STORE_KEY);
      if (stored) setActiveStoreId(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStores();
    loadActiveStore();
  }, [fetchStores, loadActiveStore]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStores();
  }, [fetchStores]);

  const handleSwitchStore = useCallback(
    async (store: LocationStore) => {
      if (switchingId) return;
      setSwitchingId(store._id);
      try {
        await apiClient.post(`merchant/stores/${store._id}/switch`, {});
        await AsyncStorage.setItem(ACTIVE_STORE_KEY, store._id);
        setActiveStoreId(store._id);
        showToast(`Now managing: ${store.name}`);
      } catch {
        // Fallback: just store locally
        await AsyncStorage.setItem(ACTIVE_STORE_KEY, store._id);
        setActiveStoreId(store._id);
        showToast(`Now managing: ${store.name}`);
      } finally {
        setSwitchingId(null);
      }
    },
    [switchingId, showToast]
  );

  const handleAddLocation = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Store name is required.');
      return;
    }
    if (!form.address.trim()) {
      Alert.alert('Validation', 'Address is required.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Validation', 'City is required.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('merchant/stores', {
        name: form.name.trim(),
        location: {
          address: form.address.trim(),
          city: form.city.trim(),
        },
        contact: form.phone.trim() ? { phone: form.phone.trim() } : undefined,
      });
      setForm(EMPTY_FORM);
      setModalVisible(false);
      showToast('Location added successfully');
      await fetchStores();
    } catch (err) {
      Alert.alert('Error', err?.message ?? 'Failed to add location');
    } finally {
      setSubmitting(false);
    }
  }, [form, fetchStores, showToast]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading locations...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <ThemedText style={styles.pageTitle}>My Locations</ThemedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="white" />
            <ThemedText style={styles.addButtonText}>Add Location</ThemedText>
          </TouchableOpacity>
        </View>

        {stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={56} color={Colors.light.textMuted} />
            <ThemedText style={styles.emptyTitle}>No locations found</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Tap "Add Location" to create your first store location.
            </ThemedText>
          </View>
        ) : (
          stores.map((store) => {
            const isActive = activeStoreId === store._id;
            const isSwitching = switchingId === store._id;
            return (
              <View key={store._id} style={[styles.storeCard, isActive && styles.storeCardActive]}>
                <View style={styles.cardTop}>
                  <View style={styles.storeInfo}>
                    <View style={styles.nameBadgeRow}>
                      <ThemedText style={styles.storeName} numberOfLines={1}>
                        {store.name}
                      </ThemedText>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="white" />
                          <ThemedText style={styles.activeBadgeText}>Active</ThemedText>
                        </View>
                      )}
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: store.isActive ? '#10B981' : '#9CA3AF' },
                        ]}
                      />
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: store.isActive ? '#10B981' : '#9CA3AF' },
                        ]}
                      >
                        {store.isActive ? 'Active' : 'Inactive'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.storeAddress} numberOfLines={1}>
                      {[store.address, store.city].filter(Boolean).join(', ')}
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    style={[styles.switchBtn, isActive && styles.switchBtnActive]}
                    onPress={() => handleSwitchStore(store)}
                    disabled={isActive || isSwitching}
                    activeOpacity={0.7}
                  >
                    {isSwitching ? (
                      <ActivityIndicator
                        size="small"
                        color={isActive ? '#3B82F6' : Colors.light.textSecondary}
                      />
                    ) : (
                      <ThemedText
                        style={[styles.switchBtnText, isActive && styles.switchBtnTextActive]}
                      >
                        {isActive ? 'Managing' : 'Switch'}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={14} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.statValue}>{store.stats.dailyVisits}</ThemedText>
                    <ThemedText style={styles.statLabel}>visits today</ThemedText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.statValue}>
                      {formatRevenue(store.stats.monthlyRevenue)}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>this month</ThemedText>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Toast */}
      {toast !== null && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="white" />
          <ThemedText style={styles.toastText}>{toast}</ThemedText>
        </View>
      )}

      {/* Add Location Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Location</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setForm(EMPTY_FORM);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>Store Name *</ThemedText>
              <TextInput
                style={styles.fieldInput}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="e.g. Koramangala Branch"
                placeholderTextColor={Colors.light.textMuted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>Address *</ThemedText>
              <TextInput
                style={styles.fieldInput}
                value={form.address}
                onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
                placeholder="Street address"
                placeholderTextColor={Colors.light.textMuted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>City *</ThemedText>
              <TextInput
                style={styles.fieldInput}
                value={form.city}
                onChangeText={(v) => setForm((p) => ({ ...p, city: v }))}
                placeholder="e.g. Bengaluru"
                placeholderTextColor={Colors.light.textMuted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.formField}>
              <ThemedText style={styles.fieldLabel}>Phone</ThemedText>
              <TextInput
                style={styles.fieldInput}
                value={form.phone}
                onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleAddLocation}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Add Location</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
  },
  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  // Store card
  storeCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  storeCardActive: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
    marginRight: 10,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  storeAddress: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  switchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
    minWidth: 72,
    alignItems: 'center',
  },
  switchBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  switchBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  switchBtnTextActive: {
    color: '#3B82F6',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
    paddingTop: 10,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.border,
    marginHorizontal: 12,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  formField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
