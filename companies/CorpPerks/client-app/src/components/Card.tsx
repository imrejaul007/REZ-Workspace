// ==========================================
// CorpPerks Client App - Card Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  title,
  subtitle,
  headerRight,
  footer,
  style,
  contentStyle,
  padding = 'md',
}: CardProps) {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.sm;
      case 'lg':
        return Spacing.lg;
      default:
        return Spacing.md;
    }
  };

  return (
    <View style={[styles.card, style]}>
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}
      <View style={[styles.content, { padding: getPadding() }, contentStyle]}>
        {children}
      </View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {},
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
