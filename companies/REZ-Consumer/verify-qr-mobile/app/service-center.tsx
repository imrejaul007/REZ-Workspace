/**
 * REZ Verify QR - Service Center Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { verifyQrApi } from '../services/verifyQrApi';
import { ServiceCenter } from '../types';

export default function ServiceCenterScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby service centers.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      fetchCenters(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
      setLoading(false);
    }
  };

  const fetchCenters = async (lat: number, lng: number, cat?: string) => {
    setLoading(true);
    try {
      const response = await verifyQrApi.findServiceCenters(lat, lng, cat || undefined);
      if (response.success && response.data) {
        setCenters(response.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (location) {
      await fetchCenters(location.lat, location.lng, category || undefined);
    } else {
      await getLocation();
    }
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (location) {
      fetchCenters(location.lat, location.lng, category || undefined);
    }
  };

  const renderCenter = ({ item }: { item: ServiceCenter }) => (
    <TouchableOpacity style={styles.centerCard}>
      <View style={styles.centerHeader}>
        <View style={styles.centerInfo}>
          <Text style={styles.centerName}>{item.name}</Text>
          <Text style={styles.centerAddress}>{item.address}</Text>
          <Text style={styles.centerCity}>{item.city}, {item.state}</Text>
        </View>
        {item.distance && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
          </View>
        )}
      </View>

      <View style={styles.services}>
        {item.services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
        {item.services.length > 3 && (
          <View style={styles.serviceTag}>
            <Text style={styles.serviceText}>+{item.services.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.centerActions}>
        <TouchableOpacity style={styles.callButton}>
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callText}>{item.phone}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookText}>Book Service</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔧</Text>
      <Text style={styles.emptyTitle}>No Service Centers Found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search or check back later.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Finding nearby service centers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          value={category}
          onChangeText={setCategory}
          placeholder="Search by category (e.g., Electronics)"
          placeholderTextColor="#94A3B8"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <FlatList
        data={centers}
        renderItem={renderCenter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  searchButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  centerAddress: {
    fontSize: 14,
    color: '#64748B',
  },
  centerCity: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  serviceTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#64748B',
  },
  centerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  callIcon: {
    fontSize: 16,
  },
  callText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  bookText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
