import { View, Text, StyleSheet, ScrollView } from "react-native";
const royalties = [{ month: "June 2026", amount: "₹4.5L", status: "Pending" }, { month: "May 2026", amount: "₹4.2L", status: "Paid" }];
export default function RoyaltiesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Royalties</Text></View>
      {royalties.map((r, i) => (
        <View key={i} style={styles.royaltyCard}>
          <Text style={styles.month}>{r.month}</Text>
          <View style={styles.royaltyRow}><Text style={styles.amount}>{r.amount}</Text><Text style={[styles.status, r.status === "Paid" ? styles.paid : styles.pending]}>{r.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#dc2626" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  royaltyCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  month: { fontSize: 16, fontWeight: "600" },
  royaltyRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  amount: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  status: { fontWeight: "600", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paid: { backgroundColor: "#d1fae5", color: "#059669" },
  pending: { backgroundColor: "#fef3c7", color: "#d97706" },
});