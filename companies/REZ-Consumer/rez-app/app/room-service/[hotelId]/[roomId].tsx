/**
 * Room Service Hub Screen - Sheraton Style
 * Route: /room-service/[hotelId]/[roomId]
 *
 * This screen appears when guests:
 * 1. Scan Room QR (web) → Opens in browser
 * 2. Scan Room QR (app) → Opens in StayOwn app
 * 3. Direct access from app → StayOwn Home → Hotel Services
 *
 * Features:
 * - Order Now (Food, Drinks, etc)
 * - My Orders (Track current orders)
 * - Bill (View charges & checkout)
 * - Offers (Deals & packages)
 * - Leave Feedback (Rate stay)
 * - Room Service (Housekeeping, Laundry, etc)
 * - AI Chat (Converse for anything)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import apiClient from '@/services/apiClient';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RoomServiceInfo {
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomNumber: string;
  services: RoomService[];
  amenities: string[];
  checkIn?: string;
  checkOut?: string;
  guestName?: string;
  bookingId?: string;
}

interface RoomService {
  id: string;
  name: string;
  icon: string;
  description: string;
  actionType: 'food' | 'housekeeping' | 'laundry' | 'concierge' | 'checkout' | 'minibar' | 'spa' | 'transport';
  actionData?: Record<string, string>;
  estimatedTime?: string;
  priceRange?: string;
}

// Service categories matching Sheraton style
const SERVICE_CATEGORIES = [
  { id: 'order', name: 'Order Now', icon: 'restaurant', color: '#E07C24' },
  { id: 'orders', name: 'My Orders', icon: 'receipt', color: '#4A90D9' },
  { id: 'bill', name: 'Bill', icon: 'card', color: '#5D8C5A' },
  { id: 'offers', name: 'Offers', icon: 'pricetag', color: '#D9656B' },
  { id: 'feedback', name: 'Feedback', icon: 'star', color: '#9B59B6' },
  { id: 'chat', name: 'Help', icon: 'chatbubbles', color: '#3498DB' },
];

const ROOM_SERVICES = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant', desc: 'Room service, restaurant' },
  { id: 'housekeeping', name: 'Housekeeping', icon: 'sparkles', desc: 'Cleaning, towels, amenities' },
  { id: 'laundry', name: 'Laundry', icon: 'shirt', desc: 'Wash, dry clean, iron' },
  { id: 'spa', name: 'Spa & Wellness', icon: 'flower', desc: 'Massage, treatments' },
  { id: 'transport', name: 'Transport', icon: 'car', desc: 'Airport pickup, tours' },
  { id: 'concierge', name: 'Concierge', icon: 'headset', desc: 'Information, bookings' },
];

export default function RoomServiceHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    bookingId?: string;
    token?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomServiceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch room service info
  const fetchRoomInfo = useCallback(async () => {
    try {
      const response = await apiClient.get(
        `/room-service/${params.hotelId}/${params.roomId}`,
        undefined,
        params.bookingId ? { bookingId: params.bookingId } : undefined
      );

      if (response.success && response.data) {
        setRoomInfo(response.data);
      } else {
        // Use mock data for demo
        setRoomInfo({
          hotelId: params.hotelId,
          hotelName: 'The Grand Mumbai',
          roomId: params.roomId,
          roomNumber: params.roomId.replace('R', ''),
          services: [],
          amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          guestName: 'Guest',
          bookingId: params.bookingId || 'DEMO-BK-001',
        });
      }
    } catch (err) {
      // Fallback to mock data
      setRoomInfo({
        hotelId: params.hotelId,
        hotelName: 'The Grand Mumbai',
        roomId: params.roomId,
        roomNumber: params.roomId.replace('R', ''),
        services: [],
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        guestName: 'Guest',
        bookingId: params.bookingId || 'DEMO-BK-001',
      });
    } finally {
      setLoading(false);
    }
  }, [params.hotelId, params.roomId, params.bookingId]);

  useEffect(() => {
    fetchRoomInfo();
  }, [fetchRoomInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoomInfo();
    setRefreshing(false);
  }, [fetchRoomInfo]);

  // Navigation handlers
  const handleServicePress = (serviceId: string) => {
    switch (serviceId) {
      case 'order':
        router.push(`/room-service/${params.hotelId}/${params.roomId}/order`);
        break;
      case 'orders':
        router.push(`/room-service/${params.hotelId}/${params.roomId}/orders`);
        break;
      case 'bill':
        router.push(`/room-service/${params.hotelId}/${params.roomId}/bill`);
        break;
      case 'offers':
        router.push(`/room-service/${params.hotelId}/${params.roomId}/offers`);
        break;
      case 'feedback':
        router.push(`/room-service/${params.hotelId}/${params.roomId}/feedback`);
        break;
      case 'chat':
        router.push(`/messages/ai-chat?context=hotel&hotelId=${params.hotelId}&roomId=${params.roomId}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E07C24" />
        <Text style={styles.loadingText}>Loading your room...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{roomInfo?.hotelName || 'Hotel'}</Text>
            <View style={styles.roomBadge}>
              <Ionicons name="bed" size={16} color="#fff" />
              <Text style={styles.roomNumber}>Room {roomInfo?.roomNumber || params.roomId}</Text>
            </View>
          </View>
          <View style={styles.guestInfo}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.guestName}>{roomInfo?.guestName || 'Guest'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E07C24" />
        }
      >
        {/* Main Action Buttons */}
        <View style={styles.mainActions}>
          {SERVICE_CATEGORIES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.actionButton, { backgroundColor: service.color }]}
              onPress={() => handleServicePress(service.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={service.icon as unknown} size={28} color="#fff" />
              <Text style={styles.actionText}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Room Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Services</Text>
          <View style={styles.servicesGrid}>
            {ROOM_SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress('order')}
                activeOpacity={0.7}
              >
                <View style={styles.serviceIconContainer}>
                  <Ionicons name={service.icon as unknown} size={24} color="#E07C24" />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {roomInfo?.amenities?.map((amenity, index) => (
              <View key={index} style={styles.amenityBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#5D8C5A" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="call" size={20} color="#E07C24" />
            <Text style={styles.quickActionText}>Call Front Desk</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="car" size={20} color="#E07C24" />
            <Text style={styles.quickActionText}>Request Checkout</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="information-circle" size={20} color="#E07C24" />
            <Text style={styles.quickActionText}>Hotel Information</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Stay Info */}
        <View style={styles.stayInfo}>
          <View style={styles.stayItem}>
            <Text style={styles.stayLabel}>Check-in</Text>
            <Text style={styles.stayValue}>
              {roomInfo?.checkIn ? new Date(roomInfo.checkIn).toLocaleDateString() : '-'}
            </Text>
          </View>
          <View style={styles.stayDivider} />
          <View style={styles.stayItem}>
            <Text style={styles.stayLabel}>Check-out</Text>
            <Text style={styles.stayValue}>
              {roomInfo?.checkOut ? new Date(roomInfo.checkOut).toLocaleDateString() : '-'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* AI Chat FAB */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => handleServicePress('chat')}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotelInfo: {
    flex: 1,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roomNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  guestInfo: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  mainActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    width: (SCREEN_WIDTH - 48) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#888',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  stayInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  stayItem: {
    flex: 1,
    alignItems: 'center',
  },
  stayDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  stayLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  stayValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  chatFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E07C24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
