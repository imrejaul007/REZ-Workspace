import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.fleetName}>Swift Logistics Fleet</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>24</Text><Text style={styles.statLabel}>Active Vehicles</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>18</Text><Text style={styles.statLabel}>On Trip</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <View style={styles.alertCard}><Text style={styles.alertText}>⚠️ Vehicle DL-01-AB-1234 needs service</Text></View>
        <View style={styles.alertCard}><Text style={styles.alertText}>⛽ Vehicle MH-02-CD-5678 low fuel</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  greeting: { fontSize: 14, color: "#fff" },
  fleetName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  alertCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  alertText: { fontSize: 14 },
});