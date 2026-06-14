import { View, Text, StyleSheet, ScrollView } from "react-native";
const tasks = [{ title: "Lift Maintenance", location: "Block A", priority: "High", status: "Scheduled" }, { title: "Plumbing Issue", location: "Apt 205", priority: "Medium", status: "In Progress" }];
export default function MaintenanceScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Maintenance</Text></View>
      {tasks.map((t, i) => (
        <View key={i} style={styles.taskCard}>
          <Text style={styles.taskTitle}>{t.title}</Text>
          <Text style={styles.taskLocation}>📍 {t.location}</Text>
          <View style={styles.taskBottom}><View style={[styles.priorityBadge, t.priority === "High" ? styles.highBadge : styles.medBadge]}><Text style={styles.priorityText}>{t.priority}</Text></View><Text style={styles.status}>{t.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0ea5e9" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  taskCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  taskTitle: { fontSize: 16, fontWeight: "600" },
  taskLocation: { marginTop: 4, color: "#666" },
  taskBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  highBadge: { backgroundColor: "#fee2e2" },
  medBadge: { backgroundColor: "#fef3c7" },
  priorityText: { fontSize: 10, fontWeight: "600" },
  status: { color: "#0ea5e9", fontWeight: "500" },
});