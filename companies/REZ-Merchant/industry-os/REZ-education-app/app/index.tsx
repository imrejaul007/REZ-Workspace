import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>🎓 REZ Education</Text><Text style={styles.tagline}>Smart Learning Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureItem}>📚 Course Management</Text>
        <Text style={styles.featureItem}>👥 Student Tracking</Text>
        <Text style={styles.featureItem}>📊 Performance Analytics</Text>
        <Text style={styles.featureItem}>📅 Scheduling</Text>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}><Text style={styles.primaryBtnText}>Get Started</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  header: { alignItems: "center", marginTop: 60 },
  logo: { fontSize: 28, fontWeight: "bold", color: "#2563eb" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#dbeafe", borderRadius: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#1e3a8a" },
  primaryBtn: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, alignItems: "center", marginTop: "auto" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});