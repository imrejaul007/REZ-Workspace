// ==========================================
// MyTalent - Trust Wallet Screen
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card } from '../../src/components';
import { mockTrustBadges } from '../../src/data/mockData';

export default function TrustWalletScreen() {
  const badges = mockTrustBadges;

  const badgeCategories = [
    { key: 'verification', label: 'Verification', badges: badges.filter(b => b.category === 'verification') },
    { key: 'achievement', label: 'Achievements', badges: badges.filter(b => b.category === 'achievement') },
    { key: 'skills', label: 'Skills', badges: badges.filter(b => b.category === 'skills') },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Badge Grid */}
      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <Card key={badge.id} style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDesc}>{badge.description}</Text>
            <Text style={styles.badgeDate}>{badge.earnedAt}</Text>
          </Card>
        ))}
      </View>

      {/* Badges by Category */}
      {badgeCategories.map((category) => (
        <View key={category.key}>
          <Text style={styles.sectionTitle}>{category.label}</Text>
          <View style={styles.categoryGrid}>
            {category.badges.map((badge) => (
              <View key={badge.id} style={styles.categoryBadge}>
                <Text style={styles.categoryIcon}>{badge.icon}</Text>
                <Text style={styles.categoryName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: Spacing.sm },
  badgeCard: { width: '47%', alignItems: 'center', padding: Spacing.lg },
  badgeIcon: { fontSize: 48, marginBottom: Spacing.sm },
  badgeName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  badgeDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  badgeDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  categoryBadge: { backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryIcon: { fontSize: 16 },
  categoryName: { fontSize: FontSize.sm, color: Colors.textPrimary },
  bottomSpacer: { height: Spacing.xxl },
});
