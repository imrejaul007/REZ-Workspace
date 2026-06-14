import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>GF</Text>
        </View>
        <Text style={styles.name}>The Golden Fork</Text>
        <Text style={styles.email}>contact@goldenfork.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Settings</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🏪</Text>
          <Text style={styles.menuText}>Business Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⏰</Text>
          <Text style={styles.menuText}>Timings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📍</Text>
          <Text style={styles.menuText}>Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💳</Text>
          <Text style={styles.menuText}>Payments</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📱</Text>
          <Text style={styles.menuText}>POS Integration</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🚗</Text>
          <Text style={styles.menuText}>Delivery Partners</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuText}>Inventory Sync</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#f59e0b", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#f59e0b" },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 12 },
  email: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8 },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { fontSize: 16, flex: 1 },
  logoutBtn: { margin: 16, backgroundColor: "#fee2e2", padding: 16, borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "600", fontSize: 16 },
});