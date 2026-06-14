// Mobile - Bookings List Screen
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const bookings = [
  { id: 'RB12345', property: 'Luxury Marina 2BHK', status: 'payment_pending', amount: 2625000, currency: 'AED', date: 'May 21, 2026' },
  { id: 'RB12340', property: 'Palm Jumeirah Villa', status: 'booking_confirmed', amount: 45000000, currency: 'AED', date: 'May 15, 2026' },
];

const statusColors: Record<string, string> = {
  initiated: '#6b7280',
  payment_pending: '#f59e0b',
  payment_confirmed: '#3b82f6',
  booking_confirmed: '#22c55e',
  cancelled: '#ef4444',
};

const statusLabels: Record<string, string> = {
  initiated: 'Initiated',
  payment_pending: 'Awaiting Payment',
  payment_confirmed: 'Payment Confirmed',
  booking_confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export default function BookingsScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Bookings</Text>

      {bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Start exploring properties to book your dream home</Text>
        </View>
      ) : (
        bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.card}
            onPress={() => navigation.navigate('booking', { bookingId: booking.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.bookingId}>#{booking.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[booking.status] + '20' }]}>
                <Text style={[styles.statusText, { color: statusColors[booking.status] }]}>
                  {statusLabels[booking.status]}
                </Text>
              </View>
            </View>

            <Text style={styles.property}>{booking.property}</Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.amount}>
                  {booking.currency === 'AED' ? 'AED ' : '₹'}{booking.amount.toLocaleString()}
                </Text>
                <Text style={styles.date}>{booking.date}</Text>
              </View>
              <Text style={styles.viewDetails}>View Details →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionLabel}>EMI Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>🌍</Text>
            <Text style={styles.actionLabel}>Golden Visa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { color: '#6b7280', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadow: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingId: { fontSize: 12, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  property: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  viewDetails: { color: '#0ea5e9', fontWeight: '500' },
  quickActions: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionItem: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionLabel: { fontSize: 12, color: '#6b7280' },
});
