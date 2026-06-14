// ==========================================
// CorpPerks Manager App - Badge Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing, getStatusColor, getPriorityColor, getLeaveTypeColor } from '../utils/theme';

interface BadgeProps {
  label: string;
  variant?: 'status' | 'priority' | 'leaveType' | 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'status':
        return { bg: `${getStatusColor(label)}20`, text: getStatusColor(label) };
      case 'priority':
        return { bg: `${getPriorityColor(label)}20`, text: getPriorityColor(label) };
      case 'leaveType':
        return { bg: `${getLeaveTypeColor(label)}20`, text: getLeaveTypeColor(label) };
      case 'success':
        return { bg: `${Colors.success}20`, text: Colors.success };
      case 'warning':
        return { bg: `${Colors.warning}20`, text: Colors.warning };
      case 'error':
        return { bg: `${Colors.error}20`, text: Colors.error };
      case 'info':
        return { bg: `${Colors.info}20`, text: Colors.info };
      default:
        return { bg: Colors.backgroundDark, text: Colors.textSecondary };
    }
  };

  const getSizeStyles = (): { paddingH: number; paddingV: number; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { paddingH: Spacing.xs, paddingV: 2, fontSize: FontSize.xs };
      case 'lg':
        return { paddingH: Spacing.md, paddingV: Spacing.sm, fontSize: FontSize.md };
      default:
        return { paddingH: Spacing.sm, paddingV: Spacing.xs, fontSize: FontSize.sm };
    }
  };

  const colors = getColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyles.paddingH,
          paddingVertical: sizeStyles.paddingV,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default Badge;
