// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();

  const stats = {
    totalReferrals: 47,
    qualifiedReferrals: 32,
    pendingReferrals: 15,
    conversionRate: 68.1,
    lifetimeEarnings: 3200,
    thisMonth: 450,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statistics</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{stats.totalReferrals}</Text>
            <Text style={styles.overviewLabel}>Total Referrals</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{stats.qualifiedReferrals}</Text>
            <Text style={styles.overviewLabel}>Qualified</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{stats.conversionRate}%</Text>
            <Text style={styles.overviewLabel}>Conversion</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>₹{stats.lifetimeEarnings}</Text>
            <Text style={styles.overviewLabel}>Earned</Text>
          </View>
        </View>

        {/* Funnel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Funnel</Text>
          <View style={styles.funnel}>
            {[
              { label: 'Invited', value: 47, percent: 100 },
              { label: 'Clicked', value: 42, percent: 89 },
              { label: 'Registered', value: 38, percent: 81 },
              { label: 'Qualified', value: 32, percent: 68 },
              { label: 'Rewarded', value: 32, percent: 68 },
            ].map((stage, index) => (
              <View key={stage.label} style={styles.funnelStage}>
                <View style={styles.funnelBar}>
                  <View style={[styles.funnelFill, { width: `${stage.percent}%` }]} />
                </View>
                <View style={styles.funnelInfo}>
                  <Text style={styles.funnelLabel}>{stage.label}</Text>
                  <Text style={styles.funnelValue}>{stage.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.monthCard}>
            <Text style={styles.monthValue}>₹{stats.thisMonth}</Text>
            <Text style={styles.monthLabel}>earned this month</Text>
            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>8</Text>
                <Text style={styles.monthStatLabel}>New Referrals</Text>
              </View>
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>5</Text>
                <Text style={styles.monthStatLabel}>Qualified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Channels</Text>
          {[
            { channel: 'WhatsApp', count: 24, percent: 51 },
            { channel: 'Instagram', count: 12, percent: 26 },
            { channel: 'QR Code', count: 8, percent: 17 },
            { channel: 'Other', count: 3, percent: 6 },
          ].map((item) => (
            <View key={item.channel} style={styles.channelRow}>
              <Text style={styles.channelName}>{item.channel}</Text>
              <View style={styles.channelBar}>
                <View style={[styles.channelFill, { width: `${item.percent}%` }]} />
              </View>
              <Text style={styles.channelCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 60, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { fontSize: 16, color: '#6366F1', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  scrollView: { flex: 1 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  overviewCard: { width: (width - 48) / 2, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12 },
  overviewValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  overviewLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  funnel: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12 },
  funnelStage: { marginBottom: 12 },
  funnelBar: { height: 24, backgroundColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  funnelFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 12 },
  funnelInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  funnelLabel: { fontSize: 12, color: '#6B7280' },
  funnelValue: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  monthCard: { backgroundColor: '#6366F1', padding: 24, borderRadius: 16 },
  monthValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  monthLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  monthStats: { flexDirection: 'row', marginTop: 20, gap: 24 },
  monthStat: {},
  monthStatValue: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  monthStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  channelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  channelName: { width: 80, fontSize: 14, color: '#4B5563' },
  channelBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  channelFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  channelCount: { width: 30, fontSize: 14, fontWeight: '600', color: '#1F2937', textAlign: 'right' },
});
