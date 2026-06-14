import { View, Text, StyleSheet, ScrollView } from "react-native";
const items = [{ name: "Raw Material A", stock: 500, min: 200 }, { name: "Raw Material B", stock: 80, min: 100 }];
export default function InventoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Inventory</Text></View>
      {items.map((item, i) => (
        <View key={i} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.stock, item.stock < item.min ? styles.low : styles.good]}>{item.stock}/{item.min} min</Text>
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
  itemName: { fontSize: 16, fontWeight: "600" },
  stock: { marginTop: 8, fontWeight: "500" },
  low: { color: "#dc2626" },
  good: { color: "#059669" },
});