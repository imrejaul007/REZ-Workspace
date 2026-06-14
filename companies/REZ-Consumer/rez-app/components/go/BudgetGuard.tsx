import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { BudgetGuard as BudgetGuardType } from './GoContext';

interface BudgetGuardProps {
  budget: BudgetGuardType;
  onSetBudget: (limit: number) => void;
  onDismiss?: () => void;
}

export function BudgetGuard({ budget, onSetBudget, onDismiss }: BudgetGuardProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSetBudget = () => {
    const value = parseInt(inputValue, 10);
    if (value > 0) {
      onSetBudget(value);
      setShowModal(false);
    }
  };

  const progressPercent = budget.limit > 0
    ? Math.min((budget.current / budget.limit) * 100, 100)
    : 0;

  const progressColor = progressPercent > 90
    ? '#EF4444'
    : progressPercent > 75
    ? '#F59E0B'
    : '#22C55E';

  if (!budget.enabled) {
    return (
      <TouchableOpacity
        style={styles.enableButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.enableIcon}>💰</Text>
        <Text style={styles.enableText}>Set Budget</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Budget Progress */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.title}>Budget: ₹{budget.limit}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, { color: progressColor }]}>
            ₹{budget.current.toFixed(0)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            ₹{budget.remaining > 0 ? budget.remaining.toFixed(0) : '0'}
          </Text>
        </View>
      </View>

      {/* Warning Banner */}
      {budget.remaining < budget.limit * 0.25 && budget.remaining > 0 && !budget.warningShown && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Approaching budget limit! ₹{budget.remaining.toFixed(0)} remaining
          </Text>
        </View>
      )}

      {/* Budget Exceeded */}
      {budget.remaining <= 0 && (
        <View style={styles.exceededBanner}>
          <Text style={styles.exceededText}>
            🚫 Budget exceeded! Consider removing some items.
          </Text>
        </View>
      )}

      {/* Set Budget Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Your Budget</Text>
            <Text style={styles.modalSubtitle}>
              Stay within your budget while shopping
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.quickAmounts}>
              {[500, 1000, 2000, 5000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmount}
                  onPress={() => {
                    setInputValue(amount.toString());
                    onSetBudget(amount);
                    setShowModal(false);
                  }}
                >
                  <Text style={styles.quickAmountText}>₹{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.setButton}
                onPress={handleSetBudget}
              >
                <Text style={styles.setButtonText}>Set Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  enableIcon: {
    fontSize: 20,
  },
  enableText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  editText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  exceededBanner: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  exceededText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#6B7280',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAmount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  setButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  setButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BudgetGuard;
