import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Landing() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🍽️ REZ Restaurant</Text>
        <Text style={styles.tagline}>Smart Restaurant Management</Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.featureTitle}>Your Restaurant, Reimagined</Text>
        <Text style={styles.featureItem}>📱 Mobile ordering& payments</Text>
        <Text style={styles.featureItem}>🍳 Kitchen display system</Text>
        <Text style={styles.featureItem}>📊 Real-time analytics</Text>
        <Text style={styles.featureItem}>🤖 AI-powered recommendations</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  header: { alignItems: "center", marginTop: 60 },
  logo: { fontSize: 32, fontWeight: "bold", color: "#f59e0b" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#fef3c7", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#92400e" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#f59e0b", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  secondaryBtn: { backgroundColor: "#fff", padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 2, borderColor: "#f59e0b" },
  secondaryBtnText: { color: "#f59e0b", fontSize: 18, fontWeight: "600" },
});