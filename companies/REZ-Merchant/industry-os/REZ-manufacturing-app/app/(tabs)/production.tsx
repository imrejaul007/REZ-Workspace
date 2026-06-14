import { View, Text, StyleSheet, ScrollView } from "react-native";
const orders = [{ id: "PO-001", product: "Widget A", quantity: 500, status: "In Progress" }, { id: "PO-002", product: "Widget B", quantity: 300, status: "Scheduled" }];
export default function ProductionScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Production</Text></View>
      {orders.map((o, i) => (
        <View key={i} style={styles.orderCard}>
          <Text style={styles.orderId}>{o.id}</Text>
          <Text style={styles.product}>{o.product} - {o.quantity} units</Text>
          <Text style={[styles.status, o.status === "In Progress" ? styles.progress : styles.scheduled]}>{o.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#7c3aed" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  orderCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  orderId: { fontSize: 16, fontWeight: "600" },
  product: { marginTop: 4, color: "#666" },
  status: { marginTop: 8, fontWeight: "600" },
  progress: { color: "#7c3aed" },
  scheduled: { color: "#059669" },
});