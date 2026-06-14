/**
 * Hyperlocal Network - Partner List Screen
 *
 * Displays merchant's active partnerships and their performance metrics.
 * Shows mutual referrals, campaign performance, and partnership status.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Partner {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCategory: string;
  partnerLogo?: string;
  status: 'active' | 'pending' | 'inactive';
  partnershipType: 'referral' | 'campaign' | 'cross_promotion';
  totalReferrals: number;
  referralConversions: number;
  conversionRate: number;
  totalRevenue: number;
  revenueShare: number;
  costShare: number;
  joinedAt: string;
  lastActivityAt: string;
}

export interface PartnershipStats {
  totalPartners: number;
  activePartners: number;
  totalReferrals: number;
  referralConversions: number;
  totalRevenue: number;
  avgConversionRate: number;
}

// ---------------------------------------------------------------------------
// Mock Data (replace with API calls)
// ---------------------------------------------------------------------------

const MOCK_PARTNERS: Partner[] = [
  {
    id: '1',
    partnerId: 'p1',
    partnerName: 'Cafe Mocha',
    partnerCategory: 'Cafe',
    partnerLogo: undefined,
    status: 'active',
    partnershipType: 'referral',
    totalReferrals: 45,
    referralConversions: 12,
    conversionRate: 26.7,
    totalRevenue: 8500,
    revenueShare: 4250,
    costShare: 0,
    joinedAt: '2024-01-15',
    lastActivityAt: '2024-05-08',
  },
  {
    id: '2',
    partnerId: 'p2',
    partnerName: 'FitLife Gym',
    partnerCategory: 'Fitness',
    partnerLogo: undefined,
    status: 'active',
    partnershipType: 'campaign',
    totalReferrals: 28,
    referralConversions: 8,
    conversionRate: 28.6,
    totalRevenue: 12000,
    revenueShare: 6000,
    costShare: 2000,
    joinedAt: '2024-02-20',
    lastActivityAt: '2024-05-07',
  },
  {
    id: '3',
    partnerId: 'p3',
    partnerName: 'Salon Elegance',
    partnerCategory: 'Beauty',
    partnerLogo: undefined,
    status: 'pending',
    partnershipType: 'cross_promotion',
    totalReferrals: 5,
    referralConversions: 0,
    conversionRate: 0,
    totalRevenue: 0,
    revenueShare: 0,
    costShare: 0,
    joinedAt: '2024-05-01',
    lastActivityAt: '2024-05-01',
  },
  {
    id: '4',
    partnerId: 'p4',
    partnerName: 'Book Haven',
    partnerCategory: 'Retail',
    partnerLogo: undefined,
    status: 'inactive',
    partnershipType: 'referral',
    totalReferrals: 15,
    referralConversions: 3,
    conversionRate: 20,
    totalRevenue: 2100,
    revenueShare: 1050,
    costShare: 0,
    joinedAt: '2023-11-10',
    lastActivityAt: '2024-02-15',
  },
];

const MOCK_STATS: PartnershipStats = {
  totalPartners: 12,
  activePartners: 8,
  totalReferrals: 156,
  referralConversions: 42,
  totalRevenue: 48500,
  avgConversionRate: 26.9,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

const StatsCard = ({ icon, label, value, subtext, color }: StatsCardProps) => (
  <View style={statsStyles.card}>
    <View style={[statsStyles.iconWrap, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as unknown} size={20} color={color} />
    </View>
    <Text style={statsStyles.value}>{value}</Text>
    <Text style={statsStyles.label}>{label}</Text>
    {subtext && <Text style={statsStyles.subtext}>{subtext}</Text>}
  </View>
);

const statsStyles = StyleSheet.create({
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
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
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
// Partner Card
// ---------------------------------------------------------------------------

interface PartnerCardProps {
  partner: Partner;
  onPress: (partner: Partner) => void;
}

const PartnerCard = ({ partner, onPress }: PartnerCardProps) => {
  const getStatusColor = (status: Partner['status']) => {
    switch (status) {
      case 'active':
        return Colors.success[500];
      case 'pending':
        return Colors.warning[500];
      case 'inactive':
        return Colors.gray[400];
    }
  };

  const getTypeLabel = (type: Partner['partnershipType']) => {
    switch (type) {
      case 'referral':
        return 'Referral';
      case 'campaign':
        return 'Campaign';
      case 'cross_promotion':
        return 'Cross-Promo';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TouchableOpacity style={cardStyles.container} onPress={() => onPress(partner)} activeOpacity={0.7}>
      <View style={cardStyles.header}>
        <View style={cardStyles.avatarWrap}>
          {partner.partnerLogo ? (
            <View style={cardStyles.avatar} />
          ) : (
            <View style={cardStyles.avatarPlaceholder}>
              <Text style={cardStyles.avatarText}>
                {partner.partnerName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {partner.partnerName}
          </Text>
          <Text style={cardStyles.category}>{partner.partnerCategory}</Text>
        </View>
        <View style={cardStyles.statusWrap}>
          <View
            style={[
              cardStyles.statusBadge,
              { backgroundColor: `${getStatusColor(partner.status)}20` },
            ]}
          >
            <Text style={[cardStyles.statusText, { color: getStatusColor(partner.status) }]}>
              {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={cardStyles.typeRow}>
        <View style={cardStyles.typeBadge}>
          <Ionicons
            name={
              partner.partnershipType === 'referral'
                ? 'people-outline'
                : partner.partnershipType === 'campaign'
                ? 'megaphone-outline'
                : 'git-merge-outline'
            }
            size={14}
            color={Colors.primary[500]}
          />
          <Text style={cardStyles.typeText}>{getTypeLabel(partner.partnershipType)}</Text>
        </View>
        <Text style={cardStyles.joinedText}>
          Joined {new Date(partner.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </Text>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.metricsRow}>
        <View style={cardStyles.metric}>
          <Text style={cardStyles.metricValue}>{partner.totalReferrals}</Text>
          <Text style={cardStyles.metricLabel}>Referrals</Text>
        </View>
        <View style={cardStyles.metric}>
          <Text style={cardStyles.metricValue}>{partner.referralConversions}</Text>
          <Text style={cardStyles.metricLabel}>Conversions</Text>
        </View>
        <View style={cardStyles.metric}>
          <Text style={[cardStyles.metricValue, { color: Colors.success[600] }]}>
            {partner.conversionRate}%
          </Text>
          <Text style={cardStyles.metricLabel}>Conv. Rate</Text>
        </View>
        <View style={cardStyles.metric}>
          <Text style={cardStyles.metricValue}>{formatCurrency(partner.totalRevenue)}</Text>
          <Text style={cardStyles.metricLabel}>Revenue</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[200],
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  category: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  statusWrap: {
    marginLeft: 8,
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
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  joinedText: {
    fontSize: 12,
    color: Colors.gray[400],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const EmptyState = ({ onDiscover }: { onDiscover: () => void }) => (
  <View style={emptyStyles.container}>
    <View style={emptyStyles.iconWrap}>
      <Ionicons name="business-outline" size={56} color={Colors.gray[300]} />
    </View>
    <Text style={emptyStyles.title}>No partnerships yet</Text>
    <Text style={emptyStyles.description}>
      Discover nearby merchants and create partnerships to boost your business through mutual referrals
      and cross-promotions.
    </Text>
    <TouchableOpacity style={emptyStyles.ctaButton} onPress={onDiscover}>
      <Ionicons name="search" size={18} color="#fff" />
      <Text style={emptyStyles.ctaText}>Discover Partners</Text>
    </TouchableOpacity>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function HyperlocalIndex() {
  const { id: merchantId } = useLocalSearchParams<{ id?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [partners] = useState<Partner[]>(MOCK_PARTNERS);
  const [stats] = useState<PartnershipStats>(MOCK_STATS);

  const filteredPartners = partners.filter(
    (p) =>
      p.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partnerCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.info('[Hyperlocal] Refreshing partnerships');
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handlePartnerPress = (partner: Partner) => {
    router.push(`/hyperlocal/${partner.id}`);
  };

  const handleDiscover = () => {
    router.push('/hyperlocal/discover');
  };

  const handleCreate = () => {
    router.push('/hyperlocal/create');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="git-network" size={24} color={Colors.primary[500]} />
          <Text style={styles.headerTitle}>Hyperlocal Network</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleDiscover}>
          <Ionicons name="search" size={20} color={Colors.primary[500]} />
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
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatsCard
              icon="people"
              label="Active Partners"
              value={`${stats.activePartners}/${stats.totalPartners}`}
              color={Colors.primary[500]}
            />
            <View style={{ width: 12 }} />
            <StatsCard
              icon="swap-horizontal"
              label="Total Referrals"
              value={stats.totalReferrals}
              subtext={`${stats.referralConversions} converted`}
              color={Colors.success[500]}
            />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.statsRow}>
            <StatsCard
              icon="trending-up"
              label="Conversion Rate"
              value={`${stats.avgConversionRate}%`}
              color={Colors.warning[500]}
            />
            <View style={{ width: 12 }} />
            <StatsCard
              icon="cash"
              label="Total Revenue"
              value={`₹${(stats.totalRevenue / 1000).toFixed(1)}k`}
              color={Colors.gray[700]}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search partners..."
            placeholderTextColor={Colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Partnerships</Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text style={styles.sectionAction}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Partner List */}
        {filteredPartners.length > 0 ? (
          filteredPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} onPress={handlePartnerPress} />
          ))
        ) : (
          <EmptyState onDiscover={handleDiscover} />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleDiscover}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray[900],
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
