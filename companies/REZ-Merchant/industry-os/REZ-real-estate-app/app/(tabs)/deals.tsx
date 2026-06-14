import { View, Text, StyleSheet, ScrollView } from "react-native";
const deals = [{ client: "John Doe", property: "Sunrise Apts", stage: "Negotiation", amount: "₹85L" }, { client: "Sarah J.", property: "Green Valley", stage: "Site Visit", amount: "₹55L" }];
export default function DealsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Deal Pipeline</Text></View>
      {deals.map((d, i) => (
        <View key={i} style={styles.dealCard}>
          <View style={styles.dealTop}><Text style={styles.clientName}>{d.client}</Text><Text style={styles.amount}>{d.amount}</Text></View>
          <Text style={styles.property}>{d.property}</Text>
          <View style={styles.stageRow}><Text style={styles.stage}>Stage:</Text><Text style={styles.stageName}>{d.stage}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#a855f7" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  dealCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  dealTop: { flexDirection: "row", justifyContent: "space-between" },
  clientName: { fontSize: 16, fontWeight: "600" },
  amount: { fontSize: 18, fontWeight: "bold", color: "#059669" },
  property: { marginTop: 4, color: "#666" },
  stageRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  stage: { color: "#666" },
  stageName: { fontWeight: "600", color: "#a855f7" },
});