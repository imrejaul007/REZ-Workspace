/**
 * Savings History Screen
 * View all savings entries with filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavings } from '@/contexts/SavingsContext';
import { formatSavings, getSavingsTypeInfo, SavingsEntry } from '@/services/savingsApi';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

type FilterType = 'all' | 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'reward', label: 'Rewards' },
  { value: 'referral', label: 'Referral' },
  { value: 'loyalty', label: 'Loyalty' },
  { value: 'promo', label: 'Promo' },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function SavingsEntryCard({ entry }: { entry: SavingsEntry }) {
  const typeInfo = getSavingsTypeInfo(entry.type);

  return (
    <View style={styles.entryCard}>
      <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
        <Text style={styles.typeIconText}>{typeInfo.icon}</Text>
      </View>
      <View style={styles.entryInfo}>
        <Text style={styles.entryDescription}>{entry.description}</Text>
        <View style={styles.entryMeta}>
          <Text style={styles.entryType}>{typeInfo.label}</Text>
          <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.entryAmount}>
        <Text style={styles.amountText}>+{formatSavings(entry.amount)}</Text>
        {entry.savingsPercentage && (
          <Text style={styles.percentText}>{entry.savingsPercentage}% off</Text>
        )}
      </View>
    </View>
  );
}

export default function SavingsHistoryScreen() {
  const { history, historyPage, historyHasMore, historyLoading, loadMoreHistory, refreshHistory } = useSavings();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredHistory = filter === 'all'
    ? history
    : history.filter((entry) => entry.type === filter);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const renderEntry = ({ item }: { item: SavingsEntry }) => (
    <SavingsEntryCard entry={item} />
  );

  const renderFooter = () => {
    if (!historyHasMore) return null;
    if (historyLoading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return (
      <Pressable style={styles.loadMoreButton} onPress={loadMoreHistory}>
        <Text style={styles.loadMoreText}>Load More</Text>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyText}>No savings found</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'all'
          ? 'Start earning cashback and rewards!'
          : `No ${filter} savings yet`}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Savings History',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryText}>
          {filteredHistory.length} savings{filteredHistory.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.totalText}>
          Total: {formatSavings(filteredHistory.reduce((sum, e) => sum + e.amount, 0))}
        </Text>
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMoreHistory}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconText: {
    fontSize: 20,
  },
  entryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  entryDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.sm,
  },
  entryType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  entryDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  entryAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  percentText: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 2,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadMoreButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
