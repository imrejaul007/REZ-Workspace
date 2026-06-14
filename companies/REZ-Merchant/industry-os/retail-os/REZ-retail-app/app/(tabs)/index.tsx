import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.storeName}>Fresh Mart</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹45,230</Text><Text style={styles.statLabel}>Today's Sales</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>85</Text><Text style={styles.statLabel}>Transactions</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling</Text>
        <View style={styles.productCard}><Text style={styles.productName}>Organic Milk</Text><Text style={styles.productSales}>42 sold</Text></View>
        <View style={styles.productCard}><Text style={styles.productName}>Whole Wheat Bread</Text><Text style={styles.productSales}>38 sold</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#7c3aed" },
  greeting: { fontSize: 14, color: "#fff" },
  storeName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  productCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  productName: { fontSize: 16, fontWeight: "500" },
  productSales: { color: "#7c3aed", fontWeight: "600" },
});