import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏨 REZ Hotel</Text>
        <Text style={styles.tagline}>Smart Hotel Management</Text>
      </View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Complete Hotel Operations</Text>
        <Text style={styles.featureItem}>🛏️ Room Management & Booking</Text>
        <Text style={styles.featureItem}>🍽️ Restaurant & Room Service</Text>
        <Text style={styles.featureItem}>🧹 Housekeeping Automation</Text>
        <Text style={styles.featureItem}>📊 Revenue Analytics</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}><Text style={styles.primaryBtnText}>Get Started</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Learn More</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  header: { alignItems: "center", marginTop: 60 },
  logo: { fontSize: 32, fontWeight: "bold", color: "#3b82f6" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#dbeafe", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#1e40af" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  secondaryBtn: { backgroundColor: "#fff", padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 2, borderColor: "#3b82f6" },
  secondaryBtnText: { color: "#3b82f6", fontSize: 18, fontWeight: "600" },
});