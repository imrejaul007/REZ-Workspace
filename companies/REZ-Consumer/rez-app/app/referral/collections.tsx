// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function CollectionsScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createCollection = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter collection name');
      return;
    }
    Alert.alert('Success', 'Collection created!');
    setName('');
    setDescription('');
    setShowCreate(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Text style={styles.addButton}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {collections.length === 0 && !showCreate ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Collections Yet</Text>
            <Text style={styles.emptyText}>
              Create collections to organize your recommended products and share with your audience
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
              <Text style={styles.createButtonText}>Create Collection</Text>
            </TouchableOpacity>
          </View>
        ) : showCreate ? (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create Collection</Text>
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={createCollection}>
                <Text style={styles.submitButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {collections.map((item) => (
              <TouchableOpacity key={item.id} style={styles.item}>
                <View style={styles.itemIcon}>
                  <Text>📚</Text>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.count} items</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 60, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { fontSize: 16, color: '#6366F1', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  addButton: { fontSize: 16, color: '#6366F1', fontWeight: '600' },
  scrollView: { flex: 1 },
  emptyState: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  createButton: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  createButtonText: { color: '#FFFFFF', fontWeight: '600' },
  createForm: { padding: 20, backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16 },
  formTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelButtonText: { color: '#6B7280', fontWeight: '600' },
  submitButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#6366F1' },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
  list: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemContent: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  chevron: { fontSize: 24, color: '#D1D5DB' },
});
