// ==========================================
// CorpPerks Client App - ListItem Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize } from '../utils/theme';
import { Avatar } from './Avatar';

interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  avatar?: {
    uri?: string;
    name: string;
  };
  onPress?: () => void;
  style?: ViewStyle;
  showBorder?: boolean;
}

export function ListItem({
  title,
  subtitle,
  description,
  leftElement,
  rightElement,
  avatar,
  onPress,
  style,
  showBorder = true,
}: ListItemProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.container, showBorder && styles.border, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {avatar && (
        <Avatar uri={avatar.uri} name={avatar.name} size="md" style={styles.avatar} />
      )}
      {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  leftElement: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
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
  description: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: Spacing.md,
  },
});
