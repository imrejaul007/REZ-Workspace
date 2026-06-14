import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>🏥 REZ Healthcare</Text><Text style={styles.tagline}>Smart Clinic Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Complete Healthcare Operations</Text>
        <Text style={styles.featureItem}>👨‍⚕️ Patient Management</Text>
        <Text style={styles.featureItem}>📅 Appointment Scheduling</Text>
        <Text style={styles.featureItem}>💊 Pharmacy & Billing</Text>
        <Text style={styles.featureItem}>📊 Health Analytics</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}><Text style={styles.primaryBtnText}>Get Started</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  header: { alignItems: "center", marginTop: 60 },
  logo: { fontSize: 32, fontWeight: "bold", color: "#10b981" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#d1fae5", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#065f46" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#10b981", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});