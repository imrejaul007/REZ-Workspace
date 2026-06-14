/**
 * StayOwn Mobile - Home Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
} from 'react-native';

const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
};

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  amenities: string[];
}

const FEATURED_HOTELS: Hotel[] = [
  { id: '1', name: 'The Grand Palace', location: 'Mumbai, Maharashtra', rating: 4.8, reviews: 1250, price: 8500, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', amenities: ['Pool', 'Spa', 'WiFi'] },
  { id: '2', name: 'Skyline Suites', location: 'Delhi, NCR', rating: 4.6, reviews: 890, price: 6200, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa', amenities: ['WiFi', 'Gym'] },
  { id: '3', name: 'Coastal Retreat', location: 'Goa, India', rating: 4.7, reviews: 2100, price: 5500, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', amenities: ['Beach', 'Pool', 'WiFi'] },
];

const CITIES = [
  { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f' },
  { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5' },
  { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b' },
  { name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2' },
  { name: 'Chennai', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220' },
];

export default function HomeScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');

  const renderHotelCard = ({ item }: { item: Hotel }) => (
    <TouchableOpacity
      style={styles.hotelCard}
      onPress={() => navigation.navigate('HotelDetail', { hotelId: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.hotelImage} />
      <View style={styles.hotelContent}>
        <Text style={styles.hotelName}>{item.name}</Text>
        <Text style={styles.hotelLocation}>{item.location}</Text>
        <View style={styles.hotelFooter}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
          <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome to</Text>
          <Text style={styles.brand}>StayOwn</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search hotels, cities...</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionLabel}>Check-in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionLabel}>Near Me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={styles.actionLabel}>Top Rated</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionLabel}>Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Cities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Cities</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CITIES.map((city, index) => (
            <TouchableOpacity key={index} style={styles.cityCard}>
              <Image source={{ uri: city.image }} style={styles.cityImage} />
              <Text style={styles.cityName}>{city.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Hotels */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Hotels</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={FEATURED_HOTELS}
          renderItem={renderHotelCard}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Offers Banner */}
      <TouchableOpacity style={styles.offerBanner}>
        <View style={styles.offerContent}>
          <Text style={styles.offerTitle}>Get 20% Off!</Text>
          <Text style={styles.offerSubtitle}>Use code STAYOWN20 on your first booking</Text>
        </View>
        <Text style={styles.offerIcon}>🎉</Text>
      </TouchableOpacity>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  cityCard: {
    marginRight: 12,
    alignItems: 'center',
  },
  cityImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cityName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  hotelCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  hotelImage: {
    width: '100%',
    height: 160,
  },
  hotelContent: {
    padding: 16,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviews: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  offerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  offerIcon: {
    fontSize: 40,
  },
});
