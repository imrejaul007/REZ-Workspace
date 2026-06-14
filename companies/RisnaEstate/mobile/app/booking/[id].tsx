// Mobile - Booking Detail Screen
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const statusSteps = [
  { key: 'initiated', label: 'Initiated' },
  { key: 'payment_pending', label: 'Payment' },
  { key: 'payment_confirmed', label: 'Confirmed' },
  { key: 'booking_confirmed', label: 'Complete' },
];

const statusIndex: Record<string, number> = {
  initiated: 0,
  payment_pending: 1,
  payment_confirmed: 2,
  booking_confirmed: 3,
};

export default function BookingDetailScreen({ route, navigation }: any) {
  const { bookingId } = route.params;

  // Demo booking data
  const booking = {
    bookingId: bookingId || 'RB12345',
    status: 'payment_pending',
    property: {
      title: 'Luxury Marina 2BHK',
      location: 'Dubai Marina, Dubai',
    },
    amount: {
      base: 2500000,
      taxes: 125000,
      total: 2625000,
      currency: 'AED',
    },
    payment: {
      razorpayOrderId: 'order_abc123',
    },
    timeline: [
      { status: 'initiated', timestamp: new Date(Date.now() - 86400000), note: 'Booking initiated' },
      { status: 'payment_pending', timestamp: new Date(), note: 'Awaiting payment' },
    ],
  };

  const currentStep = statusIndex[booking.status] || 0;
  const formatPrice = (amount: number) => `AED ${amount.toLocaleString()}`;

  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.bookingId}>Booking #{booking.bookingId}</Text>

        {/* Progress Steps */}
        <View style={styles.steps}>
          {statusSteps.map((step, i) => (
            <View key={step.key} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                i <= currentStep && styles.stepDotActive,
                i < currentStep && styles.stepDotDone,
              ]}>
                {i < currentStep && <Text style={styles.checkmark}>✓</Text>}
                {i === currentStep && <Text style={styles.stepNumber}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>
                {step.label}
              </Text>
              {i < statusSteps.length - 1 && (
                <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Property Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Property</Text>
        <Text style={styles.propertyTitle}>{booking.property.title}</Text>
        <Text style={styles.propertyLocation}>📍 {booking.property.location}</Text>
      </View>

      {/* Amount Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Details</Text>
        <View style={styles.amountRow}>
          <Text>Base Price</Text>
          <Text>{formatPrice(booking.amount.base)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text>Taxes (5%)</Text>
          <Text>{formatPrice(booking.amount.taxes)}</Text>
        </View>
        <View style={[styles.amountRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPrice(booking.amount.total)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {booking.status === 'payment_pending' && (
          <TouchableOpacity style={styles.payButton}>
            <Text style={styles.payButtonText}>💳 Pay Now</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'booking_confirmed' && (
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤 Share Booking</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activity</Text>
        {booking.timeline.map((item: any, i: number) => (
          <View key={i} style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineNote}>{item.note}</Text>
              <Text style={styles.timelineDate}>
                {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  statusCard: { backgroundColor: '#0ea5e9', padding: 20, paddingTop: 50 },
  bookingId: { color: '#fff', fontSize: 14, opacity: 0.8 },
  steps: { flexDirection: 'row', marginTop: 20 },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#fff' },
  stepDotDone: { backgroundColor: '#22c55e' },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  stepNumber: { color: '#0ea5e9', fontWeight: 'bold' },
  stepLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  stepLabelActive: { color: '#fff' },
  stepLine: { position: 'absolute', top: 15, left: '60%', width: '80%', height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepLineActive: { backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  propertyTitle: { fontSize: 18, fontWeight: 'bold' },
  propertyLocation: { color: '#6b7280', marginTop: 4 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 12 },
  totalLabel: { fontWeight: 'bold', fontSize: 16 },
  totalAmount: { fontWeight: 'bold', fontSize: 18, color: '#059669' },
  actions: { padding: 16, gap: 12 },
  payButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  shareButton: { backgroundColor: '#22c55e', padding: 16, borderRadius: 12, alignItems: 'center' },
  shareButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelButton: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#ef4444', fontWeight: '600' },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0ea5e9', marginRight: 12, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineNote: { fontWeight: '500' },
  timelineDate: { color: '#6b7280', fontSize: 12, marginTop: 2 },
});
