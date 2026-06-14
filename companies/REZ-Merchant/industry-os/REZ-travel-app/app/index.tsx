import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>✈️ REZ Travel</Text><Text style={styles.tagline}>Complete Travel Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Travel Operations</Text>
        <Text style={styles.featureItem}>🛫 Booking Management</Text>
        <Text style={styles.featureItem}>🏨 Hotel Integrations</Text>
        <Text style={styles.featureItem}>🚗 Transfers & Cab</Text>
        <Text style={styles.featureItem}>📊 Expense Tracking</Text>
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
  logo: { fontSize: 28, fontWeight: "bold", color: "#3b82f6" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#dbeafe", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#1e3a8a" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});