/**
 * EmptyState Component
 *
 * Displays empty state UI with icon, title, message, and optional action button.
 * Uses the design system tokens for consistent styling.
 */

import React from 'react';
import { View, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import Text from '../ui/Text';

interface EmptyStateProps {
  title: string;
  message?: string;
  subtitle?: string;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
  imageSource?: ImageSourcePropType;
  actionLabel?: string;
  onAction?: () => void;
  trustText?: string;
  secondaryCTALabel?: string;
  onSecondaryAction?: () => void;
  style?: object;
}

function EmptyState({
  title,
  message,
  subtitle,
  icon,
  iconName,
  iconColor,
  iconBackgroundColor,
  actionLabel,
  onAction,
  trustText,
  secondaryCTALabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const { colors, shadows } = useTheme();
  const description = subtitle || message;
  const resolvedIconColor = iconColor ?? colors.secondary[600];
  const resolvedIconBg = iconBackgroundColor ?? colors.background.tertiary;

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={`${title}. ${description || ''}`}
    >
      {iconName ? (
        <View style={[styles.iconCircle, { backgroundColor: resolvedIconBg }]}>
          <Ionicons name={iconName} size={32} color={resolvedIconColor} />
        </View>
      ) : icon ? (
        <View style={[styles.iconCircle, { backgroundColor: resolvedIconBg }]}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>
      ) : null}

      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>

      {description && (
        <Text variant="body" color="secondary" align="center" style={styles.message}>
          {description}
        </Text>
      )}

      {trustText && (
        <Text variant="bodySmall" color="tertiary" align="center" style={styles.trustText}>
          {trustText}
        </Text>
      )}

      {actionLabel && onAction && (
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.primary[500],
              ...shadows.subtle,
            },
          ]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text variant="button" style={{ color: colors.text.inverse }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}

      {secondaryCTALabel && onSecondaryAction && (
        <Pressable
          style={[
            styles.secondaryButton,
            {
              borderColor: colors.primary[500],
            },
          ]}
          onPress={onSecondaryAction}
          accessibilityRole="button"
          accessibilityLabel={secondaryCTALabel}
        >
          <Text variant="button" style={{ color: colors.primary[500] }}>
            {secondaryCTALabel}
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
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    marginBottom: spacing.sm,
  },
  message: {
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  trustText: {
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  button: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
});

export default React.memo(EmptyState);
