/**
 * Mobile - Analytics Screen
 */
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const STATS = [
  { label: 'Leads', value: '24', change: '+5', color: '#0ea5e9' },
  { label: 'Hot Leads', value: '8', change: '+2', color: '#ef4444' },
  { label: 'Site Visits', value: '12', change: '+3', color: '#22c55e' },
  { label: 'Earnings', value: '₹45K', change: '+₹5K', color: '#f59e0b' },
];

const CHART_DATA = [
  { month: 'Jan', value: 5 },
  { month: 'Feb', value: 8 },
  { month: 'Mar', value: 12 },
  { month: 'Apr', value: 10 },
  { month: 'May', value: 15 },
  { month: 'Jun', value: 18 },
];

export default function AnalyticsScreen() {
  const maxValue = Math.max(...CHART_DATA.map(d => d.value));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Analytics</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {STATS.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statChange, { color: stat.color }]}>{stat.change}</Text>
          </View>
        ))}
      </View>

      {/* Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Leads This Month</Text>
        <View style={styles.barChart}>
          {CHART_DATA.map((d, i) => (
            <View key={i} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  { height: (d.value / maxValue) * 120, backgroundColor: '#0ea5e9' }
                ]}
              />
              <Text style={styles.barLabel}>{d.month}</Text>
              <Text style={styles.barValue}>{d.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Properties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Properties</Text>
        {[
          { name: 'Marina Heights', views: 1250, leads: 45 },
          { name: 'Palm Villa', views: 980, leads: 32 },
          { name: 'Downtown Penthouse', views: 756, leads: 28 },
        ].map((p, i) => (
          <View key={i} style={styles.propertyRow}>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{p.name}</Text>
              <Text style={styles.propertyViews}>{p.views} views</Text>
            </View>
            <View style={styles.propertyStat}>
              <Text style={styles.propertyLeads}>{p.leads} leads</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Source Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lead Sources</Text>
        {[
          { source: 'Website', count: 45, color: '#0ea5e9' },
          { source: 'WhatsApp', count: 28, color: '#22c55e' },
          { source: 'Referral', count: 18, color: '#f59e0b' },
          { source: 'Social', count: 12, color: '#8b5cf6' },
        ].map((s, i) => (
          <View key={i} style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: s.color }]} />
            <Text style={styles.sourceName}>{s.source}</Text>
            <Text style={styles.sourceCount}>{s.count}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statCard: { width: '50%', padding: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statChange: { fontSize: 12, marginTop: 2 },
  chartCard: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  chartTitle: { fontWeight: '600', marginBottom: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160 },
  barContainer: { alignItems: 'center', flex: 1 },
  bar: { width: 32, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  barValue: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  propertyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  propertyInfo: { flex: 1 },
  propertyName: { fontWeight: '500' },
  propertyViews: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  propertyStat: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  propertyLeads: { fontSize: 12, color: '#2563eb', fontWeight: '500' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sourceDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  sourceName: { flex: 1 },
  sourceCount: { fontWeight: '600' },
});
