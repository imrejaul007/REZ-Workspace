import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.agentName}>Prime Properties</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>24</Text><Text style={styles.statLabel}>Active Leads</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>8</Text><Text style={styles.statLabel}>Open Deals</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}><Text style={styles.activityText}>📋 New lead: Sarah Johnson - 3BHK</Text></View>
        <View style={styles.activityCard}><Text style={styles.activityText}>🤝 Deal closed: ₹85L - Sector 21</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#a855f7" },
  greeting: { fontSize: 14, color: "#fff" },
  agentName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  activityCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  activityText: { fontSize: 14 },
});