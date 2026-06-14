// Habixo Hourly Booking Screen - Co-working, Studios, Day-use
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';

// Mock hourly properties
const HOURLY_PROPERTIES = [
  {
    id: 'h1',
    title: 'Co-Working Space Koramangala',
    location: 'Koramangala, Bangalore',
    image: 'https://picsum.photos/400/300?random=50',
    hourlyRate: 150,
    halfDayRate: 500,
    fullDayRate: 800,
    rating: 4.7,
    reviews: 234,
    amenities: ['WiFi', 'Power', 'AC', 'Coffee', 'Printer'],
    minHours: 2,
    maxHours: 12,
  },
  {
    id: 'h2',
    title: 'Photo Studio HSR',
    location: 'HSR Layout, Bangalore',
    image: 'https://picsum.photos/400/300?random=51',
    hourlyRate: 300,
    halfDayRate: 1000,
    fullDayRate: 1800,
    rating: 4.9,
    reviews: 89,
    amenities: ['WiFi', 'Lighting', 'Backdrop', 'AC', 'Makeup Area'],
    minHours: 2,
    maxHours: 8,
  },
  {
    id: 'h3',
    title: 'Meeting Room Whitefield',
    location: 'Whitefield, Bangalore',
    image: 'https://picsum.photos/400/300?random=52',
    hourlyRate: 200,
    halfDayRate: 700,
    fullDayRate: 1200,
    rating: 4.6,
    reviews: 156,
    amenities: ['WiFi', 'Projector', 'Whiteboard', 'Video Conf', 'Tea'],
    minHours: 1,
    maxHours: 8,
  },
  {
    id: 'h4',
    title: 'Day-Use Hotel Room',
    location: 'MG Road, Bangalore',
    image: 'https://picsum.photos/400/300?random=53',
    hourlyRate: 250,
    halfDayRate: 800,
    fullDayRate: 1500,
    rating: 4.5,
    reviews: 312,
    amenities: ['WiFi', 'Pool', 'Gym', 'AC', 'Breakfast'],
    minHours: 4,
    maxHours: 12,
  },
];

const CATEGORIES = ['All', 'Co-Working', 'Studios', 'Meeting Rooms', 'Day-Use'];

export default function HabixoHourly() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProperties = selectedCategory === 'All'
    ? HOURLY_PROPERTIES
    : HOURLY_PROPERTIES.filter(p => {
        if (selectedCategory === 'Co-Working') return p.title.toLowerCase().includes('co-work');
        if (selectedCategory === 'Studios') return p.title.toLowerCase().includes('studio');
        if (selectedCategory === 'Meeting Rooms') return p.title.toLowerCase().includes('meeting');
        if (selectedCategory === 'Day-Use') return p.title.toLowerCase().includes('hotel');
        return true;
      });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⏰ Hourly Booking</Text>
        <Text style={styles.headerSubtitle}>
          Co-working, studios, meeting rooms, day-use
        </Text>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Choose hours</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Book instantly</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Get QR code</Text>
        </View>
      </View>

      {/* Properties */}
      <FlashList
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.propertyCard}
            onPress={() => router.push(`/habixo/hourly/${item.id}`)}
          >
            <Image source={{ uri: item.image }} style={styles.propertyImage} />
            <View style={styles.propertyContent}>
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.propertyLocation}>📍 {item.location}</Text>

              {/* Amenities */}
              <View style={styles.amenities}>
                {item.amenities.slice(0, 3).map((amenity, i) => (
                  <Text key={i} style={styles.amenity}>
                    ✓ {amenity}
                  </Text>
                ))}
              </View>

              {/* Pricing */}
              <View style={styles.pricingRow}>
                <View style={styles.priceBlock}>
                  <Text style={styles.priceValue}>₹{item.hourlyRate}</Text>
                  <Text style={styles.priceLabel}>/hour</Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.priceValue}>₹{item.halfDayRate}</Text>
                  <Text style={styles.priceLabel}>4 hrs</Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.priceValue}>₹{item.fullDayRate}</Text>
                  <Text style={styles.priceLabel}>8 hrs</Text>
                </View>
              </View>

              {/* Rating & CTA */}
              <View style={styles.footer}>
                <Text style={styles.rating}>⭐ {item.rating} ({item.reviews})</Text>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        estimatedItemSize={280}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#6366f1', padding: 20, paddingTop: 48 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e7ff', marginTop: 4 },
  categories: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16 },
  categoryChip: { backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#6366f1' },
  categoryText: { fontSize: 14, color: '#6b7280' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  howItWorks: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  step: { alignItems: 'center' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f1', color: '#fff', textAlign: 'center', lineHeight: 28, fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  stepText: { fontSize: 12, color: '#6b7280' },
  stepLine: { width: 30, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8, marginBottom: 16 },
  list: { padding: 16 },
  propertyCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  propertyImage: { width: '100%', height: 150 },
  propertyContent: { padding: 16 },
  propertyTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  propertyLocation: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  amenity: { fontSize: 12, color: '#10b981', marginRight: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 },
  priceBlock: { alignItems: 'center' },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  priceLabel: { fontSize: 11, color: '#6b7280' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rating: { fontSize: 13, color: '#6b7280' },
  bookButton: { backgroundColor: '#6366f1', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  bookButtonText: { color: '#fff', fontWeight: '600' },
});
