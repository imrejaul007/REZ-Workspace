// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Salon Details Page
 * View salon info, services, stylists, and book appointments
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { CardGridSkeleton } from '@/components/skeletons';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useGetCurrencySymbol } from '@/stores/selectors';
import ServiceList from './components/ServiceList';
import StylistPicker from './components/StylistPicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: colors.brand.pink,
  primaryDark: '#F43F5E',
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: Colors.success,
  background: colors.background.secondary,
  amber: Colors.warning,
};

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number;
  category: string;
  image?: string;
}

export interface Stylist {
  id: string;
  name: string;
  image?: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: string;
  available: boolean;
}

export interface SalonDetails {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distance: string;
  cashback: string;
  image: string;
  images: string[];
  isVerified: boolean;
  category: string;
  address: string;
  phone: string;
  email: string;
  timing: string;
  openNow: boolean;
  about: string;
  services: Service[];
  stylists: Stylist[];
  amenities: string[];
  reviews: Review[];
}

export interface Review {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

const SalonDetailsPage: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'stylists' | 'reviews'>('services');

  // Mock data for demonstration
  const mockSalon: SalonDetails = {
    id: '1',
    name: 'Luxe Hair & Beauty Studio',
    rating: 4.8,
    reviewCount: 234,
    distance: '0.5 km',
    cashback: '25%',
    image: '',
    images: [],
    isVerified: true,
    category: 'Hair & Beauty',
    address: '123 Main Street, Downtown, Mumbai 400001',
    phone: '+91 98765 43210',
    email: 'contact@luxebeauty.com',
    timing: '9:00 AM - 9:00 PM',
    openNow: true,
    about:
      'Luxe Hair & Beauty Studio is a premium salon offering world-class hair and beauty services. Our team of expert stylists use only the finest products to give you the look you deserve. From trendy haircuts to luxurious spa treatments, we have everything you need to look and feel your best.',
    services: [
      {
        id: '1',
        name: 'Haircut & Styling',
        description: 'Professional haircut with wash, condition, and styling',
        price: 800,
        originalPrice: 1000,
        duration: 60,
        category: 'Hair',
      },
      {
        id: '2',
        name: 'Hair Coloring',
        description: 'Full color treatment with premium products',
        price: 2500,
        originalPrice: 3000,
        duration: 120,
        category: 'Hair',
      },
      {
        id: '3',
        name: 'Keratin Treatment',
        description: 'Smooth and shiny hair for up to 6 months',
        price: 5000,
        originalPrice: 6500,
        duration: 180,
        category: 'Hair',
      },
      {
        id: '4',
        name: 'Basic Facial',
        description: 'Cleansing, exfoliation, and moisturizing',
        price: 600,
        originalPrice: 800,
        duration: 45,
        category: 'Beauty',
      },
      {
        id: '5',
        name: 'Gold Facial',
        description: 'Premium facial with 24K gold treatment',
        price: 1500,
        originalPrice: 2000,
        duration: 60,
        category: 'Beauty',
      },
      {
        id: '6',
        name: 'Classic Manicure',
        description: 'Nail shaping, cuticle care, and polish',
        price: 400,
        originalPrice: 500,
        duration: 30,
        category: 'Nails',
      },
      {
        id: '7',
        name: 'Gel Manicure',
        description: 'Long-lasting gel polish application',
        price: 800,
        originalPrice: 1000,
        duration: 45,
        category: 'Nails',
      },
      {
        id: '8',
        name: 'Bridal Makeup',
        description: 'Complete bridal makeup with trial session',
        price: 8000,
        originalPrice: 10000,
        duration: 180,
        category: 'Makeup',
      },
    ],
    stylists: [
      {
        id: '1',
        name: 'Priya Sharma',
        image: '',
        specialty: 'Hair Styling & Coloring',
        rating: 4.9,
        reviewCount: 156,
        experience: '8 years',
        available: true,
      },
      {
        id: '2',
        name: 'Rahul Verma',
        image: '',
        specialty: 'Men\'s Grooming',
        rating: 4.7,
        reviewCount: 89,
        experience: '5 years',
        available: true,
      },
      {
        id: '3',
        name: 'Anita Patel',
        image: '',
        specialty: 'Facials & Skincare',
        rating: 4.8,
        reviewCount: 112,
        experience: '6 years',
        available: false,
      },
      {
        id: '4',
        name: 'Meera Joshi',
        image: '',
        specialty: 'Bridal Makeup',
        rating: 4.9,
        reviewCount: 78,
        experience: '10 years',
        available: true,
      },
    ],
    amenities: ['AC', 'WiFi', 'Parking', 'Wheelchair Accessible', 'Card Payment', 'Gift Vouchers'],
    reviews: [
      {
        id: '1',
        userName: 'Sneha K.',
        rating: 5,
        comment:
          'Amazing experience! Priya did a fantastic job with my hair. The ambiance is great and the staff is very friendly. Highly recommend!',
        date: '2 weeks ago',
        service: 'Hair Coloring',
      },
      {
        id: '2',
        userName: 'Rahul M.',
        rating: 4,
        comment: 'Good service for men\'s grooming. Rahul is very professional and does a great job with beard styling.',
        date: '1 month ago',
        service: 'Beard Trim',
      },
      {
        id: '3',
        userName: 'Pooja S.',
        rating: 5,
        comment:
          'Got my bridal makeup done here and I was absolutely thrilled! Meera and her team did an amazing job. Worth every penny!',
        date: '2 months ago',
        service: 'Bridal Makeup',
      },
    ],
  };

