import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const appointments = [
  { time: "09:00", patient: "Sarah Johnson", type: "General", status: "Completed" },
  { time: "10:30", patient: "Sarah Johnson", type: "Checkup", status: "In Progress" },
  { time: "11:45", patient: "Mike Chen", type: "Follow-up", status: "Scheduled" },
  { time: "14:00", patient: "Emma Wilson", type: "Consultation", status: "Scheduled" },
];
export default function AppointmentsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Appointments</Text><Text style={styles.date}>June 8, 2026</Text></View>
      {appointments.map((a, i) => (
        <View key={i} style={styles.apptCard}>
          <View style={styles.timeColumn}><Text style={styles.time}>{a.time}</Text></View>
          <View style={styles.apptDetails}>
            <Text style={styles.patientName}>{a.patient}</Text>
            <Text style={styles.apptType}>{a.type}</Text>
          </View>
          <View style={[styles.statusBadge, a.status === "Completed" ? styles.doneBadge : a.status === "In Progress" ? styles.progressBadge : styles.scheduledBadge]}>
            <Text style={styles.statusText}>{a.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#10b981" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  date: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  apptCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  timeColumn: { width: 60 },
  time: { fontSize: 16, fontWeight: "bold", color: "#10b981" },
  apptDetails: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: "600" },
  apptType: { fontSize: 12, color: "#666" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  doneBadge: { backgroundColor: "#d1fae5" },
  progressBadge: { backgroundColor: "#dbeafe" },
  scheduledBadge: { backgroundColor: "#fef3c7" },
  statusText: { fontSize: 10, fontWeight: "600" },
});