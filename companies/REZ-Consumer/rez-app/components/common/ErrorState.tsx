/**
 * ErrorState Component
 *
 * Enhanced error display component with design tokens and dark mode support.
 * Provides a consistent UX for error handling across the app.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ErrorStateProps {
  /**
   * Error object or error message string
   */
  error: Error | string;

  /**
   * Callback function when retry button is pressed
   */
  onRetry?: () => void;

  /**
   * Optional custom title (defaults to "Oops! Something went wrong")
   */
  title?: string;

  /**
   * Optional custom styles
   */
  style?: object;
}

/**
 * ErrorState displays error information with an optional retry action
 *
 * @example
 * <ErrorState
 *   error={error}
 *   onRetry={() => refetchData()}
 *   title="Failed to Load Store"
 * />
 */
function ErrorState({
  error,
  onRetry,
  title = 'Oops! Something went wrong',
  style,
}: ErrorStateProps) {
  const { colors } = useTheme();
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <View
      style={[styles.container, style, { backgroundColor: colors.background.secondary }]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${title}. ${errorMessage}`}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.errorScale[50] }]}>
        <Ionicons
          name="alert-circle"
          size={48}
          color={colors.errorScale[500]}
        />
      </View>

      <Text
        style={[styles.title, { color: colors.errorScale[700] }]}
        accessible={true}
        accessibilityRole="header"
      >
        {title}
      </Text>

      <Text
        style={[styles.message, { color: colors.text.secondary }]}
        accessible={true}
        accessibilityRole="text"
      >
        {errorMessage}
      </Text>

      {onRetry && (
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.errorScale[500],
              ...shadows.md,
            },
          ]}
          onPress={onRetry}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Try Again"
          accessibilityHint="Double tap to retry the failed action"
        >
          <Ionicons
            name="refresh"
            size={18}
            color={colors.text.inverse}
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
            Try Again
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 320,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(ErrorState);
