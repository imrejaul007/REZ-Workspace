import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/contexts/StoreContext';
import { storeService, Store } from '@/services/api/stores';
import { tableBookingService } from '@/services/api/tableBookings';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StoreDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { activateStoreById, deactivateStoreById } = useStore();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);

  // Deactivate modal state
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Today's bookings widget
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [nextBookingTime, setNextBookingTime] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadStoreDetails();
      loadTodayBookings();
      setCurrentBannerIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTodayBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await tableBookingService.getStoreTableBookings(id as string, {
        date: today,
        limit: 50,
      });
      const activeBookings = result.bookings.filter(
        (b) => b.status === 'pending' || b.status === 'confirmed'
      );
      setTodayBookingsCount(activeBookings.length);

      // Find next upcoming booking
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const upcoming = activeBookings
        .filter((b) => b.bookingTime >= currentTime)
        .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
      setNextBookingTime(upcoming.length > 0 ? upcoming[0].bookingTime : null);
    } catch {
      // Non-critical — silently fail
    }
  };

  const loadStoreDetails = async () => {
    try {
      setLoading(true);
      const storeData = await storeService.getStoreById(id as string);
      setStore(storeData);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to load store details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStoreStatus = (store: Store) => {
    // If store is not active, show inactive status
    if (!store.isActive) {
      return { text: 'Inactive', color: Colors.light.textSecondary };
    }

    // If operational hours are set, check if store is currently open
    if (store.operationalInfo?.hours) {
      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5);
      const todayHours =
        store.operationalInfo.hours[dayName as keyof typeof store.operationalInfo.hours];

      if (!todayHours || todayHours.closed) {
        return { text: 'Closed', color: Colors.light.danger };
      }

      if (currentTime >= todayHours.open && currentTime <= todayHours.close) {
        return { text: 'Open', color: Colors.light.success };
      }

      return { text: 'Closed', color: Colors.light.danger };
    }

    // If no operational hours but store is active, show as "Open"
    return { text: 'Open', color: Colors.light.success };
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#FFB800" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#FFB800" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#E5E7EB" />);
      }
    }
    return stars;
  };

  // Get banners as array (support both string and array)
  const getBanners = (): string[] => {
    if (!store?.banner) return [];
    if (Array.isArray(store.banner)) {
      return store.banner;
    }
    return [store.banner];
  };

  const banners = getBanners();

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = SCREEN_WIDTH;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentBannerIndex(index);
  };

  const renderBannerItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.banner} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading store details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
          <Text style={styles.errorText}>Store not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStoreStatus(store);
  const rating = store.ratings?.average || 0;
  const ratingCount = store.ratings?.count || 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store Details</Text>
          <TouchableOpacity
            onPress={() => router.push(`/stores/${store._id}/edit`)}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Section */}
          <View style={styles.bannerSection}>
            {banners.length > 0 ? (
              <>
                <FlatList
                  ref={bannerFlatListRef}
                  data={banners}
                  renderItem={renderBannerItem}
                  keyExtractor={(item) => item}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleBannerScroll}
                  scrollEventThrottle={16}
                  snapToInterval={SCREEN_WIDTH}
                  decelerationRate="fast"
                  getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                  })}
                />
                {/* Pagination Dots */}
                {banners.length > 1 && (
                  <View style={styles.paginationContainer}>
                    {banners.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.paginationDot,
                          index === currentBannerIndex && styles.paginationDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons name="storefront" size={64} color={Colors.light.textMuted} />
              </View>
            )}
            {store.isActive && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.background} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>

          {/* Store Info Card */}
          <View style={styles.infoCard}>
            {/* Logo and Basic Info */}
            <View style={styles.logoSection}>
              {store.logo ? (
                <Image source={{ uri: store.logo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront" size={32} color={Colors.light.textMuted} />
                </View>
              )}
              <View style={styles.basicInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  {store.isVerified && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                  )}
                </View>
                {store.category && (
                  <Text style={styles.category}>
                    {typeof store.category === 'object' ? store.category.name : 'Category'}
                  </Text>
                )}
              </View>
            </View>

            {/* Rating and Status */}
            <View style={styles.ratingStatusSection}>
              {rating > 0 && (
                <View style={styles.ratingSection}>
                  <View style={styles.starsContainer}>{renderRatingStars(rating)}</View>
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                  {ratingCount > 0 && (
                    <Text style={styles.ratingCount}>({ratingCount} reviews)</Text>
                  )}
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
              </View>
              {store.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>

            {/* Description */}
            {store.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{store.description}</Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <Text style={styles.locationText}>{store.location.address}</Text>
              <Text style={styles.locationText}>
                {store.location.city}
                {store.location.state && `, ${store.location.state}`}
                {store.location.pincode && ` - ${store.location.pincode}`}
              </Text>
              {store.location.landmark && (
                <Text style={styles.landmarkText}>Near {store.location.landmark}</Text>
              )}
              {store.location.deliveryRadius && (
                <Text style={styles.deliveryRadius}>
                  Delivery radius: {store.location.deliveryRadius} km
                </Text>
              )}
            </View>

            {/* Contact Information */}
            {(store.contact?.phone || store.contact?.email || store.contact?.website) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="call" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Contact</Text>
                </View>
                {store.contact.phone && (
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
                    <Text style={styles.contactText}>{store.contact.phone}</Text>
                  </View>
                )}
                {store.contact.email && (
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={16} color={Colors.light.textSecondary} />
                    <Text style={styles.contactText}>{store.contact.email}</Text>
                  </View>
                )}
                {store.contact.website && (
                  <View style={styles.contactItem}>
                    <Ionicons name="globe-outline" size={16} color={Colors.light.textSecondary} />
                    <Text style={styles.contactText}>{store.contact.website}</Text>
                  </View>
                )}
                {store.contact.whatsapp && (
                  <View style={styles.contactItem}>
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={styles.contactText}>{store.contact.whatsapp}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Operational Info */}
            {store.operationalInfo && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Operational Details</Text>
                </View>
                {store.operationalInfo.deliveryTime && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Delivery Time:</Text>
                    <Text style={styles.infoValue}>{store.operationalInfo.deliveryTime}</Text>
                  </View>
                )}
                {store.operationalInfo.minimumOrder !== undefined && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Minimum Order:</Text>
                    <Text style={styles.infoValue}>₹{store.operationalInfo.minimumOrder}</Text>
                  </View>
                )}
                {store.operationalInfo.deliveryFee !== undefined && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Delivery Fee:</Text>
                    <Text style={styles.infoValue}>₹{store.operationalInfo.deliveryFee}</Text>
                  </View>
                )}
                {store.operationalInfo.freeDeliveryAbove && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Free Delivery Above:</Text>
                    <Text style={styles.infoValue}>₹{store.operationalInfo.freeDeliveryAbove}</Text>
                  </View>
                )}
                {store.operationalInfo.hours && (
                  <View style={styles.hoursSection}>
                    <Text style={styles.hoursTitle}>Store Hours</Text>
                    {Object.entries(store.operationalInfo.hours).map(
                      ([day, hours]: [string, unknown]) => (
                        <View key={day} style={styles.hourRow}>
                          <Text style={styles.dayName}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </Text>
                          {hours.closed ? (
                            <Text style={styles.closedText}>Closed</Text>
                          ) : (
                            <Text style={styles.hoursText}>
                              {hours.open} - {hours.close}
                            </Text>
                          )}
                        </View>
                      )
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Offers */}
            {store.offers && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="gift" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Offers & Cashback</Text>
                </View>
                {store.offers.cashback && (
                  <View style={styles.offerCard}>
                    <Ionicons name="cash" size={24} color={Colors.light.success} />
                    <View style={styles.offerInfo}>
                      <Text style={styles.offerTitle}>{store.offers.cashback}% Cashback</Text>
                      {store.offers.minOrderAmount && (
                        <Text style={styles.offerSubtitle}>
                          On orders above ₹{store.offers.minOrderAmount}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {store.offers.isPartner && (
                  <View style={styles.partnerBadge}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.partnerText}>
                      Partner Store {store.offers.partnerLevel && `(${store.offers.partnerLevel})`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Analytics */}
            {store.analytics && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="stats-chart" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Analytics</Text>
                </View>
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="receipt-outline" size={24} color={Colors.light.primary} />
                    <Text style={styles.analyticsValue}>{store.analytics.totalOrders || 0}</Text>
                    <Text style={styles.analyticsLabel}>Total Orders</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="cash-outline" size={24} color={Colors.light.success} />
                    <Text style={styles.analyticsValue}>
                      ₹{((store.analytics.totalRevenue || 0) / 1000).toFixed(1)}K
                    </Text>
                    <Text style={styles.analyticsLabel}>Total Revenue</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="people-outline" size={24} color={Colors.light.warning} />
                    <Text style={styles.analyticsValue}>
                      {store.analytics.repeatCustomers || 0}
                    </Text>
                    <Text style={styles.analyticsLabel}>Repeat Customers</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="cart-outline" size={24} color={Colors.light.error} />
                    <Text style={styles.analyticsValue}>
                      ₹{(store.analytics.avgOrderValue || 0).toFixed(0)}
                    </Text>
                    <Text style={styles.analyticsLabel}>Avg Order Value</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Today's Bookings Widget */}
            {todayBookingsCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.section,
                  {
                    backgroundColor: '#F0FDF4',
                    borderWidth: 1,
                    borderColor: '#BBF7D0',
                    borderRadius: 16,
                  },
                ]}
                onPress={() => router.push(`/stores/${store._id}/table-bookings`)}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: '#DCFCE7',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="restaurant-outline" size={20} color="#16A34A" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#15803D' }}>
                        {todayBookingsCount} Booking{todayBookingsCount !== 1 ? 's' : ''} Today
                      </Text>
                      {nextBookingTime && (
                        <Text style={{ fontSize: 13, color: '#4ADE80', marginTop: 2 }}>
                          Next at{' '}
                          {(() => {
                            const [h, m] = nextBookingTime.split(':').map(Number);
                            return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                          })()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#16A34A" />
                </View>
              </TouchableOpacity>
            )}

            {/* Tags */}
            {store.tags && store.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {store.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reviews & UGC Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Reviews & UGC</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                View customer reviews and user-generated content for your store
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/reviews`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="star" size={24} color="#FFB800" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Store Reviews</Text>
                      <Text style={styles.actionCardSubtitle}>
                        {ratingCount > 0 ? `${ratingCount} reviews` : 'No reviews yet'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/ugc`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="images" size={24} color="#10B981" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>UGC Content</Text>
                      <Text style={styles.actionCardSubtitle}>
                        User-generated photos and videos
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Web Menu Promotions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="megaphone-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Web Menu Promotions</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Manage promotional banners shown at the top of your web menu
              </Text>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/promotions`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="megaphone" size={24} color="#F59E0B" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Promotions</Text>
                      <Text style={styles.actionCardSubtitle}>
                        {(store.promotions?.length ?? 0) > 0
                          ? `${store.promotions?.length ?? 0} active banner${(store.promotions?.length ?? 0) > 1 ? 's' : ''}`
                          : 'No banners — tap to add'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Gallery Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="images-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Store Gallery</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Manage your store gallery with images and videos
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/gallery`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="grid" size={24} color="#8B5CF6" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Gallery</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Upload and organize store images
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Promotional Videos Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="videocam" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Promotional Videos</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Upload promotional videos to showcase products in UGC section
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/promotional-videos`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="play-circle" size={24} color="#EC4899" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Videos</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Upload and track promotional videos
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Creator Picks Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Creator Picks</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Review and approve creator picks that promote your products
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/creator-analytics`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="star-outline" size={24} color="#8B5CF6" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Creator Analytics</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Approve picks, reward creators, and track performance
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* UPI Payment Discounts Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flash" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>UPI Payment Discounts</Text>
              </View>
              <Text style={styles.sectionSubtext}>Manage UPI payment discounts for this store</Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() =>
                  router.push({
                    pathname: `/stores/${store._id}/discounts`,
                    params: { paymentMethod: 'upi' },
                  })
                }
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="flash" size={24} color="#10B981" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Discounts</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Create and manage UPI payment discounts
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Card Offers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Card Offers</Text>
              </View>
              <Text style={styles.sectionSubtext}>Manage card payment offers for this store</Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() =>
                  router.push({
                    pathname: `/stores/${store._id}/discounts`,
                    params: { paymentMethod: 'card' },
                  })
                }
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="card" size={24} color="#3B82F6" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Card Offers</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Create and manage card payment offers
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Store Vouchers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="ticket" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Store Vouchers</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Create discount vouchers for store visits and promotions
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/vouchers`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="ticket-outline" size={24} color="#8B5CF6" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Vouchers</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Create and manage discount vouchers for customers
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Store Outlets Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Store Outlets</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Manage your store outlet locations for customers to visit
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/outlets`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="storefront-outline" size={24} color="#10B981" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Outlets</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Add and manage store outlet locations
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Payment QR Code Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="qr-code" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Payment QR Code</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Generate and manage QR code for customers to pay at your store
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/qr-code`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="qr-code-outline" size={24} color="#6366F1" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage QR Code</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Generate, download, or share your store's payment QR
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/payment-settings`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="settings-outline" size={24} color="#F59E0B" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Payment Settings</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Configure accepted payment methods and rewards
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Table Bookings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Table Bookings</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                View and manage table reservations from customers
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/table-bookings`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="calendar-outline" size={24} color="#10B981" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>View Table Bookings</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Manage reservations, confirm or cancel bookings
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Coin Drops Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="gift" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Coin Drops</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Create and manage coin drop campaigns to reward customers
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/coin-drops`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="gift-outline" size={24} color="#F59E0B" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Coin Drops</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Set up coin drop events and track redemptions
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Branded Coins Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="diamond" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Branded Coins</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Configure your store's branded coin rewards and exchange rates
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/branded-coins`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="diamond-outline" size={24} color="#8B5CF6" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Branded Coins</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Customise coin name, value, and earn rules
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Earning Analytics Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Earning Analytics</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Track coin earnings, redemptions, and loyalty revenue for this store
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/earning-analytics`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="trending-up-outline" size={24} color="#10B981" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>View Earning Analytics</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Analyse coin activity and loyalty programme ROI
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Prive Campaigns Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="megaphone" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Prive Campaigns</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Create exclusive campaigns for high-value customers at this store
              </Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/stores/${store._id}/prive-campaigns`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="megaphone-outline" size={24} color="#EC4899" />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>Manage Prive Campaigns</Text>
                      <Text style={styles.actionCardSubtitle}>
                        Invite-only offers and premium customer perks
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              {!store.isActive ? (
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={async () => {
                    try {
                      await activateStoreById(store._id);
                      // Reload store details to get updated status
                      await loadStoreDetails();
                      showAlert('Success', `${store.name} is now active and visible to customers.`);
                    } catch (error) {
                      showAlert('Error', error.message || 'Failed to activate store');
                    }
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.background} />
                  <Text style={styles.activateButtonText}>Activate Store</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.deactivateButton}
                  onPress={() => setDeactivateModalVisible(true)}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.light.background} />
                  <Text style={styles.activateButtonText}>Deactivate Store</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.editButtonFull}
                onPress={() => router.push(`/stores/${store._id}/edit`)}
              >
                <Ionicons name="pencil" size={20} color={Colors.light.primary} />
                <Text style={styles.editButtonText}>Edit Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        visible={deactivateModalVisible}
        title="Deactivate Store"
        message={`Are you sure you want to deactivate "${store?.name || ''}"? It will no longer be visible to customers.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        type="warning"
        loading={deactivating}
        onConfirm={async () => {
          if (!store) return;
          setDeactivating(true);
          try {
            await deactivateStoreById(store._id);
            await loadStoreDetails();
            setDeactivateModalVisible(false);
            showAlert('Success', `${store.name} has been deactivated.`);
          } catch (error) {
            showAlert('Error', error.message || 'Failed to deactivate store');
          } finally {
            setDeactivating(false);
          }
        }}
        onCancel={() => setDeactivateModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16,
  },
  bannerSection: {
    height: 200,
    position: 'relative',
    backgroundColor: Colors.light.backgroundSecondary,
    overflow: 'hidden',
  },
  banner: {
    width: SCREEN_WIDTH,
    height: 200,
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.light.background,
  },
  activeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeBadgeText: {
    color: Colors.light.background,
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.light.background,
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  basicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginRight: 8,
  },
  category: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  ratingStatusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  ratingCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deliveryRadius: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  hoursSection: {
    marginTop: 12,
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  closedText: {
    fontSize: 14,
    color: Colors.light.error,
    fontWeight: '500',
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.success,
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  partnerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  actionsSection: {
    marginTop: 8,
    gap: 12,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.success,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.warning,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  activateButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    gap: 8,
  },
  editButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionCardText: {
    marginLeft: 12,
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
