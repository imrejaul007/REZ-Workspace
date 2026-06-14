/**
 * Mobile - Site Visits Screen
 */
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VISITS = [
  { id: '1', property: 'Marina Heights 2BHK', client: 'Rajesh Sharma', date: 'Today', time: '3:00 PM', status: 'confirmed' },
  { id: '2', property: 'Palm Jumeirah Villa', client: 'Sarah Johnson', date: 'Tomorrow', time: '11:00 AM', status: 'pending' },
  { id: '3', property: 'Downtown Penthouse', client: 'Priya Patel', date: 'Mar 25', time: '2:00 PM', status: 'confirmed' },
  { id: '4', property: 'Business Bay 1BHK', client: 'Amit Kumar', date: 'Mar 20', time: '10:00 AM', status: 'completed' },
];

export default function VisitsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const visits = VISITS.filter(v =>
    activeTab === 'upcoming' ? v.status !== 'completed' : v.status === 'completed'
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Site Visits</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({VISITS.filter(v => v.status !== 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed ({VISITS.filter(v => v.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {visits.map((visit) => (
          <View key={visit.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{visit.client.charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.property}>{visit.property}</Text>
                <Text style={styles.client}>{visit.client}</Text>
              </View>
              <View style={[styles.badge, visit.status === 'confirmed' ? styles.badgeConfirmed : visit.status === 'pending' ? styles.badgePending : styles.badgeCompleted]}>
                <Text style={[styles.badgeText, { color: visit.status === 'confirmed' ? '#16a34a' : visit.status === 'pending' ? '#ca8a04' : '#6b7280' }]}>
                  {visit.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.detail}>
                <Ionicons name="calendar" size={16} color="#6b7280" />
                <Text style={styles.detailText}>{visit.date} at {visit.time}</Text>
              </View>
            </View>

            {visit.status !== 'completed' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="call" size={20} color="#22c55e" />
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]}>
                  <Ionicons name="navigate" size={20} color="#0ea5e9" />
                  <Text style={[styles.actionText, { color: '#0ea5e9' }]>Navigate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

import { useState } from 'react';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#e5e7eb' },
  tabActive: { borderBottomColor: '#22c55e' },
  tabText: { color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#22c55e' },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#22c55e' },
  cardInfo: { flex: 1, marginLeft: 12 },
  property: { fontWeight: '600', fontSize: 16 },
  client: { color: '#6b7280', fontSize: 14, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeConfirmed: { backgroundColor: '#dcfce7' },
  badgePending: { backgroundColor: '#fef9c3' },
  badgeCompleted: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  cardDetails: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  detail: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  detailText: { marginLeft: 6, color: '#6b7280', fontSize: 14 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#f3f4f6' },
  actionPrimary: { backgroundColor: '#eff6ff' },
  actionText: { marginLeft: 6, fontWeight: '500', color: '#6b7280' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
