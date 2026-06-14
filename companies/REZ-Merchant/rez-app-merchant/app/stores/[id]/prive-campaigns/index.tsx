import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/contexts/StoreContext';
import { priveCampaignsService } from '@/services/api';
import { logger } from '@/utils/logger';

interface Campaign {
  _id: string;
  title: string;
  hashtag: string;
  status: 'active' | 'draft' | 'paused' | 'ended';
  submissionsCount: number;
  approvalRate: number;
  coinsIssued: number;
  platform: string[];
  deadline: string;
}

export default function PriveCampaignsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'paused' | 'ended'>('active');

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await priveCampaignsService.getCampaigns(storeId);
      setCampaigns(data || []);
    } catch (err) {
      if (__DEV__) console.error('Error loading campaigns:', err);
      showAlert('Error', 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  }, [loadCampaigns]);

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, [loadCampaigns])
  );

  const filteredCampaigns = campaigns.filter((c) => c.status === activeTab);

  const handleCreateCampaign = () => {
    router.push({
      pathname: '/stores/[id]/prive-campaigns/create',
      params: { id: storeId },
    });
  };

  const handleViewSubmissions = (campaignId: string) => {
    router.push({
      pathname: '/stores/[id]/prive-campaigns/submissions',
      params: { id: storeId, campaignId },
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privé Campaigns</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privé Campaigns</Text>
        <TouchableOpacity onPress={handleCreateCampaign}>
          <Ionicons name="add-circle" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {store && (
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeSubtext}>Manage influencer campaigns and content creation</Text>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {(['active', 'draft', 'paused', 'ended'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredCampaigns.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No {activeTab} campaigns</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'draft'
                ? 'Create a new campaign to get started.'
                : 'Check other tabs for campaigns.'}
            </Text>
            {activeTab === 'draft' && (
              <TouchableOpacity style={styles.addButton} onPress={handleCreateCampaign}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Create Campaign</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {filteredCampaigns.map((campaign) => (
          <View key={campaign._id} style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <View style={styles.campaignTitleContainer}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <Text style={styles.campaignHashtag}>{campaign.hashtag}</Text>
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}
              >
                <Text style={styles.statusText}>{campaign.status}</Text>
              </View>
            </View>

            <View style={styles.campaignDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="send-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Submissions:</Text>
                <Text style={styles.detailValue}>{campaign.submissionsCount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Approval Rate:</Text>
                <Text style={styles.detailValue}>{campaign.approvalRate}%</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Coins Issued:</Text>
                <Text style={styles.detailValue}>{campaign.coinsIssued}</Text>
              </View>
            </View>

            <View style={styles.platformContainer}>
              {campaign.platform.map((p, i) => (
                <View key={i} style={styles.platformBadge}>
                  <Text style={styles.platformText}>{p}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewSubmissions(campaign._id)}
            >
              <Text style={styles.viewButtonText}>Review Submissions →</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {campaigns.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateCampaign}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: '#D1FAE5',
    draft: '#FEF3C7',
    paused: '#FEE2E2',
    ended: '#E5E7EB',
  };
  return colors[status] || '#E5E7EB';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  storeInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  campaignHashtag: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  campaignDetails: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  platformContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  platformBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  viewButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
