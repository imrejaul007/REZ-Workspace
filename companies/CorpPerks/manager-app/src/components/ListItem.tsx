// ==========================================
// CorpPerks Manager App - ListItem Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../utils/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftContent,
  rightContent,
  onPress,
  showDivider = true,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {leftContent && <View style={styles.left}>{leftContent}</View>}
      <View style={[styles.content, !leftContent && { marginLeft: 0 }]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightContent && <View style={styles.right}>{rightContent}</View>}
      {onPress && <Text style={styles.chevron}>{'>'}</Text>}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  left: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    marginLeft: Spacing.sm,
  },
  chevron: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
});

export default ListItem;
