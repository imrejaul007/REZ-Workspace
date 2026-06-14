/**
 * Twin Detail Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7c3aed',
  success: '#10b981',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
};

const MOCK_TWIN = {
  twinId: 'TWIN-001',
  type: 'SKILL',
  name: 'Skill Twin',
  status: 'ACTIVE',
  score: 92,
  multiplier: 2.5,
  reliability: 94,
  knowledge: 85,
  execution: 95,
  expertise: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
  trainingHours: 2500,
  milestones: [
    { name: 'Reached Expert Level', date: '2026-03-15' },
    { name: 'Completed 1000 Training Hours', date: '2026-02-01' },
    { name: 'First Active Twin', date: '2026-01-20' },
  ],
};

export default function TwinDetailScreen({ route }: any) {
  const { twinId } = route.params;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
          <Ionicons name="construct" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.twinName}>{MOCK_TWIN.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.success }]}>{MOCK_TWIN.status}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{MOCK_TWIN.multiplier}x</Text>
          <Text style={styles.metricLabel}>Productivity</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{MOCK_TWIN.score}</Text>
          <Text style={styles.metricLabel}>Score</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{MOCK_TWIN.reliability}%</Text>
          <Text style={styles.metricLabel}>Reliability</Text>
        </View>
      </View>

      {/* Progress Bars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metrics Breakdown</Text>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Knowledge</Text>
            <Text style={styles.progressValue}>{MOCK_TWIN.knowledge}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: MOCK_TWIN.knowledge + '%', backgroundColor: '#3b82f6' }]} />
          </View>
        </View>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Execution</Text>
            <Text style={styles.progressValue}>{MOCK_TWIN.execution}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: MOCK_TWIN.execution + '%', backgroundColor: COLORS.success }]} />
          </View>
        </View>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Reliability</Text>
            <Text style={styles.progressValue}>{MOCK_TWIN.reliability}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: MOCK_TWIN.reliability + '%', backgroundColor: COLORS.primary }]} />
          </View>
        </View>
      </View>

      {/* Expertise */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expertise</Text>
        <View style={styles.skillsContainer}>
          {MOCK_TWIN.expertise.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Training */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Progress</Text>
        <View style={styles.trainingCard}>
          <View style={styles.trainingStats}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.trainingHours}>{MOCK_TWIN.trainingHours}</Text>
            <Text style={styles.trainingLabel}>Training Hours</Text>
          </View>
        </View>
      </View>

      {/* Milestones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        {MOCK_TWIN.milestones.map((milestone, index) => (
          <View key={index} style={styles.milestoneItem}>
            <View style={styles.milestoneIcon}>
              <Ionicons name="trophy" size={16} color={COLORS.warning} />
            </View>
            <View style={styles.milestoneContent}>
              <Text style={styles.milestoneName}>{milestone.name}</Text>
              <Text style={styles.milestoneDate}>{milestone.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Ionicons name="share-social" size={20} color={COLORS.text} />
          <Text style={styles.primaryButtonText}>Share Twin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="settings" size={20} color={COLORS.text} />
          <Text style={styles.secondaryButtonText}>Privacy</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', paddingVertical: 24 },
  iconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  twinName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: '600' },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 20, marginHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 16 },
  metricCard: { alignItems: 'center' },
  metricValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  metricLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  progressItem: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: COLORS.textSecondary },
  progressValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  progressBar: { height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBadge: { backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  skillText: { fontSize: 14, color: COLORS.text },
  trainingCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: 'center' },
  trainingStats: { alignItems: 'center' },
  trainingHours: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  trainingLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  milestoneIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.warning + '20', justifyContent: 'center', alignItems: 'center' },
  milestoneContent: { marginLeft: 12 },
  milestoneName: { fontSize: 14, color: COLORS.text },
  milestoneDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 24 },
  primaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, marginRight: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginLeft: 8 },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingVertical: 14 },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginLeft: 8 },
});
