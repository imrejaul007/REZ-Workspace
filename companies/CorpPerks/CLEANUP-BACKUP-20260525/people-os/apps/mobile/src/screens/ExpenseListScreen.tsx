import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';
import { getExpenseClaims } from '../services/api';
import { ExpenseClaim } from '../types';
import ExpenseCard from '../components/ExpenseCard';

const TABS = ['all', 'pending', 'approved', 'reimbursed'];

export const ExpenseListScreen: React.FC = () => {
  const router = useRouter();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const employeeId = 'EMP001';

  const loadClaims = async () => {
    const status = activeTab === 'all' ? undefined : activeTab === 'pending' ? 'submitted' : activeTab;
    const data = await getExpenseClaims(employeeId, status);
    setClaims(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    loadClaims();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClaims();
  };

  const filteredClaims = claims;

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
        data={filteredClaims}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ExpenseCard
            claim={item}
            onPress={() => router.push(`/expense/${item._id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No Expense Claims</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? 'You haven\'t submitted any expense claims yet.'
                : `No ${activeTab} expense claims.`}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/expense/new')}
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

export default ExpenseListScreen;
