/**
 * Chip Component
 * Reusable chip/tag component for filters and selections
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';

type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const variantStyles: Record<ChipVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: {
      backgroundColor: Colors.gray[100],
    },
    text: {
      color: Colors.text.secondary,
    },
  },
  primary: {
    container: {
      backgroundColor: Colors.primary[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
  success: {
    container: {
      backgroundColor: Colors.success[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
  warning: {
    container: {
      backgroundColor: Colors.warning[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
  error: {
    container: {
      backgroundColor: Colors.error[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.border.default,
    },
    text: {
      color: Colors.text.secondary,
    },
  },
};

export function Chip({
  label,
  selected = false,
  onPress,
  variant = 'default',
  icon,
  iconPosition = 'left',
  size = 'md',
  style,
  textStyle,
  disabled = false,
}: ChipProps) {
  const variantStyle = variantStyles[selected ? 'primary' : variant];

  const sizeStyles = {
    sm: {
      container: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
      },
      text: {
        fontSize: Typography.fontSize.xs,
      },
    },
    md: {
      container: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
      },
      text: {
        fontSize: Typography.fontSize.sm,
      },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyle.container,
        currentSize.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 12 : 14}
          color={variantStyle.text.color}
          style={styles.iconLeft}
        />
      )}
      <Text
        style={[
          styles.text,
          variantStyle.text,
          currentSize.text,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 12 : 14}
          color={variantStyle.text.color}
          style={styles.iconRight}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
});

export default Chip;
