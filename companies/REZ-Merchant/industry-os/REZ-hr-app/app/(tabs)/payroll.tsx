import { View, Text, StyleSheet, ScrollView } from "react-native";
const payroll = [{ month: "June 2026", total: "₹12,50,000", status: "Processed" }, { month: "May 2026", total: "₹12,00,000", status: "Paid" }];
export default function PayrollScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Payroll</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹12.5L</Text><Text style={styles.statLabel}>This Month</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#e0e7ff" }]}><Text style={styles.statValue}>85</Text><Text style={styles.statLabel}>Employees</Text></View>
      </View>
      {payroll.map((p, i) => (
        <View key={i} style={styles.payrollCard}>
          <Text style={styles.month}>{p.month}</Text>
          <View style={styles.payrollRow}><Text style={styles.total}>{p.total}</Text><Text style={styles.status}>{p.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#6366f1" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  payrollCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  month: { fontSize: 16, fontWeight: "600" },
  payrollRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  total: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  status: { color: "#6366f1", fontWeight: "500" },
});