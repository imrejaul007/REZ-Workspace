import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const services = [
  { name: "Haircut", category: "Hair", price: "₹500", duration: "45 min", bookings: 45 },
  { name: "Hair Coloring", category: "Hair", price: "₹2,500", duration: "2 hrs", bookings: 12 },
  { name: "Facial", category: "Skin", price: "₹1,200", duration: "1 hr", bookings: 28 },
  { name: "Manicure", category: "Nails", price: "₹400", duration: "30 min", bookings: 35 },
];
export default function ServicesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Services</Text><TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity></View>
      {services.map((s, i) => (
        <View key={i} style={styles.serviceCard}>
          <View style={styles.serviceTop}><Text style={styles.serviceName}>{s.name}</Text><Text style={styles.servicePrice}>{s.price}</Text></View>
          <View style={styles.serviceDetails}><Text style={styles.category}>{s.category}</Text><Text style={styles.duration}>⏱ {s.duration}</Text><Text style={styles.bookings}>{s.bookings} bookings</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ec4899", flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#ec4899", fontWeight: "600" },
  serviceCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  serviceTop: { flexDirection: "row", justifyContent: "space-between" },
  serviceName: { fontSize: 18, fontWeight: "600" },
  servicePrice: { fontSize: 18, fontWeight: "bold", color: "#10b981" },
  serviceDetails: { flexDirection: "row", marginTop: 12, gap: 16 },
  category: { fontSize: 12, color: "#ec4899", backgroundColor: "#fce7f3", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  duration: { fontSize: 12, color: "#666" },
  bookings: { fontSize: 12, color: "#666" },
});