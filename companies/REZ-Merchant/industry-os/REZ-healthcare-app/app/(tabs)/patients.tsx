import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const patients = [
  { name: "Sarah Johnson", age: 32, condition: "General", lastVisit: "Jun 5", phone: "9876543210" },
  { name: "Mike Chen", age: 45, condition: "Diabetes", lastVisit: "Jun 2", phone: "9876543211" },
  { name: "Emma Wilson", age: 28, condition: "Flu", lastVisit: "Jun 1", phone: "9876543212" },
];
export default function PatientsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Patients</Text><TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ Add Patient</Text></TouchableOpacity></View>
      {patients.map((p, i) => (
        <View key={i} style={styles.patientCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{p.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.patientInfo}><Text style={styles.patientName}>{p.name}</Text><Text style={styles.patientDetails}>Age: {p.age} • {p.condition}</Text><Text style={styles.lastVisit}>Last Visit: {p.lastVisit}</Text></View>
          <TouchableOpacity style={styles.callBtn}><Text style={styles.callBtnText}>📞</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#10b981", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#10b981", fontWeight: "600" },
  patientCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  patientInfo: { flex: 1, marginLeft: 12 },
  patientName: { fontSize: 16, fontWeight: "600" },
  patientDetails: { fontSize: 12, color: "#666" },
  lastVisit: { fontSize: 12, color: "#10b981", marginTop: 2 },
  callBtn: { padding: 8, backgroundColor: "#d1fae5", borderRadius: 8 },
  callBtnText: { fontSize: 20 },
});