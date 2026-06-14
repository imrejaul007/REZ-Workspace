import { View, Text, StyleSheet, ScrollView } from "react-native";
const orders = [{ id: "ORD-001", customer: "John Doe", items: "3 Shirts, 2 Pants", status: "Washing" }, { id: "ORD-002", customer: "Jane Smith", items: "5 Items", status: "Ready" }];
export default function OrdersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Orders</Text></View>
      {orders.map((o, i) => (
        <View key={i} style={styles.orderCard}>
          <Text style={styles.orderId}>{o.id}</Text>
          <Text style={styles.customer}>{o.customer}</Text>
          <Text style={styles.items}>{o.items}</Text>
          <Text style={[styles.status, o.status === "Ready" ? styles.ready : styles.washing]}>{o.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0ea5e9" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  orderCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  orderId: { fontSize: 12, color: "#666" },
  customer: { fontSize: 16, fontWeight: "600" },
  items: { marginTop: 4, color: "#666" },
  status: { marginTop: 8, fontWeight: "600" },
  ready: { color: "#059669" },
  washing: { color: "#0ea5e9" },
});