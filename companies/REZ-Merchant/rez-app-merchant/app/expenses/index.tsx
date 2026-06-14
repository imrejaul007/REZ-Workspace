/**
 * ExpensesScreen
 * Lists merchant expenses with monthly summary and category breakdown.
 * API: GET /api/merchant/expenses
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Expense {
  _id: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  createdAt: string;
}

interface ExpenseSummary {
  totalThisMonth: number;
  byCategory: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: 'fast-food-outline',
  Utilities: 'flash-outline',
  Salary: 'people-outline',
  Marketing: 'megaphone-outline',
  Other: 'ellipsis-horizontal-circle-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Utilities: '#3b82f6',
  Salary: '#10b981',
  Marketing: '#ec4899',
  Other: '#6b7280',
};

const formatCurrency = (n: number) =>
  `\u20B9${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

function buildSummary(expenses: Expense[]): ExpenseSummary {
  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.date || e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = thisMonth.reduce((s, e) => s + (e.amount ?? 0), 0);
  const byCategory: Record<string, number> = {};
  for (const e of thisMonth) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + (e.amount ?? 0);
  }
  return { totalThisMonth, byCategory };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await apiClient.get<{ expenses: Expense[] }>('/merchant/expenses?limit=100');
      if (res.success && res.data) {
        setExpenses(res.data.expenses ?? []);
      } else {
        showAlert('Error', res.message || 'Failed to load expenses');
      }
    } catch (err) {
      showAlert('Error', err?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchExpenses();
    }, [fetchExpenses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses();
  }, [fetchExpenses]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </ThemedView>
    );
  }

  const summary = buildSummary(expenses);
  const categoryEntries = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);

  const renderExpense = ({ item }: { item: Expense }) => {
    const color = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.Other;
    const icon = CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.Other;
    return (
      <View style={styles.expenseRow}>
        <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          {item.note ? (
            <Text style={styles.expenseNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
          <Text style={styles.expenseDate}>{formatDate(item.date || item.createdAt)}</Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        renderItem={renderExpense}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            {/* Monthly Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>This Month</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(summary.totalThisMonth)}</Text>
              {categoryEntries.length > 0 && (
                <View style={styles.categoryBreakdown}>
                  {categoryEntries.map(([cat, amt]) => (
                    <View key={cat} style={styles.categoryBreakdownRow}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other },
                        ]}
                      />
                      <Text style={styles.categoryBreakdownLabel}>{cat}</Text>
                      <Text style={styles.categoryBreakdownAmt}>{formatCurrency(amt)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.listSectionTitle}>All Expenses</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={Colors.light.icon} />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to log your first expense.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/expenses/add')}>
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.light.icon },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: Colors.light.card },

  listContent: { paddingBottom: 100 },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.icon,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
  },
  summaryTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryTotal: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12 },
  categoryBreakdown: { gap: 6 },
  categoryBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryBreakdownLabel: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  categoryBreakdownAmt: { fontSize: 13, fontWeight: '600', color: '#fff' },

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 2 },
  expenseNote: { fontSize: 12, color: Colors.light.icon, marginBottom: 2 },
  expenseDate: { fontSize: 11, color: Colors.light.icon },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: Colors.light.text },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  emptySubtitle: { fontSize: 13, color: Colors.light.icon, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
