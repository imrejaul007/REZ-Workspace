import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><View style={styles.avatar}><Text style={styles.avatarText}>AC</Text></View><Text style={styles.name}>Acme Corp</Text></View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>Company Settings</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>Reports</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>Integrations</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#6366f1", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#6366f1" },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 12 },
  section: { padding: 16 },
  menuItem: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  menuText: { fontSize: 16 },
  logoutBtn: { margin: 16, backgroundColor: "#fee2e2", padding: 16, borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "600" },
});