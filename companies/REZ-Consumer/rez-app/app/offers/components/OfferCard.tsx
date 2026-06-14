/**
 * OfferCard Component - Extracted from offers screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface OfferCardProps {
  id: string;
  title: string;
  description?: string;
  image?: string;
  code?: string;
  expiresAt?: string;
  onPress?: () => void;
  onCopy?: () => void;
}

export default function OfferCard({ title, description, image, code, expiresAt, onPress, onCopy }: OfferCardProps) {
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <Pressable style={[styles.container, isExpired && styles.expired]} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <View style={styles.badge}>
          {isExpired ? (
            <Text style={styles.expiredBadge}>Expired</Text>
          ) : code ? (
            <Text style={styles.codeBadge}>Use Code</Text>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
        {code && !isExpired && (
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Text style={styles.code}>{code}</Text>
            </View>
            <Pressable onPress={onCopy} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={16} color={colors.primary[500] ?? '#FF6B35'} />
            </Pressable>
          </View>
        )}
        {expiresAt && !isExpired && (
          <Text style={styles.expires}>Expires {expiresAt}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  expired: { opacity: 0.6 },
  image: { width: 80, height: 80, borderRadius: borderRadius.md, marginRight: spacing.md },
  content: { flex: 1 },
  badge: { marginBottom: spacing.xs },
  expiredBadge: { fontSize: 10, fontWeight: '600', color: '#EF4444', backgroundColor: '#FEE2E2', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  codeBadge: { fontSize: 10, fontWeight: '600', color: '#059669', backgroundColor: '#D1FAE5', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  description: { fontSize: 13, color: colors.text.secondary, marginBottom: spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  codeBox: { backgroundColor: colors.background.secondary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 4, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border.default },
  code: { fontSize: 12, fontWeight: '600', color: colors.text.primary, letterSpacing: 1 },
  copyBtn: { marginLeft: spacing.sm, padding: 4 },
  expires: { fontSize: 11, color: colors.text.tertiary },
});
