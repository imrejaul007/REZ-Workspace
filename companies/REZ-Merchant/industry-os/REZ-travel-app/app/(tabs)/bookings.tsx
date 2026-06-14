import { View, Text, StyleSheet, ScrollView } from "react-native";
const bookings = [{ customer: "John Doe", dest: "Mumbai", date: "Jun 15-18", status: "Confirmed", amount: "₹45,000" }, { customer: "Sarah S.", dest: "Goa", date: "Jun 20-25", status: "Pending", amount: "₹65,000" }];
export default function BookingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Bookings</Text></View>
      {bookings.map((b, i) => (
        <View key={i} style={styles.bookingCard}>
          <Text style={styles.customer}>{b.customer}</Text>
          <Text style={styles.dest}>📍 {b.dest}</Text>
          <Text style={styles.date}>📅 {b.date}</Text>
          <View style={styles.bookingBottom}>
            <Text style={styles.amount}>{b.amount}</Text>
            <Text style={[styles.status, b.status === "Confirmed" ? styles.confirmed : styles.pending]}>{b.status}</Text>
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
  bookingCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  customer: { fontSize: 16, fontWeight: "600" },
  dest: { marginTop: 4, color: "#666" },
  date: { marginTop: 4, color: "#666" },
  bookingBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  amount: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  status: { fontWeight: "600", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  confirmed: { backgroundColor: "#d1fae5", color: "#059669" },
  pending: { backgroundColor: "#fef3c7", color: "#d97706" },
});