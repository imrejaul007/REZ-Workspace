import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/services/api/client';

interface StoreOption {
  _id: string;
  name: string;
  isActive: boolean;
  location?: { city?: string };
}

export default function CreateBrandScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [centralMenuEnabled, setCentralMenuEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('merchant/stores');
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : raw?.stores || raw?.items || [];
        setStores(list.filter((s: StoreOption) => s.isActive));
      } catch {
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    })();
  }, []);

  const toggleStore = (id: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Brand name is required.');
      return;
    }
    if (selectedStoreIds.length === 0) {
      Alert.alert('Validation Error', 'Select at least one store for this brand.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('merchant/brands', {
        name: trimmedName,
        description: description.trim(),
        storeIds: selectedStoreIds,
        settings: {
          centralMenuEnabled,
          centralPricingEnabled: false,
          centralCampaignsEnabled: false,
        },
      });
      Alert.alert('Brand Created', `"${trimmedName}" has been created successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Failed to create brand. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Brand</Text>
          <View style={{ width: 38 }} />
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Brand Details</Text>

            <Text style={styles.label}>Brand Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Biryani House"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of your brand (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Store selection */}
            <Text style={[styles.label, { marginTop: 16 }]}>Outlets *</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
              Select stores that belong to this brand
            </Text>
            {loadingStores ? (
              <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 12 }} />
            ) : stores.length === 0 ? (
              <Text
                style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8 }}
              >
                No active stores found. Create a store first.
              </Text>
            ) : (
              stores.map((store) => {
                const selected = selectedStoreIds.includes(store._id);
                return (
                  <TouchableOpacity
                    key={store._id}
                    style={[styles.storeRow, selected && styles.storeRowSelected]}
                    onPress={() => toggleStore(store._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={selected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={selected ? '#7C3AED' : '#9CA3AF'}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                        {store.name}
                      </Text>
                      {store.location?.city && (
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                          {store.location.city}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setCentralMenuEnabled((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Central Menu</Text>
                <Text style={styles.toggleHint}>Manage one menu and push it to all outlets</Text>
              </View>
              <View style={[styles.toggle, centralMenuEnabled && styles.toggleActive]}>
                <View
                  style={[styles.toggleThumb, centralMenuEnabled && styles.toggleThumbActive]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Brand</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: { height: 100, paddingTop: 10 },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  storeRowSelected: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toggleHint: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: '#7C3AED' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
  submitBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
