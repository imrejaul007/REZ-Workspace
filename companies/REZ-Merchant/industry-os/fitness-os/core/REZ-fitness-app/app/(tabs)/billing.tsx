import { View, Text, StyleSheet, ScrollView } from "react-native";
const bills = [
  { member: "John Doe", amount: "₹5,000", type: "Monthly", date: "Jun 1" },
  { member: "Jane Smith", amount: "₹3,000", type: "Monthly", date: "Jun 3" },
  { member: "Bob Wilson", amount: "₹50,000", type: "Annual", date: "Jun 5" },
];
export default function BillingScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Billing</Text><Text style={styles.subtitle}>This Month: ₹1,25,000</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹95,000</Text><Text style={styles.statLabel}>Collected</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>₹30,000</Text><Text style={styles.statLabel}>Pending</Text></View>
      </View>
      {bills.map((b, i) => (
        <View key={i} style={styles.billCard}>
          <View><Text style={styles.memberName}>{b.member}</Text><Text style={styles.billDetails}>{b.type} • {b.date}</Text></View>
          <Text style={styles.billAmount}>{b.amount}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ef4444" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  billCard: { flexDirection: "row", justifyContent: "space-between", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  memberName: { fontSize: 16, fontWeight: "600" },
  billDetails: { fontSize: 12, color: "#666" },
  billAmount: { fontSize: 18, fontWeight: "bold", color: "#10b981" },
});