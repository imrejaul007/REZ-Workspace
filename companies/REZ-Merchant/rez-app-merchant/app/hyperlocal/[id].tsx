/**
 * Hyperlocal Network - Partnership Details Screen
 *
 * Shows detailed metrics and management options for a specific partnership.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartnerReferral {
  id: string;
  customerName: string;
  customerPhone: string;
  referralDate: string;
  status: 'pending' | 'converted' | 'expired';
  convertedDate?: string;
  revenue: number;
  yourShare: number;
}

interface CampaignMetric {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
}

interface PartnershipDetails {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCategory: string;
  partnerPhone: string;
  partnerEmail: string;
  status: 'active' | 'pending' | 'inactive';
  partnershipType: 'referral' | 'campaign' | 'cross_promotion';
  revenueShare: number;
  costShare: number;
  totalReferrals: number;
  referralConversions: number;
  conversionRate: number;
  totalRevenue: number;
  yourTotalRevenue: number;
  referrals: PartnerReferral[];
  campaigns: {
    id: string;
    name: string;
    status: 'active' | 'completed';
    startDate: string;
    endDate: string;
    budget: number;
    spent: number;
    impressions: number;
    conversions: number;
  }[];
  joinedAt: string;
  lastActivityAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_DETAILS: PartnershipDetails = {
  id: '1',
  partnerId: 'p1',
  partnerName: 'Cafe Mocha',
  partnerCategory: 'Cafe',
  partnerPhone: '+91 98765 43210',
  partnerEmail: 'hello@cafemocha.in',
  status: 'active',
  partnershipType: 'referral',
  revenueShare: 50,
  costShare: 0,
  totalReferrals: 45,
  referralConversions: 12,
  conversionRate: 26.7,
  totalRevenue: 8500,
  yourTotalRevenue: 4250,
  joinedAt: '2024-01-15',
  lastActivityAt: '2024-05-08',
  referrals: [
    {
      id: 'r1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 11111',
      referralDate: '2024-05-07',
      status: 'converted',
      convertedDate: '2024-05-07',
      revenue: 450,
      yourShare: 225,
    },
    {
      id: 'r2',
      customerName: 'Rahul Verma',
      customerPhone: '+91 98765 22222',
      referralDate: '2024-05-06',
      status: 'pending',
      revenue: 0,
      yourShare: 0,
    },
    {
      id: 'r3',
      customerName: 'Anita Patel',
      customerPhone: '+91 98765 33333',
      referralDate: '2024-05-05',
      status: 'converted',
      convertedDate: '2024-05-06',
      revenue: 780,
      yourShare: 390,
    },
    {
      id: 'r4',
      customerName: 'Vikram Singh',
      customerPhone: '+91 98765 44444',
      referralDate: '2024-04-20',
      status: 'expired',
      revenue: 0,
      yourShare: 0,
    },
  ],
  campaigns: [
    {
      id: 'c1',
      name: 'Summer Special Combo',
      status: 'active',
      startDate: '2024-05-01',
      endDate: '2024-06-30',
      budget: 10000,
      spent: 3500,
      impressions: 12500,
      conversions: 28,
    },
  ],
};

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  onPress?: () => void;
}

const MetricCard = ({ icon, label, value, subtext, color, onPress }: MetricCardProps) => (
  <TouchableOpacity
    style={metricStyles.card}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[metricStyles.iconWrap, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as unknown} size={18} color={color} />
    </View>
    <Text style={metricStyles.value}>{value}</Text>
    <Text style={metricStyles.label}>{label}</Text>
    {subtext && <Text style={metricStyles.subtext}>{subtext}</Text>}
  </TouchableOpacity>
);

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  label: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 2,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 10,
    color: Colors.success[600],
    marginTop: 4,
  },
});

// ---------------------------------------------------------------------------
// Referral Item
// ---------------------------------------------------------------------------

interface ReferralItemProps {
  referral: PartnerReferral;
}

const ReferralItem = ({ referral }: ReferralItemProps) => {
  const getStatusStyle = (status: PartnerReferral['status']) => {
    switch (status) {
      case 'converted':
        return { bg: Colors.success[50], color: Colors.success[600], label: 'Converted' };
      case 'pending':
        return { bg: Colors.warning[50], color: Colors.warning[600], label: 'Pending' };
      case 'expired':
        return { bg: Colors.gray[100], color: Colors.gray[500], label: 'Expired' };
    }
  };

  const statusStyle = getStatusStyle(referral.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={referralStyles.item}>
      <View style={referralStyles.left}>
        <View style={referralStyles.avatar}>
          <Text style={referralStyles.avatarText}>
            {referral.customerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={referralStyles.info}>
          <Text style={referralStyles.name}>{referral.customerName}</Text>
          <Text style={referralStyles.phone}>{referral.customerPhone}</Text>
          <Text style={referralStyles.date}>
            Referred on {new Date(referral.referralDate).toLocaleDateString('en-IN')}
          </Text>
        </View>
      </View>
      <View style={referralStyles.right}>
        <View style={[referralStyles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[referralStyles.statusText, { color: statusStyle.color }]}>
            {statusStyle.label}
          </Text>
        </View>
        {referral.revenue > 0 && (
          <Text style={referralStyles.revenue}>{formatCurrency(referral.yourShare)}</Text>
        )}
      </View>
    </View>
  );
};

const referralStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  phone: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 1,
  },
  date: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  revenue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success[600],
    marginTop: 6,
  },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PartnershipDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [details] = useState<PartnershipDetails | null>(MOCK_DETAILS);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'campaigns'>('referrals');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.info('[Hyperlocal] Refreshing partnership details:', id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, [id]);

  const handleContactPartner = () => {
    if (details?.partnerPhone) {
      Linking.openURL(`tel:${details.partnerPhone}`);
    }
  };

  const handleEmailPartner = () => {
    if (details?.partnerEmail) {
      Linking.openURL(`mailto:${details.partnerEmail}`);
    }
  };

  const handleEndPartnership = () => {
    Alert.alert(
      'End Partnership',
      `Are you sure you want to end your partnership with ${details?.partnerName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Partnership',
          style: 'destructive',
          onPress: () => {
            logger.info('[Hyperlocal] Ending partnership:', id);
            router.back();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!details) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Partnership not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray[900]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {details.partnerName}
          </Text>
          <Text style={styles.headerSubtitle}>{details.partnerCategory}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.gray[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Partner Card */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerHeader}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerAvatarText}>
                {details.partnerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{details.partnerName}</Text>
              <View style={styles.partnerMeta}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        details.status === 'active'
                          ? Colors.success[50]
                          : details.status === 'pending'
                          ? Colors.warning[50]
                          : Colors.gray[100],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          details.status === 'active'
                            ? Colors.success[600]
                            : details.status === 'pending'
                            ? Colors.warning[600]
                            : Colors.gray[500],
                      },
                    ]}
                  >
                    {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.typeBadge}>
                  {details.partnershipType === 'referral'
                    ? 'Referral'
                    : details.partnershipType === 'campaign'
                    ? 'Campaign'
                    : 'Cross-Promo'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.partnerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleContactPartner}>
              <Ionicons name="call-outline" size={18} color={Colors.primary[500]} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleEmailPartner}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary[500]} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDestructive]}
              onPress={handleEndPartnership}
            >
              <Ionicons name="close-circle-outline" size={18} color={Colors.error[500]} />
              <Text style={[styles.actionButtonText, { color: Colors.error[500] }]}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="people"
              label="Total Referrals"
              value={details.totalReferrals}
              color={Colors.primary[500]}
            />
            <View style={{ width: 10 }} />
            <MetricCard
              icon="checkmark-circle"
              label="Conversions"
              value={details.referralConversions}
              subtext={`${details.conversionRate}% rate`}
              color={Colors.success[500]}
            />
          </View>
          <View style={{ height: 10 }} />
          <View style={styles.metricsRow}>
            <MetricCard
              icon="cash"
              label="Total Revenue"
              value={formatCurrency(details.totalRevenue)}
              color={Colors.warning[500]}
            />
            <View style={{ width: 10 }} />
            <MetricCard
              icon="wallet"
              label="Your Share"
              value={formatCurrency(details.yourTotalRevenue)}
              color={Colors.success[600]}
            />
          </View>
        </View>

        {/* Revenue Share Info */}
        <View style={styles.shareInfo}>
          <View style={styles.shareItem}>
            <Text style={styles.shareLabel}>Revenue Share</Text>
            <Text style={styles.shareValue}>{details.revenueShare}%</Text>
          </View>
          {details.costShare > 0 && (
            <View style={styles.shareItem}>
              <Text style={styles.shareLabel}>Cost Share</Text>
              <Text style={styles.shareValue}>{details.costShare}%</Text>
            </View>
          )}
          <View style={styles.shareItem}>
            <Text style={styles.shareLabel}>Partnership Since</Text>
            <Text style={styles.shareValue}>
              {new Date(details.joinedAt).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'referrals' && styles.tabActive]}
            onPress={() => setActiveTab('referrals')}
          >
            <Text style={[styles.tabText, activeTab === 'referrals' && styles.tabTextActive]}>
              Referrals ({details.referrals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'campaigns' && styles.tabActive]}
            onPress={() => setActiveTab('campaigns')}
          >
            <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>
              Campaigns ({details.campaigns.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'referrals' && (
          <View style={styles.referralsList}>
            {details.referrals.length > 0 ? (
              details.referrals.map((referral) => (
                <ReferralItem key={referral.id} referral={referral} />
              ))
            ) : (
              <View style={styles.emptyTab}>
                <Ionicons name="people-outline" size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyTabText}>No referrals yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'campaigns' && (
          <View style={styles.campaignsList}>
            {details.campaigns.length > 0 ? (
              details.campaigns.map((campaign) => (
                <View key={campaign.id} style={campaignStyles.card}>
                  <View style={campaignStyles.header}>
                    <Text style={campaignStyles.name}>{campaign.name}</Text>
                    <View
                      style={[
                        campaignStyles.statusBadge,
                        {
                          backgroundColor:
                            campaign.status === 'active' ? Colors.success[50] : Colors.gray[100],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          campaignStyles.statusText,
                          { color: campaign.status === 'active' ? Colors.success[600] : Colors.gray[500] },
                        ]}
                      >
                        {campaign.status === 'active' ? 'Active' : 'Completed'}
                      </Text>
                    </View>
                  </View>
                  <View style={campaignStyles.dates}>
                    <Text style={campaignStyles.dateText}>
                      {new Date(campaign.startDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(campaign.endDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={campaignStyles.metrics}>
                    <View style={campaignStyles.metric}>
                      <Text style={campaignStyles.metricValue}>
                        {(campaign.budget / 1000).toFixed(1)}k
                      </Text>
                      <Text style={campaignStyles.metricLabel}>Budget</Text>
                    </View>
                    <View style={campaignStyles.metric}>
                      <Text style={campaignStyles.metricValue}>{campaign.impressions}</Text>
                      <Text style={campaignStyles.metricLabel}>Impressions</Text>
                    </View>
                    <View style={campaignStyles.metric}>
                      <Text style={campaignStyles.metricValue}>{campaign.conversions}</Text>
                      <Text style={campaignStyles.metricLabel}>Conversions</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyTab}>
                <Ionicons name="megaphone-outline" size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyTabText}>No campaigns yet</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Campaign Card Styles
// ---------------------------------------------------------------------------

const campaignStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dates: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  partnerAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    fontSize: 12,
    color: Colors.gray[500],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary[50],
  },
  actionButtonDestructive: {
    backgroundColor: Colors.error[50],
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  metricsGrid: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
  },
  shareInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shareItem: {
    flex: 1,
    alignItems: 'center',
  },
  shareLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  shareValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  tabTextActive: {
    color: '#fff',
  },
  referralsList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignsList: {},
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTabText: {
    fontSize: 14,
    color: Colors.gray[400],
    marginTop: 8,
  },
});
