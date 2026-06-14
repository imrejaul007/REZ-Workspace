/**
 * Card Component
 * Consistent card container for merchant app
 *
 * Accessibility:
 * - Supports accessibilityLabel for screen readers
 * - Can contain pressable regions
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: keyof typeof spacing;
  testID?: string;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  style,
  elevated = true,
  padding = 'base',
  testID,
  accessibilityLabel,
}: CardProps): React.JSX.Element {
  const cardStyle: ViewStyle = {
    ...styles.card,
    ...(elevated && shadows.md),
    padding: spacing[padding],
  };

  if (onPress) {
    return (
      <Pressable
        style={[cardStyle, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[cardStyle, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  } as ViewStyle,
});

export default Card;
