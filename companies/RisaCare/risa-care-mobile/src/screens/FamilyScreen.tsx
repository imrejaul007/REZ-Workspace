// RisaCare Mobile - Family Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert
} from 'react-native';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  isPrimary: boolean;
}

const relationships = [
  { id: 'self', label: 'Self', icon: '👤' },
  { id: 'father', label: 'Father', icon: '👨' },
  { id: 'mother', label: 'Mother', icon: '👩' },
  { id: 'spouse', label: 'Spouse', icon: '💑' },
  { id: 'son', label: 'Son', icon: '👦' },
  { id: 'daughter', label: 'Daughter', icon: '👧' },
  { id: 'brother', label: 'Brother', icon: '👦' },
  { id: 'sister', label: 'Sister', icon: '👧' },
  { id: 'other', label: 'Other', icon: '👥' }
];

const mockFamily: FamilyMember[] = [
  { id: '1', name: 'Rahul Kumar', relationship: 'self', age: 32, gender: 'male', isPrimary: true },
  { id: '2', name: 'Priya Kumar', relationship: 'spouse', age: 28, gender: 'female', isPrimary: false },
  { id: '3', name: 'Ramesh Kumar', relationship: 'father', age: 62, gender: 'male', isPrimary: false },
  { id: '4', name: 'Sushma Kumar', relationship: 'mother', age: 58, gender: 'female', isPrimary: false }
];

export default function FamilyScreen() {
  const [family, setFamily] = useState<FamilyMember[]>(mockFamily);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relationship: 'self', age: '', gender: 'male' });

  const addMember = () => {
    if (!newMember.name || !newMember.age) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newMember.name,
      relationship: newMember.relationship,
      age: parseInt(newMember.age),
      gender: newMember.gender,
      isPrimary: false
    };

    setFamily([...family, member]);
    setModalVisible(false);
    setNewMember({ name: '', relationship: 'self', age: '', gender: 'male' });
  };

  const removeMember = (id: string) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setFamily(family.filter(m => m.id !== id)) }
      ]
    );
  };

  const getRelationshipIcon = (rel: string) => relationships.find(r => r.id === rel)?.icon || '👤';

  const renderMember = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.avatarText}>{item.name.split(' ').map(n => n[0]).join('')}</Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName}>{item.name}</Text>
          {item.isPrimary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
        </View>
        <Text style={styles.memberRelation}>{getRelationshipIcon(item.relationship)} {item.relationship.charAt(0).toUpperCase() + item.relationship.slice(1)} • {item.age} yrs</Text>
        {item.relationship !== 'self' && (
          <View style={styles.healthCard}>
            <TouchableOpacity style={styles.healthOption}>
              <Text style={styles.healthOptionIcon}>📋</Text>
              <Text style={styles.healthOptionText}>Records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.healthOption}>
              <Text style={styles.healthOptionIcon}>💊</Text>
              <Text style={styles.healthOptionText}>Medications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.healthOption}>
              <Text style={styles.healthOptionIcon}>👨‍⚕️</Text>
              <Text style={styles.healthOptionText}>Doctor</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {!item.isPrimary && (
        <TouchableOpacity style={styles.removeButton} onPress={() => removeMember(item.id)}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Family</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Family List */}
      <FlatList
        data={family}
        renderItem={renderMember}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Family Member</Text>

            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={newMember.name}
              onChangeText={(text) => setNewMember({ ...newMember, name: text })}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <View style={styles.relationshipGrid}>
              {relationships.filter(r => r.id !== 'self').map(rel => (
                <TouchableOpacity
                  key={rel.id}
                  style={[styles.relChip, newMember.relationship === rel.id && styles.relChipActive]}
                  onPress={() => setNewMember({ ...newMember, relationship: rel.id })}
                >
                  <Text style={styles.relChipIcon}>{rel.icon}</Text>
                  <Text style={[styles.relChipText, newMember.relationship === rel.id && styles.relChipTextActive]}>{rel.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Age *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              keyboardType="numeric"
              value={newMember.age}
              onChangeText={(text) => setNewMember({ ...newMember, age: text })}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addMember}>
                <Text style={styles.saveButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
  memberCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
  memberAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  memberInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  memberName: { fontSize: 16, fontWeight: '600', color: '#333' },
  primaryBadge: { backgroundColor: '#34C759', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  primaryText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  memberRelation: { fontSize: 13, color: '#666', marginTop: 4 },
  healthCard: { flexDirection: 'row', marginTop: 12 },
  healthOption: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, alignItems: 'center' },
  healthOptionIcon: { fontSize: 16 },
  healthOptionText: { fontSize: 10, color: '#666', marginTop: 2 },
  removeButton: { padding: 8 },
  removeText: { color: '#FF3B30', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, fontSize: 16 },
  relationshipGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  relChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  relChipActive: { backgroundColor: '#007AFF' },
  relChipIcon: { fontSize: 14, marginRight: 4 },
  relChipText: { fontSize: 13, color: '#666' },
  relChipTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', marginTop: 20 },
  cancelButton: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 8 },
  cancelButtonText: { color: '#666', fontWeight: '600' },
  saveButton: { flex: 2, backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginLeft: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600' }
});
