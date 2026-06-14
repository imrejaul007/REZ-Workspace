import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '../../App';

const appointments = [
  { id: '1', doctor: 'Dr. Amit Sharma', specialty: 'Cardiologist', date: '2026-06-25', time: '10:00 AM', status: 'upcoming', type: 'Video Consult' },
  { id: '2', doctor: 'Dr. Priya Patel', specialty: 'Dermatologist', date: '2026-06-20', time: '11:30 AM', status: 'upcoming', type: 'Clinic Visit' },
  { id: '3', doctor: 'Dr. Rajesh Kumar', specialty: 'General Physician', date: '2026-06-15', time: '09:00 AM', status: 'completed', type: 'Video Consult' },
];

const statusColors: any = { upcoming: COLORS.warning, completed: COLORS.success, cancelled: COLORS.danger };

export default function AppointmentsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.doctorName}>{item.doctor}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.specialty}>{item.specialty}</Text>
            <View style={styles.details}>
              <Text style={styles.detail}>📅 {item.date}</Text>
              <Text style={styles.detail}>🕐 {item.time}</Text>
              <Text style={styles.detail}>📱 {item.type}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  card: { backgroundColor: COLORS.white, padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  specialty: { fontSize: 14, color: COLORS.textLight, marginTop: 5 },
  details: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  detail: { fontSize: 13, color: COLORS.text },
});
