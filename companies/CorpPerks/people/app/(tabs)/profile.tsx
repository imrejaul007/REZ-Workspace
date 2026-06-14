// ==========================================
// MyTalent - Profile Tab Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, Button, ProgressRing } from '../../src/components';
import { mockEmployee, mockCorpIDProfile, mockTrustBadges } from '../../src/data/mockData';
import { getCorpIDProfile } from '../../src/services/corpIdService';
import { useAppStore } from '../../src/store/useAppStore';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { reset } = useAppStore();
  const { logout } = useAuthStore();
  const [corpIdProfile, setCorpIdProfile] = useState(mockCorpIDProfile);

  useEffect(() => {
    loadCorpID();
  }, []);

  const loadCorpID = async () => {
    const result = await getCorpIDProfile('EMP001');
    if (result.success && result.profile) {
      setCorpIdProfile(result.profile);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              reset();
            } catch (error) {
              logger.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Elite':
        return Colors.elite;
      case 'Premium':
        return Colors.premium;
      case 'Verified':
        return Colors.verified;
      default:
        return Colors.textMuted;
    }
  };

  const profileSections = [
    {
      id: 'corpId',
      title: 'CorpID Passport',
      icon: '🪪',
      subtitle: `${corpIdProfile?.corpId || 'CI-IND-XXXX'} • CI Score: ${corpIdProfile?.ciScore || 0}`,
      badge: corpIdProfile?.tier,
      onPress: () => navigation.navigate('CorpID'),
    },
    {
      id: 'professionalPassport',
      title: 'Professional Passport',
      icon: '📋',
      subtitle: 'Career timeline, projects, reputation',
      onPress: () => navigation.navigate('ProfessionalPassport'),
    },
    {
      id: 'trustWallet',
      title: 'Trust Wallet',
      icon: '👛',
      subtitle: `${corpIdProfile?.badges?.length || 0} badges earned`,
      onPress: () => navigation.navigate('TrustWallet'),
    },
    {
      id: 'documents',
      title: 'Document Vault',
      icon: '📄',
      subtitle: 'Offer letter, Payslips, Certificates',
      onPress: () => navigation.navigate('Documents'),
    },
    {
      id: 'directory',
      title: 'People Directory',
      icon: '👥',
      subtitle: 'Find colleagues',
      onPress: () => navigation.navigate('Directory'),
    },
    {
      id: 'announcements',
      title: 'Announcements',
      icon: '📢',
      subtitle: 'HR updates, Company news',
      onPress: () => navigation.navigate('Announcements'),
    },
    {
      id: 'support',
      title: 'Support Center',
      icon: '🎧',
      subtitle: 'Help & FAQs',
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: 'aiCopilot',
      title: 'AI Copilot',
      icon: '🤖',
      subtitle: 'Ask anything',
      onPress: () => navigation.navigate('AICopilot'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{mockEmployee.avatar}</Text>
        </View>
        <Text style={styles.userName}>{mockEmployee.name}</Text>
        <Text style={styles.userDesignation}>{mockEmployee.designation}</Text>
        <Text style={styles.userDept}>{mockEmployee.department} • {mockEmployee.companyName}</Text>

        {/* CI Score Badge */}
        <TouchableOpacity
          style={styles.ciScoreBadge}
          onPress={() => navigation.navigate('CorpID')}
        >
          <ProgressRing
            progress={corpIdProfile?.ciScore || 0}
            size={60}
            strokeWidth={6}
            color={getTierColor(corpIdProfile?.tier || '')}
          />
          <View style={styles.ciScoreInfo}>
            <Text style={styles.ciScoreLabel}>CI Score</Text>
            <Text style={[styles.ciScoreValue, { color: getTierColor(corpIdProfile?.tier || '') }]}>
              {corpIdProfile?.ciScore || 0}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Verification Status */}
        <View style={styles.verificationRow}>
          {corpIdProfile?.verificationStatus?.identity && (
            <View style={styles.verifyBadge}>
              <Text style={styles.verifyIcon}>✅</Text>
              <Text style={styles.verifyLabel}>Identity</Text>
            </View>
          )}
          {corpIdProfile?.verificationStatus?.employment && (
            <View style={styles.verifyBadge}>
              <Text style={styles.verifyIcon}>✅</Text>
              <Text style={styles.verifyLabel}>Employment</Text>
            </View>
          )}
          {corpIdProfile?.verificationStatus?.education && (
            <View style={styles.verifyBadge}>
              <Text style={styles.verifyIcon}>✅</Text>
              <Text style={styles.verifyLabel}>Education</Text>
            </View>
          )}
          {corpIdProfile?.verificationStatus?.skills && (
            <View style={styles.verifyBadge}>
              <Text style={styles.verifyIcon}>✅</Text>
              <Text style={styles.verifyLabel}>Skills</Text>
            </View>
          )}
        </View>
      </View>

      {/* Employee Details */}
      <Card style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Employee Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Employee ID</Text>
          <Text style={styles.detailValue}>{mockEmployee.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{mockEmployee.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{mockEmployee.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Join Date</Text>
          <Text style={styles.detailValue}>{mockEmployee.joinDate}</Text>
        </View>
      </Card>

      {/* Profile Sections */}
      {profileSections.map((section) => (
        <TouchableOpacity
          key={section.id}
          onPress={section.onPress}
          activeOpacity={0.7}
        >
          <Card style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionEmoji}>{section.icon}</Text>
              </View>
              <View style={styles.sectionInfo}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.badge && (
                    <View style={[styles.sectionBadge, { backgroundColor: `${getTierColor(section.badge)}20` }]}>
                      <Text style={[styles.sectionBadgeText, { color: getTierColor(section.badge) }]}>
                        {section.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <Text style={styles.sectionArrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Enabled</Text>
          </View>
          <Text style={styles.settingStatus}>ON</Text>
        </View>
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <View>
            <Text style={styles.settingLabel}>Location</Text>
            <Text style={styles.settingValue}>Enabled</Text>
          </View>
          <Text style={styles.settingStatus}>ON</Text>
        </View>
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingValue}>System Default</Text>
          </View>
          <Text style={styles.settingStatus}>OFF</Text>
        </View>
      </Card>

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.versionText}>MyTalent v1.0.0</Text>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  userDesignation: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  userDept: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ciScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.lg,
  },
  ciScoreInfo: {
    marginLeft: Spacing.md,
  },
  ciScoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  ciScoreValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  verificationRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verifyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  verifyLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  detailsCard: {
    margin: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sectionBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionArrow: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  settingsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingStatus: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  logoutBtn: {
    backgroundColor: Colors.errorLight,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
