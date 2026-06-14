import { View, Text, StyleSheet, ScrollView } from "react-native";
const invoices = [{ id: "INV-001", client: "Acme Corp", amount: "₹45,000", status: "Paid" }, { id: "INV-002", client: "XYZ Ltd", amount: "₹32,000", status: "Pending" }];
export default function InvoicesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Invoices</Text></View>
      {invoices.map((inv, i) => (
        <View key={i} style={styles.invCard}>
          <Text style={styles.invId}>{inv.id}</Text>
          <Text style={styles.client}>{inv.client}</Text>
          <View style={styles.invBottom}><Text style={styles.amount}>{inv.amount}</Text><Text style={[styles.status, inv.status === "Paid" ? styles.paid : styles.pending]}>{inv.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#059669" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  invCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  invId: { fontSize: 12, color: "#666" },
  client: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  invBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  amount: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  status: { fontWeight: "600", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paid: { backgroundColor: "#d1fae5", color: "#059669" },
  pending: { backgroundColor: "#fef3c7", color: "#d97706" },
});