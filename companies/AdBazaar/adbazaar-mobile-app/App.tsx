/**
 * AdBazaar Mobile App - Advertiser Dashboard
 * Built with Expo
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';

const API_URL = 'http://localhost:4000';

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  roas: number;
}

interface Stats {
  revenue: number;
  roas: number;
  impressions: number;
  conversions: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'analytics' | 'support'>('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ revenue: 0, roas: 0, impressions: 0, conversions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.campaigns || []);
        setStats({ revenue: 2345678, roas: 3.2, impressions: 45000000, conversions: 45000 });
      }
    } catch (err) {
      // Use mock data on error
      setCampaigns([
        { id: '1', name: 'Summer Sale', status: 'active', budget: 100000, spent: 45000, impressions: 1500000, clicks: 60000, roas: 3.5 },
        { id: '2', name: 'New Launch', status: 'active', budget: 50000, spent: 25000, impressions: 800000, clicks: 32000, roas: 2.8 },
      ]);
      setStats({ revenue: 2345678, roas: 3.2, impressions: 45000000, conversions: 45000 });
    }
    setLoading(false);
  };

  const renderDashboard = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{(stats.revenue / 100000).toFixed(1)}L</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.roas.toFixed(1)}x</Text>
          <Text style={styles.statLabel}>ROAS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(stats.impressions / 1000000).toFixed(1)}M</Text>
          <Text style={styles.statLabel}>Impressions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(stats.conversions / 1000).toFixed(1)}K</Text>
          <Text style={styles.statLabel}>Conversions</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Campaigns</Text>
      {campaigns.slice(0, 3).map(c => (
        <View key={c.id} style={styles.campaignCard}>
          <View style={styles.campaignHeader}>
            <Text style={styles.campaignName}>{c.name}</Text>
            <View style={[styles.badge, c.status === 'active' ? styles.badgeActive : styles.badgePaused]}>
              <Text style={styles.badgeText}>{c.status}</Text>
            </View>
          </View>
          <View style={styles.campaignStats}>
            <Text>Spent: ₹{(c.spent / 1000).toFixed(0)}K</Text>
            <Text>ROAS: {c.roas}x</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCampaigns = () => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>+ Create Campaign</Text>
      </TouchableOpacity>
      <FlatList
        data={campaigns}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignName}>{item.name}</Text>
              <View style={[styles.badge, item.status === 'active' ? styles.badgeActive : styles.badgePaused]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${(item.spent / item.budget) * 100}%` }]} />
            </View>
            <View style={styles.campaignStats}>
              <Text>Budget: ₹{item.budget.toLocaleString()}</Text>
              <Text>Spent: ₹{item.spent.toLocaleString()}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance</Text>
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsLabel}>Click Through Rate</Text>
        <Text style={styles.analyticsValue}>4.2%</Text>
      </View>
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsLabel}>Conversion Rate</Text>
        <Text style={styles.analyticsValue}>2.5%</Text>
      </View>
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsLabel}>Cost Per Acquisition</Text>
        <Text style={styles.analyticsValue}>₹52</Text>
      </View>
    </View>
  );

  const renderSupport = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Support</Text>
      <TouchableOpacity style={styles.supportCard}>
        <Text style={styles.supportTitle}>📧 Email Support</Text>
        <Text style={styles.supportDesc}>support@adbazaar.com</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.supportCard}>
        <Text style={styles.supportTitle}>💬 Live Chat</Text>
        <Text style={styles.supportDesc}>Available 24/7</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.supportCard}>
        <Text style={styles.supportTitle}>📞 Phone</Text>
        <Text style={styles.supportDesc}>+91 98765 43210</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AdBazaar</Text>
        <Text style={styles.headerSubtitle}>Advertiser Dashboard</Text>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'support' && renderSupport()}
      </ScrollView>

      <View style={styles.tabBar}>
        {['dashboard', 'campaigns', 'analytics', 'support'].map(tab => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab as any)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#FF5722', padding: 20, paddingTop: 50 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#fff', fontSize: 14, opacity: 0.8 },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '47%', elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FF5722' },
  statLabel: { fontSize: 12, color: '#666' },
  campaignCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campaignName: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#4CAF50' },
  badgePaused: { backgroundColor: '#FFC107' },
  badgeText: { color: '#fff', fontSize: 12 },
  progressBar: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginVertical: 12 },
  progress: { height: '100%', backgroundColor: '#FF5722', borderRadius: 2 },
  campaignStats: { flexDirection: 'row', justifyContent: 'space-between' },
  createButton: { backgroundColor: '#FF5722', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  analyticsCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  analyticsLabel: { fontSize: 14, color: '#666' },
  analyticsValue: { fontSize: 28, fontWeight: 'bold', color: '#FF5722' },
  supportCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  supportTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  supportDesc: { color: '#666' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { fontSize: 12, color: '#666' },
  tabTextActive: { color: '#FF5722', fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
