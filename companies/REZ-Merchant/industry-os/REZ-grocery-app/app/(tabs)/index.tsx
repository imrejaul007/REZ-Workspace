import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.storeName}>FreshCart</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}><Text style={styles.statValue}>₹85,420</Text><Text style={styles.statLabel}>Today's Sales</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>156</Text><Text style={styles.statLabel}>Orders</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={styles.orderCard}><Text style={styles.orderId}>#ORD-1245</Text><Text style={styles.orderItems}>Milk, Bread, Eggs</Text><Text style={styles.orderStatus}>Delivering</Text></View>
        <View style={styles.orderCard}><Text style={styles.orderId}>#ORD-1244</Text><Text style={styles.orderItems}>Vegetables, Fruits</Text><Text style={styles.orderStatus}>Preparing</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#22c55e" },
  greeting: { fontSize: 14, color: "#fff" },
  storeName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  orderCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  orderId: { fontWeight: "600" },
  orderItems: { marginTop: 4, color: "#666" },
  orderStatus: { marginTop: 4, color: "#22c55e", fontWeight: "500" },
});