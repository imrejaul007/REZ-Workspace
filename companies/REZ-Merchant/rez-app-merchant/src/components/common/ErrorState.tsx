/**
 * ErrorState Component
 * Consistent error state display for merchant app
 *
 * Accessibility:
 * - Uses accessibilityRole="alert" for screen readers
 * - Retry button has proper accessibilityLabel
 * - Error icon is hidden from screen readers
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';

interface ErrorStateProps {
  icon?: string;
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({
  icon = '⚠️',
  title = 'Something went wrong',
  message,
  retryLabel = 'Try Again',
  onRetry,
  style,
}: ErrorStateProps): React.JSX.Element {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLabel={`${title}: ${message}`}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  } as ViewStyle,
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  } as TextStyle,
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.errorMain,
    textAlign: 'center',
    marginBottom: spacing.sm,
  } as TextStyle,
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  } as TextStyle,
  retryButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryMain,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  } as ViewStyle,
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
});

export default ErrorState;
