// ==========================================
// MyTalent - List Item Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '../utils/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightContent,
  onPress,
  showDivider = true,
  style,
}: ListItemProps) {
  const content = (
    <View style={[styles.container, !showDivider && styles.noDivider, style]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
      {rightIcon && <Text style={styles.rightIcon}>{rightIcon}</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  noDivider: {
    borderBottomWidth: 0,
  },
  leftIcon: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightContent: {
    marginLeft: Spacing.sm,
  },
  rightIcon: {
    fontSize: 18,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
});
