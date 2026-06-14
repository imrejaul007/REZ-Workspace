import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';
import { showAlert } from '@/utils/alert';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  mode: string;
  date: string;
}

interface ExpenseSummary {
  month: string;
  revenue: number;
  cogs: number;
  expenses: number;
  netProfit: number;
  cogsPercentage: number;
  expensesPercentage: number;
  marginPercentage: number;
  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentExpenses: Expense[];
}

type CategoryType =
  | 'rent'
  | 'salary'
  | 'utilities'
  | 'inventory'
  | 'marketing'
  | 'maintenance'
  | 'supplies'
  | 'other';

export default function ExpensesScreen() {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'utilities' as CategoryType,
    amount: '',
    description: '',
    mode: 'upi',
  });

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get<ExpenseSummary>(
        `/merchant/analytics/expenses?month=current`
      );

      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        showAlert('Error', response.message || 'Failed to load expenses');
      }
    } catch (error) {
      logger.error('Error fetching expenses:', error);
      showAlert('Error', error?.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description) {
      showAlert('Validation', 'Please fill all fields');
      return;
    }

    try {
      const payload = {
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        mode: expenseForm.mode,
      };

      const response = await apiClient.post('/merchant/expenses', payload);
      if (response.success) {
        showAlert('Success', 'Expense added');
        setExpenseForm({
          category: 'utilities',
          amount: '',
          description: '',
          mode: 'upi',
        });
        setShowAddModal(false);
        await fetchData();
      } else {
        showAlert('Error', response.message || 'Failed to add expense');
      }
    } catch (error) {
      logger.error('Error adding expense:', error);
      showAlert('Error', error?.message || 'Failed to add expense');
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'rent':
        return '🏢';
      case 'salary':
        return '👨‍💼';
      case 'utilities':
        return '💡';
      case 'inventory':
        return '📦';
      case 'marketing':
        return '📢';
      case 'maintenance':
        return '🔧';
      case 'supplies':
        return '📋';
      default:
        return '💰';
    }
  };

  const renderProgressBar = (percentage: number) => {
    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: Colors.light.tint,
            },
          ]}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading expenses...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Expense Tracker</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Add Form */}
        <TouchableOpacity style={styles.quickAddButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle" size={20} color={Colors.light.tint} />
          <ThemedText style={styles.quickAddText}>+ Add Expense</ThemedText>
        </TouchableOpacity>

        {summary && (
          <>
            {/* Month Overview */}
            <View style={styles.section}>
              <ThemedText style={styles.monthLabel}>{summary.month}</ThemedText>
              <ThemedText style={styles.expenseAmount}>
                ₹{summary.expenses.toLocaleString()}
              </ThemedText>
            </View>

            {/* Expense Breakdown */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>By category</ThemedText>
              {summary.byCategory.map((item, index) => (
                <View key={`${item.category}-${index}`} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLabel}>
                      <ThemedText style={styles.categoryIcon}>
                        {getCategoryIcon(item.category)}
                      </ThemedText>
                      <View>
                        <ThemedText style={styles.categoryName}>
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.categoryAmount}>
                      ₹{item.amount.toLocaleString()}
                    </ThemedText>
                  </View>
                  {renderProgressBar(item.percentage)}
                </View>
              ))}
            </View>

            {/* P&L Snapshot */}
            <View style={styles.plCard}>
              <ThemedText style={styles.plTitle}>P&L Snapshot</ThemedText>
              <View style={styles.plRow}>
                <ThemedText style={styles.plLabel}>Revenue</ThemedText>
                <ThemedText style={styles.plValue}>₹{summary.revenue.toLocaleString()}</ThemedText>
              </View>
              <View style={styles.plRow}>
                <ThemedText style={styles.plLabel}>
                  COGS · {summary.cogsPercentage.toFixed(0)}%
                </ThemedText>
                <ThemedText style={styles.plValue}>₹{summary.cogs.toLocaleString()}</ThemedText>
              </View>
              <View style={styles.plRow}>
                <ThemedText style={styles.plLabel}>
                  Expenses · {summary.expensesPercentage.toFixed(0)}%
                </ThemedText>
                <ThemedText style={styles.plValue}>₹{summary.expenses.toLocaleString()}</ThemedText>
              </View>
              <View
                style={[
                  styles.plRow,
                  {
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: Colors.light.border,
                  },
                ]}
              >
                <ThemedText style={[styles.plLabel, { fontWeight: '700' }]}>
                  Net Profit · {summary.marginPercentage.toFixed(0)}%
                </ThemedText>
                <ThemedText
                  style={[styles.plValue, { color: Colors.light.success, fontWeight: '700' }]}
                >
                  ₹{summary.netProfit.toLocaleString()}
                </ThemedText>
              </View>
            </View>

            {/* Recent Expenses */}
            {summary.recentExpenses.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Recent expenses</ThemedText>
                <FlatList
                  data={summary.recentExpenses}
                  renderItem={({ item }) => (
                    <View style={styles.expenseRow}>
                      <View style={styles.expenseInfo}>
                        <ThemedText style={styles.expenseDate}>
                          {item.date} · {item.category}
                        </ThemedText>
                        <ThemedText style={styles.expenseDesc}>{item.description}</ThemedText>
                      </View>
                      <View style={styles.expenseAmountCell}>
                        <ThemedText style={styles.expenseValue}>
                          ₹{item.amount.toLocaleString()}
                        </ThemedText>
                        <ThemedText style={styles.expenseMode}>{item.mode}</ThemedText>
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Expense</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Category</ThemedText>
              <View style={styles.categoryButtons}>
                {(['rent', 'salary', 'utilities', 'inventory'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catButton,
                      expenseForm.category === cat && styles.catButtonActive,
                    ]}
                    onPress={() => setExpenseForm({ ...expenseForm, category: cat })}
                  >
                    <ThemedText
                      style={[
                        styles.catButtonText,
                        expenseForm.category === cat && styles.catButtonTextActive,
                      ]}
                    >
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Amount (₹)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.light.icon}
                keyboardType="decimal-pad"
                value={expenseForm.amount}
                onChangeText={(text) => setExpenseForm({ ...expenseForm, amount: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Electricity bill"
                placeholderTextColor={Colors.light.icon}
                value={expenseForm.description}
                onChangeText={(text) => setExpenseForm({ ...expenseForm, description: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Payment Mode</ThemedText>
              <View style={styles.modeButtons}>
                {['upi', 'bank', 'cash'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeButton,
                      expenseForm.mode === mode && styles.modeButtonActive,
                    ]}
                    onPress={() => setExpenseForm({ ...expenseForm, mode })}
                  >
                    <ThemedText
                      style={[
                        styles.modeButtonText,
                        expenseForm.mode === mode && styles.modeButtonTextActive,
                      ]}
                    >
                      {mode.toUpperCase()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddExpense}>
              <ThemedText style={styles.submitButtonText}>Add Expense</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  quickAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  section: {
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  plCard: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  plTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  plRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plLabel: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  plValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDate: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  expenseDesc: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  expenseAmountCell: {
    alignItems: 'flex-end',
  },
  expenseValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  expenseMode: {
    fontSize: 10,
    color: Colors.light.icon,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  catButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  catButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  catButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  catButtonTextActive: {
    color: Colors.light.card,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  modeButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modeButtonTextActive: {
    color: Colors.light.card,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
