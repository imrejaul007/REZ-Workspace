/**
 * AddressCard Component - Extracted from checkout.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface AddressCardProps {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  address: string;
  isDefault?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
}

export default function AddressCard({ type, name, phone, address, isDefault, onPress, onEdit }: AddressCardProps) {
  const icons = { home: 'home', work: 'business', other: 'location' };

  return (
    <Pressable style={[styles.container, isDefault && styles.default]} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={icons[type] as unknown} size={24} color={isDefault ? '#fff' : colors.text.secondary} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.type}>{type.charAt(0).toUpperCase() + type.slice(1)} {isDefault ? '(Default)' : ''}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
        <Text style={styles.address} numberOfLines={2}>{address}</Text>
      </View>
      {onEdit && (
        <Pressable style={styles.edit} onPress={onEdit}>
          <Ionicons name="pencil" size={18} color={colors.primary[500] ?? '#FF6B35'} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.default },
  default: { borderColor: colors.primary[500] ?? '#FF6B35', borderWidth: 2 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  type: { fontSize: 12, fontWeight: '600', color: colors.text.tertiary, textTransform: 'uppercase' },
  name: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  phone: { fontSize: 13, color: colors.text.secondary, marginBottom: 4 },
  address: { fontSize: 13, color: colors.text.tertiary },
  edit: { padding: spacing.sm },
});
