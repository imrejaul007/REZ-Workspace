// @ts-nocheck
import React, {  useCallback, useMemo } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  label?: string; // Alias for title
}

const SIZE_CONFIG: Record<ButtonSize, { height: number; paddingH: number; iconSize: number }> = {
  small: { height: 48, paddingH: spacing.base, iconSize: 16 }, // ACCESSIBILITY FIX: Increased from 40 to 48px for WCAG 2.1 Level AA touch target
  medium: { height: 48, paddingH: spacing.lg, iconSize: 18 }, // WCAG 2.1 Level AA touch target
  large: { height: 56, paddingH: spacing.xl, iconSize: 20 },
};

function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  leftIcon,
  rightIcon,
  haptic = true,
  style,
  textStyle = {} as StyleProp<TextStyle>,
  testID,
  label,
}: ButtonProps) {
  const buttonTitle = title || label;
  const { colors, shadows } = useTheme();
  const scaleAnim = useSharedValue(1);
  const sizeConfig = SIZE_CONFIG[size];
  const isInteractive = !disabled && !loading;

  const variantBg = useMemo<Record<ButtonVariant, string>>(() => ({
    primary: colors.primary[500],
    secondary: colors.secondary[600],
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  }), [colors]);

  const variantText = useMemo<Record<ButtonVariant, string>>(() => ({
    primary: colors.secondary[700],
    secondary: colors.text.inverse,
    outline: colors.primary[500],
    ghost: colors.primary[500],
    danger: colors.text.inverse,
  }), [colors]);

  const textColor = variantText[variant];

  const handlePressIn = useCallback(() => {
    // LUCA: Spring-based scale down (0.96) with natural bounce on press-in
    scaleAnim.value = withSpring(0.96, { damping: 14, stiffness: 180, overshootClamping: false });
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    // LUCA: Spring-based scale back to 1.0 with satisfying overshoot and settle
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 160, overshootClamping: false });
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (!isInteractive) return;
    if (haptic) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
    onPress();
  }, [isInteractive, haptic, onPress]);

  const isOutlineOrGhost = variant === 'outline' || variant === 'ghost';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: variantBg[variant],
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingH,
    ...(variant === 'outline' && {
      borderWidth: 1.5,
      borderColor: colors.primary[500],
    }),
    ...(!isOutlineOrGhost && shadows.subtle),
    ...(isOutlineOrGhost && { shadowOpacity: 0, elevation: 0 }),
    ...(fullWidth && { width: '100%' as const }),
    ...((disabled || loading) && {
      opacity: 0.6,
      backgroundColor: disabled ? colors.gray[200] : variantBg[variant],
    }),
  };

  const labelStyle: unknown = {
    textAlign: 'center',
    color: textColor,
    fontSize: 14,
    fontWeight: '600',
  };

  // LUCA: Animated style for scale transform
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={animatedButtonStyle as unknown}>
      <Pressable
        style={[containerStyle, style]}
        onPress={handlePress}
        onPressIn={isInteractive ? handlePressIn : undefined}
        onPressOut={isInteractive ? handlePressOut : undefined}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        accessibilityLabel={loading ? `${buttonTitle}, loading` : buttonTitle}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator
            color={textColor}
            size={size === 'small' ? 'small' : 'large'}
          />
        ) : children ? (
          children
        ) : (
          <>
            {icon}
            {leftIcon && (
              <Ionicons name={leftIcon} size={sizeConfig.iconSize} color={textColor} />
            )}
            <Text style={labelStyle}>{buttonTitle}</Text>
            {rightIcon && (
              <Ionicons name={rightIcon} size={sizeConfig.iconSize} color={textColor} />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(Button);
