import { View, Text, StyleSheet, ScrollView } from "react-native";
const residents = [{ name: "John Doe", apt: "Apt 101", type: "Owner", dues: "Paid" }, { name: "Sarah Smith", apt: "Apt 205", type: "Tenant", dues: "Pending" }];
export default function ResidentsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Residents</Text></View>
      {residents.map((r, i) => (
        <View key={i} style={styles.residentCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{r.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.residentInfo}><Text style={styles.residentName}>{r.name}</Text><Text style={styles.apt}>📍 {r.apt}</Text><Text style={styles.type}>{r.type}</Text></View>
          <View style={[styles.duesBadge, r.dues === "Paid" ? styles.paidBadge : styles.pendingBadge]}><Text style={styles.duesText}>{r.dues}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#0ea5e9" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  residentCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  residentInfo: { flex: 1, marginLeft: 12 },
  residentName: { fontSize: 16, fontWeight: "600" },
  apt: { fontSize: 12, color: "#666" },
  type: { fontSize: 12, color: "#666" },
  duesBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paidBadge: { backgroundColor: "#d1fae5" },
  pendingBadge: { backgroundColor: "#fee2e2" },
  duesText: { fontSize: 10, fontWeight: "600" },
});