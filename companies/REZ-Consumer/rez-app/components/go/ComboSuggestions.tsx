import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ComboSuggestion } from './GoContext';

interface ComboSuggestionsProps {
  suggestions: ComboSuggestion[];
  onAddCombo: (combo: ComboSuggestion) => void;
  onDismiss: () => void;
}

export function ComboSuggestions({ suggestions, onAddCombo, onDismiss }: ComboSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.title}>Combo Deals</Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {suggestions.map((combo) => (
          <View key={combo.id} style={styles.comboCard}>
            <View style={styles.comboInfo}>
              <Text style={styles.comboName}>{combo.name}</Text>
              <Text style={styles.comboItems}>
                {combo.items.join(' + ')}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>
                  ₹{combo.originalPrice.toFixed(0)}
                </Text>
                <Text style={styles.comboPrice}>
                  ₹{combo.comboPrice.toFixed(0)}
                </Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>
                    Save ₹{combo.savings.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAddCombo(combo)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  dismissText: {
    fontSize: 14,
    color: '#6B7280',
  },
  list: {
    gap: 12,
  },
  comboCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  comboInfo: {
    flex: 1,
  },
  comboName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  comboItems: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  comboPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  savingsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  addButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ComboSuggestions;
