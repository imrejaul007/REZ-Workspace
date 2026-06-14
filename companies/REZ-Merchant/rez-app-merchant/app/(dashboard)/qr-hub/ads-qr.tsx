'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AdsQRStats {
  campaigns: { id: string; name: string; status: string; scans: number; conversions: number; roi: number }[];
  totalScans: number;
  totalConversions: number;
  totalRevenue: number;
  avgROI: number;
}

export default function AdsQRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdsQRStats | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        campaigns: [
          { id: '1', name: 'Summer Sale', status: 'active', scans: 1234, conversions: 89, roi: 145 },
          { id: '2', name: 'Coffee Promo', status: 'active', scans: 567, conversions: 45, roi: 123 },
          { id: '3', name: 'Weekend Special', status: 'paused', scans: 890, conversions: 34, roi: 98 },
        ],
        totalScans: 3420,
        totalConversions: 234,
        totalRevenue: 156000,
        avgROI: 122,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Ads QR</Text>
        <TouchableOpacity onPress={() => router.push('/(dashboard)/ads')}>
          <Ionicons name="add-circle-outline" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Ionicons name="scan" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{stats?.totalScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statValue}>{stats?.totalConversions}</Text>
          <Text style={styles.statLabel}>Conversions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#6366F1" />
          <Text style={styles.statValue}>{stats?.avgROI}%</Text>
          <Text style={styles.statLabel}>Avg ROI</Text>
        </View>
      </View>

      {/* Revenue Card */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Attributed Revenue</Text>
        <Text style={styles.revenueValue}>₹{stats?.totalRevenue?.toLocaleString()}</Text>
        <View style={styles.revenueBar}>
          <View style={[styles.revenueProgress, { width: '65%' }]} />
        </View>
        <Text style={styles.revenueSubtext}>65% of budget utilized</Text>
      </View>

      {/* Campaigns List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        {stats?.campaigns.map((campaign) => (
          <TouchableOpacity
            key={campaign.id}
            style={styles.campaignCard}
            onPress={() => router.push('/(dashboard)/ads')}
          >
            <View style={styles.campaignHeader}>
              <View>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: campaign.status === 'active' ? '#10B98120' : '#6B728020' }]}>
                  <Text style={[styles.statusText, { color: campaign.status === 'active' ? '#10B981' : '#6B7280' }]}>
                    {campaign.status}
                  </Text>
                </View>
              </View>
              <View style={styles.roiBadge}>
                <Text style={styles.roiValue}>{campaign.roi}%</Text>
                <Text style={styles.roiLabel}>ROI</Text>
              </View>
            </View>
            <View style={styles.campaignStats}>
              <View style={styles.campaignStat}>
                <Text style={styles.campaignStatValue}>{campaign.scans}</Text>
                <Text style={styles.campaignStatLabel}>Scans</Text>
              </View>
              <View style={styles.campaignStat}>
                <Text style={styles.campaignStatValue}>{campaign.conversions}</Text>
                <Text style={styles.campaignStatLabel}>Conversions</Text>
              </View>
              <View style={styles.campaignStat}>
                <Text style={styles.campaignStatValue}>
                  {Math.round((campaign.conversions / campaign.scans) * 100)}%
                </Text>
                <Text style={styles.campaignStatLabel}>Rate</Text>
              </View>
            </View>
            <View style={styles.campaignConversionBar}>
              <View
                style={[
                  styles.conversionProgress,
                  { width: `${Math.min((campaign.conversions / campaign.scans) * 100 * 5, 100)}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(dashboard)/ads')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Create Campaign</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push('/(dashboard)/campaign-roi')}
        >
          <Ionicons name="analytics" size={20} color="#F59E0B" />
          <Text style={styles.actionButtonTextSecondary}>View Analytics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statsOverview: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: '#F59E0B',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#FFFFFFB0',
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  revenueBar: {
    height: 6,
    backgroundColor: '#FFFFFF40',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  revenueProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#FFFFFFB0',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  roiBadge: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  roiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  roiLabel: {
    fontSize: 10,
    color: '#6366F1',
  },
  campaignStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  campaignStat: {
    flex: 1,
  },
  campaignStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  campaignStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  campaignConversionBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  conversionProgress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
