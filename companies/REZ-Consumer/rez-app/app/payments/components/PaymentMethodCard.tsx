/**
 * PaymentMethodCard Component - Extracted from payment screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface PaymentMethodCardProps {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking' | 'cod';
  name: string;
  icon?: string;
  isDefault?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
}

const icons = {
  card: 'card-outline',
  upi: 'qr-code-outline',
  wallet: 'wallet-outline',
  netbanking: 'business-outline',
  cod: 'cash-outline',
};

export default function PaymentMethodCard({ type, name, icon, isDefault, onPress, onEdit }: PaymentMethodCardProps) {
  return (
    <Pressable style={[styles.container, isDefault && styles.selected]} onPress={onPress}>
      <View style={[styles.icon, isDefault && styles.iconSelected]}>
        <Ionicons name={(icon || icons[type]) as unknown} size={24} color={isDefault ? '#fff' : colors.text.secondary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {isDefault && <Text style={styles.default}>Default</Text>}
      </View>
      {onEdit && (
        <Pressable style={styles.edit} onPress={onEdit}>
          <Ionicons name="pencil" size={18} color={colors.text.secondary} />
        </Pressable>
      )}
      <Ionicons name="checkmark-circle" size={20} color={isDefault ? colors.primary[500] ?? '#FF6B35' : colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.default },
  selected: { borderColor: colors.primary[500] ?? '#FF6B35', borderWidth: 2 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  iconSelected: { backgroundColor: colors.primary[500] ?? '#FF6B35' },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
  default: { fontSize: 11, color: colors.primary[500] ?? '#FF6B35', marginTop: 2 },
  edit: { marginRight: spacing.sm, padding: spacing.xs },
});
