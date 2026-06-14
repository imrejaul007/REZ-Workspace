import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.workshop}>AutoTech Workshop</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#ccfbf1" }]}><Text style={styles.statValue}>8</Text><Text style={styles.statLabel}>Active Jobs</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>₹45K</Text><Text style={styles.statLabel}>Revenue</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0f766e" },
  greeting: { fontSize: 14, color: "#fff" },
  workshop: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
});