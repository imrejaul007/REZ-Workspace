// RisaCare Mobile - Records Screen

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput
} from 'react-native';

interface HealthRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  lab: string;
  isAbnormal: boolean;
  category: string;
}

const mockRecords: HealthRecord[] = [
  { id: '1', title: 'CBC - Complete Blood Count', type: 'blood_report', date: 'Mar 14, 2026', lab: 'Apollo Diagnostics', isAbnormal: true, category: 'blood' },
  { id: '2', title: 'Lipid Profile', type: 'blood_report', date: 'Feb 20, 2026', lab: 'SRL Diagnostics', isAbnormal: false, category: 'cardiac' },
  { id: '3', title: 'Thyroid Panel', type: 'blood_report', date: 'Jan 15, 2026', lab: 'Apollo Diagnostics', isAbnormal: false, category: 'thyroid' },
  { id: '4', title: 'Vitamin D & B12', type: 'blood_report', date: 'Dec 10, 2025', lab: 'Dr. Lal PathLabs', isAbnormal: true, category: 'nutrition' },
  { id: '5', title: 'HbA1c', type: 'blood_report', date: 'Nov 05, 2025', lab: 'Apollo Diagnostics', isAbnormal: false, category: 'diabetes' }
];

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    blood: '🩸',
    cardiac: '❤️',
    thyroid: '🔬',
    nutrition: '🥗',
    diabetes: '💉',
    liver: '🫀',
    kidney: '🫘',
    general: '📋'
  };
  return icons[category] || icons.general;
};

export default function RecordsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredRecords = mockRecords.filter(record =>
    record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.lab.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRecord = ({ item }: { item: HealthRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
    >
      <View style={styles.recordIcon}>
        <Text style={styles.recordIconText}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.recordContent}>
        <Text style={styles.recordTitle}>{item.title}</Text>
        <Text style={styles.recordMeta}>{item.lab}</Text>
        <Text style={styles.recordDate}>{item.date}</Text>
      </View>
      {item.isAbnormal && (
        <View style={styles.abnormalBadge}>
          <Text style={styles.abnormalText}>⚠️</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports, labs..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {['All', 'Blood', 'Cardiac', 'Thyroid', 'Diabetes'].map((filter, index) => (
          <TouchableOpacity key={filter} style={styles.filterChip}>
            <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        renderItem={renderRecord}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No records found</Text>
            <Text style={styles.emptySubtext}>Upload your health reports to get started</Text>
          </View>
        }
      />

      {/* Upload FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Upload')}
      >
        <Text style={styles.fabIcon}>📤</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333'
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8
  },
  filterText: {
    fontSize: 14,
    color: '#666'
  },
  filterTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  listContent: {
    padding: 16,
    paddingBottom: 100
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  recordIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordIconText: {
    fontSize: 24
  },
  recordContent: {
    flex: 1,
    marginLeft: 12
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  recordMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 4
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  abnormalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF950020',
    alignItems: 'center',
    justifyContent: 'center'
  },
  abnormalText: {
    fontSize: 14
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  fabIcon: {
    fontSize: 24
  }
});
