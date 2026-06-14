/**
 * Rendez Offer Details Screen
 *
 * Shows complete details of a social offer including bookings,
 * analytics, and allows editing or toggling status.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Types
interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  people: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

interface RendezOffer {
  id: string;
  name: string;
  description: string;
  type: 'couple' | 'group';
  category: string;
  minPeople: number;
  maxPeople: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  isActive: boolean;
  contextRules: ContextRule[];
  bookings: Booking[];
  analytics: OfferAnalytics;
  validFrom: string;
  validTo: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContextRule {
  id: string;
  type: 'day' | 'date' | 'time';
  value: string;
  label: string;
  isActive: boolean;
}

interface OfferAnalytics {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageRating?: number;
}

// Mock data
const mockOffer: RendezOffer = {
  id: '1',
  name: 'Romantic Candlelight Dinner',
  description: 'An intimate candlelit dinner for two with a special menu curated by our chef. Includes welcome drinks, a 5-course meal, and dessert.',
  type: 'couple',
  category: 'Dining',
  minPeople: 2,
  maxPeople: 2,
  price: 2999,
  originalPrice: 4500,
  discount: 33,
  isActive: true,
  contextRules: [
    { id: 'r1', type: 'day', value: 'friday', label: 'Friday', isActive: true },
    { id: 'r2', type: 'day', value: 'saturday', label: 'Saturday', isActive: true },
    { id: 'r3', type: 'date', value: 'valentines', label: "Valentine's Day", isActive: true },
  ],
  bookings: [
    {
      id: 'b1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'priya.s@example.com',
      date: '2026-05-16',
      time: '19:00',
      people: 2,
      status: 'confirmed',
      totalAmount: 2999,
      notes: 'Anniversary dinner, please arrange a small cake',
      createdAt: '2026-05-08T10:30:00Z',
    },
    {
      id: 'b2',
      customerName: 'Rahul Verma',
      customerPhone: '+91 87654 32109',
      date: '2026-05-10',
      time: '20:00',
      people: 2,
      status: 'completed',
      totalAmount: 2999,
      createdAt: '2026-05-01T14:00:00Z',
    },
    {
      id: 'b3',
      customerName: 'Anita Desai',
      customerPhone: '+91 76543 21098',
      date: '2026-05-12',
      time: '19:30',
      people: 2,
      status: 'pending',
      totalAmount: 2999,
      createdAt: '2026-05-09T09:00:00Z',
    },
    {
      id: 'b4',
      customerName: 'Vikram Singh',
      customerPhone: '+91 65432 10987',
      date: '2026-05-15',
      time: '18:30',
      people: 2,
      status: 'cancelled',
      totalAmount: 2999,
      createdAt: '2026-05-07T11:00:00Z',
    },
  ],
  analytics: {
    views: 1234,
    conversions: 45,
    conversionRate: 3.6,
    revenue: 74975,
    averageRating: 4.8,
  },
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  terms: 'Reservation required 24 hours in advance. Cancellations must be made 12 hours before the booking time.',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-05-01T14:30:00Z',
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Status Badge Component
const StatusBadge: React.FC<{ status: Booking['status'] }> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'confirmed':
        return { bg: '#d1fae5', text: '#059669' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'completed':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#dc2626' };
    }
  };

  const style = getStatusStyle();
  return (
    <View style={[statusStyles.badge, { backgroundColor: style.bg }]}>
      <Text style={[statusStyles.text, { color: style.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

const statusStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

// Analytics Card
const AnalyticsCard: React.FC<{ analytics: OfferAnalytics; colors: typeof Colors.light }> = ({
  analytics,
  colors,
}) => (
  <View style={[styles.card, { backgroundColor: colors.card }]}>
    <Text style={[styles.cardTitle, { color: colors.text }]}>Performance Analytics</Text>
    <View style={styles.analyticsGrid}>
      <View style={styles.analyticItem}>
        <Text style={[styles.analyticValue, { color: colors.primary }]}>{analytics.views}</Text>
        <Text style={[styles.analyticLabel, { color: colors.textSecondary }]}>Views</Text>
      </View>
      <View style={[styles.analyticDivider, { backgroundColor: colors.border }]} />
      <View style={styles.analyticItem}>
        <Text style={[styles.analyticValue, { color: colors.secondary }]}>{analytics.conversions}</Text>
        <Text style={[styles.analyticLabel, { color: colors.textSecondary }]}>Bookings</Text>
      </View>
      <View style={[styles.analyticDivider, { backgroundColor: colors.border }]} />
      <View style={styles.analyticItem}>
        <Text style={[styles.analyticValue, { color: colors.indigo }]}>{analytics.conversionRate}%</Text>
        <Text style={[styles.analyticLabel, { color: colors.textSecondary }]}>Conversion</Text>
      </View>
    </View>
    <View style={[styles.revenueRow, { backgroundColor: colors.backgroundTertiary }]}>
      <View style={styles.revenueItem}>
        <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
        <Text style={[styles.revenueValue, { color: colors.text }]}>
          {formatCurrency(analytics.revenue)}
        </Text>
      </View>
      {analytics.averageRating && (
        <View style={styles.revenueItem}>
          <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={[styles.revenueValue, { color: colors.text }]}>
              {analytics.averageRating}/5
            </Text>
          </View>
        </View>
      )}
    </View>
  </View>
);

// Booking Card
const BookingCard: React.FC<{
  booking: Booking;
  onConfirm?: () => void;
  onCancel?: () => void;
  colors: typeof Colors.light;
}> = ({ booking, onConfirm, onCancel, colors }) => (
  <View style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.bookingHeader}>
      <View>
        <Text style={[styles.customerName, { color: colors.text }]}>{booking.customerName}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)}>
          <Text style={[styles.customerPhone, { color: colors.primary }]}>
            {booking.customerPhone}
          </Text>
        </TouchableOpacity>
      </View>
      <StatusBadge status={booking.status} />
    </View>

    <View style={styles.bookingDetails}>
      <View style={styles.detailItem}>
        <Ionicons name="calendar" size={14} color={colors.textSecondary} />
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {formatDate(booking.date)} at {booking.time}
        </Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="people" size={14} color={colors.textSecondary} />
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {booking.people} {booking.people === 1 ? 'person' : 'people'}
        </Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="cash" size={14} color={colors.textSecondary} />
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {formatCurrency(booking.totalAmount)}
        </Text>
      </View>
    </View>

    {booking.notes && (
      <View style={[styles.notesContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{booking.notes}</Text>
      </View>
    )}

    {booking.status === 'pending' && (
      <View style={styles.bookingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton, { borderColor: colors.error }]}
          onPress={onCancel}
        >
          <Ionicons name="close" size={16} color={colors.error} />
          <Text style={[styles.cancelButtonText, { color: colors.error }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.confirmButton, { backgroundColor: colors.secondary }]}
          onPress={onConfirm}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// Context Rules Display
const ContextRulesDisplay: React.FC<{ rules: ContextRule[]; colors: typeof Colors.light }> = ({
  rules,
  colors,
}) => (
  <View style={[styles.card, { backgroundColor: colors.card }]}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Availability Rules</Text>
      <Ionicons name="calendar" size={20} color={colors.primary} />
    </View>
    <View style={styles.rulesContainer}>
      {rules.map((rule) => (
        <View
          key={rule.id}
          style={[
            styles.ruleChip,
            {
              backgroundColor: rule.isActive ? colors.primaryLight2 : colors.backgroundTertiary,
              borderColor: rule.isActive ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons
            name={rule.type === 'day' ? 'calendar' : rule.type === 'date' ? 'heart' : 'time'}
            size={14}
            color={rule.isActive ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.ruleChipText,
              { color: rule.isActive ? colors.primary : colors.textMuted },
            ]}
          >
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

// Stats Summary
const StatsSummary: React.FC<{
  bookings: Booking[];
  colors: typeof Colors.light;
}> = ({ bookings, colors }) => {
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    revenue: bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Booking Summary</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.confirmed}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Confirmed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#d97706' }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#1d4ed8' }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
        </View>
      </View>
      <View style={[styles.revenueBox, { backgroundColor: colors.backgroundTertiary }]}>
        <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Confirmed Revenue</Text>
        <Text style={[styles.revenueAmount, { color: colors.text }]}>
          {formatCurrency(stats.revenue)}
        </Text>
      </View>
    </View>
  );
};

export default function OfferDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [offer, setOffer] = useState<RendezOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'analytics'>('overview');

  const fetchOffer = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOffer(mockOffer);
    } catch (error) {
      Alert.alert('Error', 'Failed to load offer details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  const handleToggleStatus = () => {
    if (!offer) return;

    Alert.alert(
      offer.isActive ? 'Deactivate Offer' : 'Activate Offer',
      `Are you sure you want to ${offer.isActive ? 'deactivate' : 'activate'} this offer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: offer.isActive ? 'Deactivate' : 'Activate',
          style: offer.isActive ? 'destructive' : 'default',
          onPress: () => {
            setOffer((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!offer) return;
    try {
      await Share.share({
        message: `Check out our ${offer.name}! ${offer.description} Book now for just ${formatCurrency(offer.price)}`,
        title: offer.name,
      });
    } catch (error) {
      // User cancelled or error
    }
  };

  const handleConfirmBooking = (bookingId: string) => {
    Alert.alert('Confirm Booking', 'Are you sure you want to confirm this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          setOffer((prev) =>
            prev
              ? {
                  ...prev,
                  bookings: prev.bookings.map((b) =>
                    b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
                  ),
                }
              : null
          );
        },
      },
    ]);
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          setOffer((prev) =>
            prev
              ? {
                  ...prev,
                  bookings: prev.bookings.map((b) =>
                    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
                  ),
                }
              : null
          );
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading offer details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Offer not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOffer(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.headerTop}>
            <View style={styles.badges}>
              <View
                style={[
                  styles.typeBadge,
                  offer.type === 'couple' ? styles.coupleBadge : styles.groupBadge,
                ]}
              >
                <Ionicons
                  name={offer.type === 'couple' ? 'heart' : 'people'}
                  size={14}
                  color={offer.type === 'couple' ? '#ec4899' : '#8b5cf6'}
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: offer.type === 'couple' ? '#ec4899' : '#8b5cf6' },
                  ]}
                >
                  {offer.type === 'couple' ? 'Couple' : 'Group'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  offer.isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: offer.isActive ? '#059669' : '#6b7280' },
                  ]}
                >
                  {offer.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionIcon} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon} onPress={handleToggleStatus}>
                <Ionicons
                  name={offer.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.offerName, { color: colors.text }]}>{offer.name}</Text>
          <Text style={[styles.offerDescription, { color: colors.textSecondary }]}>
            {offer.description}
          </Text>

          <View style={styles.pricingRow}>
            <View>
              <Text style={[styles.price, { color: colors.text }]}>
                {formatCurrency(offer.price)}
              </Text>
              {offer.originalPrice && (
                <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                  {formatCurrency(offer.originalPrice)}
                </Text>
              )}
            </View>
            {offer.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{offer.discount}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.peopleRow}>
            <Ionicons name="people" size={18} color={colors.textSecondary} />
            <Text style={[styles.peopleText, { color: colors.textSecondary }]}>
              {offer.minPeople}-{offer.maxPeople} people
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
              {offer.category}
            </Text>
          </View>

          <View style={styles.validityRow}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.validityText, { color: colors.textMuted }]}>
              Valid: {formatDate(offer.validFrom)} - {formatDate(offer.validTo)}
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
          {(['overview', 'bookings', 'analytics'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <StatsSummary bookings={offer.bookings} colors={colors} />
            <ContextRulesDisplay rules={offer.contextRules} colors={colors} />

            {/* Terms */}
            {offer.terms && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Terms & Conditions
                  </Text>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  {offer.terms}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'bookings' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Bookings ({offer.bookings.length})
            </Text>
            {offer.bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No bookings yet
                </Text>
              </View>
            ) : (
              offer.bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={() => handleConfirmBooking(booking.id)}
                  onCancel={() => handleCancelBooking(booking.id)}
                  colors={colors}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.tabContent}>
            <AnalyticsCard analytics={offer.analytics} colors={colors} />

            {/* Quick Actions */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="share-social" size={24} color={colors.primary} />
                  <Text style={[styles.actionCardText, { color: colors.text }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="qr-code" size={24} color={colors.primary} />
                  <Text style={[styles.actionCardText, { color: colors.text }]}>QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="copy-outline" size={24} color={colors.primary} />
                  <Text style={[styles.actionCardText, { color: colors.text }]}>Duplicate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
                  <Text style={[styles.actionCardText, { color: colors.text }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  coupleBadge: {
    backgroundColor: '#fce7f3',
  },
  groupBadge: {
    backgroundColor: '#ede9fe',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  inactiveBadge: {
    backgroundColor: '#f3f4f6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
  },
  offerName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  peopleText: {
    fontSize: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  categoryText: {
    fontSize: 14,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityText: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  analyticItem: {
    alignItems: 'center',
  },
  analyticDivider: {
    width: 1,
    height: '100%',
  },
  analyticValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  analyticLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 10,
  },
  revenueItem: {
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ruleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  ruleChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  revenueBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  revenueLabel: {
    fontSize: 13,
  },
  revenueAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  bookingCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
