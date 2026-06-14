/**
 * ProfileMenuItem Component - Extracted from profile screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface ProfileMenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export default function ProfileMenuItem({ icon, title, subtitle, value, badge, onPress, showChevron = true }: ProfileMenuItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={icon as unknown} size={20} color={colors.primary[500] ?? '#FF6B35'} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.value}>{value}</Text>}
      {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      {showChevron && <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.background.primary },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: colors.text.primary },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  value: { fontSize: 14, color: colors.text.tertiary, marginRight: spacing.sm },
  badge: { backgroundColor: '#EF4444', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10, marginRight: spacing.sm },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
