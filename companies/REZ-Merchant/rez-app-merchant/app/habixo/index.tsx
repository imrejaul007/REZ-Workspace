// Habixo Host Dashboard - Smart Living OS powered by ReZ
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { getHostProperties, getHostBookings, getHostEarnings, HabixoProperty, HabixoBooking } from './api';

// Mock data for development/fallback
const DEFAULT_HOST_PROFILE = {
  name: 'Rahul Sharma',
  email: 'rahul@habixo.com',
  joinedDate: 'January 2024',
  totalProperties: 3,
  responseRate: 98,
  avgRating: 4.8,
  superhost: true,
  avatar: 'https://i.pravatar.cc/100?img=12',
};

const DEFAULT_STATS = {
  totalEarnings: 284500,
  thisMonth: 45600,
  pendingPayout: 12500,
  totalBookings: 127,
  upcomingBookings: 8,
  avgOccupancy: 72,
};

const QUICK_ACTIONS = [
  { name: 'Add Property', icon: '➕', color: '#6366f1', href: '/habixo/property/add' },
  { name: 'View Calendar', icon: '📅', color: '#10b981', href: '/habixo/bookings' },
  { name: 'Pricing Tools', icon: '💲', color: '#f59e0b', href: '/habixo/earnings' },
  { name: 'Messages', icon: '💬', color: '#3b82f6', href: '/habixo/settings' },
];

// Mock upcoming bookings for initial state
const MOCK_UPCOMING_BOOKINGS = [
  {
    id: 'b1',
    guestName: 'Priya M.',
    property: 'Modern Apartment Koramangala',
    checkIn: 'May 10, 2026',
    checkOut: 'May 15, 2026',
    amount: 12500,
    status: 'confirmed' as const,
    guestAvatar: 'https://i.pravatar.cc/50?img=5',
  },
  {
    id: 'b2',
    guestName: 'Amit K.',
    property: 'Cozy Room Indiranagar',
    checkIn: 'May 12, 2026',
    checkOut: 'May 14, 2026',
    amount: 4800,
    status: 'confirmed' as const,
    guestAvatar: 'https://i.pravatar.cc/50?img=3',
  },
  {
    id: 'b3',
    guestName: 'Sneha J.',
    property: 'Modern Apartment Koramangala',
    checkIn: 'May 18, 2026',
    checkOut: 'May 25, 2026',
    amount: 17500,
    status: 'pending' as const,
    guestAvatar: 'https://i.pravatar.cc/50?img=9',
  },
];

// TODO: Get hostId from auth context/storage
const HOST_ID = 'host_123';

