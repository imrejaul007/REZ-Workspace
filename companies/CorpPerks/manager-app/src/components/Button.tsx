// ==========================================
// CorpPerks Manager App - Button Component
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
import { Colors, BorderRadius, FontSize, Spacing } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? Colors.textMuted : Colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? Colors.textMuted : Colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? Colors.textMuted : Colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? Colors.textMuted : Colors.error,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    if (disabled) return Colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return Colors.textInverse;
      case 'outline':
      case 'ghost':
        return Colors.primary;
      default:
        return Colors.textInverse;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.md,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
        };
      default:
        return {
          paddingVertical: Spacing.sm + 2,
          paddingHorizontal: Spacing.lg,
        };
    }
  };

  const getFontSize = (): number => {
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
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
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
              icon ? { marginLeft: Spacing.sm } : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;
