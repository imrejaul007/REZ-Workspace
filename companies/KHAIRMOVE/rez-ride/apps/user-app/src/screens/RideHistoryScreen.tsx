import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const RIDE_HISTORY = [
  { id: '1', date: 'May 15', from: 'MG Road', to: 'Koramangala', fare: 180, status: 'completed' },
  { id: '2', date: 'May 14', from: 'Indiranagar', to: 'Whitefield', fare: 220, status: 'completed' },
  { id: '3', date: 'May 12', from: 'Electronic City', to: 'MG Road', fare: 350, status: 'completed' },
  { id: '4', date: 'May 10', from: 'Koramangala', to: 'Airport', fare: 450, status: 'completed' },
];

export const RideHistoryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Rides</Text>
      <FlatList
        data={RIDE_HISTORY}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <Text style={styles.rideDate}>{item.date}</Text>
              <Text style={styles.rideFare}>₹{item.fare}</Text>
            </View>
            <View style={styles.rideRoute}>
              <View style={styles.routePoint}>
                <Text style={styles.dotGreen}>●</Text>
                <Text style={styles.routeText}>{item.from}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <Text style={styles.dotRed}>●</Text>
                <Text style={styles.routeText}>{item.to}</Text>
              </View>
            </View>
            <View style={styles.rideActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Help</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Rebook</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  rideCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rideDate: { fontSize: 14, color: '#666' },
  rideFare: { fontSize: 18, fontWeight: 'bold' },
  rideRoute: { marginBottom: 12 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  dotGreen: { color: '#22c55e', fontSize: 10 },
  dotRed: { color: '#ef4444', fontSize: 10 },
  routeText: { marginLeft: 8, fontSize: 16 },
  routeLine: { width: 2, height: 20, backgroundColor: '#ddd', marginLeft: 4, marginVertical: 4 },
  rideActions: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8 },
  actionText: { color: '#6B4EFF', fontWeight: '600' },
});

export default RideHistoryScreen;
