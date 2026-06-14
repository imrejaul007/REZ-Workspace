import { View, Text, StyleSheet, ScrollView } from "react-native";
const bills = [
  { patient: "Sarah Johnson", amount: "₹1,500", status: "Paid", date: "Jun 5" },
  { patient: "Mike Chen", amount: "₹3,200", status: "Pending", date: "Jun 2" },
  { patient: "Emma Wilson", amount: "₹800", status: "Paid", date: "Jun 1" },
];
export default function BillingScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Billing</Text><Text style={styles.subtitle}>This Month: ₹45,600</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹32,400</Text><Text style={styles.statLabel}>Collected</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>₹13,200</Text><Text style={styles.statLabel}>Pending</Text></View>
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Recent Bills</Text>
        {bills.map((b, i) => (
          <View key={i} style={styles.billCard}>
            <View><Text style={styles.patientName}>{b.patient}</Text><Text style={styles.billDate}>{b.date}</Text></View>
            <View style={styles.billRight}><Text style={styles.billAmount}>{b.amount}</Text><Text style={[styles.billStatus, b.status === "Paid" ? styles.paidText : styles.pendingText]}>{b.status}</Text></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#10b981" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  billCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  patientName: { fontSize: 16, fontWeight: "600" },
  billDate: { fontSize: 12, color: "#666" },
  billRight: { alignItems: "flex-end" },
  billAmount: { fontSize: 18, fontWeight: "bold" },
  billStatus: { fontSize: 12, marginTop: 2 },
  paidText: { color: "#10b981" },
  pendingText: { color: "#f59e0b" },
});