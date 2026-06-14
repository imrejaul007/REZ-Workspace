// Habixo Hourly Booking Detail - Select Time & Book
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

const PROPERTY = {
  id: 'h1',
  title: 'Co-Working Space Koramangala',
  location: 'Koramangala, Bangalore',
  image: 'https://picsum.photos/800/400?random=50',
  hourlyRate: 150,
  halfDayRate: 500,
  fullDayRate: 800,
  rating: 4.7,
  reviews: 234,
  amenities: ['WiFi', 'Power Outlets', 'AC', 'Coffee', 'Printer', 'Meeting Pod'],
  minHours: 2,
  maxHours: 12,
  availableHours: {
    start: '08:00',
    end: '22:00',
  },
};

const TIME_SLOTS = [
  { time: '08:00', available: true },
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: false },
  { time: '12:00', available: true },
  { time: '13:00', available: true },
  { time: '14:00', available: false },
  { time: '15:00', available: true },
  { time: '16:00', available: true },
  { time: '17:00', available: true },
  { time: '18:00', available: true },
  { time: '19:00', available: false },
  { time: '20:00', available: true },
  { time: '21:00', available: true },
];

const DURATION_OPTIONS = [
  { hours: 2, label: '2 Hours', price: 300 },
  { hours: 4, label: '4 Hours (Half Day)', price: 500 },
  { hours: 6, label: '6 Hours', price: 750 },
  { hours: 8, label: '8 Hours (Full Day)', price: 800 },
];

export default function HourlyBookingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStart, setSelectedStart] = useState('09:00');
  const [selectedDuration, setSelectedDuration] = useState(2);

  const calculatePrice = () => {
    if (selectedDuration === 4) return PROPERTY.halfDayRate;
    if (selectedDuration === 8) return PROPERTY.fullDayRate;
    return selectedDuration * PROPERTY.hourlyRate;
  };

  const totalPrice = calculatePrice();
  const serviceFee = Math.round(totalPrice * 0.1);
  const taxes = Math.round((totalPrice + serviceFee) * 0.18);
  const grandTotal = totalPrice + serviceFee + taxes;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Image */}
        <Image source={{ uri: PROPERTY.image }} style={styles.image} />

        {/* Property Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{PROPERTY.title}</Text>
          <Text style={styles.location}>📍 {PROPERTY.location}</Text>
          <Text style={styles.rating}>⭐ {PROPERTY.rating} ({PROPERTY.reviews} reviews)</Text>

          {/* Amenities */}
          <View style={styles.amenities}>
            {PROPERTY.amenities.map((amenity, i) => (
              <View key={i} style={styles.amenityChip}>
                <Text style={styles.amenityText}>✓ {amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Select Date</Text>
          <View style={styles.dateSelector}>
            {[0, 1, 2, 3].map((day) => {
              const date = new Date();
              date.setDate(date.getDate() + day);
              const dateStr = date.toISOString().split('T')[0];
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dateCard,
                    selectedDate === dateStr && styles.dateCardActive,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={styles.dateDay}>
                    {date.toLocaleDateString('en', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.dateNum}>{date.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Select Duration</Text>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.hours}
                style={[
                  styles.durationCard,
                  selectedDuration === option.hours && styles.durationCardActive,
                ]}
                onPress={() => setSelectedDuration(option.hours)}
              >
                <Text style={styles.durationHours}>{option.label}</Text>
                <Text style={styles.durationPrice}>₹{option.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Select Start Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  selectedStart === slot.time && styles.timeSlotActive,
                  !slot.available && styles.timeSlotDisabled,
                ]}
                onPress={() => slot.available && setSelectedStart(slot.time)}
                disabled={!slot.available}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedStart === slot.time && styles.timeTextActive,
                    !slot.available && styles.timeTextDisabled,
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Price Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                ₹{PROPERTY.hourlyRate} × {selectedDuration} hours
              </Text>
              <Text style={styles.priceValue}>₹{totalPrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>₹{serviceFee}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes (18% GST)</Text>
              <Text style={styles.priceValue}>₹{taxes}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal}</Text>
            </View>
          </View>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <Text style={styles.trustIcon}>🛡️</Text>
          <View>
            <Text style={styles.trustTitle}>Instant Confirmation</Text>
            <Text style={styles.trustText}>Get QR code immediately after payment</Text>
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalDisplay}>
          <Text style={styles.totalDisplayLabel}>Total</Text>
          <Text style={styles.totalDisplayValue}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push('/habixo/checkout')}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  image: { width: '100%', height: 200 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  location: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  rating: { fontSize: 14, color: '#374151' },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  amenityChip: { backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  amenityText: { fontSize: 12, color: '#374151' },
  section: { padding: 16, backgroundColor: '#fff', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  dateSelector: { flexDirection: 'row', justifyContent: 'space-around' },
  dateCard: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center', width: 70 },
  dateCardActive: { backgroundColor: '#6366f1' },
  dateDay: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  dateNum: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  durationCard: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, width: '48%', alignItems: 'center' },
  durationCardActive: { backgroundColor: '#6366f1' },
  durationHours: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  durationPrice: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  timeSlotActive: { backgroundColor: '#6366f1' },
  timeSlotDisabled: { backgroundColor: '#f3f4f6', opacity: 0.5 },
  timeText: { fontSize: 14, color: '#1f2937' },
  timeTextActive: { color: '#fff', fontWeight: '600' },
  timeTextDisabled: { color: '#9ca3af', textDecorationLine: 'line-through' },
  priceCard: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 14, color: '#6b7280' },
  priceValue: { fontSize: 14, color: '#1f2937' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10b981' },
  trustIcon: { fontSize: 32, marginRight: 12 },
  trustTitle: { fontSize: 14, fontWeight: '600', color: '#065f46' },
  trustText: { fontSize: 12, color: '#065f46' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'center' },
  totalDisplay: { flex: 1 },
  totalDisplayLabel: { fontSize: 12, color: '#6b7280' },
  totalDisplayValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  bookButton: { backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  bookButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
