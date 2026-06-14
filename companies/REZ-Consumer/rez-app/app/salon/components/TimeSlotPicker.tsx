import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const COLORS = {
  primary: colors.brand.pink,
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: colors.brand.green,
  background: colors.background.secondary,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLOT_WIDTH = (SCREEN_WIDTH - 48 - 24) / 4; // 4 slots per row with padding

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
}) => {
  return (
    <View style={styles.container}>
      {slots.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.gray200} />
          <Text style={styles.emptyText}>No time slots available</Text>
          <Text style={styles.emptySubtext}>Please select a different date</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {slots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <Pressable
                key={slot.id}
                style={[
                  styles.slot,
                  !slot.available && styles.slotDisabled,
                  isSelected && styles.slotSelected,
                ]}
                onPress={() => slot.available && onSelectSlot(slot)}
                disabled={!slot.available}
              >
                <Text
                  style={[
                    styles.slotText,
                    !slot.available && styles.slotTextDisabled,
                    isSelected && styles.slotTextSelected,
                  ]}
                >
                  {slot.time}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200 }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.gray50 }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    width: SLOT_WIDTH,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    position: 'relative',
  },
  slotDisabled: {
    backgroundColor: COLORS.gray50,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  slotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: colors.nileBlue,
  },
  slotTextDisabled: {
    color: COLORS.gray600,
  },
  slotTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.green500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text.inverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...Typography.body,
    color: colors.nileBlue,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...Typography.caption,
    color: COLORS.gray600,
  },
});

export default TimeSlotPicker;
