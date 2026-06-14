import { View, Text, StyleSheet, ScrollView } from "react-native";
const parts = [{ name: "Engine Oil", stock: 25, min: 10 }, { name: "Air Filter", stock: 5, min: 8 }];
export default function InventoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Parts Inventory</Text></View>
      {parts.map((p, i) => (
        <View key={i} style={styles.partCard}>
          <Text style={styles.partName}>{p.name}</Text>
          <Text style={[styles.stock, p.stock < p.min ? styles.low : styles.good]}>{p.stock} / {p.min} min</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0f766e" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  partCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  partName: { fontSize: 16, fontWeight: "600" },
  stock: { marginTop: 8, fontWeight: "500" },
  low: { color: "#dc2626" },
  good: { color: "#059669" },
});