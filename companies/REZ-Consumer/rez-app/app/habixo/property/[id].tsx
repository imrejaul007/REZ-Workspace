// @ts-nocheck
// Habixo Property Detail Screen - Production Ready
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { getProperty, addToWishlist, removeFromWishlist, HabixoProperty } from '../api';
import { shareProperty, copyPropertyLink } from '../services/shareService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

// Amenity icon mapping
const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📶',
  'AC': '❄️',
  'TV': '📺',
  'Kitchen': '🍳',
  'Parking': '🅿️',
  'Pool': '🏊',
  'Gym': '🏋️',
  'Security': '🛡️',
  'Hot Water': '🚿',
  'Washing Machine': '🧺',
  'Air Conditioning': '❄️',
  'Balcony': '🏞️',
  'Garden': '🌳',
  'Beach Access': '🏖️',
  'City View': '🌆',
  'Mountain View': '⛰️',
  'Pet Friendly': '🐾',
  'Smoking Allowed': '🚬',
  'Wheelchair Accessible': '♿',
};

const getAmenityIcon = (amenity: string): string => {
  const normalized = amenity.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (normalized.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return '✨';
};

// House rules based on property type
const generateHouseRules = (property: HabixoProperty): string[] => {
  const rules = [
    'No smoking indoors',
    'No parties or events',
    'Check-in: 2:00 PM - 9:00 PM',
    'Check-out: 11:00 AM',
  ];

  if (property.type.toLowerCase().includes('shared')) {
    rules.push('Quiet hours: 10:00 PM - 8:00 AM');
    rules.push('Keep common areas clean');
  }

  rules.push(`Maximum ${property.guests} guests`);
  return rules;
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [property, setProperty] = useState<HabixoProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState({ checkIn: '', checkOut: '' });

  const flatListRef = useRef<FlatList>(null);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getProperty(id);

        if (response.success && response.data) {
          setProperty(response.data);
        } else {
          setError(response.error || 'Failed to load property');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!property) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const response = await removeFromWishlist(property.id);
        if (response.success) {
          setIsWishlisted(false);
          Alert.alert('Removed', 'Property removed from wishlist');
        }
      } else {
        const response = await addToWishlist(property.id);
        if (response.success) {
          setIsWishlisted(true);
          Alert.alert('Added', 'Property added to wishlist');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!property) return;
    const success = await shareProperty(property.title, property.id, property.images[0]);
    if (!success) {
      Alert.alert('Error', 'Failed to share property');
    }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    if (!property) return;
    const success = await copyPropertyLink(property.id);
    if (success) {
      Alert.alert('Copied!', 'Property link copied to clipboard');
    }
  };

  // Handle reserve button
  const handleReserve = () => {
    if (!property) return;

    router.push({
      pathname: '/habixo/bookings',
      params: {
        propertyId: property.id,
        price: property.price,
      },
    });
  };

  // Image scroll handler
  const onImageScroll = (event) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !property) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Unable to load property</Text>
          <Text style={styles.errorMessage}>{error || 'Property not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const houseRules = generateHouseRules(property);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: property.title,
          headerRight: () => (
            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonIcon}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWishlistToggle}
                disabled={wishlistLoading}
                style={styles.headerButton}
              >
                <Text style={styles.headerWishlistIcon}>
                  {isWishlisted ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery with Horizontal Scroll */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => setGalleryVisible(true)}
        >
          <FlatList
            ref={flatListRef}
            data={property.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onImageScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => `image-${index}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
          />
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1}/{property.images.length}
            </Text>
          </View>
          <View style={styles.showAllPhotos}>
            <Text style={styles.showAllPhotosText}>Show all photos</Text>
          </View>
        </TouchableOpacity>

        {/* Property Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>
                {property.brand.replace('habixo_', '').toUpperCase()}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.location}>{property.location}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {property.rating.toFixed(1)}</Text>
                <Text style={styles.reviews}>({property.reviews} reviews)</Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.typeRow}>
            <Text style={styles.type}>{property.type}</Text>
            <Text style={styles.city}>• {property.city}</Text>
          </View>

          {/* Quick Facts */}
          <View style={styles.quickFacts}>
            <View style={styles.factItem}>
              <Text style={styles.factIcon}>🛏️</Text>
              <Text style={styles.factValue}>{property.bedrooms}</Text>
              <Text style={styles.factLabel}>Bedrooms</Text>
            </View>
            <View style={styles.factDivider} />
            <View style={styles.factItem}>
              <Text style={styles.factIcon}>🚿</Text>
              <Text style={styles.factValue}>{property.bathrooms}</Text>
              <Text style={styles.factLabel}>Bathrooms</Text>
            </View>
            <View style={styles.factDivider} />
            <View style={styles.factItem}>
              <Text style={styles.factIcon}>👥</Text>
              <Text style={styles.factValue}>{property.guests}</Text>
              <Text style={styles.factLabel}>Guests</Text>
            </View>
          </View>

          {/* Host Info Card */}
          <View style={styles.hostSection}>
            <View style={styles.hostHeader}>
              <Image
                source={{ uri: `https://i.pravatar.cc/100?img=${property.id}` }}
                style={styles.hostImage}
              />
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>Hosted by {property.host.name}</Text>
                <View style={styles.hostStatsRow}>
                  <View style={styles.hostStat}>
                    <Text style={styles.hostStatIcon}>📊</Text>
                    <Text style={styles.hostStatText}>
                      {property.host.responseRate}% response
                    </Text>
                  </View>
                  <View style={styles.hostStat}>
                    <Text style={styles.hostStatIcon}>⭐</Text>
                    <Text style={styles.hostStatText}>
                      {property.host.rating.toFixed(1)} rating
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.contactHostButton}>
              <Text style={styles.contactHostText}>Contact Host</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <View style={styles.trustIconContainer}>
              <Text style={styles.trustIcon}>🛡️</Text>
            </View>
            <View style={styles.trustContent}>
              <Text style={styles.trustTitle}>Habixo Trust Verified</Text>
              <Text style={styles.trustDesc}>
                This property has passed our 58-point quality and safety check
              </Text>
            </View>
          </View>

          {/* Amenities Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What this place offers</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.slice(0, 8).map((amenity, index) => (
                <View key={index} style={styles.amenityCard}>
                  <Text style={styles.amenityIcon}>{getAmenityIcon(amenity)}</Text>
                  <Text style={styles.amenityName}>{amenity}</Text>
                </View>
              ))}
            </View>
            {property.amenities.length > 8 && (
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>
                  +{property.amenities.length - 8} more amenities
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* House Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House rules</Text>
            <View style={styles.rulesList}>
              {houseRules.map((rule, index) => (
                <View key={index} style={styles.ruleRow}>
                  <Text style={styles.ruleBullet}>•</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Location Map Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapIcon}>📍</Text>
                <Text style={styles.mapLocationText}>{property.location}</Text>
                <Text style={styles.mapActionText}>View on map</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancellation Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation policy</Text>
            <View style={styles.policyCard}>
              <Text style={styles.policyBadge}>Free cancellation</Text>
              <Text style={styles.policyText}>
                Free cancellation up to 7 days before check-in. After that, cancel
                before check-in and get a 50% refund, minus the service fee.
              </Text>
            </View>
          </View>

          {/* Add to Wishlist Button */}
          <TouchableOpacity
            style={[styles.wishlistButton, isWishlisted && styles.wishlistButtonActive]}
            onPress={handleWishlistToggle}
            disabled={wishlistLoading}
          >
            <Text style={[styles.wishlistButtonIcon, isWishlisted && styles.wishlistButtonIconActive]}>
              {isWishlisted ? '❤️' : '🤍'}
            </Text>
            <Text style={[styles.wishlistButtonText, isWishlisted && styles.wishlistButtonTextActive]}>
              {isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </Text>
          </TouchableOpacity>

          {/* Share Section */}
          <View style={styles.shareSection}>
            <Text style={styles.shareTitle}>Share this property</Text>
            <View style={styles.shareButtons}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonIcon}>📤</Text>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleCopyLink}>
                <Text style={styles.shareButtonIcon}>🔗</Text>
                <Text style={styles.shareButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing for Fixed Bar */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Booking Card */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{property.price.toLocaleString()}</Text>
            <Text style={styles.perNight}>/night</Text>
          </View>
          <Text style={styles.priceNote}>Excludes taxes and fees</Text>
        </View>
        <View style={styles.datePickers}>
          <TouchableOpacity style={styles.datePicker}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={styles.dateValue}>
              {selectedDates.checkIn || 'Add date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.datePicker}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={styles.dateValue}>
              {selectedDates.checkOut || 'Add date'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={handleReserve}
        >
          <Text style={styles.reserveButtonText}>Reserve</Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Gallery Modal */}
      <Modal
        visible={galleryVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setGalleryVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setGalleryVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <FlatList
            data={property.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `modal-image-${index}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.modalImage} />
            )}
          />
          <View style={styles.modalCounter}>
            <Text style={styles.modalCounterText}>
              {currentImageIndex + 1} / {property.images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  headerWishlistButton: {
    padding: 8,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  headerWishlistIcon: {
    fontSize: 24,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  showAllPhotos: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  showAllPhotosText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366f1',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  brandText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviews: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  type: {
    fontSize: 14,
    color: '#6b7280',
  },
  city: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickFacts: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  factItem: {
    flex: 1,
    alignItems: 'center',
  },
  factIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  factValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  factLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  factDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  hostSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  hostHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hostImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  hostInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  hostStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  hostStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostStatIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  hostStatText: {
    fontSize: 13,
    color: '#6b7280',
  },
  contactHostButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactHostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  trustIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trustIcon: {
    fontSize: 28,
  },
  trustContent: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 12,
    color: '#059669',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    width: '47%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  amenityName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  showMoreButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  rulesList: {
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleBullet: {
    fontSize: 16,
    color: '#374151',
    marginRight: 10,
    width: 16,
  },
  ruleText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    backgroundColor: '#f3f4f6',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  mapLocationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  mapActionText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  policyCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  policyBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 22,
  },
  wishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  wishlistButtonActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  wishlistButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  wishlistButtonIconActive: {
    fontSize: 20,
  },
  wishlistButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  wishlistButtonTextActive: {
    color: '#dc2626',
  },
  shareSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  shareButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  bottomSpacer: {
    height: 180,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  priceSection: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  perNight: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  priceNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  datePickers: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  datePicker: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  reserveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: '100%',
    resizeMode: 'contain',
  },
  modalCounter: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  modalCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
