import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>💪 REZ Fitness</Text><Text style={styles.tagline}>Smart Gym Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Complete Fitness Operations</Text>
        <Text style={styles.featureItem}>🏋️ Member Management</Text>
        <Text style={styles.featureItem}>📅 Class Scheduling</Text>
        <Text style={styles.featureItem}>💳 Billing & Membership</Text>
        <Text style={styles.featureItem}>📊 Attendance Tracking</Text>
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
  logo: { fontSize: 32, fontWeight: "bold", color: "#ef4444" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#fee2e2", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#991b1b" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#ef4444", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});