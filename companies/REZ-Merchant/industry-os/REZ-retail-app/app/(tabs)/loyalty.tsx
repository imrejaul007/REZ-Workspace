import { View, Text, StyleSheet, ScrollView } from "react-native";
const members = [{ name: "Sarah J.", points: 2450, tier: "Gold" }, { name: "Mike S.", points: 890, tier: "Silver" }, { name: "Emma W.", points: 3200, tier: "Platinum" }];
export default function LoyaltyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Loyalty Program</Text><Text style={styles.subtitle}>156 Active Members</Text></View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}><Text style={styles.statValue}>₹1.2L</Text><Text style={styles.statLabel}>Rewards Given</Text></View>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}><Text style={styles.statValue}>+18%</Text><Text style={styles.statLabel}>Retention</Text></View>
      </View>
      {members.map((m, i) => (
        <View key={i} style={styles.memberCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{m.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.memberInfo}><Text style={styles.memberName}>{m.name}</Text><Text style={styles.points}>{m.points} points</Text></View>
          <View style={[styles.tierBadge, m.tier === "Platinum" ? styles.platinumBadge : m.tier === "Gold" ? styles.goldBadge : styles.silverBadge]}><Text style={styles.tierText}>{m.tier}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#7c3aed" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  memberCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: "600" },
  points: { fontSize: 12, color: "#666" },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  platinumBadge: { backgroundColor: "#e0e7ff" },
  goldBadge: { backgroundColor: "#fef3c7" },
  silverBadge: { backgroundColor: "#e5e7eb" },
  tierText: { fontSize: 10, fontWeight: "600" },
});