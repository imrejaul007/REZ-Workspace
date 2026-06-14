import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.salonName}>StyleStudio</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#fce7f3" }]}><Text style={styles.statValue}>8</Text><Text style={styles.statLabel}>Today's Bookings</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹12,500</Text><Text style={styles.statLabel}>Revenue</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <View style={styles.apptCard}><Text style={styles.clientName}>Sarah M.</Text><Text style={styles.service}>Haircut + Coloring • 10:30 AM</Text></View>
        <View style={styles.apptCard}><Text style={styles.clientName}>Emma W.</Text><Text style={styles.service}>Facial • 11:45 AM</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ec4899" },
  greeting: { fontSize: 14, color: "#fff" },
  salonName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  apptCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  clientName: { fontSize: 16, fontWeight: "600" },
  service: { marginTop: 4, color: "#ec4899" },
});