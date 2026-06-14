import { View, Text, StyleSheet, ScrollView } from "react-native";
const leads = [{ name: "Sarah Johnson", budget: "₹80L - 1Cr", requirement: "3BHK", status: "Hot", source: "Website" }, { name: "Mike Chen", budget: "₹50L - 60L", requirement: "2BHK", status: "Warm", source: "Referral" }];
export default function LeadsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Leads</Text></View>
      {leads.map((l, i) => (
        <View key={i} style={styles.leadCard}>
          <View style={styles.leadTop}><Text style={styles.leadName}>{l.name}</Text><View style={[styles.statusBadge, l.status === "Hot" ? styles.hotBadge : styles.warmBadge]}><Text style={styles.statusText}>{l.status}</Text></View></View>
          <Text style={styles.budget}>Budget: {l.budget}</Text>
          <Text style={styles.requirement}>Looking for: {l.requirement}</Text>
          <Text style={styles.source}>Source: {l.source}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#a855f7" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  leadCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  leadTop: { flexDirection: "row", justifyContent: "space-between" },
  leadName: { fontSize: 16, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  hotBadge: { backgroundColor: "#fee2e2" },
  warmBadge: { backgroundColor: "#fef3c7" },
  statusText: { fontSize: 10, fontWeight: "600" },
  budget: { marginTop: 8, color: "#a855f7", fontWeight: "500" },
  requirement: { marginTop: 4, color: "#666" },
  source: { marginTop: 4, color: "#666" },
});