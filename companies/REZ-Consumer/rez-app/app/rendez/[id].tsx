/**
 * Rendez Offer Detail Screen
 *
 * Shows details for a couple/group dining offer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';
import { ThemedText } from '@/components/ThemedText';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

interface RendezOffer {
  id: string;
  title: string;
  description: string;
  type: 'couple' | 'group';
  merchantName: string;
  merchantId: string;
  merchantImage?: string;
  location: string;
  address?: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  minPeople: number;
  maxPeople: number;
  rating: number;
  reviews: number;
  images?: string[];
  features?: string[];
  timeSlots?: string[];
  date?: string;
  terms?: string[];
  isAvailable: boolean;
}

const mockOffer: RendezOffer = {
  id: '1',
  title: 'Romantic Candlelight Dinner',
  description: 'Experience an unforgettable evening with your special someone at our premium candlelight dinner. Includes a complimentary bottle of house wine, appetizers, and a dessert for two.',
  type: 'couple',
  merchantName: 'The Sky Lounge',
  merchantId: 'merchant_1',
  merchantImage: 'https://example.com/merchant.jpg',
  location: 'Andheri West, Mumbai',
  address: '123 Sky Tower, Link Road, Andheri West, Mumbai 400053',
  originalPrice: 3000,
  discountedPrice: 1999,
  discount: 33,
  minPeople: 2,
  maxPeople: 2,
  rating: 4.8,
  reviews: 234,
  images: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  ],
  features: [
    'Complimentary house wine',
    '4-course meal',
    'Live music',
    'Private seating',
    'Special decoration on request',
  ],
  timeSlots: ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'],
  terms: [
    'Reservation required at least 24 hours in advance',
    'Valid only on the selected date and time',
    'Cannot be combined with other offers',
    'Full payment required at booking',
  ],
  isAvailable: true,
};

export default function RendezDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<RendezOffer | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    loadOffer();
  }, [params.id]);

  const loadOffer = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // const response = await apiClient.get(`/rendez/${params.id}`);
      // if (response.success) setOffer(response.data);

      // Using mock data for now
      setOffer(mockOffer);
      if (mockOffer.timeSlots?.length) {
        setSelectedTime(mockOffer.timeSlots[0]);
      }
    } catch (error) {
      logger.error('[RendezDetail] Error loading offer:', error);
      Alert.alert('Error', 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot to continue');
      return;
    }

    router.push({
      pathname: '/booking',
      params: {
        type: 'rendez',
        offerId: offer?.id,
        time: selectedTime,
        date: selectedDate,
      },
    });
  };

  const handleShare = async () => {
    if (!offer) return;

    const shareContent = `Check out this amazing deal on ReZ!\n\n${offer.title}\n${offer.discount}% OFF at ${offer.merchantName}\n\nBook now on ReZ!`;

    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(shareContent);
        Alert.alert('Copied!', 'Link copied to clipboard');
      } else {
        await Sharing.shareAsync(shareContent);
      }
    } catch (error) {
      logger.error('[RendezDetail] Share error:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Offer not found</Text>
          <TouchableOpacity style={styles.backToListButton} onPress={() => router.back()}>
            <Text style={styles.backToListText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {offer.images && offer.images.length > 0 ? (
            <Image
              source={{ uri: offer.images[0] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Ionicons
                name={offer.type === 'couple' ? 'heart' : 'people'}
                size={64}
                color={Colors.primary}
              />
            </View>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareButton, { top: insets.top + 10 }]}
            onPress={handleShare}
          >
            <View style={styles.shareButtonInner}>
              <Ionicons name="share-outline" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Type Badge */}
          <View style={[styles.typeBadge, { bottom: 20 }]}>
            <Ionicons
              name={offer.type === 'couple' ? 'heart' : 'people'}
              size={14}
              color="#FFF"
            />
            <Text style={styles.typeBadgeText}>
              {offer.type === 'couple' ? 'Couple' : 'Group'} Deal
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{offer.title}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{offer.rating}</Text>
              <Text style={styles.reviews}>({offer.reviews} reviews)</Text>
            </View>
          </View>

          {/* Merchant Info */}
          <TouchableOpacity style={styles.merchantCard}>
            <View style={styles.merchantIcon}>
              <Ionicons name="storefront-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{offer.merchantName}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{offer.location}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceInfo}>
              <Text style={styles.discountedPrice}>
                {formatPrice(offer.discountedPrice)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(offer.originalPrice)}
              </Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{offer.discount}% OFF</Text>
            </View>
          </View>

          {/* Group Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Size</Text>
            <View style={styles.groupSizeRow}>
              <Ionicons name="people-outline" size={20} color={Colors.primary} />
              <Text style={styles.groupSizeText}>
                {offer.minPeople} - {offer.maxPeople} people
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{offer.description}</Text>
          </View>

          {/* Features */}
          {offer.features && offer.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {offer.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Time Slots */}
          {offer.timeSlots && offer.timeSlots.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              <View style={styles.timeSlotsGrid}>
                {offer.timeSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      selectedTime === slot && styles.timeSlotSelected,
                    ]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        selectedTime === slot && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Address */}
          {offer.address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.addressCard}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.addressText}>{offer.address}</Text>
              </View>
            </View>
          )}

          {/* Terms */}
          {offer.terms && offer.terms.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.termsHeader}
                onPress={() => setShowTerms(!showTerms)}
              >
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                <Ionicons
                  name={showTerms ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {showTerms && (
                <View style={styles.termsList}>
                  {offer.terms.map((term, index) => (
                    <View key={index} style={styles.termRow}>
                      <Text style={styles.termBullet}>•</Text>
                      <Text style={styles.termText}>{term}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          <Text style={styles.bottomPriceValue}>
            {formatPrice(offer.discountedPrice)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, !offer.isAvailable && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={!offer.isAvailable}
        >
          <Text style={styles.bookButtonText}>
            {offer.isAvailable ? 'Book Now' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  backToListButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  backToListText: {
    color: '#FFF',
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.lg,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    right: Spacing.lg,
  },
  shareButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviews: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#92400E',
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  discountText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  groupSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  groupSizeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: Colors.text,
  },
  timeSlotTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termsList: {
    marginTop: Spacing.sm,
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  termBullet: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomPrice: {},
  bottomPriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
