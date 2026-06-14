import { View, Text, StyleSheet, ScrollView } from "react-native";
const customers = [{ name: "John Doe", orders: 12, total: "₹2,400" }, { name: "Jane Smith", orders: 8, total: "₹1,600" }];
export default function CustomersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Customers</Text></View>
      {customers.map((c, i) => (
        <View key={i} style={styles.customerCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{c.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.customerInfo}><Text style={styles.customerName}>{c.name}</Text><Text style={styles.customerDetails}>{c.orders} orders • {c.total}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0ea5e9" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  customerCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 16, fontWeight: "600" },
  customerDetails: { fontSize: 12, color: "#666" },
});