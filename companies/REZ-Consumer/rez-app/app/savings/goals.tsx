/**
 * Savings Goals Screen
 * Create and manage savings goals
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavings } from '@/contexts/SavingsContext';
import { formatSavings } from '@/services/savingsApi';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

// Extract color values as strings to avoid TypeScript union type issues
const C = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#faf1e0',
  textPrimary: '#1a3a52',
  textSecondary: '#2A5577',
  borderColor: '#E8DCC4',
  accentBg: '#FFF9E6',
};

const GOAL_ICONS = ['🎯', '✈️', '🏖️', '🚗', '🏠', '💻', '📱', '🎓', '💍', '🎁'];
const GOAL_COLORS = ['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#E91E63'];

export default function SavingsGoalsScreen() {
  const { goals, goalsLoading, createGoal, removeGoal } = useSavings();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#4CAF50');

  const handleCreateGoal = async () => {
    if (!goalName.trim() || !targetAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(targetAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setCreating(true);
    try {
      const success = await createGoal({
        name: goalName.trim(),
        targetAmount: Math.round(amount * 100), // Convert to paise/coins
        icon: selectedIcon,
        color: selectedColor,
      });

      if (success) {
        setShowCreateModal(false);
        setGoalName('');
        setTargetAmount('');
        setSelectedIcon('🎯');
        setSelectedColor('#4CAF50');
      } else {
        Alert.alert('Error', 'Failed to create goal');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGoal = (goalId: string, name: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeGoal(goalId);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Savings Goals',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set & Track Goals</Text>
          <Text style={styles.headerSubtitle}>
            Create savings goals to stay motivated
          </Text>
        </View>

        {/* Loading State */}
        {goalsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {/* Active Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          {goals.filter((g) => !g.isCompleted).length === 0 && !goalsLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No active goals yet</Text>
              <Text style={styles.emptySubtext}>Create your first savings goal below!</Text>
            </View>
          )}
          {goals
            .filter((g) => !g.isCompleted)
            .map((goal) => (
              <Pressable key={goal.goalId} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                    <Text style={styles.goalIconText}>{goal.icon}</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalProgress}>
                      {formatSavings(goal.currentAmount)} / {formatSavings(goal.targetAmount)}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal.goalId, goal.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </Pressable>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                        backgroundColor: goal.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% complete
                </Text>
              </Pressable>
            ))}
        </View>

        {/* Completed Goals */}
        {goals.filter((g) => g.isCompleted).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Goals</Text>
            {goals
              .filter((g) => g.isCompleted)
              .map((goal) => (
                <View key={goal.goalId} style={[styles.goalCard, styles.completedCard]}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                      <Text style={styles.goalIconText}>{goal.icon}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalName, styles.completedText]}>{goal.name}</Text>
                      <Text style={styles.goalProgress}>
                        Goal reached! {formatSavings(goal.targetAmount)}
                      </Text>
                    </View>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Create Goal Button */}
        <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create New Goal</Text>
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Savings Goal</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            {/* Goal Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Vacation Fund"
                value={goalName}
                onChangeText={setGoalName}
                maxLength={50}
              />
            </View>

            {/* Target Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5000"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
              />
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Choose Icon</Text>
              <View style={styles.iconGrid}>
                {GOAL_ICONS.map((icon) => (
                  <Pressable
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Choose Color</Text>
              <View style={styles.colorGrid}>
                {GOAL_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && <Text style={styles.colorCheck}>✓</Text>}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Create Button */}
            <Pressable
              style={[styles.submitButton, creating && styles.submitButtonDisabled]}
              onPress={handleCreateGoal}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Goal</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgSecondary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: C.bgPrimary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 4,
  },
  goalCard: {
    backgroundColor: C.bgPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  completedCard: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconText: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textPrimary,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  goalProgress: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.success,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: C.borderColor,
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.bgPrimary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textPrimary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: C.bgSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: C.textPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: C.accentBg,
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: C.textPrimary,
  },
  colorCheck: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
