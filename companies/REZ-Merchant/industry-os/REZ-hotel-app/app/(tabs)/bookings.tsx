import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const bookings = [
  { id: "BK001", guest: "John Doe", room: "301", checkIn: "Jun 8", checkOut: "Jun 10", status: "Checked In", amount: "₹8,500" },
  { id: "BK002", guest: "Jane Smith", room: "205", checkIn: "Jun 9", checkOut: "Jun 12", status: "Confirmed", amount: "₹15,300" },
  { id: "BK003", guest: "Bob Wilson", room: "410", checkIn: "Jun 8", checkOut: "Jun 8", status: "Checked Out", amount: "₹4,200" },
];
export default function BookingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Bookings</Text></View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}><Text style={[styles.tabText, styles.activeTabText]}>All</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Checked In</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Pending</Text></TouchableOpacity>
      </View>
      {bookings.map(b => (
        <View key={b.id} style={styles.bookingCard}>
          <View style={styles.bookingTop}>
            <View><Text style={styles.guestName}>{b.guest}</Text><Text style={styles.roomNo}>Room {b.room}</Text></View>
            <View style={[styles.statusBadge, b.status === "Checked In" ? styles.inBadge : b.status === "Confirmed" ? styles.confirmedBadge : styles.outBadge]}>
              <Text style={styles.statusText}>{b.status}</Text>
            </View>
          </View>
          <View style={styles.bookingDetails}>
            <Text style={styles.detailText}>📅 {b.checkIn} → {b.checkOut}</Text>
            <Text style={styles.amountText}>{b.amount}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>View Details</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  tabs: { flexDirection: "row", padding: 16, gap: 8 },
  tab: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", backgroundColor: "#fff" },
  activeTab: { backgroundColor: "#3b82f6" },
  tabText: { fontWeight: "500", color: "#666", fontSize: 12 },
  activeTabText: { color: "#fff" },
  bookingCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  bookingTop: { flexDirection: "row", justifyContent: "space-between" },
  guestName: { fontSize: 16, fontWeight: "600" },
  roomNo: { fontSize: 12, color: "#666" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  inBadge: { backgroundColor: "#d1fae5" },
  confirmedBadge: { backgroundColor: "#fef3c7" },
  outBadge: { backgroundColor: "#e5e7eb" },
  statusText: { fontSize: 12, fontWeight: "600" },
  bookingDetails: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  detailText: { color: "#666" },
  amountText: { fontWeight: "bold", color: "#059669" },
  actionBtn: { marginTop: 12, backgroundColor: "#3b82f6", padding: 12, borderRadius: 8, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "600" },
});