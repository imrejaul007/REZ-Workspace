import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

interface ConsultationForm {
  _id: string;
  name: string;
  description?: string;
  fields: { id: string }[];
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

export default function ConsultationFormsScreen() {
  const [forms, setForms] = useState<ConsultationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchForms = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.get<{
        forms?: ConsultationForm[];
        data?: ConsultationForm[] | { forms?: ConsultationForm[] };
      }>('consultation-forms');
      const data: ConsultationForm[] =
        (res as unknown as { forms?: ConsultationForm[]; data?: { forms?: ConsultationForm[] } }).forms ?? (res as unknown as { data?: { forms?: ConsultationForm[] } }).data?.forms ?? (res as unknown as ConsultationForm[]) ?? [];
      setForms(Array.isArray(data) ? data : []);
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Failed to load forms' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchForms();
    }, [fetchForms])
  );

  const toggleActive = async (form: ConsultationForm) => {
    setTogglingId(form._id);
    try {
      await apiClient.put(`consultation-forms/${form._id}`, { active: !form.active });
      setForms((prev) => prev.map((f) => (f._id === form._id ? { ...f, active: !f.active } : f)));
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Failed to update form' });
    } finally {
      setTogglingId(null);
    }
  };

  const renderItem = ({ item }: { item: ConsultationForm }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/consultation-forms/builder?id=${item._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name="clipboard-outline" size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.formName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <ThemedText style={styles.defaultBadgeText}>Default</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.fieldCount}>
            {item.fields.length} field{item.fields.length !== 1 ? 's' : ''}
          </ThemedText>
          {item.description ? (
            <ThemedText style={styles.description} numberOfLines={1}>
              {item.description}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        {togglingId === item._id ? (
          <ActivityIndicator size="small" color={Colors.light.primary} />
        ) : (
          <Switch
            value={item.active}
            onValueChange={() => toggleActive(item)}
            trackColor={{ false: '#e5e7eb', true: Colors.light.primary + '66' }}
            thumbColor={item.active ? Colors.light.primary : '#9ca3af'}
            ios_backgroundColor="#e5e7eb"
          />
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.light.textSecondary}
          style={{ marginTop: 4 }}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Consultation Forms</ThemedText>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/consultation-forms/builder')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={forms}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchForms(true)} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
              <ThemedText style={styles.emptyTitle}>No forms yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Create your first consultation form to collect client information before
                appointments.
              </ThemedText>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/consultation-forms/builder')}
              >
                <ThemedText style={styles.createBtnText}>Create Form</ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  addBtn: {
    backgroundColor: Colors.light.primary,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, gap: 10, paddingBottom: 48 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  formName: { fontSize: 15, fontWeight: '600', color: Colors.light.text, flexShrink: 1 },
  defaultBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.light.primary },
  fieldCount: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  description: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  cardRight: { alignItems: 'center', gap: 2, marginLeft: 8 },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  createBtn: {
    marginTop: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
