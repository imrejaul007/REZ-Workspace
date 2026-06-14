import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface Delivery {
  id: string;
  orderId: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  driverName?: string;
  driverPhone?: string;
  estimatedTime?: string;
  pickupTime?: string;
  currentLocation?: { lat: number; lng: number };
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Created' },
  { key: 'assigned', label: 'Driver Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

export default function DeliveryTracking({ route }) {
  const { orderId } = route.params;
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDelivery();
  }, [orderId]);

  const fetchDelivery = async () => {
    try {
      const response = await fetch(`/api/v1/merchant/delivery/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDelivery(data.data);
    } catch (error) {
      console.error('Failed to fetch delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex(s => s.key === status);
  };

  const assignDriver = async () => {
    // Navigate to driver selection
  };

  if (loading || !delivery) {
    return <Text>Loading...</Text>;
  }

  const currentIndex = getStatusIndex(delivery.status);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Delivery Status</Text>

      {/* Status Timeline */}
      <View style={styles.timeline}>
        {STATUS_STEPS.map((step, index) => (
          <View key={step.key} style={styles.stepContainer}>
            <View style={[
              styles.stepDot,
              index <= currentIndex && styles.stepDotActive,
              index < currentIndex && styles.stepDotComplete,
            ]} />
            {index < STATUS_STEPS.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentIndex && styles.stepLineComplete,
              ]} />
            )}
            <Text style={[
              styles.stepLabel,
              index <= currentIndex && styles.stepLabelActive,
            ]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Driver Info */}
      {delivery.driverName && (
        <View style={styles.driverCard}>
          <Text style={styles.driverName}>{delivery.driverName}</Text>
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>💬 Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ETA */}
      {delivery.estimatedTime && (
        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>Estimated Arrival</Text>
          <Text style={styles.etaValue}>{delivery.estimatedTime}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {delivery.status === 'pending' && (
          <TouchableOpacity style={styles.primaryButton} onPress={assignDriver}>
            <Text style={styles.primaryButtonText}>Assign Driver</Text>
          </TouchableOpacity>
        )}
        {delivery.status === 'delivered' && (
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  timeline: { padding: 24 },
  stepContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e0e0e0', borderWidth: 3, borderColor: '#fff' },
  stepDotActive: { backgroundColor: '#f59e0b' },
  stepDotComplete: { backgroundColor: '#22c55e' },
  stepLine: { flex: 1, height: 3, backgroundColor: '#e0e0e0', marginHorizontal: 8 },
  stepLineComplete: { backgroundColor: '#22c55e' },
  stepLabel: { marginLeft: 12, fontSize: 14, color: '#999' },
  stepLabelActive: { color: '#333', fontWeight: '600' },
  driverCard: { backgroundColor: '#f9f9f9', padding: 16, margin: 16, borderRadius: 12 },
  driverName: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  driverActions: { flexDirection: 'row', gap: 12 },
  callButton: { flex: 1, backgroundColor: '#22c55e', padding: 12, borderRadius: 8, alignItems: 'center' },
  callButtonText: { color: '#fff', fontWeight: '600' },
  messageButton: { flex: 1, backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  messageButtonText: { color: '#fff', fontWeight: '600' },
  etaCard: { backgroundColor: '#fef3c7', padding: 16, margin: 16, borderRadius: 12, alignItems: 'center' },
  etaLabel: { fontSize: 14, color: '#666' },
  etaValue: { fontSize: 28, fontWeight: 'bold', color: '#f59e0b', marginTop: 4 },
  actions: { padding: 16 },
  primaryButton: { backgroundColor: '#22c55e', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
