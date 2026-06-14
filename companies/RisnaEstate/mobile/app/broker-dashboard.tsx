// Mobile - Broker Dashboard
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BrokerDashboard() {
  const stats = [
    { label: 'Leads', value: '24', color: '#0ea5e9' },
    { label: 'Hot', value: '8', color: '#ef4444' },
    { label: 'Visits', value: '12', color: '#22c55e' },
    { label: 'Earnings', value: '45K', color: '#f59e0b' },
  ];

  const quickActions = [
    { icon: 'person-add', label: 'Add Lead', color: '#0ea5e9' },
    { icon: 'calendar', label: 'Schedule', color: '#22c55e' },
    { icon: 'cash', label: 'Earnings', color: '#f59e0b' },
    { icon: 'people', label: 'Team', color: '#8b5cf6' },
  ];

  const recentLeads = [
    { name: 'Rajesh S.', segment: 'HNI', score: 92, time: '5m ago' },
    { name: 'Priya P.', segment: 'NRI', score: 88, time: '1h ago' },
    { name: 'Amit K.', segment: 'Investor', score: 75, time: '3h ago' },
  ];

  const upcomingVisits = [
    { property: 'Marina Heights', time: 'Today 3:00 PM' },
    { property: 'Palm Villa', time: 'Tomorrow 11:00 AM' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={[styles.actionCard, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Leads */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        {recentLeads.map((lead, i) => (
          <View key={i} style={styles.listItem}>
            <View style={styles.listLeft}>
              <Text style={styles.listTitle}>{lead.name}</Text>
              <Text style={styles.listSub}>{lead.segment} • {lead.time}</Text>
            </View>
            <View style={[styles.scoreBadge, lead.score >= 80 ? styles.scoreHot : styles.scoreWarm]}>
              <Text style={styles.scoreText}>{lead.score}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Upcoming Visits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Visits</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        {upcomingVisits.map((visit, i) => (
          <View key={i} style={styles.listItem}>
            <View style={styles.listLeft}>
              <Text style={styles.listTitle}>{visit.property}</Text>
              <Text style={styles.listSub}>{visit.time}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={20} color="#22c55e" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: { width: '48%', backgroundColor: '#fff', margin: 6, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  seeAll: { fontSize: 14, color: '#0ea5e9' },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { width: '23%', alignItems: 'center', padding: 12, borderRadius: 12 },
  actionLabel: { fontSize: 12, marginTop: 8, fontWeight: '500' },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 },
  listLeft: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  listSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreHot: { backgroundColor: '#fef2f2' },
  scoreWarm: { backgroundColor: '#fef9c3' },
  scoreText: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
});
