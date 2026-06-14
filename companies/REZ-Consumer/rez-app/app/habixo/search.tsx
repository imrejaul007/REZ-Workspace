// Habixo Search Screen
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, TextInput, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const FILTERS = ['Price', 'Bedrooms', 'Amenities', 'Instant Book', 'Superhost'];
const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Rating'];

const MOCK_RESULTS = [
  { id: '1', title: 'Modern Apartment Koramangala', location: 'Koramangala, Bangalore', price: 2500, rating: 4.8, image: 'https://picsum.photos/300/200?random=1' },
  { id: '2', title: 'Cozy Room Indiranagar', location: 'Indiranagar, Bangalore', price: 1200, rating: 4.9, image: 'https://picsum.photos/300/200?random=2' },
  { id: '3', title: 'Beach Villa Goa', location: 'Anjuna, Goa', price: 5500, rating: 4.7, image: 'https://picsum.photos/300/200?random=3' },
];

export default function HabixoSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeSort, setActiveSort] = useState('Relevance');

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations, areas..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {FILTERS.map((filter, i) => (
          <TouchableOpacity key={i} style={styles.filterChip}>
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{MOCK_RESULTS.length} properties</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort: {activeSort}</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <FlashList
        data={MOCK_RESULTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => router.push(`/habixo/property/${item.id}`)}
          >
            <Image source={{ uri: item.image }} style={styles.resultImage} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.resultLocation}>{item.location}</Text>
              <View style={styles.resultMeta}>
                <Text style={styles.resultPrice}>₹{item.price}/night</Text>
                <Text style={styles.resultRating}>⭐ {item.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.resultsList}
        estimatedItemSize={120}
      />

      {/* Map Button */}
      <TouchableOpacity style={styles.mapButton}>
        <Text style={styles.mapButtonText}>🗺️ Map</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchHeader: { padding: 16, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 12 },
  searchIcon: { fontSize: 18, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937' },
  filtersRow: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16 },
  filterChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 14, color: '#374151' },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  resultCount: { fontSize: 14, color: '#6b7280' },
  sortButton: { padding: 8 },
  sortText: { fontSize: 14, color: '#374151' },
  resultsList: { padding: 16 },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  resultImage: { width: '100%', height: 150 },
  resultInfo: { padding: 12 },
  resultTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  resultLocation: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultPrice: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  resultRating: { fontSize: 14, color: '#374151' },
  mapButton: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#1f2937', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  mapButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
