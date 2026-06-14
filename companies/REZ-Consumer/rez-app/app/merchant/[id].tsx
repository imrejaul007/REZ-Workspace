// @ts-nocheck
/**
 * Merchant Detail Screen
 * Detailed view of a single merchant with all information
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMerchant } from '@/hooks/useREZMerchant';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function MerchantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: merchant, isLoading, error, refetch } = useMerchant(id);

  const handleCall = useCallback(() => {
    if (merchant?.phone) {
      Linking.openURL(`tel:${merchant.phone}`);
    }
  }, [merchant?.phone]);

  const handleEmail = useCallback(() => {
    if (merchant?.email) {
      Linking.openURL(`mailto:${merchant.email}`);
    }
  }, [merchant?.email]);

  const handleWebsite = useCallback(() => {
    if (merchant?.website) {
      Linking.openURL(merchant.website);
    }
  }, [merchant?.website]);

  const handleShare = useCallback(async () => {
    if (merchant) {
      try {
        await Share.share({
          message: `Check out ${merchant.name} on REZ!\n${merchant.website || `https://rez.money/merchant/${merchant.id}`}`,
          title: merchant.name,
        });
      } catch (error) {
        // Handle error silently
      }
    }
  }, [merchant]);

  const handleGetDirections = useCallback(() => {
    if (merchant?.address) {
      const address = encodeURIComponent(`${merchant.address}, ${merchant.city || ''}, ${merchant.state || ''}`);
      Linking.openURL(`https://maps.google.com/?q=${address}`);
    }
  }, [merchant]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading merchant...</Text>
      </View>
    );
  }

  if (error || !merchant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load merchant</Text>
        <Text style={styles.errorSubtitle}>{error?.message || 'Merchant not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: merchant.name,
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {merchant.coverImage ? (
            <Image
              source={{ uri: merchant.coverImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : merchant.logo ? (
            <Image
              source={{ uri: merchant.logo }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.placeholderEmoji}>🏪</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              {merchant.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>

            <Text style={styles.industryLabel}>
              {merchant.industry.charAt(0).toUpperCase() + merchant.industry.slice(1)}
            </Text>

            {/* Rating */}
            {merchant.rating && (
              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingValue}>{merchant.rating.toFixed(1)}</Text>
                </View>
                {merchant.reviewCount && (
                  <Text style={styles.reviewCount}>
                    {merchant.reviewCount} reviews
                  </Text>
                )}
              </View>
            )}

            {/* Price Range */}
            {merchant.priceRange && (
              <Text style={styles.priceRange}>{merchant.priceRange}</Text>
            )}

            {/* Tags */}
            {merchant.tags && merchant.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {merchant.tags.slice(0, 5).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          {merchant.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{merchant.description}</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationCard}
              onPress={handleGetDirections}
              activeOpacity={0.8}
            >
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>📍</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  {merchant.address || 'Address not available'}
                </Text>
                {(merchant.city || merchant.state) && (
                  <Text style={styles.locationSubtext}>
                    {[merchant.city, merchant.state, merchant.country].filter(Boolean).join(', ')}
                    {merchant.pincode && ` ${merchant.pincode}`}
                  </Text>
                )}
              </View>
              <Text style={styles.directionsIcon}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactRow}>
              {merchant.phone && (
                <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                  <Text style={styles.contactIcon}>📞</Text>
                  <Text style={styles.contactLabel}>Call</Text>
                </TouchableOpacity>
              )}
              {merchant.email && (
                <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                  <Text style={styles.contactIcon}>✉️</Text>
                  <Text style={styles.contactLabel}>Email</Text>
                </TouchableOpacity>
              )}
              {merchant.website && (
                <TouchableOpacity style={styles.contactButton} onPress={handleWebsite}>
                  <Text style={styles.contactIcon}>🌐</Text>
                  <Text style={styles.contactLabel}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Social Links */}
          {merchant.socialLinks && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Follow Us</Text>
              <View style={styles.socialRow}>
                {merchant.socialLinks.instagram && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.socialIcon}>📸</Text>
                    <Text style={styles.socialLabel}>Instagram</Text>
                  </TouchableOpacity>
                )}
                {merchant.socialLinks.facebook && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.socialIcon}>👍</Text>
                    <Text style={styles.socialLabel}>Facebook</Text>
                  </TouchableOpacity>
                )}
                {merchant.socialLinks.twitter && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.socialIcon}>🐦</Text>
                    <Text style={styles.socialLabel}>Twitter</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Opening Hours */}
          {merchant.openingHours && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opening Hours</Text>
              <View style={styles.hoursContainer}>
                {Object.entries(merchant.openingHours).map(([day, hours]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    <Text style={styles.hoursTime}>
                      {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Amenities */}
          {merchant.amenities && merchant.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {merchant.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Book Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>View Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  heroContainer: {
    width: width,
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.tint.slate,
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.tint.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.text.primary,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  content: {
    marginTop: -spacing.xl,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
    minHeight: 400,
  },
  header: {
    marginBottom: spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  merchantName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: colors.successScale[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  industryLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  ratingStar: {
    fontSize: 14,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  priceRange: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.tint.slate,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconText: {
    fontSize: 20,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  locationSubtext: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  directionsIcon: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactIcon: {
    fontSize: 24,
  },
  contactLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  socialIcon: {
    fontSize: 24,
  },
  socialLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  hoursContainer: {
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  hoursDay: {
    fontSize: 14,
    color: colors.text.primary,
  },
  hoursTime: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityItem: {
    backgroundColor: colors.tint.slate,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  amenityText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
    marginBottom: spacing['3xl'],
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.tint.slate,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
