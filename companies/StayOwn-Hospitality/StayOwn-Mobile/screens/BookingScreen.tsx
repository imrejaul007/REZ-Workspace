/**
 * StayOwn Mobile - Booking Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280', success: '#10B981' };

export default function BookingScreen({ route, navigation }: any) {
  const { hotelId, roomId } = route.params;

  const handleBook = () => {
    Alert.alert('Booking Confirmed!', 'Your room has been booked. Check My Trips for details.', [
      { text: 'View Booking', onPress: () => navigation.navigate('MyTrips') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Stay</Text>
        <View style={styles.row}><Text style={styles.label}>Hotel</Text><Text style={styles.value}>The Grand Palace</Text></View>
        <View style={styles.row}><Text style={styles.label}>Room</Text><Text style={styles.value}>Deluxe Suite</Text></View>
        <View style={styles.row}><Text style={styles.label}>Check-in</Text><Text style={styles.value}>Jun 1, 2026</Text></View>
        <View style={styles.row}><Text style={styles.label}>Check-out</Text><Text style={styles.value}>Jun 3, 2026</Text></View>
        <View style={styles.row}><Text style={styles.label}>Nights</Text><Text style={styles.value}>2</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <View style={styles.row}><Text style={styles.label}>₹8,500 x 2 nights</Text><Text style={styles.value}>₹17,000</Text></View>
        <View style={styles.row}><Text style={styles.label}>Taxes (18%)</Text><Text style={styles.value}>₹3,060</Text></View>
        <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹20,060</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity style={styles.paymentOption}><Text style={styles.paymentIcon}>💳</Text><Text style={styles.paymentText}>Credit/Debit Card</Text></TouchableOpacity>
        <TouchableOpacity style={styles.paymentOption}><Text style={styles.paymentIcon}>📱</Text><Text style={styles.paymentText}>UPI</Text></TouchableOpacity>
        <TouchableOpacity style={styles.paymentOption}><Text style={styles.paymentIcon}>💰</Text><Text style={styles.paymentText}>REZ Wallet (₹5,000 available)</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
        <Text style={styles.bookBtnText}>Pay ₹20,060</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { backgroundColor: COLORS.white, margin: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 14, color: COLORS.textLight },
  value: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  totalRow: { borderBottomWidth: 0, marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  totalValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  paymentIcon: { fontSize: 24, marginRight: 12 },
  paymentText: { fontSize: 15, color: COLORS.text },
  bookBtn: { backgroundColor: COLORS.primary, margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  bookBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
});
