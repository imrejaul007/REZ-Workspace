import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.company}>Acme Corp</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#e0e7ff" }]}><Text style={styles.statValue}>85</Text><Text style={styles.statLabel}>Employees</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>3</Text><Text style={styles.statLabel}>On Leave</Text></View>
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionCard}><Text style={styles.actionText}>🧑‍💼 Add Employee</Text></View>
        <View style={styles.actionCard}><Text style={styles.actionText}>💰 Process Payroll</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#6366f1" },
  greeting: { fontSize: 14, color: "#fff" },
  company: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  actionCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  actionText: { fontSize: 16 },
});