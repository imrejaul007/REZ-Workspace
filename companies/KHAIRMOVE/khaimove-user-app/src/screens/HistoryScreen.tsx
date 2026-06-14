// KHAIRMOVE User App - History Screen
import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';

const MOCK_RIDES = [
  { id: '1', pickup: 'MG Road', drop: 'Koramangala', vehicle: '🚗 Cab', fare: 245, status: 'completed', date: 'Today' },
  { id: '2', pickup: 'Indiranagar', drop: 'Whitefield', vehicle: '🛺 Auto', fare: 180, status: 'completed', date: 'Yesterday' },
  { id: '3', pickup: 'HSR Layout', drop: 'Electronic City', vehicle: '🏍️ Bike', fare: 120, status: 'cancelled', date: 'May 25' },
];

export default function HistoryScreen() {
  const renderItem = ({ item }: any) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <Text style={styles.rideDate}>{item.date}</Text>
        <View style={[styles.statusBadge, item.status === 'completed' ? styles.completed : styles.cancelled]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.rideRoute}>
        <Text style={styles.routePoint}>📍 {item.pickup}</Text>
        <Text style={styles.routeArrow}>↓</Text>
        <Text style={styles.routePoint}>🎯 {item.drop}</Text>
      </View>
      <View style={styles.rideFooter}>
        <Text style={styles.vehicle}>{item.vehicle}</Text>
        <Text style={styles.fare}>₹{item.fare}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Rides</Text>
      </View>
      <FlatList
        data={MOCK_RIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  list: { padding: 16 },
  rideCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rideDate: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  completed: { backgroundColor: '#DCFCE7' },
  cancelled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  rideRoute: { marginBottom: 12 },
  routePoint: { fontSize: 14, color: '#6B7280', marginVertical: 2 },
  routeArrow: { fontSize: 12, color: '#9CA3AF', marginVertical: 4 },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  vehicle: { fontSize: 14, color: '#6B7280' },
  fare: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
});
