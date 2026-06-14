import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>👥 REZ HR</Text><Text style={styles.tagline}>Smart HR Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>HR Operations</Text>
        <Text style={styles.featureItem}>🧑‍💼 Employee Management</Text>
        <Text style={styles.featureItem}>📅 Leave & Attendance</Text>
        <Text style={styles.featureItem}>💰 Payroll Processing</Text>
        <Text style={styles.featureItem}>📊 Performance Reviews</Text>
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
  logo: { fontSize: 32, fontWeight: "bold", color: "#6366f1" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#e0e7ff", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#4338ca" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#6366f1", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});