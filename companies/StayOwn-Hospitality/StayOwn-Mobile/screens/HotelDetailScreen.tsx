/**
 * StayOwn Mobile - Hotel Detail Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280', success: '#10B981' };

const { width } = Dimensions.get('window');

export default function HotelDetailScreen({ route, navigation }: any) {
  const { hotelId } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }} style={styles.heroImage} />
        <View style={styles.content}>
          <Text style={styles.name}>The Grand Palace</Text>
          <Text style={styles.location}>📍 Marine Drive, Mumbai, Maharashtra</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ 4.8</Text>
            <Text style={styles.reviews}>(1,250 reviews)</Text>
          </View>

          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenities}>
            {['Pool', 'Spa', 'WiFi', 'Gym', 'Restaurant', 'Parking'].map((a) => (
              <View key={a} style={styles.amenity}><Text style={styles.amenityText}>{a}</Text></View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Rooms</Text>
          <TouchableOpacity style={styles.roomCard} onPress={() => navigation.navigate('Booking', { hotelId, roomId: '1' })}>
            <Text style={styles.roomName}>Deluxe Suite</Text>
            <Text style={styles.roomPrice}>₹8,500/night</Text>
            <Text style={styles.bookBtn}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroImage: { width, height: 250 },
  content: { padding: 16 },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  location: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rating: { fontSize: 16, fontWeight: '600' },
  reviews: { fontSize: 14, color: COLORS.textLight, marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap' },
  amenity: { backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  amenityText: { fontSize: 13, color: COLORS.text },
  roomCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 12 },
  roomName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  roomPrice: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  bookBtn: { backgroundColor: COLORS.primary, color: COLORS.white, textAlign: 'center', padding: 12, borderRadius: 8, marginTop: 12, overflow: 'hidden', fontSize: 16, fontWeight: '600' },
});
