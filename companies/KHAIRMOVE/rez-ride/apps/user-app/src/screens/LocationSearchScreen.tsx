import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock recent searches
const RECENT_SEARCHES = [
  { id: '1', address: 'MG Road Metro Station', lat: 12.9758, lng: 77.5964 },
  { id: '2', address: 'Koramangala 5th Block', lat: 12.9352, lng: 77.6245 },
  { id: '3', address: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
];

// Mock saved places
const SAVED_PLACES = [
  { id: '1', name: 'Home', address: '123 Whitefield Main Road', lat: 12.9698, lng: 77.7499 },
  { id: '2', name: 'Office', address: '456 Electronic City', lat: 12.8461, lng: 77.6603 },
];

// Mock search results
const MOCK_RESULTS = [
  { id: '1', address: 'Bangalore International Airport', lat: 13.1979, lng: 77.7063, type: 'airport' },
  { id: '2', address: 'Majestic Bus Station', lat: 12.9762, lng: 77.5715, type: 'bus_station' },
  { id: '3', address: 'Bangalore City Railway Station', lat: 12.9784, lng: 77.5712, type: 'train_station' },
  { id: '4', address: 'Forum Mall, Koramangala', lat: 12.9351, lng: 77.6102, type: 'mall' },
  { id: '5', address: 'UB City, Vittal Mallya Road', lat: 12.9716, lng: 77.5920, type: 'mall' },
  { id: '6', address: 'Phoenix Marketcity, Whitefield', lat: 12.9852, lng: 77.6972, type: 'mall' },
  { id: '7', address: 'ISKCON Temple, Hare Krishna Hill', lat: 13.0096, lng: 77.5510, type: 'temple' },
  { id: '8', address: 'Lalbagh Botanical Garden', lat: 12.9507, lng: 77.5848, type: 'park' },
];

interface LocationSearchScreenProps {
  navigation: any;
  route: {
    params?: {
      mode?: 'pickup' | 'drop' | 'stop';
      stopIndex?: number;
    };
  };
}

export const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const mode = route.params?.mode || 'drop';
  const stopIndex = route.params?.stopIndex;

  // Search locations (mock API call)
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Filter mock results
    const filtered = MOCK_RESULTS.filter(item =>
      item.address.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
    setLoading(false);
  }, []);

  // Handle text change
  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    searchLocations(text);
  };

  // Handle location selection
  const handleSelectLocation = (location: any) => {
    // Navigate back with result
    navigation.navigate('Home', {
      selectedLocation: location,
      mode,
      stopIndex,
    });
  };

  // Get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case 'airport': return 'airplane';
      case 'bus_station': return 'bus';
      case 'train_station': return 'train';
      case 'mall': return 'business';
      case 'temple': return 'moon';
      case 'park': return 'leaf';
      default: return 'location';
    }
  };

  const renderHeader = () => (
    <View>
      {/* Saved Places */}
      {searchQuery.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Places</Text>
          {SAVED_PLACES.map(place => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeItem}
              onPress={() => handleSelectLocation(place)}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="home" size={20} color="#ef4444" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress}>{place.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Searches */}
      {searchQuery.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {RECENT_SEARCHES.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.placeItem}
              onPress={() => handleSelectLocation(item)}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="time" size={20} color="#6b7280" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeAddress}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Results */}
      {searchQuery.length >= 3 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <View style={[styles.searchDot, mode === 'pickup' ? styles.greenDot : styles.redDot]} />
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'pickup' ? 'Pickup location' : mode === 'stop' ? 'Add stop' : 'Where to?'}
            value={searchQuery}
            onChangeText={handleTextChange}
            autoFocus
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleTextChange('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectLocation(item)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name={getIcon(item.type) as any} size={20} color="#6b7280" />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultAddress}>{item.address}</Text>
              <Text style={styles.resultType}>{item.type.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          searchQuery.length >= 3 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          ) : null
        )}
        ListFooterComponent={() => loading ? (
          <ActivityIndicator size="small" color="#6B4EFF" style={styles.loader} />
        ) : null}
      />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="navigate" size={20} color="#6B4EFF" />
          <Text style={styles.actionText}>Current Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="star" size={20} color="#6B4EFF" />
          <Text style={styles.actionText}>Saved Places</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 8, marginRight: 8 },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  greenDot: { backgroundColor: '#22c55e' },
  redDot: { backgroundColor: '#ef4444' },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' },
  placeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  placeInfo: { flex: 1, marginLeft: 12 },
  placeName: { fontSize: 16, fontWeight: '600', color: '#333' },
  placeAddress: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultAddress: { fontSize: 16, color: '#333' },
  resultType: { fontSize: 12, color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  loader: { paddingVertical: 20 },
  bottomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  actionText: { marginLeft: 8, color: '#6B4EFF', fontWeight: '500' },
});

export default LocationSearchScreen;
