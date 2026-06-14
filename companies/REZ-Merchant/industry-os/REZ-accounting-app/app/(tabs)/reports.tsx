import { View, Text, StyleSheet, ScrollView } from "react-native";
export default function ReportsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Financial Reports</Text></View>
      <View style={styles.reportCard}><Text style={styles.reportTitle}>Profit & Loss</Text><Text style={styles.reportDesc}>Monthly P&L Statement</Text></View>
      <View style={styles.reportCard}><Text style={styles.reportTitle}>Balance Sheet</Text><Text style={styles.reportDesc}>Assets & Liabilities</Text></View>
      <View style={styles.reportCard}><Text style={styles.reportTitle}>Cash Flow</Text><Text style={styles.reportDesc}>Cash Flow Statement</Text></View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#059669" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  reportCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  reportTitle: { fontSize: 16, fontWeight: "600" },
  reportDesc: { fontSize: 12, color: "#666", marginTop: 4 },
});