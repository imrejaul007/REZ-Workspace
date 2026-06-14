import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.agencyName}>TravelEase Agency</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>45</Text><Text style={styles.statLabel}>Active Bookings</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹12L</Text><Text style={styles.statLabel}>Revenue</Text></View>
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Recent Bookings</Text>
        <View style={styles.bookingCard}><Text style={styles.customer}>John Doe</Text><Text style={styles.details}>Flight + Hotel - Mumbai</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  greeting: { fontSize: 14, color: "#fff" },
  agencyName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  bookingCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  customer: { fontSize: 16, fontWeight: "600" },
  details: { marginTop: 4, color: "#666" },
});