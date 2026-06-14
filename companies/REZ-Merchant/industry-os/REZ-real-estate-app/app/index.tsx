import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>🏠 REZ Real Estate</Text><Text style={styles.tagline}>Complete Property Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Property Operations</Text>
        <Text style={styles.featureItem}>📋 Lead Management</Text>
        <Text style={styles.featureItem}>🏢 Property Listings</Text>
        <Text style={styles.featureItem}>📊 Deal Pipeline</Text>
        <Text style={styles.featureItem}>🤝 Agreements & Handover</Text>
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
  logo: { fontSize: 28, fontWeight: "bold", color: "#a855f7" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#f3e8ff", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#7c3aed" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#a855f7", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});