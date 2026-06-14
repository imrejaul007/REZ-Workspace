import { View, Text, StyleSheet, ScrollView } from "react-native";
const orders = [{ id: "1245", items: "Milk, Bread, Eggs, Butter", amount: 485, status: "Delivering", time: "15 min" }, { id: "1244", items: "Vegetables, Fruits", amount: 320, status: "Preparing", time: "5 min" }, { id: "1243", items: "Rice, Dal, Oil", amount: 650, status: "Pending", time: "2 min" }];
export default function OrdersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Orders</Text><Text style={styles.subtitle}>156 Today</Text></View>
      {orders.map((o, i) => (
        <View key={i} style={styles.orderCard}>
          <View style={styles.orderTop}><Text style={styles.orderId}>#{o.id}</Text><Text style={styles.time}>⏱ {o.time}</Text></View>
          <Text style={styles.items}>{o.items}</Text>
          <View style={styles.orderBottom}><Text style={styles.amount}>₹{o.amount}</Text><View style={[styles.statusBadge, o.status === "Delivering" ? styles.deliveringBadge : o.status === "Preparing" ? styles.preparingBadge : styles.pendingBadge]}><Text style={styles.statusText}>{o.status}</Text></View></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#22c55e" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8 },
  orderCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  orderTop: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 16, fontWeight: "bold" },
  time: { color: "#666" },
  items: { marginTop: 8, color: "#666" },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  amount: { fontSize: 20, fontWeight: "bold", color: "#22c55e" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  deliveringBadge: { backgroundColor: "#dbeafe" },
  preparingBadge: { backgroundColor: "#fef3c7" },
  pendingBadge: { backgroundColor: "#e5e7eb" },
  statusText: { fontSize: 12, fontWeight: "600" },
});