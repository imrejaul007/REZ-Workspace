/**
 * EventFilters Component
 * Filter chips for events
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface Filter {
  id: string;
  label: string;
  icon?: string;
}

interface EventFiltersProps {
  filters: Filter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function EventFilters({ filters, selectedId, onSelect }: EventFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isSelected = filter.id === selectedId;
        return (
          <Pressable
            key={filter.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(filter.id)}
          >
            {filter.icon && (
              <Ionicons
                name={filter.icon as unknown}
                size={16}
                color={isSelected ? '#fff' : colors.text.secondary}
              />
            )}
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary ?? '#F3F4F6',
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary[500] ?? '#FF6B35',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  labelSelected: {
    color: '#fff',
  },
});
