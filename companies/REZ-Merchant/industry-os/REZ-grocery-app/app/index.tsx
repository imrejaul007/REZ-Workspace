import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
export default function Landing() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.logo}>🛒 REZ Grocery</Text><Text style={styles.tagline}>Quick Commerce Management</Text></View>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Complete Quick Commerce</Text>
        <Text style={styles.featureItem}>📦 Inventory & Stock</Text>
        <Text style={styles.featureItem}>🚴 Delivery Tracking</Text>
        <Text style={styles.featureItem}>💰 Pricing & Offers</Text>
        <Text style={styles.featureItem}>📊 Demand Forecasting</Text>
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
  logo: { fontSize: 32, fontWeight: "bold", color: "#22c55e" },
  tagline: { fontSize: 16, color: "#666", marginTop: 8 },
  features: { marginTop: 48, padding: 24, backgroundColor: "#dcfce7", borderRadius: 16 },
  featureTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  featureItem: { fontSize: 16, marginVertical: 8, color: "#166534" },
  buttons: { marginTop: "auto", gap: 12 },
  primaryBtn: { backgroundColor: "#22c55e", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});