export default function HabixoDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [properties, setProperties] = useState<HabixoProperty[]>([]);
  const [bookings, setBookings] = useState<HabixoBooking[]>([]);
  const [stats, setStats] = useState(DEFAULT_STATS);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch properties and bookings in parallel
      const [propertiesData, bookingsData, earningsData] = await Promise.all([
        getHostProperties(HOST_ID).catch(() => []),
        getHostBookings(HOST_ID).catch(() => []),
        getHostEarnings(HOST_ID).catch(() => null),
      ]);

      setProperties(propertiesData);

      // Filter upcoming bookings (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingBookings = bookingsData.filter((booking: HabixoBooking) => {
        const checkIn = new Date(booking.checkIn);
        return booking.status === 'upcoming' || booking.status === 'pending'
          ? checkIn >= now && checkIn <= thirtyDaysFromNow
          : false;
      });
      setBookings(upcomingBookings.length > 0 ? upcomingBookings.slice(0, 3) : bookingsData.slice(0, 3));

      // Update stats from earnings data
      if (earningsData) {
        setStats({
          totalEarnings: earningsData.total,
          thisMonth: earningsData.thisMonth,
          pendingPayout: earningsData.pendingPayout,
          totalBookings: bookingsData.length,
          upcomingBookings: bookingsData.filter((b: HabixoBooking) => b.status === 'upcoming').length,
          avgOccupancy: propertiesData.length > 0
            ? Math.round(propertiesData.reduce((sum: number, p: HabixoProperty) => sum + p.occupancy, 0) / propertiesData.length)
            : 72,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Calculate property performance from API data
  const propertyPerformance = properties.length > 0
    ? properties.map((p: HabixoProperty) => ({
        name: p.title,
        bookings: p.bookings,
        rating: p.rating,
        earnings: p.earnings,
      }))
    : [
        { name: 'Modern Apt Koramangala', bookings: 45, rating: 4.9, earnings: 156000 },
        { name: 'Cozy Room Indiranagar', bookings: 38, rating: 4.7, earnings: 78400 },
        { name: 'Beach Villa Goa', bookings: 22, rating: 4.8, earnings: 165000 },
      ];

  // Use bookings from API or mock data
  const displayBookings = bookings.length > 0 ? bookings : MOCK_UPCOMING_BOOKINGS;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && properties.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#6366f1']} />
      }>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image source={{ uri: DEFAULT_HOST_PROFILE.avatar }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.greeting}>Hello, {DEFAULT_HOST_PROFILE.name.split(' ')[0]}!</Text>
                {DEFAULT_HOST_PROFILE.superhost && (
                  <View style={styles.superhostBadge}>
                    <Text style={styles.superhostText}>⭐ Superhost</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtext}>Host since {DEFAULT_HOST_PROFILE.joinedDate}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/habixo/settings')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View Details →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalEarnings}>₹{STATS.totalEarnings.toLocaleString()}</Text>
          <View style={styles.earningsStats}>
            <View style={styles.earningStat}>
              <Text style={styles.earningStatLabel}>This Month</Text>
              <Text style={styles.earningStatValue}>₹{STATS.thisMonth.toLocaleString()}</Text>
            </View>
            <View style={styles.earningStat}>
              <Text style={styles.earningStatLabel}>Pending Payout</Text>
              <Text style={styles.pendingPayout}>₹{STATS.pendingPayout.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => router.push(action.href as unknown)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Text style={styles.quickActionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionName}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.upcomingBookings}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgOccupancy}%</Text>
            <Text style={styles.statLabel}>Occupancy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{DEFAULT_HOST_PROFILE.responseRate}%</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/habixo/bookings')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {displayBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => router.push(`/habixo/bookings/${booking.id}`)}
            >
              <Image source={{ uri: booking.guestAvatar }} style={styles.guestAvatar} />
              <View style={styles.bookingInfo}>
                <Text style={styles.guestName}>{booking.guestName}</Text>
                <Text style={styles.propertyName}>{booking.property}</Text>
                <Text style={styles.bookingDates}>
                  📅 {booking.checkIn} → {booking.checkOut}
                </Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingAmount}>₹{booking.amount.toLocaleString()}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        booking.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          booking.status === 'confirmed' ? '#166534' : '#92400e',
                      },
                    ]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Property Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Property Performance</Text>
            <TouchableOpacity onPress={() => router.push('/habixo/properties')}>
              <Text style={styles.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          {propertyPerformance.map((property, index) => (
            <TouchableOpacity
              key={index}
              style={styles.propertyCard}
              onPress={() => router.push('/habixo/properties')}
            >
              <View style={styles.propertyRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle}>{property.name}</Text>
                <View style={styles.propertyStats}>
                  <Text style={styles.propertyStat}>📅 {property.bookings} bookings</Text>
                  <Text style={styles.propertyStat}>⭐ {property.rating}</Text>
                </View>
              </View>
              <View style={styles.propertyEarnings}>
                <Text style={styles.propertyEarningsValue}>
                  ₹{(property.earnings / 1000).toFixed(0)}K
                </Text>
                <Text style={styles.propertyEarningsLabel}>earned</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust Score Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustIcon}>🛡️</Text>
          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Habixo Trust Score</Text>
            <View style={styles.trustStats}>
              <View style={styles.trustStat}>
                <Text style={styles.trustValue}>94</Text>
                <Text style={styles.trustLabel}>Trust Score</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustStat}>
                <Text style={styles.trustValue}>{DEFAULT_HOST_PROFILE.avgRating}</Text>
                <Text style={styles.trustLabel}>Avg Rating</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustStat}>
                <Text style={styles.trustValue}>{stats.totalBookings}</Text>
                <Text style={styles.trustLabel}>Bookings</Text>
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 48,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: {},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  superhostBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  superhostText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  headerSubtext: {
    fontSize: 13,
    color: '#e0e7ff',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  earningsCard: {
    backgroundColor: '#1f2937',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  viewAll: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  totalEarnings: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningStat: {},
  earningStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  earningStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pendingPayout: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbbf24',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  propertyName: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  bookingDates: {
    fontSize: 12,
    color: '#6b7280',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  propertyRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  propertyStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  propertyEarnings: {
    alignItems: 'flex-end',
  },
  propertyEarningsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  propertyEarningsLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  trustBanner: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  trustIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  trustContent: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
  },
  trustStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustStat: {
    alignItems: 'center',
  },
  trustValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
  },
  trustLabel: {
    fontSize: 11,
    color: '#065f46',
  },
  trustDivider: {
    width: 1,
    backgroundColor: '#10b981',
    opacity: 0.3,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
