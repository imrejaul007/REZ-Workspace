import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/DesignTokens';

/**
 * PrimaryButton - Shared across all REZ apps (Consumer, Merchant, Admin)
 *
 * DESIGN SYSTEM RULES:
 * - All colors must come from design tokens (never hardcoded hex)
 * - All spacing must use spacing tokens (8px grid)
 * - All border radius must use design system constants
 * - All shadows must use design system shadows
 * - All typography must use typography tokens
 *
 * This is the single source of truth for primary buttons across all platforms.
 * Each app adapts the color scheme while maintaining consistent structure.
 */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const SIZE_CONFIG: Record<ButtonSize, { height: number; paddingH: number; iconSize: number }> = {
  small: { height: 40, paddingH: 16, iconSize: 16 },
  medium: { height: 48, paddingH: 20, iconSize: 18 },
  large: { height: 56, paddingH: 24, iconSize: 20 },
};

function PrimaryButton({
  title,
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
  textStyle: customTextStyle,
  testID,
}: PrimaryButtonProps) {
  const scaleAnim = useSharedValue(1);
  const sizeConfig = SIZE_CONFIG[size];
  const isInteractive = !disabled && !loading;

  /**
   * Variant background colors - sourced from design tokens
   * Merchant app uses purple as primary, but respects design system
   */
  const variantBg = useMemo<Record<ButtonVariant, string>>(() => ({
    primary: Colors.light.primary, // #7C3AED (Merchant purple)
    secondary: Colors.light.secondary, // #10B981 (Merchant green)
    outline: 'transparent',
    ghost: 'transparent',
    danger: Colors.light.danger, // #EF4444 (Shared error)
  }), []);

  /**
   * Variant text colors - sourced from design tokens
   */
  const variantText = useMemo<Record<ButtonVariant, string>>(() => ({
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: Colors.light.primary,
    ghost: Colors.light.primary,
    danger: '#FFFFFF',
  }), []);

  const textColor = variantText[variant];

  const handlePressIn = useCallback(() => {
    scaleAnim.value = withSpring(0.96, { damping: 14, stiffness: 180, overshootClamping: false });
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 160, overshootClamping: false });
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (!isInteractive) return;
    if (haptic && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((e) => console.warn('[PrimaryButton] Haptic feedback failed:', e));
      } catch {}
    }
    onPress();
  }, [isInteractive, haptic, onPress]);

  const isOutlineOrGhost = variant === 'outline' || variant === 'ghost';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: variantBg[variant],
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingH,
    ...(variant === 'outline' && {
      borderWidth: 1.5,
      borderColor: Colors.light.primary,
    }),
    ...((disabled || loading) && {
      opacity: 0.6,
      backgroundColor: disabled ? '#E5E7EB' : variantBg[variant],
    }),
    ...(fullWidth && { width: '100%' as const }),
  };

  const labelStyle: TextStyle = {
    textAlign: 'center',
    color: textColor,
    fontSize: size === 'small' ? 12 : 14,
    lineHeight: size === 'small' ? 16 : 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    ...customTextStyle,
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={animatedButtonStyle}>
      <Pressable
        style={[containerStyle, style]}
        onPress={handlePress}
        onPressIn={isInteractive ? handlePressIn : undefined}
        onPressOut={isInteractive ? handlePressOut : undefined}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        accessibilityLabel={loading ? `${title}, loading` : title}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator
            color={textColor}
            size={size === 'small' ? 'small' : 'large'}
          />
        ) : (
          <>
            {icon}
            {leftIcon && (
              <MaterialIcons name={leftIcon} size={sizeConfig.iconSize} color={textColor} />
            )}
            <Text style={labelStyle}>{title}</Text>
            {rightIcon && (
              <MaterialIcons name={rightIcon} size={sizeConfig.iconSize} color={textColor} />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(PrimaryButton);
