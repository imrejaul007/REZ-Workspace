import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const appointments = [
  { time: "10:30", client: "Sarah M.", service: "Haircut + Coloring", status: "In Progress" },
  { time: "11:45", client: "Emma W.", service: "Facial", status: "Scheduled" },
  { time: "14:00", client: "Lisa K.", service: "Manicure", status: "Scheduled" },
  { time: "16:30", client: "Anna P.", service: "Hair Treatment", status: "Scheduled" },
];
export default function AppointmentsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Appointments</Text></View>
      {appointments.map((a, i) => (
        <View key={i} style={styles.apptCard}>
          <View style={styles.timeCol}><Text style={styles.time}>{a.time}</Text></View>
          <View style={styles.apptInfo}><Text style={styles.clientName}>{a.client}</Text><Text style={styles.service}>{a.service}</Text></View>
          <View style={[styles.statusBadge, a.status === "In Progress" ? styles.progressBadge : styles.scheduledBadge]}><Text style={styles.statusText}>{a.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ec4899" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  apptCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  timeCol: { width: 50 },
  time: { fontWeight: "bold", color: "#ec4899" },
  apptInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: "600" },
  service: { fontSize: 12, color: "#666" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressBadge: { backgroundColor: "#fce7f3" },
  scheduledBadge: { backgroundColor: "#dbeafe" },
  statusText: { fontSize: 10, fontWeight: "600" },
});