import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const clients = [
  { name: "Sarah M.", visits: 12, lastVisit: "Jun 1", totalSpent: "₹25,000" },
  { name: "Emma W.", visits: 8, lastVisit: "May 28", totalSpent: "₹18,000" },
  { name: "Lisa K.", visits: 5, lastVisit: "Jun 5", totalSpent: "₹8,500" },
];
export default function ClientsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Clients</Text><TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity></View>
      {clients.map((c, i) => (
        <View key={i} style={styles.clientCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{c.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.clientInfo}><Text style={styles.clientName}>{c.name}</Text><Text style={styles.clientDetails}>{c.visits} visits • Last: {c.lastVisit}</Text><Text style={styles.totalSpent}>Total: {c.totalSpent}</Text></View>
          <TouchableOpacity style={styles.bookBtn}><Text style={styles.bookBtnText}>Book</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ec4899", flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#ec4899", fontWeight: "600" },
  clientCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ec4899", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  clientInfo: { flex: 1, marginLeft: 12 },
  clientName: { fontSize: 16, fontWeight: "600" },
  clientDetails: { fontSize: 12, color: "#666" },
  totalSpent: { fontSize: 12, color: "#10b981", marginTop: 2 },
  bookBtn: { backgroundColor: "#ec4899", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bookBtnText: { color: "#fff", fontWeight: "600" },
});