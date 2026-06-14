import { View, Text, StyleSheet, ScrollView } from "react-native";
const items = [{ name: "Organic Milk", stock: 45, min: 20, price: 85 }, { name: "Whole Wheat Bread", stock: 8, min: 15, price: 45 }, { name: "Free Range Eggs (30)", stock: 60, min: 30, price: 180 }, { name: "Butter", stock: 25, min: 10, price: 250 }];
export default function InventoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Inventory</Text></View>
      {items.map((item, i) => (
        <View key={i} style={styles.itemCard}>
          <View style={styles.itemTop}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.price}>₹{item.price}</Text></View>
          <View style={styles.stockRow}><Text style={[styles.stockText, item.stock < item.min ? styles.lowStock : styles.goodStock]}>{item.stock}/{item.min} min</Text><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(100, (item.stock / item.min) * 50)}%`, backgroundColor: item.stock < item.min ? "#dc2626" : "#22c55e" }]} /></View></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#22c55e" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  itemCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  itemTop: { flexDirection: "row", justifyContent: "space-between" },
  itemName: { fontSize: 16, fontWeight: "600" },
  price: { fontSize: 16, fontWeight: "bold", color: "#22c55e" },
  stockRow: { marginTop: 12 },
  stockText: { fontSize: 12, fontWeight: "500" },
  lowStock: { color: "#dc2626" },
  goodStock: { color: "#22c55e" },
  progressBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginTop: 8 },
  progressFill: { height: 8, borderRadius: 4 },
});