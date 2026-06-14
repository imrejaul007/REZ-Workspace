// ==========================================
// MyTalent - CorpID Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, ProgressRing } from '../../src/components';
import { mockCorpIDProfile } from '../../src/data/mockData';
import { getCorpIDProfile } from '../../src/services/corpIdService';

export default function CorpIDScreen() {
  const [profile, setProfile] = useState(mockCorpIDProfile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await getCorpIDProfile('EMP001');
    if (result.success && result.profile) {
      setProfile(result.profile);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Elite': return Colors.elite;
      case 'Premium': return Colors.premium;
      case 'Verified': return Colors.verified;
      default: return Colors.textMuted;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* CorpID Card */}
      <Card style={styles.corpIdCard}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrIcon}>🪪</Text>
        </View>
        <Text style={styles.corpIdNumber}>{profile.corpId}</Text>
        <View style={[styles.tierBadge, { backgroundColor: `${getTierColor(profile.tier)}20` }]}>
          <Text style={[styles.tierText, { color: getTierColor(profile.tier) }]}>
            {profile.tier}
          </Text>
        </View>
      </Card>

      {/* CI Score */}
      <Card style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>CI Score</Text>
        <View style={styles.scoreMain}>
          <ProgressRing
            progress={profile.ciScore}
            size={120}
            strokeWidth={12}
            color={getTierColor(profile.tier)}
          />
          <View style={styles.scoreBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Identity</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${profile.scoreBreakdown.identityScore}%`, backgroundColor: Colors.success }]} />
              </View>
              <Text style={styles.breakdownValue}>{profile.scoreBreakdown.identityScore}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Employment</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${profile.scoreBreakdown.employmentScore}%`, backgroundColor: Colors.primary }]} />
              </View>
              <Text style={styles.breakdownValue}>{profile.scoreBreakdown.employmentScore}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Financial</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${profile.scoreBreakdown.financialScore}%`, backgroundColor: Colors.warning }]} />
              </View>
              <Text style={styles.breakdownValue}>{profile.scoreBreakdown.financialScore}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Social</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${profile.scoreBreakdown.socialScore}%`, backgroundColor: Colors.secondary }]} />
              </View>
              <Text style={styles.breakdownValue}>{profile.scoreBreakdown.socialScore}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Skills</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${profile.scoreBreakdown.skillScore}%`, backgroundColor: Colors.error }]} />
              </View>
              <Text style={styles.breakdownValue}>{profile.scoreBreakdown.skillScore}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Verification Status */}
      <Text style={styles.sectionTitle}>Verification Status</Text>
      <Card style={styles.verificationCard}>
        {Object.entries(profile.verificationStatus).map(([key, value]) => (
          <View key={key} style={styles.verifyItem}>
            <View style={styles.verifyInfo}>
              <Text style={styles.verifyIcon}>{value ? '✓' : '✗'}</Text>
              <Text style={styles.verifyLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </View>
            <View style={[styles.verifyStatus, { backgroundColor: value ? Colors.successLight : Colors.errorLight }]}>
              <Text style={[styles.verifyStatusText, { color: value ? Colors.success : Colors.error }]}>
                {value ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Passport Details */}
      <Text style={styles.sectionTitle}>Passport Details</Text>
      <Card style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CorpID</Text>
          <Text style={styles.detailValue}>{profile.corpId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Issued</Text>
          <Text style={styles.detailValue}>{profile.createdAt}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated</Text>
          <Text style={styles.detailValue}>{profile.lastUpdated}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={[styles.detailValue, { color: Colors.success }]}>Active</Text>
        </View>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  corpIdCard: { margin: Spacing.md, alignItems: 'center' },
  qrPlaceholder: { width: 120, height: 120, backgroundColor: Colors.backgroundDark, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  qrIcon: { fontSize: 48 },
  corpIdNumber: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  tierBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  tierText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scoreCard: { marginHorizontal: Spacing.md },
  scoreTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.md },
  scoreMain: { flexDirection: 'row', alignItems: 'center' },
  scoreBreakdown: { flex: 1, marginLeft: Spacing.lg },
  breakdownItem: { marginBottom: Spacing.sm },
  breakdownLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  breakdownBar: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3 },
  breakdownFill: { height: '100%', borderRadius: 3 },
  breakdownValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  verificationCard: { marginHorizontal: Spacing.md },
  verifyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  verifyInfo: { flexDirection: 'row', alignItems: 'center' },
  verifyIcon: { fontSize: FontSize.md, marginRight: Spacing.sm },
  verifyLabel: { fontSize: FontSize.md, color: Colors.textPrimary },
  verifyStatus: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  verifyStatusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  detailsCard: { marginHorizontal: Spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  detailValue: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  bottomSpacer: { height: Spacing.xxl },
});
