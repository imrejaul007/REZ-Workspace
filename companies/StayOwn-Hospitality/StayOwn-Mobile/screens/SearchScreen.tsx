/**
 * StayOwn Mobile - Search Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280' };

const HOTELS = [
  { id: '1', name: 'The Grand Palace', location: 'Mumbai', rating: 4.8, price: 8500, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
  { id: '2', name: 'Skyline Suites', location: 'Delhi', rating: 4.6, price: 6200, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa' },
  { id: '3', name: 'Coastal Retreat', location: 'Goa', rating: 4.7, price: 5500, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d' },
];

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput style={styles.input} placeholder="Search hotels, cities..." value={query} onChangeText={setQuery} />
      </View>
      <FlatList
        data={HOTELS.filter(h => h.name.toLowerCase().includes(query.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.hotelCard} onPress={() => navigation.navigate('HotelDetail', { hotelId: item.id })}>
            <Image source={{ uri: item.image }} style={styles.hotelImage} />
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>{item.name}</Text>
              <Text style={styles.hotelLocation}>{item.location}</Text>
              <Text style={styles.hotelRating}>⭐ {item.rating}  ₹{item.price.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { padding: 16, backgroundColor: COLORS.white },
  input: { backgroundColor: COLORS.background, padding: 12, borderRadius: 10, fontSize: 16 },
  hotelCard: { flexDirection: 'row', backgroundColor: COLORS.white, margin: 16, borderRadius: 12, overflow: 'hidden' },
  hotelImage: { width: 100, height: 100 },
  hotelInfo: { flex: 1, padding: 12 },
  hotelName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  hotelLocation: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  hotelRating: { fontSize: 14, color: COLORS.primary, marginTop: 8 },
});
