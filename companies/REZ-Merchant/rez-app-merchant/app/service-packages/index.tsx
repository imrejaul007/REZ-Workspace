import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';

interface ServiceEntry {
  serviceName: string;
  sessions: number;
}

interface ServicePackage {
  _id: string;
  name: string;
  description?: string;
  services: ServiceEntry[];
  price: number;
  validityDays: number;
  active: boolean;
}

const emptyService = (): ServiceEntry => ({ serviceName: '', sessions: 1 });

export default function ServicePackagesScreen() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formServices, setFormServices] = useState<ServiceEntry[]>([emptyService()]);
  const [formPrice, setFormPrice] = useState('');
  const [formValidity, setFormValidity] = useState('365');
  const [saving, setSaving] = useState(false);

  const fetchPackages = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const merchant = await storageService.getMerchantData<unknown>();
      const sid = merchant?.activeStoreId || merchant?.storeId || merchant?.id || '';
      setStoreId(sid);
      const res = await apiClient.get<unknown>(`service-packages?storeId=${sid}`);
      const data: ServicePackage[] = (res as unknown as { data?: ServicePackage[] }).data ?? (res as unknown as ServicePackage[]) ?? [];
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load packages' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPackages();
    }, [fetchPackages])
  );

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setFormServices([emptyService()]);
    setFormPrice('');
    setFormValidity('365');
    setShowModal(true);
  };

  const openEdit = (pkg: ServicePackage) => {
    setEditing(pkg);
    setFormName(pkg.name);
    setFormDesc(pkg.description || '');
    setFormServices(
      pkg.services.length > 0 ? pkg.services.map((s) => ({ ...s })) : [emptyService()]
    );
    setFormPrice(String(pkg.price));
    setFormValidity(String(pkg.validityDays));
    setShowModal(true);
  };

  const updateServiceEntry = (index: number, field: keyof ServiceEntry, value: string | number) => {
    setFormServices((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addService = () => setFormServices((prev) => [...prev, emptyService()]);

  const removeService = (index: number) => {
    setFormServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }
    const validServices = formServices.filter((s) => s.serviceName.trim());
    try {
      setSaving(true);
      const payload = {
        storeId,
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        services: validServices,
        price: parseFloat(formPrice) || 0,
        validityDays: parseInt(formValidity, 10) || 365,
      };
      if (editing) {
        await apiClient.put(`service-packages/${editing._id}`, payload);
        Toast.show({ type: 'success', text1: 'Package updated' });
      } else {
        await apiClient.post('service-packages', payload);
        Toast.show({ type: 'success', text1: 'Package created' });
      }
      setShowModal(false);
      fetchPackages();
    } catch (e) {
      Toast.show({ type: 'error', text1: e?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg: ServicePackage) => {
    try {
      await apiClient.put(`service-packages/${pkg._id}`, { storeId, active: !pkg.active });
      setPackages((prev) => prev.map((p) => (p._id === pkg._id ? { ...p, active: !p.active } : p)));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update' });
    }
  };

  const handleDelete = (pkg: ServicePackage) => {
    Alert.alert('Delete Package', `Delete "${pkg.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`service-packages/${pkg._id}`);
            setPackages((prev) => prev.filter((p) => p._id !== pkg._id));
            Toast.show({ type: 'success', text1: 'Package deleted' });
          } catch {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        },
      },
    ]);
  };

  const totalSessions = (pkg: ServicePackage) => pkg.services.reduce((s, sv) => s + sv.sessions, 0);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Service Packages</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Sell prepaid bundles and multi-session passes to clients</Text>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPackages(true)} />
        }
      >
        {loading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : packages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No packages yet</Text>
            <Text style={styles.emptySubText}>Create prepaid bundles for your clients</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Text style={styles.emptyBtnText}>+ Create First Package</Text>
            </TouchableOpacity>
          </View>
        ) : (
          packages.map((pkg) => (
            <TouchableOpacity key={pkg._id} style={styles.pkgCard} onPress={() => openEdit(pkg)}>
              <View style={styles.pkgIcon}>
                <Ionicons name="gift-outline" size={22} color="#4f46e5" />
              </View>
              <View style={styles.pkgInfo}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                <Text style={styles.pkgMeta}>
                  {totalSessions(pkg)} sessions · ₹{pkg.price} · {pkg.validityDays}d validity
                </Text>
                {pkg.description ? (
                  <Text style={styles.pkgDesc} numberOfLines={1}>
                    {pkg.description}
                  </Text>
                ) : null}
              </View>
              <Switch
                value={pkg.active}
                onValueChange={() => handleToggleActive(pkg)}
                trackColor={{ true: '#4f46e5' }}
                style={{ marginRight: 8 }}
              />
              <TouchableOpacity onPress={() => handleDelete(pkg)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Package' : 'New Package'}</Text>

              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. 10-Session Massage Bundle"
              />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={styles.input}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="What's included?"
              />

              <Text style={styles.fieldLabel}>Services</Text>
              {formServices.map((svc, idx) => (
                <View key={idx} style={styles.serviceRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    value={svc.serviceName}
                    onChangeText={(v) => updateServiceEntry(idx, 'serviceName', v)}
                    placeholder="Service name"
                  />
                  <TextInput
                    style={[styles.input, styles.sessionsInput]}
                    value={String(svc.sessions)}
                    onChangeText={(v) => updateServiceEntry(idx, 'sessions', parseInt(v, 10) || 1)}
                    keyboardType="numeric"
                    placeholder="Sessions"
                  />
                  {formServices.length > 1 && (
                    <TouchableOpacity onPress={() => removeService(idx)} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addServiceBtn} onPress={addService}>
                <Text style={styles.addServiceBtnText}>+ Add Service</Text>
              </TouchableOpacity>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Validity (days)</Text>
                  <TextInput
                    style={styles.input}
                    value={formValidity}
                    onChangeText={setFormValidity}
                    keyboardType="numeric"
                    placeholder="365"
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.light.text },
  addBtn: { padding: 4 },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary ?? '#6b7280',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  pkgIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pkgInfo: { flex: 1 },
  pkgName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  pkgMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  pkgDesc: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  deleteBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sessionsInput: { width: 70, textAlign: 'center' },
  removeBtn: { marginLeft: 6 },
  addServiceBtn: { marginTop: 4, marginBottom: 4 },
  addServiceBtnText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
  rowInputs: { flexDirection: 'row', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
