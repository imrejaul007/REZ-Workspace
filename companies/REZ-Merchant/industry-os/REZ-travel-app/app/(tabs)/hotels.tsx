import { View, Text, StyleSheet, ScrollView } from "react-native";
const hotels = [{ name: "Grand Hyatt", location: "Mumbai", checkIn: "Jun 15", checkOut: "Jun 18", status: "Confirmed", rooms: 5 }];
export default function HotelsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Hotels</Text></View>
      {hotels.map((h, i) => (
        <View key={i} style={styles.hotelCard}>
          <Text style={styles.name}>{h.name}</Text>
          <Text style={styles.location}>📍 {h.location}</Text>
          <View style={styles.dateRow}><Text>Check-in: {h.checkIn}</Text><Text>Check-out: {h.checkOut}</Text></View>
          <View style={styles.hotelBottom}>
            <Text style={styles.rooms}>{h.rooms} rooms</Text>
            <Text style={styles.status}>{h.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  hotelCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  name: { fontSize: 18, fontWeight: "bold" },
  location: { marginTop: 4, color: "#666" },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  hotelBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  rooms: { color: "#3b82f6", fontWeight: "500" },
  status: { color: "#059669", fontWeight: "600" },
});