// Properties Screen
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';

export default function PropertiesScreen() {
  const [filters, setFilters] = useState({
    country: '',
    type: '',
    budget: '',
  });

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Location</Text>
          <Text style={styles.filterIcon}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Property Type</Text>
          <Text style={styles.filterIcon}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Budget</Text>
          <Text style={styles.filterIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Property List */}
      <FlatList
        data={[]}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.propertyCard}>
            <View style={styles.propertyImage} />
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle}>{item.title}</Text>
              <Text style={styles.propertyLocation}>{item.locality}, {item.city}</Text>
              <View style={styles.propertyMeta}>
                <Text style={styles.propertyPrice}>
                  {item.price.currency === 'AED' ? 'AED ' : '₹'}
                  {item.price.amount.toLocaleString()}
                </Text>
                <Text style={styles.propertyType}>{item.propertyType}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Search for properties</Text>
            <Text style={styles.emptySubtext}>Use filters to find your dream property</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filters: { flexDirection: 'row', padding: 16, backgroundColor: '#ffffff' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 14, color: '#374151' },
  filterIcon: { marginLeft: 4, fontSize: 10, color: '#9ca3af' },
  propertyCard: { backgroundColor: '#ffffff', marginHorizontal: 16, marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  propertyImage: { height: 150, backgroundColor: '#e5e7eb' },
  propertyInfo: { padding: 12 },
  propertyTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  propertyLocation: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  propertyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  propertyPrice: { fontSize: 18, fontWeight: 'bold', color: '#0ea5e9' },
  propertyType: { fontSize: 12, color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
});
