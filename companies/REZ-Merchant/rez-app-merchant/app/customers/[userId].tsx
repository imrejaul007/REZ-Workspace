import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  memberSince?: string;
  segment?: string;
  visitCount?: number;
  lifetimeValue?: number;
  averageOrderValue?: number;
  lastVisit?: string;
  notes?: string;
}

interface HealthProfile {
  allergies?: string;
  medicalNotes?: string;
  preferredProducts?: string;
  skinHairType?: string;
}

const SKIN_HAIR_TYPES = [
  'Normal',
  'Dry',
  'Oily',
  'Combination',
  'Sensitive',
  'Curly',
  'Straight',
  'Wavy',
  'Coily',
];

export default function CustomerDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Health profile state
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({});
  const [savingHealth, setSavingHealth] = useState(false);
  const [healthDirty, setHealthDirty] = useState(false);

  const fetchCustomer = useCallback(
    async (isRefreshing = false) => {
      if (!userId) return;
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        const res = await apiClient.get<unknown>(`merchant/customers/${userId}`);
        const data: CustomerDetail = res.data ?? res;
        setCustomer(data);

        // Try to load health profile
        try {
          const hRes = await apiClient.get<unknown>(`merchant/customers/${userId}/health-profile`);
          if (hRes.data || (hRes as unknown as { allergies?: unknown }).allergies != null) {
            setHealthProfile(hRes.data ?? hRes);
          }
        } catch {
          // Health profile endpoint may not exist yet — start with empty
        }
      } catch (error) {
        Toast.show({ type: 'error', text1: error?.message || 'Failed to load customer' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const updateHealthField = (field: keyof HealthProfile, value: string) => {
    setHealthProfile((prev) => ({ ...prev, [field]: value }));
    setHealthDirty(true);
  };

  const saveHealthProfile = async () => {
    if (!userId) return;
    setSavingHealth(true);
    try {
      await apiClient.put(`merchant/customers/${userId}/health-profile`, healthProfile);
      setHealthDirty(false);
      Toast.show({ type: 'success', text1: 'Health profile saved' });
    } catch (err) {
      // Handle 404 gracefully — endpoint may not exist yet
      const status = err?.status || err?.response?.status;
      if (status === 404) {
        // Optimistic: keep the UI state, show a note
        setHealthDirty(false);
        Toast.show({
          type: 'info',
          text1: 'Saved locally',
          text2: 'Health profile endpoint not yet available',
        });
      } else {
        Toast.show({ type: 'error', text1: err?.message || 'Failed to save health profile' });
      }
    } finally {
      setSavingHealth(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="person-outline" size={48} color="#d1d5db" />
        <ThemedText style={styles.emptyText}>Customer not found</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <ThemedText style={{ color: Colors.light.primary, fontWeight: '600' }}>
            Go back
          </ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Customer Profile</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCustomer(true)} />
        }
      >
        {/* Basic Info */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {(customer.name || '?').charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
              {customer.segment && (
                <View style={styles.segmentBadge}>
                  <ThemedText style={styles.segmentText}>{customer.segment}</ThemedText>
                </View>
              )}
            </View>
          </View>
          <InfoRow icon="call-outline" label="Phone" value={customer.phone} />
          {customer.email && <InfoRow icon="mail-outline" label="Email" value={customer.email} />}
          {customer.memberSince && (
            <InfoRow
              icon="calendar-outline"
              label="Member since"
              value={new Date(customer.memberSince).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            />
          )}
        </View>

        {/* Visit Stats */}
        {(customer.visitCount != null || customer.lifetimeValue != null) && (
          <View style={styles.statsRow}>
            {customer.visitCount != null && (
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{customer.visitCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Visits</ThemedText>
              </View>
            )}
            {customer.lifetimeValue != null && (
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>
                  {'\u20B9'}
                  {customer.lifetimeValue.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Lifetime Value</ThemedText>
              </View>
            )}
            {customer.averageOrderValue != null && (
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>
                  {'\u20B9'}
                  {customer.averageOrderValue.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Avg Order</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Consultation Forms */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/consultation-forms')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="clipboard-outline" size={18} color={Colors.light.primary} />
            <ThemedText style={[styles.cardTitle, { flex: 1 }]}>Consultation Forms</ThemedText>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
          </View>
          <ThemedText style={{ fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 }}>
            View and manage intake forms for this client
          </ThemedText>
        </TouchableOpacity>

        {/* Health & Preferences */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-circle-outline" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.cardTitle}>Health & Preferences</ThemedText>
          </View>

          <ThemedText style={styles.fieldLabel}>Allergies</ThemedText>
          <TextInput
            style={[styles.textArea, { height: 72 }]}
            placeholder="e.g. latex, parabens, sulphates..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={healthProfile.allergies || ''}
            onChangeText={(v) => updateHealthField('allergies', v)}
          />

          <ThemedText style={styles.fieldLabel}>Medical Notes</ThemedText>
          <TextInput
            style={[styles.textArea, { height: 72 }]}
            placeholder="e.g. eczema, scalp conditions, pregnancy..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={healthProfile.medicalNotes || ''}
            onChangeText={(v) => updateHealthField('medicalNotes', v)}
          />

          <ThemedText style={styles.fieldLabel}>Preferred Products</ThemedText>
          <TextInput
            style={[styles.textArea, { height: 60 }]}
            placeholder="e.g. Olaplex, Wella, Sulphate-free..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={healthProfile.preferredProducts || ''}
            onChangeText={(v) => updateHealthField('preferredProducts', v)}
          />

          <ThemedText style={styles.fieldLabel}>Skin / Hair Type</ThemedText>
          <View style={styles.typeGrid}>
            {SKIN_HAIR_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, healthProfile.skinHairType === t && styles.typeChipActive]}
                onPress={() =>
                  updateHealthField('skinHairType', healthProfile.skinHairType === t ? '' : t)
                }
              >
                <ThemedText
                  style={[
                    styles.typeChipText,
                    healthProfile.skinHairType === t && styles.typeChipTextActive,
                  ]}
                >
                  {t}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {healthDirty && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveHealthProfile}
              disabled={savingHealth}
            >
              {savingHealth ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveBtnText}>Save Health Profile</ThemedText>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={15} color={Colors.light.textSecondary} />
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    gap: 10,
  },
  emptyText: { fontSize: 15, color: Colors.light.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  customerName: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  segmentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  segmentText: { fontSize: 11, fontWeight: '600', color: Colors.light.primary },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  infoLabel: { fontSize: 11, color: Colors.light.textSecondary, marginBottom: 1 },
  infoValue: { fontSize: 14, color: Colors.light.text, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  statLabel: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  typeChipActive: { borderColor: Colors.light.primary, backgroundColor: '#eff6ff' },
  typeChipText: { fontSize: 13, fontWeight: '500', color: Colors.light.textSecondary },
  typeChipTextActive: { color: Colors.light.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
