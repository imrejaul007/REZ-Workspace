// ==========================================
// MyTalent - Role AI Agents Screen
// AI Agents for each job role with 4 levels
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../src/components/Badge';

interface Role {
  id: string;
  name: string;
  icon: string;
  color: string;
  levels: Level[];
}

interface Level {
  id: string;
  name: string;
  years: string;
  description: string;
}

const roles: Role[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    icon: '💻',
    color: '#6366F1',
    levels: [
      { id: 'l1', name: 'CodeBuddy', years: '0-2 years', description: 'Learn coding basics, syntax, debugging' },
      { id: 'l2', name: 'DevPro', years: '2-5 years', description: 'Architecture, testing, Git workflows' },
      { id: 'l3', name: 'TechLead', years: '5-8 years', description: 'System design, mentoring, performance' },
      { id: 'l4', name: 'CTO Advisor', years: '8+ years', description: 'Tech strategy, hiring, org impact' },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: '📈',
    color: '#10B981',
    levels: [
      { id: 'l1', name: 'SalesBuddy', years: '0-2 years', description: 'Product demos, basic objections' },
      { id: 'l2', name: 'SalesPro', years: '2-5 years', description: 'Pipeline management, negotiation' },
      { id: 'l3', name: 'SalesLeader', years: '5-8 years', description: 'Account strategy, team leadership' },
      { id: 'l4', name: 'Revenue Strategist', years: '8+ years', description: 'Revenue strategy, enterprise deals' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📣',
    color: '#F59E0B',
    levels: [
      { id: 'l1', name: 'MarketingBuddy', years: '0-2 years', description: 'Content creation, social media' },
      { id: 'l2', name: 'MarketingPro', years: '2-5 years', description: 'Campaign management, analytics' },
      { id: 'l3', name: 'MarketingManager', years: '5-8 years', description: 'Brand strategy, budget allocation' },
      { id: 'l4', name: 'CMO Counselor', years: '8+ years', description: 'Market positioning, growth strategy' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    color: '#3B82F6',
    levels: [
      { id: 'l1', name: 'FinanceBuddy', years: '0-2 years', description: 'Data entry, basic reporting' },
      { id: 'l2', name: 'FinanceAnalyst', years: '2-5 years', description: 'Budget tracking, variance analysis' },
      { id: 'l3', name: 'FinanceManager', years: '5-8 years', description: 'Financial planning, forecasting' },
      { id: 'l4', name: 'CFO Counselor', years: '8+ years', description: 'Capital strategy, M&A advisory' },
    ],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    icon: '👥',
    color: '#EC4899',
    levels: [
      { id: 'l1', name: 'HRBuddy', years: '0-2 years', description: 'Employee onboarding, basic queries' },
      { id: 'l2', name: 'HRPro', years: '2-5 years', description: 'Recruitment, engagement programs' },
      { id: 'l3', name: 'HRManager', years: '5-8 years', description: 'Performance management, L&D' },
      { id: 'l4', name: 'CHRO Counselor', years: '8+ years', description: 'Culture strategy, org design' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: '⚙️',
    color: '#8B5CF6',
    levels: [
      { id: 'l1', name: 'OpsBuddy', years: '0-2 years', description: 'Process documentation, tasks' },
      { id: 'l2', name: 'OpsAnalyst', years: '2-5 years', description: 'Workflow optimization, tooling' },
      { id: 'l3', name: 'OpsManager', years: '5-8 years', description: 'Process design, vendor management' },
      { id: 'l4', name: 'COO Counselor', years: '8+ years', description: 'Ops strategy, scaling' },
    ],
  },
  {
    id: 'product',
    name: 'Product',
    icon: '🎯',
    color: '#14B8A6',
    levels: [
      { id: 'l1', name: 'PMBuddy', years: '0-2 years', description: 'Feature specs, user feedback' },
      { id: 'l2', name: 'PMPro', years: '2-5 years', description: 'Roadmap management, prioritization' },
      { id: 'l3', name: 'SeniorPM', years: '5-8 years', description: 'Product strategy, experiments' },
      { id: 'l4', name: 'Product Visionary', years: '8+ years', description: 'Product vision, market fit' },
    ],
  },
  {
    id: 'design',
    name: 'Design',
    icon: '🎨',
    color: '#F97316',
    levels: [
      { id: 'l1', name: 'DesignBuddy', years: '0-2 years', description: 'Design fundamentals, tools' },
      { id: 'l2', name: 'DesignPro', years: '2-5 years', description: 'UI design, prototyping' },
      { id: 'l3', name: 'SeniorDesigner', years: '5-8 years', description: 'Design systems, user research' },
      { id: 'l4', name: 'Design Director', years: '8+ years', description: 'Brand strategy, design leadership' },
    ],
  },
  {
    id: 'support',
    name: 'Customer Support',
    icon: '🎧',
    color: '#06B6D4',
    levels: [
      { id: 'l1', name: 'SupportBuddy', years: '0-2 years', description: 'Ticket handling, troubleshooting' },
      { id: 'l2', name: 'SeniorSupport', years: '2-5 years', description: 'Escalation, knowledge base' },
      { id: 'l3', name: 'SupportLead', years: '5-8 years', description: 'Process improvement, training' },
      { id: 'l4', name: 'Support Strategist', years: '8+ years', description: 'Support strategy, customer success' },
    ],
  },
  {
    id: 'admin',
    name: 'Admin & IT',
    icon: '🔐',
    color: '#64748B',
    levels: [
      { id: 'l1', name: 'AdminBuddy', years: '0-2 years', description: 'System access, basic permissions' },
      { id: 'l2', name: 'AdminPro', years: '2-5 years', description: 'User management, security basics' },
      { id: 'l3', name: 'SeniorAdmin', years: '5-8 years', description: 'Access control, compliance' },
      { id: 'l4', name: 'Security Strategist', years: '8+ years', description: 'Security strategy, governance' },
    ],
  },
];

export default function RoleAgentsScreen() {
  const router = useRouter();
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<{role: string; level: string} | null>(null);

  const handleRolePress = (roleId: string) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  const handleLevelPress = (role: Role, level: Level) => {
    router.push(`/ai-chat/${role.id}/${level.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Role AI Agents</Text>
        <Text style={styles.headerSubtitle}>AI specialized for your role & experience level</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role Cards */}
        {roles.map((role) => (
          <View key={role.id} style={styles.roleCard}>
            <TouchableOpacity
              style={styles.roleHeader}
              onPress={() => handleRolePress(role.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
                <Text style={styles.roleIconText}>{role.icon}</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>{role.name}</Text>
                <Text style={styles.roleLevels}>4 levels available</Text>
              </View>
              <View style={[styles.expandIcon, expandedRole === role.id && styles.expandIconActive]}>
                <Text style={styles.expandIconText}>▼</Text>
              </View>
            </TouchableOpacity>

            {/* Level Tabs */}
            {expandedRole === role.id && (
              <View style={styles.levelsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {role.levels.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[styles.levelCard, { borderLeftColor: role.color }]}
                      onPress={() => handleLevelPress(role, level)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.levelBadge, { backgroundColor: role.color + '15' }]}>
                        <Text style={[styles.levelBadgeText, { color: role.color }]}>{level.name}</Text>
                      </View>
                      <Text style={styles.levelYears}>{level.years}</Text>
                      <Text style={styles.levelDescription}>{level.description}</Text>
                      <View style={styles.levelAction}>
                        <Text style={[styles.levelActionText, { color: role.color }]}>Chat →</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ))}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your AI Team</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Job Roles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>40</Text>
              <Text style={styles.statLabel}>AI Agents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Experience Levels</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#1E293B' },
  headerSubtitle: { fontSize: FontSize.sm, color: '#64748B', marginTop: Spacing.xs },
  content: { flex: 1, padding: Spacing.md },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  roleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  roleIconText: { fontSize: 24 },
  roleInfo: { flex: 1, marginLeft: Spacing.md },
  roleName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#1E293B' },
  roleLevels: { fontSize: FontSize.sm, color: '#64748B', marginTop: 2 },
  expandIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  expandIconActive: { backgroundColor: '#8B5CF6' },
  expandIconText: { fontSize: 12, color: '#64748B' },
  levelsContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  levelCard: {
    width: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderLeftWidth: 3,
  },
  levelBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4, marginBottom: Spacing.xs },
  levelBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  levelYears: { fontSize: FontSize.xs, color: '#94A3B8', marginBottom: Spacing.xs },
  levelDescription: { fontSize: FontSize.xs, color: '#64748B', lineHeight: 16, marginBottom: Spacing.sm },
  levelAction: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: Spacing.xs },
  levelActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  statsContainer: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
  statsTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: '#1E293B', marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row' },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: Spacing.md, marginHorizontal: Spacing.xs, alignItems: 'center',
  },
  statNumber: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#8B5CF6' },
  statLabel: { fontSize: FontSize.xs, color: '#64748B', marginTop: Spacing.xs, textAlign: 'center' },
});
