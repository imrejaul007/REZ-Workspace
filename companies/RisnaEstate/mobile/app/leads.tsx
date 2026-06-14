// Mobile - Leads List Screen
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SAMPLE_LEADS = [
  { id: '1', name: 'Rajesh Sharma', phone: '+91 98765 43210', source: 'Website', score: 92, status: 'hot' },
  { id: '2', name: 'Priya Patel', phone: '+91 98765 43211', source: 'Referral', score: 88, status: 'qualified' },
  { id: '3', name: 'Amit Kumar', phone: '+91 98765 43212', source: 'WhatsApp', score: 65, status: 'warm' },
  { id: '4', name: 'Sarah Johnson', phone: '+971 50 123 4567', source: 'NRI', score: 78, status: 'warm' },
  { id: '5', name: 'Vikram Singh', phone: '+91 98765 43213', source: 'Website', score: 45, status: 'cold' },
];

export default function LeadsScreen() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filters = ['all', 'hot', 'qualified', 'warm', 'cold'];

  const filteredLeads = SAMPLE_LEADS.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{item.name}</Text>
                <Text style={styles.leadPhone}>{item.phone}</Text>
              </View>
              <View style={[styles.scoreBadge, item.score >= 80 ? styles.scoreHot : styles.scoreWarm]}>
                <Text style={styles.scoreText}>{item.score}</Text>
              </View>
            </View>

            <View style={styles.leadFooter}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.source}</Text>
              </View>
              <View style={[styles.statusBadge, item.status === 'hot' && styles.statusHot]}>
                <Text style={[styles.statusText, item.status === 'hot' && styles.statusHotText]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="call" size={20} color="#22c55e" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="logo-whatsapp" size={20} color="#22c55e" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="calendar" size={20} color="#0ea5e9" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, borderRadius: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0ea5e9' },
  filterText: { fontSize: 14, color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  leadCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16 },
  leadHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  leadInfo: { flex: 1, marginLeft: 12 },
  leadName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  leadPhone: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreHot: { backgroundColor: '#fef2f2' },
  scoreWarm: { backgroundColor: '#fef9c3' },
  scoreText: { fontSize: 14, fontWeight: '600' },
  leadFooter: { flexDirection: 'row', marginTop: 12 },
  badge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, color: '#6b7280' },
  statusBadge: { marginLeft: 8, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusHot: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 12, color: '#3b82f6' },
  statusHotText: { color: '#ef4444' },
  actions: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  actionBtn: { marginRight: 24 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
