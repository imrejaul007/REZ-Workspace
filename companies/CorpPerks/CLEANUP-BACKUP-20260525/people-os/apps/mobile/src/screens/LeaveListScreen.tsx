import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';
import { getLeaveRequests } from '../services/api';
import { LeaveRequest } from '../types';
import LeaveCard from '../components/LeaveCard';

const TABS = ['all', 'pending', 'approved', 'rejected'];

export const LeaveListScreen: React.FC = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const employeeId = 'EMP001';

  const loadRequests = async () => {
    const status = activeTab === 'all' ? undefined : activeTab === 'pending' ? 'submitted' : activeTab;
    const data = await getLeaveRequests(employeeId, status);
    setRequests(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const filteredRequests = requests;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LeaveCard
            request={item}
            onPress={() => router.push(`/leave/${item._id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Leave Requests</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? 'You haven\'t submitted any leave requests yet.'
                : `No ${activeTab} leave requests.`}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/leave/new')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: '300',
  },
});

export default LeaveListScreen;
