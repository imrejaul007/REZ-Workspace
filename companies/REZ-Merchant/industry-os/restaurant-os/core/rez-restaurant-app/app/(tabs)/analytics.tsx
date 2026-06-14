import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function AnalyticsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Your restaurant insights</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}>
          <Text style={styles.statValue}>₹45,230</Text>
          <Text style={styles.statLabel}>Revenue (Today)</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Orders (Today)</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#fce7f3" }]}>
          <Text style={styles.statValue}>₹290</Text>
          <Text style={styles.statLabel}>Avg Order Value</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}>
          <Text style={styles.statValue}>4.7★</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>📊 Bar Chart Placeholder</Text>
          <Text style={styles.chartSubtext}>Butter Chicken - 89 orders</Text>
          <Text style={styles.chartSubtext}>Paneer Tikka - 67 orders</Text>
          <Text style={styles.chartSubtext}>Biryani - 54 orders</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue This Week</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>📈 Line Chart Placeholder</Text>
          <Text style={styles.chartSubtext}>Mon: ₹32,450 | Tue: ₹38,200</Text>
          <Text style={styles.chartSubtext}>Wed: ₹41,100 | Thu: ₹35,800</Text>
          <Text style={styles.chartSubtext}>Fri: ₹52,300 | Sat: ₹61,450</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#f59e0b" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  statCard: { width: "47%", padding: 16, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  chartPlaceholder: { backgroundColor: "#fff", padding: 24, borderRadius: 12, alignItems: "center" },
  chartText: { fontSize: 24, marginBottom: 12 },
  chartSubtext: { fontSize: 14, color: "#666", marginTop: 4 },
});