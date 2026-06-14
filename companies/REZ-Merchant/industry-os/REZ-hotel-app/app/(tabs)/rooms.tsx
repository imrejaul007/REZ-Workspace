import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const floors = [
  { floor: 3, rooms: [{ no: "301", type: "Deluxe", status: "Occupied" }, { no: "302", type: "Deluxe", status: "Available" }, { no: "303", type: "Suite", status: "Maintenance" }] },
  { floor: 2, rooms: [{ no: "201", type: "Standard", status: "Available" }, { no: "202", type: "Standard", status: "Occupied" }, { no: "203", type: "Deluxe", status: "Available" }] },
];
export default function RoomsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Rooms</Text><Text style={styles.subtitle}>18 Available / 42 Occupied</Text></View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#22c55e" }]} /><Text>Available</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#3b82f6" }]} /><Text>Occupied</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#ef4444" }]} /><Text>Maintenance</Text></View>
      </View>
      {floors.map(f => (
        <View key={f.floor} style={styles.floorSection}>
          <Text style={styles.floorTitle}>Floor {f.floor}</Text>
          <View style={styles.roomsGrid}>
            {f.rooms.map(r => (
              <TouchableOpacity key={r.no} style={[styles.roomCard, r.status === "Occupied" ? styles.occupiedCard : r.status === "Maintenance" ? styles.maintCard : styles.availCard]}>
                <Text style={styles.roomNo}>{r.no}</Text>
                <Text style={styles.roomType}>{r.type}</Text>
                <Text style={styles.roomStatus}>{r.status}</Text>
              </TouchableOpacity>
            ))}
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
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  legend: { flexDirection: "row", justifyContent: "center", padding: 16, gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  floorSection: { padding: 16 },
  floorTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  roomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomCard: { width: "31%", padding: 12, borderRadius: 8, alignItems: "center" },
  availCard: { backgroundColor: "#d1fae5" },
  occupiedCard: { backgroundColor: "#dbeafe" },
  maintCard: { backgroundColor: "#fee2e2" },
  roomNo: { fontWeight: "bold", fontSize: 16 },
  roomType: { fontSize: 10, color: "#666" },
  roomStatus: { fontSize: 10, marginTop: 4 },
});