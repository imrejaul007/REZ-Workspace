// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const router = useRouter();

  const referrals = [
    { id: '1', status: 'rewarded', reward: 100, date: 'May 28', name: 'Priya S.' },
    { id: '2', status: 'qualified', reward: 100, date: 'May 27', name: 'Rahul K.' },
    { id: '3', status: 'registered', reward: 0, date: 'May 26', name: 'Amit J.' },
    { id: '4', status: 'pending', reward: 0, date: 'May 25', name: 'Neha P.' },
    { id: '5', status: 'rewarded', reward: 100, date: 'May 24', name: 'Vikram R.' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'rewarded': return '✅';
      case 'qualified': return '🎯';
      case 'registered': return '📋';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'rewarded': return { bg: '#ECFDF5', text: '#059669' };
      case 'qualified': return { bg: '#EEF2FF', text: '#6366F1' };
      case 'registered': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <View style={styles.item}>
        <Text style={styles.itemIcon}>{getStatusIcon(item.status)}</Text>
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDate}>{item.date}</Text>
        </View>
        <View style={styles.itemRight}>
          {item.reward > 0 && (
            <Text style={styles.itemReward}>+₹{item.reward}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Referral History</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={referrals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Referrals Yet</Text>
            <Text style={styles.emptyText}>Share your code to start referring!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 60, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { fontSize: 16, color: '#6366F1', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  list: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemIcon: { fontSize: 24, marginRight: 12 },
  itemContent: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemDate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  itemRight: { alignItems: 'flex-end' },
  itemReward: { fontSize: 16, fontWeight: '600', color: '#059669', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  empty: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
