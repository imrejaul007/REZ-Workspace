/**
 * Button Component
 * Reusable button component with various styles and states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: Colors.primary[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
  secondary: {
    container: {
      backgroundColor: Colors.secondary[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.primary[500],
    },
    text: {
      color: Colors.primary[500],
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: Colors.primary[500],
    },
  },
  danger: {
    container: {
      backgroundColor: Colors.error[500],
    },
    text: {
      color: Colors.text.inverse,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      height: 36,
      paddingHorizontal: Spacing.base,
    },
    text: {
      fontSize: Typography.fontSize.sm,
    },
  },
  md: {
    container: {
      height: 44,
      paddingHorizontal: Spacing.lg,
    },
    text: {
      fontSize: Typography.fontSize.base,
    },
  },
  lg: {
    container: {
      height: 52,
      paddingHorizontal: Spacing.xl,
    },
    text: {
      fontSize: Typography.fontSize.lg,
    },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text.color}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.text,
              variantStyle.text,
              sizeStyle.text,
              leftIcon && styles.textWithLeftIcon,
              rightIcon && styles.textWithRightIcon,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  textWithLeftIcon: {
    marginLeft: Spacing.xs,
  },
  textWithRightIcon: {
    marginRight: Spacing.xs,
  },
});

export default Button;
