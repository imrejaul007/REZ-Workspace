import { View, Text, StyleSheet, ScrollView } from "react-native";
const leaves = [{ employee: "John Doe", type: "Sick Leave", from: "Jun 10", to: "Jun 12", status: "Pending" }, { employee: "Sarah Smith", type: "Vacation", from: "Jun 20", to: "Jun 25", status: "Approved" }];
export default function LeaveScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Leave Management</Text></View>
      {leaves.map((l, i) => (
        <View key={i} style={styles.leaveCard}>
          <Text style={styles.empName}>{l.employee}</Text>
          <Text style={styles.leaveType}>{l.type}</Text>
          <Text style={styles.dates}>{l.from} - {l.to}</Text>
          <View style={[styles.statusBadge, l.status === "Approved" ? styles.approvedBadge : styles.pendingBadge]}><Text style={styles.statusText}>{l.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#6366f1" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  leaveCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  empName: { fontSize: 16, fontWeight: "600" },
  leaveType: { color: "#6366f1", marginTop: 4 },
  dates: { color: "#666", marginTop: 4 },
  statusBadge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  approvedBadge: { backgroundColor: "#d1fae5" },
  pendingBadge: { backgroundColor: "#fef3c7" },
  statusText: { fontSize: 10, fontWeight: "600" },
});