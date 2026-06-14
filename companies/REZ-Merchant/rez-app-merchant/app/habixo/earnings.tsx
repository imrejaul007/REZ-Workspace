// Habixo Earnings Screen with Payout Tracker
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { getHostEarnings, getHostProperties, HabixoEarnings, HabixoProperty } from './api';
import { PayoutTracker, Payout } from './components/PayoutTracker';

// Mock data for development/fallback
const DEFAULT_EARNINGS: HabixoEarnings = {
  total: 284500,
  thisMonth: 45600,
  pendingPayout: 12500,
  nextPayoutDate: 'May 15, 2026',
  monthlyEarnings: [
    { month: 'Jan', amount: 32000 },
    { month: 'Feb', amount: 28500 },
    { month: 'Mar', amount: 45000 },
    { month: 'Apr', amount: 38400 },
    { month: 'May', amount: 45600 },
  ],
  propertyEarnings: [
    { propertyId: 'p1', name: 'Modern Apartment Koramangala', earnings: 156000, bookings: 45, percentage: 55 },
    { propertyId: 'p2', name: 'Beach Villa Goa', earnings: 165000, bookings: 22, percentage: 35 },
    { propertyId: 'p3', name: 'Cozy Room Indiranagar', earnings: 78400, bookings: 38, percentage: 10 },
  ],
};

// Mock payouts for payout tracker
const MOCK_PAYOUTS: Payout[] = [
  {
    id: 'p1',
    amount: 45000,
    status: 'completed',
    scheduledDate: 'Apr 30, 2026',
    completedDate: 'Apr 30, 2026',
    method: 'bank_transfer',
    methodDetails: 'HDFC Bank ****4521',
    bookingsIncluded: ['b1', 'b2', 'b3'],
  },
  {
    id: 'p2',
    amount: 38400,
    status: 'completed',
    scheduledDate: 'Mar 31, 2026',
    completedDate: 'Mar 31, 2026',
    method: 'bank_transfer',
    methodDetails: 'HDFC Bank ****4521',
    bookingsIncluded: ['b4', 'b5', 'b6'],
  },
  {
    id: 'p3',
    amount: 12500,
    status: 'pending',
    scheduledDate: 'May 15, 2026',
    method: 'upi',
    methodDetails: 'host@upi',
    bookingsIncluded: ['b7', 'b8'],
  },
];

// TODO: Get hostId from auth context/storage
const HOST_ID = 'host_123';

export default function HabixoEarnings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<HabixoEarnings | null>(null);
  const [properties, setProperties] = useState<HabixoProperty[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>(MOCK_PAYOUTS);

  const fetchEarningsData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [earningsData, propertiesData] = await Promise.all([
        getHostEarnings(HOST_ID).catch(() => null),
        getHostProperties(HOST_ID).catch(() => []),
      ]);

      if (earningsData) {
        setEarnings(earningsData);
      } else {
        // Use default mock data if API fails
        setEarnings(DEFAULT_EARNINGS);
      }
      setProperties(propertiesData);
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
      setError('Failed to load earnings data. Showing cached data.');
      setEarnings(DEFAULT_EARNINGS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  const onRefresh = useCallback(() => {
    fetchEarningsData(true);
  }, [fetchEarningsData]);

  // Use API data or mock data
  const displayEarnings = earnings || DEFAULT_EARNINGS;
  const maxEarning = Math.max(...displayEarnings.monthlyEarnings.map(m => m.amount));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#6366f1']} />
      }>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Payout Tracker */}
        <PayoutTracker
          payouts={payouts}
          pendingPayout={displayEarnings.pendingPayout}
          nextPayoutDate={displayEarnings.nextPayoutDate}
          onPayoutDetails={(payoutId) => console.log('Payout details:', payoutId)}
          onManagePayout={() => console.log('Manage payout settings')}
        />

        {/* Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Monthly Earnings</Text>
          <View style={styles.chart}>
            {displayEarnings.monthlyEarnings.map((month, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: (month.amount / maxEarning) * 120 },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{month.month}</Text>
                <Text style={styles.barAmount}>₹{(month.amount / 1000).toFixed(0)}K</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Property Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Earnings by Property</Text>
          {displayEarnings.propertyEarnings.map((property, index) => (
            <View key={index} style={styles.propertyRow}>
              <View style={styles.propertyInfo}>
                <View style={styles.propertyRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.propertyDetails}>
                  <Text style={styles.propertyName}>{property.name}</Text>
                  <Text style={styles.propertyBookings}>{property.bookings} bookings</Text>
                </View>
              </View>
              <View style={styles.propertyEarnings}>
                <Text style={styles.propertyAmount}>₹{property.earnings.toLocaleString()}</Text>
                <View style={styles.percentageBar}>
                  <View
                    style={[styles.percentageFill, { width: `${property.percentage}%` }]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Reports & Tools</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>Financial Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💹</Text>
              <Text style={styles.actionTitle}>Tax Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={styles.actionTitle}>Payout Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionTitle}>Pricing Tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summaryPeriod: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
  },
  summaryStat: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#374151',
    marginHorizontal: 16,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pendingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbbf24',
  },
  chartSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 4,
  },
  bar: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  barAmount: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  payoutCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  payoutBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  payoutBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  payoutAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  payoutButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  breakdownSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  propertyRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  propertyDetails: {},
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  propertyBookings: {
    fontSize: 12,
    color: '#6b7280',
  },
  propertyEarnings: {
    alignItems: 'flex-end',
  },
  propertyAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 6,
  },
  percentageBar: {
    width: 80,
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  actionsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});
