import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const tasks = [
  { room: "301", task: "Full Cleaning", priority: "High", status: "In Progress", assigned: "Maria S." },
  { room: "205", task: "Quick Tidying", priority: "Normal", status: "Pending", assigned: "John D." },
  { room: "410", task: "Deep Clean", priority: "High", status: "Completed", assigned: "Maria S." },
  { room: "102", task: "Full Cleaning", priority: "Normal", status: "Pending", assigned: "John D." },
];
export default function HousekeepingScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Housekeeping</Text><Text style={styles.subtitle}>12 Tasks Today</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>5</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>4</Text><Text style={styles.statLabel}>In Progress</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>3</Text><Text style={styles.statLabel}>Done</Text></View>
      </View>
      {tasks.map((t, i) => (
        <View key={i} style={styles.taskCard}>
          <View style={styles.taskTop}>
            <Text style={styles.roomNo}>Room {t.room}</Text>
            <View style={[styles.priorityBadge, t.priority === "High" ? styles.highBadge : styles.normalBadge]}>
              <Text style={styles.priorityText}>{t.priority}</Text>
            </View>
          </View>
          <Text style={styles.taskName}>{t.task}</Text>
          <View style={styles.taskBottom}>
            <Text style={styles.assignedTo}>👤 {t.assigned}</Text>
            <View style={[styles.statusPill, t.status === "Completed" ? styles.donePill : t.status === "In Progress" ? styles.progressPill : styles.pendingPill]}>
              <Text style={styles.statusText}>{t.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  taskCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  taskTop: { flexDirection: "row", justifyContent: "space-between" },
  roomNo: { fontSize: 18, fontWeight: "bold" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  highBadge: { backgroundColor: "#fee2e2" },
  normalBadge: { backgroundColor: "#e5e7eb" },
  priorityText: { fontSize: 10, fontWeight: "600" },
  taskName: { marginTop: 8, color: "#666" },
  taskBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  assignedTo: { fontSize: 12, color: "#666" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  donePill: { backgroundColor: "#d1fae5" },
  progressPill: { backgroundColor: "#dbeafe" },
  pendingPill: { backgroundColor: "#fef3c7" },
  statusText: { fontSize: 10, fontWeight: "600" },
});