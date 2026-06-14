import { View, Text, StyleSheet, ScrollView } from "react-native";
const flights = [{ airline: "IndiGo", route: "DEL → BOM", dep: "06:00", arr: "08:30", status: "On Time" }, { airline: "Air India", route: "BOM → DEL", dep: "14:00", arr: "16:30", status: "Delayed" }];
export default function FlightsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Flights</Text></View>
      {flights.map((f, i) => (
        <View key={i} style={styles.flightCard}>
          <Text style={styles.airline}>{f.airline}</Text>
          <Text style={styles.route}>{f.route}</Text>
          <View style={styles.timeRow}>
            <View><Text style={styles.time}>{f.dep}</Text><Text style={styles.label}>Departure</Text></View>
            <Text style={styles.arrow}>→</Text>
            <View><Text style={styles.time}>{f.arr}</Text><Text style={styles.label}>Arrival</Text></View>
          </View>
          <Text style={[styles.status, f.status === "On Time" ? styles.onTime : styles.delayed]}>{f.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  flightCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  airline: { fontSize: 18, fontWeight: "bold" },
  route: { marginTop: 4, color: "#666" },
  timeRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  time: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  label: { fontSize: 12, color: "#666" },
  arrow: { fontSize: 24, color: "#3b82f6", alignSelf: "center" },
  status: { marginTop: 12, textAlign: "center", fontWeight: "600" },
  onTime: { color: "#059669" },
  delayed: { color: "#dc2626" },
});