import { View, Text, StyleSheet, ScrollView } from "react-native";
const drivers = [
  { name: "Rajesh K.", phone: "9876543210", vehicle: "DL-01-AB-1234", rating: 4.8, status: "On Duty" },
  { name: "Amit S.", phone: "9876543211", vehicle: "MH-02-CD-5678", rating: 4.5, status: "Off Duty" },
  { name: "Suresh M.", phone: "9876543212", vehicle: "KA-03-EF-9012", rating: 4.9, status: "On Duty" },
];
export default function DriversScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Drivers</Text></View>
      {drivers.map((d, i) => (
        <View key={i} style={styles.driverCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{d.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.driverInfo}><Text style={styles.driverName}>{d.name}</Text><Text style={styles.vehicle}>🚗 {d.vehicle}</Text><Text style={styles.rating}>⭐ {d.rating}</Text></View>
          <View style={[styles.statusBadge, d.status === "On Duty" ? styles.onDutyBadge : styles.offDutyBadge]}><Text style={styles.statusText}>{d.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  driverCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: "600" },
  vehicle: { fontSize: 12, color: "#666", marginTop: 2 },
  rating: { fontSize: 12, color: "#f59e0b", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  onDutyBadge: { backgroundColor: "#d1fae5" },
  offDutyBadge: { backgroundColor: "#e5e7eb" },
  statusText: { fontSize: 10, fontWeight: "600" },
});