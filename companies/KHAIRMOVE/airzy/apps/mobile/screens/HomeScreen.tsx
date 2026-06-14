/**
 * Airzy Home Screen
 * Dashboard with upcoming trips, quick actions, and personalized recommendations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import airzyApi from '../src/api/airzyApi';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  FlightSearch: undefined;
  LoungeSearch: { airport?: string };
  CreateTrip: undefined;
  ItineraryDetails: { itineraryId: string };
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Mock user - replace with actual auth
  const userId = 'user_123';

  // Fetch upcoming trips
  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming', userId],
    queryFn: () => airzyApi.getUpcoming(userId, 7),
    enabled: !!userId,
  });

  // Fetch recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => airzyApi.getRecommendations(userId, 'home'),
    enabled: !!userId,
  });

  // Fetch membership
  const { data: membershipData } = useQuery({
    queryKey: ['membership', userId],
    queryFn: () => airzyApi.getMembership(userId),
    enabled: !!userId,
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.subtitle}>Where are you flying today?</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('CreateTrip')}
        >
          <Text style={styles.profileInitial}>R</Text>
        </TouchableOpacity>
      </View>

      {/* Membership Card */}
      <View style={styles.membershipCard}>
        <View style={styles.membershipHeader}>
          <Text style={styles.membershipTier}>
            {membershipData?.data?.membership?.tier?.toUpperCase() || 'BASIC'}
          </Text>
          <Text style={styles.membershipName}>Airzy Member</Text>
        </View>
        <View style={styles.membershipStats}>
          <View style={styles.membershipStat}>
            <Text style={styles.statValue}>
              {membershipData?.data?.membership?.coinsBalance || 0}
            </Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.membershipStat}>
            <Text style={styles.statValue}>
              {membershipData?.data?.loungeVisitsRemaining || 0}
            </Text>
            <Text style={styles.statLabel}>Lounge Visits</Text>
          </View>
          <View style={styles.membershipStat}>
            <Text style={styles.statValue}>
              {membershipData?.data?.tierConfig?.coinMultiplier || 1}x
            </Text>
            <Text style={styles.statLabel}>Earning Rate</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade to Elite</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('FlightSearch')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Text style={styles.quickActionEmoji}>✈️</Text>
            </View>
            <Text style={styles.quickActionText}>Book Flight</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('LoungeSearch', {})}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.quickActionEmoji}>🛋️</Text>
            </View>
            <Text style={styles.quickActionText}>Find Lounge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('CreateTrip')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.quickActionEmoji}>📋</Text>
            </View>
            <Text style={styles.quickActionText}>Plan Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {}}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FCE7F3' }]}>
              <Text style={styles.quickActionEmoji}>🚗</Text>
            </View>
            <Text style={styles.quickActionText}>Airport Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Trips */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Trips</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcomingData?.data?.items?.length > 0 ? (
          upcomingData.data.items.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.tripCard}
              onPress={() =>
                navigation.navigate('ItineraryDetails', {
                  itineraryId: item.itineraryId || item.id,
                })
              }
            >
              <View style={styles.tripCardContent}>
                <View style={styles.tripCardIcon}>
                  <Text style={styles.tripCardIconText}>
                    {item.type === 'itinerary' ? '🎫' : '✈️'}
                  </Text>
                </View>
                <View style={styles.tripCardInfo}>
                  <Text style={styles.tripCardTitle}>{item.name}</Text>
                  <Text style={styles.tripCardDate}>
                    {new Date(item.datetime).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.tripCardArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🧳</Text>
            <Text style={styles.emptyStateTitle}>No upcoming trips</Text>
            <Text style={styles.emptyStateText}>
              Start planning your next adventure!
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('CreateTrip')}
            >
              <Text style={styles.emptyStateButtonText}>Create Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recommended Offers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Offers</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.offersScroll}
        >
          <TouchableOpacity style={styles.offerCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1540541338287-41700207dee6' }}
              style={styles.offerImage}
            />
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>Plaza Premium Lounge</Text>
              <Text style={styles.offerSubtitle}>BLR Terminal 2</Text>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>20% Cashback</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.offerCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5' }}
              style={styles.offerImage}
            />
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>Airport Café</Text>
              <Text style={styles.offerSubtitle}>DEL Terminal 3</Text>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>2x Coins</Text>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* AI Tips */}
      <View style={styles.section}>
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>AI Travel Tips</Text>
            <Text style={styles.aiBadge}>🤖</Text>
          </View>
          <Text style={styles.aiTip}>
            "You usually order coffee at T2 before boarding. ☕ 20% cashback available at
            Starbucks nearby!"
          </Text>
          <TouchableOpacity style={styles.aiAction}>
            <Text style={styles.aiActionText}>View More Tips</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  membershipCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  membershipHeader: {
    marginBottom: 16,
  },
  membershipTier: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 1,
  },
  membershipName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  membershipStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  membershipStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#C7D2FE',
    marginTop: 4,
  },
  upgradeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 72) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  tripCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tripCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripCardIconText: {
    fontSize: 20,
  },
  tripCardInfo: {
    flex: 1,
  },
  tripCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tripCardDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tripCardArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offersScroll: {
    paddingLeft: 20,
  },
  offerCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerImage: {
    width: '100%',
    height: 120,
  },
  offerContent: {
    padding: 12,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  offerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  offerBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  offerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  aiCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  aiBadge: {
    fontSize: 20,
  },
  aiTip: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  aiAction: {
    marginTop: 12,
  },
  aiActionText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
