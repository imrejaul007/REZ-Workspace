import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.franchise}>Brand HQ</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#fee2e2" }]}><Text style={styles.statValue}>15</Text><Text style={styles.statLabel}>Locations</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹45L</Text><Text style={styles.statLabel}>Revenue</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#dc2626" },
  greeting: { fontSize: 14, color: "#fff" },
  franchise: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
});