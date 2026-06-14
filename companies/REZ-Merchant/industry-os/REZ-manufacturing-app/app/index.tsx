import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>🏭 REZ Manufacturing</Text><Text style={styles.tagline}>Smart Production Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureItem}>📦 Production Planning</Text>
        <Text style={styles.featureItem}>🔧 Quality Control</Text>
        <Text style={styles.featureItem}>📊 Inventory Tracking</Text>
        <Text style={styles.featureItem}>📈 Analytics</Text>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}><Text style={styles.primaryBtnText}>Get Started</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  header: { alignItems: "center", marginTop: 60 },
  logo: { fontSize: 28, fontWeight: "bold", color: "#7c3aed" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#ede9fe", borderRadius: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#5b21b6" },
  primaryBtn: { backgroundColor: "#7c3aed", padding: 16, borderRadius: 12, alignItems: "center", marginTop: "auto" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});