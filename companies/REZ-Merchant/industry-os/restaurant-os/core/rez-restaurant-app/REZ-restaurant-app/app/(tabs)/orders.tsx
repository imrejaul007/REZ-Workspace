import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const orders = [
  { id: "1245", items: "Butter Chicken, Naan, Rice", amount: 485, status: "Preparing", time: "10 min" },
  { id: "1244", items: "Paneer Tikka, Roti x2", amount: 320, status: "Ready", time: "2 min" },
  { id: "1243", items: "Biryani, Raita", amount: 280, status: "Delivered", time: "15 min" },
  { id: "1242", items: "Dosa, Idli, Coffee", amount: 195, status: "Delivered", time: "30 min" },
];

export default function OrdersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Manage your restaurant orders</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Active (2)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Completed</Text>
        </TouchableOpacity>
      </View>

      {orders.filter(o => o.status !== "Delivered").map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.orderTime}>⏱ {order.time}</Text>
            </View>
            <View style={[styles.badge, order.status === "Ready" ? styles.readyBadge : styles.preparingBadge]}>
              <Text style={styles.badgeText}>{order.status}</Text>
            </View>
          </View>
          <Text style={styles.orderItems}>{order.items}</Text>
          <View style={styles.orderBottom}>
            <Text style={styles.orderAmount}>₹{order.amount}</Text>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#f59e0b" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  tabs: { flexDirection: "row", padding: 16, gap: 12 },
  tab: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", backgroundColor: "#fff" },
  activeTab: { backgroundColor: "#f59e0b" },
  tabText: { fontWeight: "500", color: "#666" },
  activeTabText: { color: "#fff" },
  orderCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 18, fontWeight: "bold" },
  orderTime: { fontSize: 12, color: "#666", marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  readyBadge: { backgroundColor: "#d1fae5" },
  preparingBadge: { backgroundColor: "#fef3c7" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  orderItems: { marginTop: 12, color: "#666" },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  orderAmount: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  actionBtn: { backgroundColor: "#f59e0b", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: "#fff", fontWeight: "600" },
});