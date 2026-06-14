import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>🚗 REZ Auto</Text><Text style={styles.tagline}>Smart Auto Workshop</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureItem}>🔧 Service Management</Text>
        <Text style={styles.featureItem}>📋 Job Cards</Text>
        <Text style={styles.featureItem}>🛒 Parts Inventory</Text>
        <Text style={styles.featureItem}>👥 Customer Management</Text>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}><Text style={styles.primaryBtnText}>Get Started</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  header: { alignItems: "center", marginTop: 60 },
  logo: { fontSize: 28, fontWeight: "bold", color: "#0f766e" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#ccfbf1", borderRadius: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#134e4a" },
  primaryBtn: { backgroundColor: "#0f766e", padding: 16, borderRadius: 12, alignItems: "center", marginTop: "auto" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});