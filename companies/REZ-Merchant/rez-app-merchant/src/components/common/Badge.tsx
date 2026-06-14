/**
 * Badge Component
 * Status badge for merchant app
 *
 * Accessibility:
 * - accessibilityRole="text" for screen readers
 * - Color + text combination for contrast
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  success: {
    container: {
      backgroundColor: colors.success[100],
    },
    text: {
      color: colors.success[700],
    },
  },
  error: {
    container: {
      backgroundColor: colors.error[100],
    },
    text: {
      color: colors.error[700],
    },
  },
  warning: {
    container: {
      backgroundColor: colors.warning[100],
    },
    text: {
      color: colors.warning[700],
    },
  },
  info: {
    container: {
      backgroundColor: colors.primary[100],
    },
    text: {
      color: colors.primary[700],
    },
  },
  default: {
    container: {
      backgroundColor: colors.gray[100],
    },
    text: {
      color: colors.gray[700],
    },
  },
};

export function Badge({
  label,
  variant = 'default',
  style,
  textStyle,
}: BadgeProps): React.JSX.Element {
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <View
      style={[styles.container, variantStyle.container, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      <Text style={[styles.text, variantStyle.text, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  } as ViewStyle,
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
});

export default Badge;
