import { View, Text, StyleSheet, ScrollView } from "react-native";
const deliveries = [{ order: "#1245", customer: "John D.", address: "Sector 15, Noida", status: "In Transit", eta: "8 min" }, { order: "#1246", customer: "Sarah M.", address: "MG Road, Gurgaon", status: "Assigned", eta: "15 min" }];
export default function DeliveryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Delivery</Text><Text style={styles.subtitle}>12 Active</Text></View>
      {deliveries.map((d, i) => (
        <View key={i} style={styles.deliveryCard}>
          <View style={styles.deliveryTop}><Text style={styles.orderId}>{d.order}</Text><View style={[styles.statusBadge, d.status === "In Transit" ? styles.transitBadge : styles.assignedBadge]}><Text style={styles.statusText}>{d.status}</Text></View></View>
          <Text style={styles.customer}>{d.customer}</Text>
          <Text style={styles.address}>{d.address}</Text>
          <View style={styles.etaRow}><Text style={styles.eta}>ETA: {d.eta}</Text></View>
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
  deliveryCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  deliveryTop: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 16, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  transitBadge: { backgroundColor: "#dbeafe" },
  assignedBadge: { backgroundColor: "#fef3c7" },
  statusText: { fontSize: 10, fontWeight: "600" },
  customer: { marginTop: 8, fontWeight: "500" },
  address: { marginTop: 4, color: "#666" },
  etaRow: { marginTop: 12 },
  eta: { color: "#22c55e", fontWeight: "600" },
});