import { View, Text, StyleSheet, ScrollView } from "react-native";
const bills = [{ month: "June 2026", amount: "₹45,000", status: "Pending", collected: "₹38,000" }, { month: "May 2026", amount: "₹45,000", status: "Collected", collected: "₹45,000" }];
export default function BillingScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Billing</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>₹4.5L</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹12.5L</Text><Text style={styles.statLabel}>Collected</Text></View>
      </View>
      {bills.map((b, i) => (
        <View key={i} style={styles.billCard}>
          <Text style={styles.month}>{b.month}</Text>
          <View style={styles.billDetails}><Text style={styles.collected}>{b.collected} collected</Text><View style={[styles.statusBadge, b.status === "Collected" ? styles.collectedBadge : styles.pendingBadge]}><Text style={styles.statusText}>{b.status}</Text></View></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0ea5e9" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  billCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  month: { fontSize: 16, fontWeight: "600" },
  billDetails: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  collected: { color: "#666" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  collectedBadge: { backgroundColor: "#d1fae5" },
  pendingBadge: { backgroundColor: "#fee2e2" },
  statusText: { fontSize: 10, fontWeight: "600" },
});