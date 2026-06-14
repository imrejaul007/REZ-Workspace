import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.hotelName}>Grand Palace Hotel</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>42/60</Text><Text style={styles.statLabel}>Occupancy</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹1.2L</Text><Text style={styles.statLabel}>Today's Revenue</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <View style={[styles.actionCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.actionIcon}>📋</Text><Text style={styles.actionText}>New Booking</Text></View>
          <View style={[styles.actionCard, { backgroundColor: "#e0e7ff" }]}><Text style={styles.actionIcon}>🛏️</Text><Text style={styles.actionText}>Check-in</Text></View>
          <View style={[styles.actionCard, { backgroundColor: "#fce7f3" }]}><Text style={styles.actionIcon}>🧹</Text><Text style={styles.actionText}>Housekeeping</Text></View>
          <View style={[styles.actionCard, { backgroundColor: "#ccfbf1" }]}><Text style={styles.actionIcon}>📊</Text><Text style={styles.actionText}>Reports</Text></View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}><Text style={styles.activityText}>🛎️ Check-in: Room 301 - John Doe</Text><Text style={styles.activityTime}>5 min ago</Text></View>
        <View style={styles.activityCard}><Text style={styles.activityText}>🛎️ Check-out: Room 205 - Jane Smith</Text><Text style={styles.activityTime}>12 min ago</Text></View>
        <View style={styles.activityCard}><Text style={styles.activityText}>🍽️ Room Service: Room 410</Text><Text style={styles.activityTime}>20 min ago</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  greeting: { fontSize: 14, color: "#fff" },
  hotelName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", padding: 20, borderRadius: 12, alignItems: "center" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: "500" },
  activityCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  activityText: { fontSize: 14 },
  activityTime: { fontSize: 12, color: "#666" },
});