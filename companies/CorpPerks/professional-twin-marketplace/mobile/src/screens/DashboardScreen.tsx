/**
 * Dashboard Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7c3aed',
  secondary: '#ec4899',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  success: '#10b981',
};

const TWIN_TYPES = [
  { type: 'KNOWLEDGE', name: 'Knowledge', icon: 'book', color: '#3b82f6' },
  { type: 'SKILL', name: 'Skill', icon: 'construct', color: '#10b981' },
  { type: 'CAREER', name: 'Career', icon: 'trending-up', color: '#8b5cf6' },
  { type: 'PRODUCTIVITY', name: 'Productivity', icon: 'flash', color: '#f59e0b' },
  { type: 'EXECUTION', name: 'Execution', icon: 'rocket', color: '#ef4444' },
];

// Mock data
const MOCK_TWINS = [
  { twinId: 'TWIN-001', type: 'KNOWLEDGE', name: 'Knowledge Twin', score: 85, multiplier: 1.5, status: 'ACTIVE' },
  { twinId: 'TWIN-002', type: 'SKILL', name: 'Skill Twin', score: 92, multiplier: 2.5, status: 'ACTIVE' },
  { twinId: 'TWIN-003', type: 'CAREER', name: 'Career Twin', score: 78, multiplier: 1.0, status: 'ACTIVE' },
  { twinId: 'TWIN-004', type: 'PRODUCTIVITY', name: 'Productivity Twin', score: 88, multiplier: 1.5, status: 'ACTIVE' },
  { twinId: 'TWIN-005', type: 'EXECUTION', name: 'Execution Twin', score: 95, multiplier: 3.0, status: 'TRAINING' },
];

export default function DashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalMultiplier = MOCK_TWINS.reduce((sum, t) => sum + t.multiplier, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>Rahul Sharma</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>RS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Your Professional Twins</Text>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MOCK_TWINS.length}</Text>
              <Text style={styles.statLabel}>Twins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{totalMultiplier.toFixed(1)}x</Text>
              <Text style={styles.statLabel}>Productivity</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2500</Text>
              <Text style={styles.statLabel}>Training Hrs</Text>
            </View>
          </View>
        </View>

        {/* Twins List */}
        <Text style={styles.sectionTitle}>Your Twins</Text>
        {MOCK_TWINS.map((twin, index) => {
          const twinConfig = TWIN_TYPES.find(t => t.type === twin.type);
          return (
            <TouchableOpacity
              key={twin.twinId}
              style={styles.twinCard}
              onPress={() => navigation.navigate('TwinDetail', { twinId: twin.twinId })}
            >
              <View style={[styles.twinIcon, { backgroundColor: twinConfig?.color + '20' }]}>
                <Ionicons name={twinConfig?.icon as any} size={24} color={twinConfig?.color} />
              </View>
              <View style={styles.twinInfo}>
                <Text style={styles.twinName}>{twin.name}</Text>
                <View style={styles.twinMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: twin.status === 'ACTIVE' ? COLORS.success + '20' : COLORS.secondary + '20' }]}>
                    <Text style={[styles.statusText, { color: twin.status === 'ACTIVE' ? COLORS.success : COLORS.secondary }]}>{twin.status}</Text>
                  </View>
                  <Text style={styles.twinScore}>Score: {twin.score}</Text>
                </View>
              </View>
              <View style={styles.twinMetrics}>
                <Text style={styles.twinMultiplier}>{twin.multiplier}x</Text>
                <Text style={styles.twinMultiplierLabel}>Productivity</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="search" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Browse{'\n'}Marketplace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="download" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Export{'\n'}Twins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="settings" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Privacy{'\n'}Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="share" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Share{'\n'}Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 48 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.surfaceLight },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  twinCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  twinIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  twinInfo: { flex: 1, marginLeft: 12 },
  twinName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  twinMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  twinScore: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 8 },
  twinMetrics: { alignItems: 'flex-end' },
  twinMultiplier: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  twinMultiplierLabel: { fontSize: 10, color: COLORS.textSecondary },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginHorizontal: 4 },
  quickActionText: { fontSize: 12, color: COLORS.text, textAlign: 'center', marginTop: 8 },
});
