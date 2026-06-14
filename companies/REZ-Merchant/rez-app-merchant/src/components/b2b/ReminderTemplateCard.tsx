/**
 * ReminderTemplateCard Component
 * Displays reminder template preview with edit functionality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Badge } from '@/components/common/Badge';
import { ReminderTemplate } from '@/services/b2bApi';

interface ReminderTemplateCardProps {
  template: ReminderTemplate;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  style?: ViewStyle;
}

const PRIORITY_CONFIG: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
  low: { variant: 'success', label: 'Low' },
  medium: { variant: 'warning', label: 'Medium' },
  high: { variant: 'error', label: 'High' },
};

const CHANNEL_CONFIG: Record<string, { icon: string; label: string }> = {
  sms: { icon: 'SMS', label: 'SMS' },
  whatsapp: { icon: 'WA', label: 'WhatsApp' },
  email: { icon: 'EM', label: 'Email' },
};

export function ReminderTemplateCard({
  template,
  onPress,
  onEdit,
  onDelete,
  onToggleActive,
  style,
}: ReminderTemplateCardProps): React.JSX.Element {
  const priorityConfig = PRIORITY_CONFIG[template.priority];
  const channelConfig = CHANNEL_CONFIG[template.channel];

  // Parse message to show preview with variables
  const renderMessagePreview = (message: string): string => {
    const maxLength = 120;
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !template.isActive && styles.inactiveContainer,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`Template ${template.name}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{template.name}</Text>
          {template.subject && (
            <Text style={styles.subject} numberOfLines={1}>
              {template.subject}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Badge label={priorityConfig.label} variant={priorityConfig.variant} />
          {!template.isActive && (
            <Badge label="Inactive" variant="default" />
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.messagePreview}>
        <Text style={styles.messageText}>
          {renderMessagePreview(template.message)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <View style={styles.channelBadge}>
            <Text style={styles.channelIcon}>{channelConfig.icon}</Text>
          </View>
          <Text style={styles.channelLabel}>{channelConfig.label}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Triggers</Text>
          <Text style={styles.metaValue}>
            {template.daysAfterDue === 0
              ? 'On due date'
              : `${template.daysAfterDue} days after due`}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${template.name}`}
        >
          <Text style={[styles.actionButtonText, styles.editButtonText]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={onToggleActive}
          accessibilityRole="button"
          accessibilityLabel={template.isActive ? 'Deactivate template' : 'Activate template'}
        >
          <Text style={[styles.actionButtonText, styles.toggleButtonText]}>
            {template.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>

        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${template.name}`}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.md,
  } as ViewStyle,
  inactiveContainer: {
    opacity: 0.7,
    backgroundColor: colors.gray[50],
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  } as ViewStyle,
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  subject: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  } as ViewStyle,
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  } as ViewStyle,
  messagePreview: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  } as ViewStyle,
  messageText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  } as TextStyle,
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  channelBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  channelIcon: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  } as TextStyle,
  channelLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  metaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  metaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  } as ViewStyle,
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  } as ViewStyle,
  editButton: {
    backgroundColor: colors.primary[50],
  } as ViewStyle,
  toggleButton: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  deleteButton: {
    backgroundColor: colors.error[50],
  } as ViewStyle,
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  } as TextStyle,
  editButtonText: {
    color: colors.primary[600],
  } as TextStyle,
  toggleButtonText: {
    color: colors.text.secondary,
  } as TextStyle,
  deleteButtonText: {
    color: colors.error[600],
  } as TextStyle,
});

export default ReminderTemplateCard;
