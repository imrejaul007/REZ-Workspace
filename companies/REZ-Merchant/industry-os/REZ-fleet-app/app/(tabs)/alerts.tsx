import { View, Text, StyleSheet, ScrollView } from "react-native";
const alerts = [
  { type: "Service", vehicle: "KA-03-EF-9012", message: "Scheduled maintenance due", priority: "High" },
  { type: "Fuel", vehicle: "MH-02-CD-5678", message: "Fuel level below 30%", priority: "Medium" },
  { type: "Speed", vehicle: "DL-01-AB-1234", message: "Overspeeding detected", priority: "Low" },
  { type: "Break", vehicle: "DL-01-AB-1234", message: "Driver break overdue", priority: "Medium" },
];
export default function AlertsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Alerts</Text></View>
      {alerts.map((a, i) => (
        <View key={i} style={styles.alertCard}>
          <View style={styles.alertTop}><Text style={[styles.alertType, a.priority === "High" ? styles.highPriority : a.priority === "Medium" ? styles.medPriority : styles.lowPriority]}>{a.type}</Text><Text style={styles.priority}>{a.priority}</Text></View>
          <Text style={styles.vehicle}>{a.vehicle}</Text>
          <Text style={styles.message}>{a.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  alertCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  alertTop: { flexDirection: "row", justifyContent: "space-between" },
  alertType: { fontSize: 12, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  highPriority: { backgroundColor: "#fee2e2", color: "#dc2626" },
  medPriority: { backgroundColor: "#fef3c7", color: "#d97706" },
  lowPriority: { backgroundColor: "#dbeafe", color: "#3b82f6" },
  priority: { fontSize: 10, color: "#666" },
  vehicle: { fontWeight: "600", marginTop: 8 },
  message: { marginTop: 4, color: "#666" },
});