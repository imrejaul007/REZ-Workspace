import { View, Text, StyleSheet, ScrollView } from "react-native";
const jobs = [{ id: "JOB-001", vehicle: "Maruti Swift", service: "Full Service", status: "In Progress" }, { id: "JOB-002", vehicle: "Honda City", service: "Oil Change", status: "Ready" }];
export default function JobsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Job Cards</Text></View>
      {jobs.map((j, i) => (
        <View key={i} style={styles.jobCard}>
          <Text style={styles.jobId}>{j.id}</Text>
          <Text style={styles.vehicle}>{j.vehicle}</Text>
          <Text style={styles.service}>{j.service}</Text>
          <Text style={[styles.status, j.status === "Ready" ? styles.ready : styles.progress]}>{j.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0f766e" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  jobCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  jobId: { fontSize: 12, color: "#666" },
  vehicle: { fontSize: 16, fontWeight: "600" },
  service: { marginTop: 4, color: "#0f766e" },
  status: { marginTop: 8, fontWeight: "600" },
  ready: { color: "#059669" },
  progress: { color: "#d97706" },
});