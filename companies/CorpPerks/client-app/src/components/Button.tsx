// ==========================================
// CorpPerks Client App - Button Component
// ==========================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled) return Colors.border;
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return Colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return Colors.textInverse;
      case 'outline':
        return Colors.primary;
      case 'ghost':
        return Colors.textPrimary;
      default:
        return Colors.textInverse;
    }
  };

  const getBorderColor = () => {
    if (isDisabled) return Colors.border;
    if (variant === 'outline') return Colors.primary;
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md };
      case 'lg':
        return { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl };
      default:
        return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return FontSize.sm;
      case 'lg':
        return FontSize.lg;
      default:
        return FontSize.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          ...getPadding(),
        },
        fullWidth && styles.fullWidth,
        variant === 'outline' && styles.outline,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getFontSize() },
              icon ? styles.textWithIcon : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
});
