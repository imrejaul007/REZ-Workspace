import { View, Text, StyleSheet, ScrollView } from "react-native";
const items = [{ name: "Organic Milk", stock: 45, min: 20, status: "Good" }, { name: "Whole Wheat Bread", stock: 8, min: 15, status: "Low" }, { name: "Free Range Eggs", stock: 60, min: 30, status: "Good" }, { name: "Butter", stock: 5, min: 10, status: "Critical" }];
export default function InventoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Inventory</Text></View>
      {items.map((item, i) => (
        <View key={i} style={styles.itemCard}>
          <View style={styles.itemTop}><Text style={styles.itemName}>{item.name}</Text><View style={[styles.statusBadge, item.status === "Good" ? styles.goodBadge : item.status === "Low" ? styles.lowBadge : styles.criticalBadge]}><Text style={styles.statusText}>{item.status}</Text></View></View>
          <View style={styles.stockRow}><Text style={styles.stockLabel}>Stock: {item.stock}/{item.min} min</Text><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(100, (item.stock / item.min) * 50)}%`, backgroundColor: item.status === "Critical" ? "#dc2626" : item.status === "Low" ? "#f59e0b" : "#10b981" }]} /></View></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#7c3aed" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  itemCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  itemTop: { flexDirection: "row", justifyContent: "space-between" },
  itemName: { fontSize: 16, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  goodBadge: { backgroundColor: "#d1fae5" },
  lowBadge: { backgroundColor: "#fef3c7" },
  criticalBadge: { backgroundColor: "#fee2e2" },
  statusText: { fontSize: 10, fontWeight: "600" },
  stockRow: { marginTop: 12 },
  stockLabel: { fontSize: 12, color: "#666" },
  progressBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginTop: 8 },
  progressFill: { height: 8, borderRadius: 4 },
});