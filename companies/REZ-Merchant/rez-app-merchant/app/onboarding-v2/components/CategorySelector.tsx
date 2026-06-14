/**
 * CategorySelector Component
 * Quick selection chips for business categories with smart defaults
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface CategoryOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  defaultServices?: string[];
}

interface CategorySelectorProps {
  options: CategoryOption[];
  selectedValue: string;
  onSelect: (value: string, defaultServices?: string[]) => void;
  label?: string;
  error?: string;
}

export default function CategorySelector({
  options,
  selectedValue,
  onSelect,
  label = 'Category',
  error,
}: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(option.value, option.defaultServices)}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : Colors.light.textSecondary}
                  style={styles.icon}
                />
              )}
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  icon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 8,
  },
});
