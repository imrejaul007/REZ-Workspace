import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.greeting}>Good Morning!</Text><Text style={styles.gymName}>FitZone Gym</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>45</Text><Text style={styles.statLabel}>Active Members</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}><Text style={styles.statValue}>₹2.5L</Text><Text style={styles.statLabel}>Monthly Revenue</Text></View>
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Today's Classes</Text>
        <View style={styles.classCard}><Text style={styles.className}>Yoga</Text><Text style={styles.classTime}>7:00 AM - 8:00 AM</Text><Text style={styles.classCount}>12 enrolled</Text></View>
        <View style={styles.classCard}><Text style={styles.className}>HIIT</Text><Text style={styles.classTime}>9:00 AM - 10:00 AM</Text><Text style={styles.classCount}>18 enrolled</Text></View>
        <View style={styles.classCard}><Text style={styles.className}>Zumba</Text><Text style={styles.classTime}>6:00 PM - 7:00 PM</Text><Text style={styles.classCount}>25 enrolled</Text></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ef4444" },
  greeting: { fontSize: 14, color: "#fff" },
  gymName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  classCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  className: { fontSize: 16, fontWeight: "600" },
  classTime: { marginTop: 4, color: "#666" },
  classCount: { marginTop: 4, color: "#ef4444" },
});