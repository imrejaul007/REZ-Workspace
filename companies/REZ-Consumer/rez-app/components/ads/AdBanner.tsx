// @ts-nocheck
import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Linking,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import adsService, { AdUnit } from '@/services/adsApi';

const { width: screenWidth } = Dimensions.get('window');
const PADDING = 16;
const CARD_WIDTH = screenWidth - PADDING * 2;

interface AdBannerProps {
  placement: string;
  style?: ViewStyle;
}

function AdBanner({ placement, style }: AdBannerProps) {
  const router = useRouter();
  const [ad, setAd] = useState<AdUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      setLoading(true);
      const result = await adsService.fetchAd(placement);
      if (!cancelled) {
        setAd(result);
        setLoading(false);
        if (result) {
          // Fire-and-forget impression tracking
          adsService.trackImpression(result._id);
        }
      }
    }

    loadAd();

    return () => {
      cancelled = true;
    };
  }, [placement]);

  const handlePress = async () => {
    if (!ad) return;
    adsService.trackClick(ad._id);

    if (ad.ctaUrl) {
      if (ad.ctaUrl.startsWith('https://') || ad.ctaUrl.startsWith('http://')) {
        try {
          await Linking.openURL(ad.ctaUrl);
        } catch {
          // URL could not be opened — silently ignore
        }
      } else {
        // Treat as internal deep link
        router.push(ad.ctaUrl as unknown);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { width: CARD_WIDTH }, style]}>
        <ActivityIndicator size="small" color="#f59e0b" />
      </View>
    );
  }

  if (!ad) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[styles.card, { width: CARD_WIDTH }, style]}
      accessibilityRole="button"
      accessibilityLabel={`Sponsored: ${ad.headline}`}
    >
      {/* Top-left AD badge */}
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>AD</Text>
      </View>

      {/* Top-right Sponsored label */}
      <Text style={styles.sponsoredLabel}>Sponsored</Text>

      {/* Ad image */}
      {ad.imageUrl && !imageError ? (
        <Image
          source={{ uri: ad.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.imageFallback} />
      )}

      {/* Text content */}
      <View style={styles.content}>
        <Text style={styles.headline} numberOfLines={2}>
          {ad.headline}
        </Text>
        <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
          {ad.description}
        </Text>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handlePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={ad.ctaText}
        >
          <Text style={styles.ctaText}>{ad.ctaText}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignSelf: 'center',
    marginHorizontal: PADDING,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    alignSelf: 'center',
    marginHorizontal: PADDING,
    backgroundColor: '#252547',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 8,
  },
  adBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sponsoredLabel: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '400',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#1a1a2e',
  },
  imageFallback: {
    width: '100%',
    height: 160,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 12,
  },
  headline: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaText: {
    color: '#1a1a2e',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default memo(AdBanner);
