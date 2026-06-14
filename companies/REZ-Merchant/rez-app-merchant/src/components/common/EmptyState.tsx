/**
 * EmptyState Component
 * Consistent empty state display for merchant app
 *
 * Accessibility:
 * - Uses accessibilityRole="text" for the message
 * - Supports accessibilityLabel for custom descriptions
 * - Buttons have proper accessibilityRole="button"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps): React.JSX.Element {
  const hasActions = actionLabel || secondaryActionLabel;

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={`${title}${message ? `. ${message}` : ''}`}
    >
      {icon && (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
      {hasActions && (
        <View style={styles.actions}>
          {actionLabel && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          )}
          {secondaryActionLabel && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onSecondaryAction}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  } as TextStyle,
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  } as ViewStyle,
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  primaryButton: {
    backgroundColor: colors.primaryMain,
    ...shadows.sm,
  } as ViewStyle,
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  } as TextStyle,
  primaryButtonText: {
    color: colors.text.inverse,
  } as TextStyle,
  secondaryButtonText: {
    color: colors.text.primary,
  } as TextStyle,
});

export default EmptyState;