  const fetchSalonDetails = useCallback(async () => {
    try {
      setIsLoading(true);

      // In production, use API call:
      // const response = await storesApi.getStoreById(id);

      // Using mock data for demonstration
      if (!isMounted()) return;
      setSalon(mockSalon);
    } catch (error) {
      if (!isMounted()) return;
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
    }
  }, [id, isMounted]);

  useEffect(() => {
    fetchSalonDetails();
  }, [fetchSalonDetails]);

  const handleShare = async () => {
    if (!salon) return;
    try {
      await Share.share({
        message: `Check out ${salon.name} on ReZ! ${salon.address} - Rating: ${salon.rating}/5`,
        title: salon.name,
      });
    } catch (error) {
      // Handle error
    }
  };

  const handleCall = () => {
    if (!salon?.phone) return;
    Linking.openURL(`tel:${salon.phone}`);
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    // Navigate to booking page with service details
    router.push({
      pathname: `/salon/book/${service.id}` as unknown,
      params: {
        salonId: id,
        salonName: salon?.name,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        stylistId: selectedStylist?.id,
        stylistName: selectedStylist?.name,
      },
    } as unknown);
  };

  const handleSelectStylist = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setActiveTab('services');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CardGridSkeleton />
      </View>
    );
  }

  if (!salon) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray600} />
        <Text style={styles.errorText}>Salon not found</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const discount = salon.services[0]?.originalPrice
    ? Math.round((1 - salon.services[0].price / salon.services[0].originalPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <CachedImage
            source={{ uri: salon.image || 'https://picsum.photos/400/300' }}
            style={styles.headerImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />

          {/* Back Button */}
          <Pressable
            style={styles.imageBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>

          {/* Share Button */}
          <Pressable style={styles.imageShareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={colors.text.inverse} />
          </Pressable>

          {/* Cashback Badge */}
          <View style={styles.cashbackBadge}>
            <Ionicons name="wallet" size={14} color={colors.text.inverse} />
            <Text style={styles.cashbackText}>{salon.cashback} Cashback</Text>
          </View>

          {/* Verified Badge */}
          {salon.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.text.inverse} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Salon Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.salonName}>{salon.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={COLORS.amber} />
              <Text style={styles.ratingText}>{salon.rating}</Text>
              <Text style={styles.reviewCount}>({salon.reviewCount})</Text>
            </View>
          </View>

          <Text style={styles.category}>{salon.category}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.gray600} />
            <Text style={styles.address}>{salon.address}</Text>
          </View>

          <View style={styles.timingRow}>
            <Ionicons
              name={salon.openNow ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color={salon.openNow ? COLORS.green500 : COLORS.gray600}
            />
            <Text style={[styles.timing, { color: salon.openNow ? COLORS.green500 : COLORS.gray600 }]}>
              {salon.openNow ? 'Open Now' : 'Closed'} • {salon.timing}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Call</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/map?salonId=${salon.id}` as unknown)}
            >
              <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Directions</Text>
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{salon.about}</Text>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {salon.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected Stylist */}
        {selectedStylist && (
          <View style={styles.selectedStylistBanner}>
            <View style={styles.selectedStylistInfo}>
              <View style={styles.selectedStylistAvatar}>
                <Text style={styles.selectedStylistInitial}>
                  {selectedStylist.name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.selectedStylistName}>{selectedStylist.name}</Text>
                <Text style={styles.selectedStylistSpecialty}>{selectedStylist.specialty}</Text>
              </View>
            </View>
            <Pressable onPress={() => setSelectedStylist(null)}>
              <Ionicons name="close-circle" size={24} color={COLORS.gray600} />
            </Pressable>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'services' && styles.tabActive]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Services
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'stylists' && styles.tabActive]}
            onPress={() => setActiveTab('stylists')}
          >
            <Text style={[styles.tabText, activeTab === 'stylists' && styles.tabTextActive]}>
              Stylists
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'services' && (
          <ServiceList
            services={salon.services}
            currencySymbol={currencySymbol}
            onServiceSelect={handleBookService}
            selectedService={selectedService}
          />
        )}

        {activeTab === 'stylists' && (
          <StylistPicker
            stylists={salon.stylists}
            onSelectStylist={handleSelectStylist}
            selectedStylistId={selectedStylist?.id}
          />
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsSection}>
            {salon.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUserAvatar}>
                    <Text style={styles.reviewUserInitial}>
                      {review.userName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.reviewUserInfo}>
                    <Text style={styles.reviewUserName}>{review.userName}</Text>
                    <Text style={styles.reviewService}>{review.service} • {review.date}</Text>
                  </View>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={14} color={COLORS.amber} />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}

            <Pressable
              style={styles.viewAllReviewsButton}
              onPress={() => router.push(`/store-reviews?storeId=${salon.id}` as unknown)}
            >
              <Text style={styles.viewAllReviewsText}>View All Reviews</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bottom Book Button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={styles.bookButton}
          onPress={() => {
            if (salon.services.length > 0) {
              handleBookService(salon.services[0]);
            }
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  errorText: {
    ...Typography.bodyLarge,
    color: COLORS.gray600,
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  imageBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    left: Spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageShareButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: Spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashbackBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green500,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  cashbackText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green500,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  salonName: {
    ...Typography.h2,
    fontWeight: '700',
    color: colors.nileBlue,
    flex: 1,
    marginRight: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  reviewCount: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  category: {
    ...Typography.body,
    color: COLORS.primary,
    marginBottom: Spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  address: {
    flex: 1,
    ...Typography.body,
    color: COLORS.gray600,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timing: {
    ...Typography.body,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${COLORS.primary}10`,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.md,
  },
  aboutText: {
    ...Typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenityChip: {
    backgroundColor: COLORS.gray50,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  amenityText: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  selectedStylistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.primary}10`,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  selectedStylistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selectedStylistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStylistInitial: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  selectedStylistName: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  selectedStylistSpecialty: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  reviewsSection: {
    padding: Spacing.base,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reviewUserInitial: {
    ...Typography.body,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  reviewService: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  reviewComment: {
    ...Typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  viewAllReviewsButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  viewAllReviewsText: {
    ...Typography.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: Spacing.base,
    paddingBottom: Spacing.base + 80,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  bookButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  bookButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(SalonDetailsPage, 'SalonDetails');
