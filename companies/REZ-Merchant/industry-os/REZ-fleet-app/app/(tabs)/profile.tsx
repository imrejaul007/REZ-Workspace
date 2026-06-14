import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><View style={styles.avatar}><Text style={styles.avatarText}>SL</Text></View><Text style={styles.name}>Swift Logistics</Text><Text style={styles.email}>admin@swiftlogistics.com</Text></View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuIcon}>🚗</Text><Text style={styles.menuText}>Fleet Info</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuIcon}>📊</Text><Text style={styles.menuText}>Reports</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuIcon}>⚙️</Text><Text style={styles.menuText}>Settings</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#3b82f6", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#3b82f6" },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 12 },
  email: { fontSize: 14, color: "#fff", opacity: 0.8 },
  section: { padding: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { fontSize: 16, flex: 1 },
  logoutBtn: { margin: 16, backgroundColor: "#fee2e2", padding: 16, borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "600", fontSize: 16 },
});