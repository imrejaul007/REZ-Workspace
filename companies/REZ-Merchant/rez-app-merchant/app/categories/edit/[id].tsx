import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/utils/alert';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface CategoryData {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const result = await apiClient.get(`merchant/categories/${id}`);
      if (result.success && result.data) {
        const cat = result.data;
        setName(cat.name || '');
        setDescription(cat.description || '');
        setIsActive(cat.isActive !== false);
      } else {
        showAlert('Error', 'Category not found.');
        router.back();
      }
    } catch (error) {
      logger.error('Error fetching category:', error);
      showAlert('Error', 'Failed to load category.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Category name is required.');
      return;
    }
    try {
      setSaving(true);
      const result = await apiClient.put(`merchant/categories/${id}`, {
        name: name.trim(),
        description: description.trim(),
        isActive,
      });
      if (!result.success) throw new Error(result.message || 'Failed to update category');
      showAlert('Success', 'Category updated.');
      router.back();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Edit Category
          </ThemedText>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Edit Category
        </ThemedText>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.light.background} />
          ) : (
            <ThemedText style={styles.saveText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Category Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Category name"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              placeholderTextColor={Colors.light.textSecondary}
              multiline
            />
          </View>

          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Active</ThemedText>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary + '80' }}
              thumbColor={isActive ? Colors.light.primary : '#9CA3AF'}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  title: { color: Colors.light.text },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: { color: Colors.light.background, fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.light.background, margin: 16, padding: 20, borderRadius: 12 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.light.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
