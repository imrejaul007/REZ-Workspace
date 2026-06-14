import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

const EmptyStateComponent: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  iconColor,
}) => {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const colors = Colors[scheme];

  const effectiveIconColor = iconColor ?? colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={48} color={effectiveIconColor} />
      </View>
      <ThemedText style={[styles.title, { color: colors.text }]}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
            {actionLabel}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const EmptyState = React.memo(EmptyStateComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
