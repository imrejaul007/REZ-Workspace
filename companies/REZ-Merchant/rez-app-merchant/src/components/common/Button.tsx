/**
 * Button Component
 * Consistent button component for merchant app
 *
 * Accessibility (WCAG 2.1 Level AA):
 * - Touch targets minimum 44x44px
 * - accessibilityRole="button" for screen readers
 * - Proper contrast ratios
 * - Loading and disabled states announced
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, touchTarget } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primaryMain,
    },
    text: {
      color: colors.text.inverse,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.gray[600],
    },
    text: {
      color: colors.text.inverse,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primaryMain,
    },
    text: {
      color: colors.primaryMain,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: colors.primaryMain,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.errorMain,
    },
    text: {
      color: colors.text.inverse,
    },
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  small: {
    container: {
      height: touchTarget.minimum,
      paddingHorizontal: spacing.md,
    },
    text: {
      fontSize: typography.fontSize.sm,
    },
  },
  medium: {
    container: {
      height: touchTarget.recommended,
      paddingHorizontal: spacing.lg,
    },
    text: {
      fontSize: typography.fontSize.base,
    },
  },
  large: {
    container: {
      height: 56,
      paddingHorizontal: spacing.xl,
    },
    text: {
      fontSize: typography.fontSize.md,
    },
  },
};

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}: ButtonProps): React.JSX.Element {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isInteractive = !disabled && !loading;

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...variantStyle.container,
    ...sizeStyle.container,
    ...(fullWidth && styles.fullWidth),
    ...(disabled && styles.disabled),
  };

  const labelStyle: TextStyle = {
    ...styles.text,
    ...variantStyle.text,
    ...sizeStyle.text,
    ...(disabled && styles.disabledText),
  };

  const handlePress = () => {
    if (!isInteractive) return;
    onPress();
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={handlePress}
      disabled={!isInteractive}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle.text.color}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {title && <Text style={[labelStyle, textStyle]}>{title}</Text>}
          {children}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  } as ViewStyle,
  fullWidth: {
    width: '100%',
  } as ViewStyle,
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.gray[400],
    shadowOpacity: 0,
    elevation: 0,
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  iconContainer: {
    marginRight: spacing.sm,
  } as ViewStyle,
  text: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  } as TextStyle,
  disabledText: {
    color: colors.text.tertiary,
  } as TextStyle,
});

export default Button;
