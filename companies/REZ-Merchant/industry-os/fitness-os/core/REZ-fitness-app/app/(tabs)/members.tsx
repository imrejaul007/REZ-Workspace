import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const members = [
  { name: "John Doe", plan: "Premium", joined: "Jan 2024", status: "Active" },
  { name: "Jane Smith", plan: "Basic", joined: "Mar 2024", status: "Active" },
  { name: "Bob Wilson", plan: "Premium", joined: "Feb 2024", status: "Expired" },
];
export default function MembersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Members</Text><TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity></View>
      {members.map((m, i) => (
        <View key={i} style={styles.memberCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{m.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.memberInfo}><Text style={styles.memberName}>{m.name}</Text><Text style={styles.memberPlan}>{m.plan} • Joined {m.joined}</Text></View>
          <View style={[styles.statusBadge, m.status === "Active" ? styles.activeBadge : styles.expiredBadge]}><Text style={styles.statusText}>{m.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ef4444", flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#ef4444", fontWeight: "600" },
  memberCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: "600" },
  memberPlan: { fontSize: 12, color: "#666" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: "#d1fae5" },
  expiredBadge: { backgroundColor: "#fee2e2" },
  statusText: { fontSize: 10, fontWeight: "600" },
});