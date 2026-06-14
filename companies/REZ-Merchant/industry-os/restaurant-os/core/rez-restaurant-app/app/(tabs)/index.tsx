import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Morning!</Text>
        <Text style={styles.restaurantName}>The Golden Fork</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}>
          <Text style={styles.statValue}>₹12,450</Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <View style={[styles.actionCard, { backgroundColor: "#fef3c7" }]}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>New Order</Text>
          </View>
          <View style={[styles.actionCard, { backgroundColor: "#e0e7ff" }]}>
            <Text style={styles.actionIcon}>🍳</Text>
            <Text style={styles.actionText}>Kitchen</Text>
          </View>
          <View style={[styles.actionCard, { backgroundColor: "#fce7f3" }]}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Inventory</Text>
          </View>
          <View style={[styles.actionCard, { backgroundColor: "#ccfbf1" }]}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Staff</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#ORD-1245</Text>
            <Text style={styles.orderStatus}>Preparing</Text>
          </View>
          <Text style={styles.orderItems}>2x Butter Chicken, 1x Naan, 1x Rice</Text>
          <Text style={styles.orderAmount}>₹485</Text>
        </View>
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#ORD-1244</Text>
            <Text style={styles.orderStatus}>Ready</Text>
          </View>
          <Text style={styles.orderItems}>1x Paneer Tikka, 2x Roti</Text>
          <Text style={styles.orderAmount}>₹320</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#f59e0b" },
  greeting: { fontSize: 14, color: "#fff" },
  restaurantName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", padding: 20, borderRadius: 12, alignItems: "center" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: "500" },
  orderCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontWeight: "600" },
  orderStatus: { color: "#f59e0b", fontWeight: "500" },
  orderItems: { marginTop: 8, color: "#666" },
  orderAmount: { marginTop: 8, fontSize: 18, fontWeight: "bold", color: "#059669" },
});