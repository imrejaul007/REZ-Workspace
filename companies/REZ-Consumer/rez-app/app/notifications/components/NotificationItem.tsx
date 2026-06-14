/**
 * NotificationItem Component - Extracted from notifications screen
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface NotificationItemProps {
  id: string;
  icon: string;
  iconColor?: string;
  title: string;
  message: string;
  timestamp: string;
  unread?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
}

export default function NotificationItem({ icon, iconColor = colors.primary[500] ?? '#FF6B35', title, message, timestamp, unread, onPress, onDismiss }: NotificationItemProps) {
  return (
    <Pressable style={[styles.container, unread && styles.unread]} onPress={onPress}>
      <View style={[styles.icon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as unknown} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
      {unread && <View style={styles.dot} />}
      {onDismiss && (
        <Pressable style={styles.dismiss} onPress={onDismiss}>
          <Ionicons name="close" size={16} color={colors.text.tertiary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, backgroundColor: colors.background.primary, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  unread: { backgroundColor: colors.background.secondary },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  message: { fontSize: 13, color: colors.text.secondary, marginBottom: 4 },
  timestamp: { fontSize: 11, color: colors.text.tertiary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500] ?? '#FF6B35', alignSelf: 'center', marginLeft: spacing.sm },
  dismiss: { padding: spacing.xs },
});
