/**
 * Fitness Membership Plans
 * Create and manage membership tiers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

interface MembershipPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  maxVisitsPerMonth?: number;
  includesClasses: boolean;
  includesPersonalTraining: boolean;
  includesLocker: boolean;
  includesSauna: boolean;
  memberCount: number;
  isPopular: boolean;
  isActive: boolean;
  color: string;
}

interface RenewalAlert {
  memberId: string;
  memberName: string;
  planName: string;
  expiryDate: string;
  daysLeft: number;
}

// Mock data
const MOCK_PLANS: MembershipPlan[] = [
  {
    _id: 'p1',
    name: 'Basic',
    description: 'Perfect for beginners',
    price: 999,
    billingCycle: 'monthly',
    features: [
      'Access to gym equipment',
      'Basic fitness assessment',
      'Locker room access',
    ],
    maxVisitsPerMonth: 12,
    includesClasses: false,
    includesPersonalTraining: false,
    includesLocker: true,
    includesSauna: false,
    memberCount: 45,
    isPopular: false,
    isActive: true,
    color: '#6B7280',
  },
  {
    _id: 'p2',
    name: 'Standard',
    description: 'Most popular choice',
    price: 1999,
    billingCycle: 'monthly',
    features: [
      'Access to gym equipment',
      'Unlimited group classes',
      'Basic fitness assessment',
      'Locker room access',
      'Free WiFi',
    ],
    includesClasses: true,
    includesPersonalTraining: false,
    includesLocker: true,
    includesSauna: false,
    memberCount: 78,
    isPopular: true,
    isActive: true,
    color: Colors.light.primary,
  },
  {
    _id: 'p3',
    name: 'Premium',
    description: 'For serious fitness enthusiasts',
    price: 3999,
    billingCycle: 'monthly',
    features: [
      'Access to gym equipment',
      'Unlimited group classes',
      '2 PT sessions per month',
      'Nutrition consultation',
      'Premium locker',
      'Sauna access',
      'Guest passes (2/month)',
    ],
    includesClasses: true,
    includesPersonalTraining: true,
    includesLocker: true,
    includesSauna: true,
    memberCount: 28,
    isPopular: false,
    isActive: true,
    color: Colors.light.warning,
  },
  {
    _id: 'p4',
    name: 'Elite',
    description: 'Ultimate fitness experience',
    price: 7999,
    billingCycle: 'monthly',
    features: [
      'Everything in Premium',
      'Unlimited PT sessions',
      'Personalized meal plan',
      'Priority booking',
      'Spa access',
      'Monthly body composition',
      'Unlimited guest passes',
    ],
    includesClasses: true,
    includesPersonalTraining: true,
    includesLocker: true,
    includesSauna: true,
    memberCount: 12,
    isPopular: false,
    isActive: true,
    color: '#EC4899',
  },
];

const MOCK_RENEWALS: RenewalAlert[] = [
  { memberId: 'm1', memberName: 'Rahul Sharma', planName: 'Premium', expiryDate: '2026-05-15', daysLeft: 4 },
  { memberId: 'm2', memberName: 'Priya Patel', planName: 'Standard', expiryDate: '2026-05-12', daysLeft: 1 },
  { memberId: 'm3', memberName: 'Amit Kumar', planName: 'Basic', expiryDate: '2026-05-18', daysLeft: 7 },
  { memberId: 'm4', memberName: 'Sneha Reddy', planName: 'Elite', expiryDate: '2026-05-20', daysLeft: 9 },
];

const PlanCard: React.FC<{
  plan: MembershipPlan;
  index: number;
  onPress: () => void;
}> = ({ plan, index, onPress }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card variant="elevated" padding="none" style={styles.planCard}>
          {/* Popular Badge */}
          {plan.isPopular && (
            <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
              <Text style={styles.popularBadgeText}>Most Popular</Text>
            </View>
          )}

          {/* Header */}
          <View style={[styles.planHeader, { backgroundColor: `${plan.color}10` }]}>
            <View style={[styles.planIconContainer, { backgroundColor: plan.color }]}>
              <Ionicons name="diamond-outline" size={24} color="#fff" />
            </View>
            <View style={styles.planHeaderText}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.priceAmount}>{formatPrice(plan.price)}</Text>
            <Text style={styles.priceCycle}>/{plan.billingCycle}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            {plan.features.slice(0, 5).map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {plan.features.length > 5 && (
              <Text style={styles.moreFeatures}>
                +{plan.features.length - 5} more features
              </Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.planFooter}>
            <View style={styles.memberCount}>
              <Ionicons name="people" size={16} color={Colors.light.textMuted} />
              <Text style={styles.memberCountText}>
                {plan.memberCount} members
              </Text>
            </View>
            <View style={[styles.planStatus, { backgroundColor: plan.isActive ? Colors.light.successLight : Colors.light.errorLight }]}>
              <Text style={[styles.planStatusText, { color: plan.isActive ? Colors.light.success : Colors.light.error }]}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RenewalCard: React.FC<{
  renewal: RenewalAlert;
  index: number;
}> = ({ renewal, index }) => {
  const getUrgentStyle = () => {
    if (renewal.daysLeft <= 2) {
      return { backgroundColor: Colors.light.error, textColor: '#fff' };
    } else if (renewal.daysLeft <= 7) {
      return { backgroundColor: Colors.light.warning, textColor: '#fff' };
    }
    return { backgroundColor: Colors.light.backgroundSecondary, textColor: Colors.light.textSecondary };
  };

  const style = getUrgentStyle();

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <View style={[styles.renewalCard, { backgroundColor: `${style.backgroundColor}` }]}>
        <View style={styles.renewalInfo}>
          <Text style={[styles.renewalName, { color: style.textColor }]}>{renewal.memberName}</Text>
          <Text style={[styles.renewalPlan, { color: style.textColor }]}>
            {renewal.planName} Plan
          </Text>
        </View>
        <View style={styles.renewalRight}>
          <Text style={[styles.renewalDays, { color: style.textColor }]}>
            {renewal.daysLeft} days
          </Text>
          <Text style={[styles.renewalLabel, { color: style.textColor }]}>left</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function MembershipScreen() {
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [renewals, setRenewals] = useState<RenewalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setPlans(MOCK_PLANS);
      setRenewals(MOCK_RENEWALS);
    } catch (error) {
      console.error('[Membership] fetchData error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  const handlePlanPress = (plan: MembershipPlan) => {
    Alert.alert(
      plan.name + ' Plan',
      `Price: Rs. ${plan.price}/${plan.billingCycle}\n\nFeatures:\n${plan.features.map(f => '• ' + f).join('\n')}\n\nMembers: ${plan.memberCount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Plan', onPress: () => console.log('Edit plan:', plan._id) },
      ]
    );
  };

  // Calculate stats
  const totalMembers = plans.reduce((sum, p) => sum + p.memberCount, 0);
  const totalRevenue = plans.reduce((sum, p) => sum + (p.price * p.memberCount), 0);
  const popularPlan = plans.find(p => p.isPopular);
  const urgentRenewals = renewals.filter(r => r.daysLeft <= 7);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Membership Plans</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{totalMembers}</Text>
              <Text style={styles.headerStatLabel}>Total Members</Text>
            </View>
            <View style={[styles.headerStatItem, styles.headerStatBorder]}>
              <Text style={styles.headerStatValue}>{formatCurrency(totalRevenue)}</Text>
              <Text style={styles.headerStatLabel}>Monthly Revenue</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Renewal Alerts */}
      {urgentRenewals.length > 0 && (
        <View style={styles.renewalSection}>
          <View style={styles.renewalHeader}>
            <View style={styles.renewalTitleRow}>
              <Ionicons name="warning-outline" size={18} color={Colors.light.warning} />
              <Text style={styles.renewalSectionTitle}>Renewals Due Soon</Text>
            </View>
            <Text style={styles.renewalCount}>{urgentRenewals.length} members</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.renewalScrollContent}
          >
            {urgentRenewals.map((renewal, index) => (
              <RenewalCard key={renewal.memberId} renewal={renewal} index={index} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Plans List */}
      <FlatList
        data={plans}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <PlanCard
            plan={item}
            index={index}
            onPress={() => handlePlanPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Available Plans</Text>
            <Text style={styles.sectionSubtitle}>
              {plans.length} plans, {totalMembers} active members
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerContent: {
    paddingTop: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  headerStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  renewalSection: {
    marginTop: -12,
    paddingBottom: 8,
  },
  renewalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  renewalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  renewalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  renewalCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  renewalScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  renewalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  renewalInfo: {
    flex: 1,
  },
  renewalName: {
    fontSize: 14,
    fontWeight: '600',
  },
  renewalPlan: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  renewalRight: {
    alignItems: 'flex-end',
  },
  renewalDays: {
    fontSize: 18,
    fontWeight: '700',
  },
  renewalLabel: {
    fontSize: 11,
    opacity: 0.8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  planCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHeaderText: {
    marginLeft: 14,
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  planDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  priceCycle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginLeft: 4,
  },
  featuresSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 26,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCountText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  planStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
