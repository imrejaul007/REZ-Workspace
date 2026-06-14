/**
 * LoadingSpinner Component
 * Consistent loading indicator for merchant app
 *
 * Accessibility: Uses accessibilityRole="progressbar" for screen readers
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color = colors.primaryMain,
  message,
  fullScreen = false,
  style,
}: LoadingSpinnerProps): React.JSX.Element {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={styles.message} accessibilityRole="text">
          {message}
        </Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View
        style={[styles.fullScreenContainer, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={message || 'Loading'}
        accessibilityState={{ busy: true }}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}
      accessibilityState={{ busy: true }}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  message: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
});

export default LoadingSpinner;
