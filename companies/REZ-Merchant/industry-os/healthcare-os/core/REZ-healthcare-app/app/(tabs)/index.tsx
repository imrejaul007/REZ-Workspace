import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.clinicName}>HealthFirst Clinic</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Today Appointments</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>156</Text><Text style={styles.statLabel}>Total Patients</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <View style={styles.appointmentCard}><Text style={styles.patientName}>Sarah Johnson</Text><Text style={styles.appointmentDetails}>General Checkup • 10:30 AM</Text></View>
        <View style={styles.appointmentCard}><Text style={styles.patientName}>Mike Chen</Text><Text style={styles.appointmentDetails}>Follow-up • 11:45 AM</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#10b981" },
  greeting: { fontSize: 14, color: "#fff" },
  clinicName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  appointmentCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  patientName: { fontSize: 16, fontWeight: "600" },
  appointmentDetails: { marginTop: 4, color: "#666" },
});