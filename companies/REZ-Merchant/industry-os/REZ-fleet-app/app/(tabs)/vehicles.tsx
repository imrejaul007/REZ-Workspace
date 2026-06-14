import { View, Text, StyleSheet, ScrollView } from "react-native";
const vehicles = [
  { plate: "DL-01-AB-1234", type: "Truck", status: "On Trip", fuel: 75 },
  { plate: "MH-02-CD-5678", type: "Van", status: "Idle", fuel: 25 },
  { plate: "KA-03-EF-9012", type: "Truck", status: "Maintenance", fuel: 90 },
];
export default function VehiclesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Vehicles</Text></View>
      {vehicles.map((v, i) => (
        <View key={i} style={styles.vehicleCard}>
          <View style={styles.vehicleTop}><Text style={styles.plate}>{v.plate}</Text><Text style={[styles.status, v.status === "On Trip" ? styles.onTrip : v.status === "Maintenance" ? styles.maint : styles.idle]}>{v.status}</Text></View>
          <Text style={styles.type}>{v.type}</Text>
          <View style={styles.fuelRow}><Text style={styles.fuelLabel}>Fuel</Text><View style={styles.fuelBar}><View style={[styles.fuelFill, { width: `${v.fuel}%` }]} /></View><Text style={styles.fuelPercent}>{v.fuel}%</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  vehicleCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  vehicleTop: { flexDirection: "row", justifyContent: "space-between" },
  plate: { fontSize: 16, fontWeight: "bold" },
  status: { fontSize: 12, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  onTrip: { backgroundColor: "#d1fae5", color: "#059669" },
  maint: { backgroundColor: "#fee2e2", color: "#dc2626" },
  idle: { backgroundColor: "#fef3c7", color: "#d97706" },
  type: { marginTop: 4, color: "#666" },
  fuelRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  fuelLabel: { fontSize: 12, color: "#666" },
  fuelBar: { flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4 },
  fuelFill: { height: 8, backgroundColor: "#3b82f6", borderRadius: 4 },
  fuelPercent: { fontSize: 12, fontWeight: "600" },
});