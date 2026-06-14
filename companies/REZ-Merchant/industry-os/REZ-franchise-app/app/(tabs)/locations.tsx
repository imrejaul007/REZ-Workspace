import { View, Text, StyleSheet, ScrollView } from "react-native";
const locations = [{ name: "Delhi NCR", stores: 5, revenue: "₹12L" }, { name: "Mumbai", stores: 4, revenue: "₹15L" }];
export default function LocationsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Locations</Text></View>
      {locations.map((l, i) => (
        <View key={i} style={styles.locationCard}>
          <Text style={styles.locationName}>{l.name}</Text>
          <View style={styles.locationDetails}><Text>{l.stores} stores</Text><Text style={styles.revenue}>{l.revenue}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#dc2626" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  locationCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  locationName: { fontSize: 18, fontWeight: "600" },
  locationDetails: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  revenue: { fontWeight: "bold", color: "#059669" },
});