/**
 * Marketplace Screen
 */

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7c3aed',
  secondary: '#ec4899',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
};

const TWIN_TYPES = [
  { id: 'ALL', name: 'All', icon: 'apps' },
  { id: 'KNOWLEDGE', name: 'Knowledge', icon: 'book' },
  { id: 'SKILL', name: 'Skill', icon: 'construct' },
  { id: 'EXECUTION', name: 'Execution', icon: 'rocket' },
];

const MOCK_MARKETPLACE = [
  { twinId: 'TWIN-001', name: 'Rahul S.', type: 'Knowledge', score: 92, multiplier: 1.8, skills: ['Python', 'ML'] },
  { twinId: 'TWIN-002', name: 'Priya P.', type: 'Skill', score: 88, multiplier: 2.2, skills: ['Figma', 'UI/UX'] },
  { twinId: 'TWIN-003', name: 'Amit K.', type: 'Execution', score: 95, multiplier: 3.1, skills: ['Sales', 'CRM'] },
  { twinId: 'TWIN-004', name: 'Sneha R.', type: 'Skill', score: 90, multiplier: 2.4, skills: ['Data Science'] },
  { twinId: 'TWIN-005', name: 'Vikram S.', type: 'Productivity', score: 86, multiplier: 1.7, skills: ['PM', 'Agile'] },
];

export default function MarketplaceScreen({ navigation }: any) {
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = MOCK_MARKETPLACE.filter(item => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Twin Marketplace</Text>
        <Text style={styles.subtitle}>Hire employees + their AI twins</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or skill..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TWIN_TYPES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedType === item.id && styles.filterChipActive]}
              onPress={() => setSelectedType(item.id)}
            >
              <Ionicons name={item.icon as any} size={16} color={selectedType === item.id ? COLORS.text : COLORS.textSecondary} />
              <Text style={[styles.filterText, selectedType === item.id && styles.filterTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.twinId}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.twinCard}>
            <View style={styles.twinHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.twinInfo}>
                <Text style={styles.twinName}>{item.name}</Text>
                <Text style={styles.twinType}>{item.type} Twin</Text>
              </View>
              <View style={styles.twinScore}>
                <Text style={styles.scoreValue}>{item.score}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>
            <View style={styles.skillsContainer}>
              {item.skills.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
            <View style={styles.twinFooter}>
              <View style={styles.multiplierContainer}>
                <Text style={styles.multiplierValue}>{item.multiplier}x</Text>
                <Text style={styles.multiplierLabel}>Productivity</Text>
              </View>
              <TouchableOpacity style={styles.hireButton}>
                <Text style={styles.hireButtonText}>Hire Twin</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No twins found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 16, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.text },
  filterContainer: { paddingHorizontal: 16, marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 6 },
  filterTextActive: { color: COLORS.text },
  twinCard: { backgroundColor: COLORS.surface, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16 },
  twinHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  twinInfo: { flex: 1, marginLeft: 12 },
  twinName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  twinType: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  twinScore: { alignItems: 'center' },
  scoreValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  scoreLabel: { fontSize: 10, color: COLORS.textSecondary },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  skillBadge: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, marginBottom: 8 },
  skillText: { fontSize: 12, color: COLORS.text },
  twinFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight },
  multiplierContainer: {},
  multiplierValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.success },
  multiplierLabel: { fontSize: 10, color: COLORS.textSecondary },
  hireButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  hireButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 16 },
});
