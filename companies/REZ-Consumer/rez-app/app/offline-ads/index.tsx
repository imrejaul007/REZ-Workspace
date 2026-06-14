/**
 * Offline Ads Consumer Screen
 *
 * Handles scanning QR codes from offline advertisements
 * (rickshaw, bus, hoarding, billboard ads)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';
import { ThemedText } from '@/components/ThemedText';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

interface ScannedAd {
  id: string;
  title: string;
  description?: string;
  type: 'rickshaw' | 'bus' | 'hoarding' | 'billboard';
  merchantName: string;
  merchantImage?: string;
  location: string;
  offer?: {
    title: string;
    description: string;
    discount: number;
    code?: string;
    expiresAt: string;
  };
  scannedAt: string;
}

const AD_TYPE_LABELS: Record<string, string> = {
  rickshaw: 'Rickshaw',
  bus: 'Bus',
  hoarding: 'Hoarding',
  billboard: 'Billboard',
};

export default function OfflineAdsIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [scannedAd, setScannedAd] = useState<ScannedAd | null>(null);
  const [recentScans, setRecentScans] = useState<ScannedAd[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Handle deep link parameters
  useEffect(() => {
    if (params.adId) {
      handleScan(params.adId as string, params.location as string);
    }
  }, [params]);

  const handleScan = async (adId: string, location?: string) => {
    setLoading(true);
    try {
      // Track the scan with the backend
      const response = await apiClient.post('/offline-ads/scan', {
        adId,
        location: location || 'Unknown',
      });

      if (response.success && response.data) {
        setScannedAd(response.data as ScannedAd);
        // Add to recent scans
        setRecentScans(prev => [
          response.data as ScannedAd,
          ...prev.filter(s => s.id !== adId)
        ].slice(0, 10));
      }
    } catch (error) {
      logger.error('[OfflineAds] Scan error:', error);
      Alert.alert('Scan Failed', 'Could not process this QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (scannedAd?.offer?.code) {
      await Clipboard.setStringAsync(scannedAd.offer.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      Alert.alert('Copied!', 'Offer code copied to clipboard');
    }
  };

  const handleViewOffer = () => {
    if (scannedAd?.offer) {
      router.push({
        pathname: '/offers/[id]',
        params: { id: scannedAd.id },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Scan Ad
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Scanner Prompt */}
        <View style={styles.scannerSection}>
          <View style={styles.scannerIcon}>
            <Ionicons name="qr-code-outline" size={64} color={Colors.primary} />
          </View>
          <ThemedText type="title" style={styles.scannerTitle}>
            Scan QR Code
          </ThemedText>
          <ThemedText type="caption" style={styles.scannerSubtitle}>
            Point your camera at a QR code on unknown ReZ advertisement
          </ThemedText>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/qr-checkin')}
          >
            <Ionicons name="camera-outline" size={20} color="#FFF" />
            <Text style={styles.scanButtonText}>Open Scanner</Text>
          </TouchableOpacity>
        </View>

        {/* Ad Types */}
        <View style={styles.adTypesSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Ad Types
          </ThemedText>
          <View style={styles.adTypesGrid}>
            {[
              { type: 'rickshaw', icon: 'car-outline', label: 'Rickshaw Ads' },
              { type: 'bus', icon: 'bus-outline', label: 'Bus Ads' },
              { type: 'hoarding', icon: 'albums-outline', label: 'Hoardings' },
              { type: 'billboard', icon: 'grid-outline', label: 'Billboards' },
            ].map((item) => (
              <TouchableOpacity
                key={item.type}
                style={styles.adTypeCard}
                onPress={() => router.push(`/offline-ads?type=${item.type}`)}
              >
                <View style={styles.adTypeIcon}>
                  <Ionicons name={item.icon as unknown} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.adTypeLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scanned Offer */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText type="caption" style={styles.loadingText}>
              Loading offer...
            </ThemedText>
          </View>
        ) : scannedAd ? (
          <View style={styles.offerSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Your Offer
            </ThemedText>
            <View style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.adTypeBadge}>
                  <Ionicons
                    name={
                      scannedAd.type === 'rickshaw' ? 'car-outline' :
                      scannedAd.type === 'bus' ? 'bus-outline' :
                      scannedAd.type === 'hoarding' ? 'albums-outline' : 'grid-outline'
                    }
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.adTypeBadgeText}>
                    {AD_TYPE_LABELS[scannedAd.type]} Ad
                  </Text>
                </View>
                <View style={styles.locationBadge}>
                  <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.locationText}>{scannedAd.location}</Text>
                </View>
              </View>

              <Text style={styles.offerTitle}>{scannedAd.offer?.title}</Text>
              <Text style={styles.offerDescription}>
                {scannedAd.offer?.description}
              </Text>

              {scannedAd.offer?.code && (
                <TouchableOpacity
                  style={styles.codeContainer}
                  onPress={handleCopyCode}
                >
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{scannedAd.offer.code}</Text>
                  </View>
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                    <Ionicons
                      name={copiedCode ? 'checkmark' : 'copy-outline'}
                      size={18}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {scannedAd.offer?.discount}% OFF
                </Text>
              </View>

              <Text style={styles.merchantName}>
                at {scannedAd.merchantName}
              </Text>

              {scannedAd.offer?.expiresAt && (
                <Text style={styles.expiryText}>
                  Valid until {new Date(scannedAd.offer.expiresAt).toLocaleDateString()}
                </Text>
              )}

              <TouchableOpacity
                style={styles.viewOfferButton}
                onPress={handleViewOffer}
              >
                <Text style={styles.viewOfferText}>View Offer Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <View style={styles.recentScansSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Recent Scans
            </ThemedText>
            {recentScans.map((scan, index) => (
              <TouchableOpacity
                key={`${scan.id}-${index}`}
                style={styles.recentScanCard}
                onPress={() => setScannedAd(scan)}
              >
                <View style={styles.recentScanInfo}>
                  <Text style={styles.recentScanTitle}>{scan.offer?.title}</Text>
                  <Text style={styles.recentScanMerchant}>
                    {scan.merchantName} - {AD_TYPE_LABELS[scan.type]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scannerSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  scannerIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  scannerSubtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  scanButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  adTypesSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  adTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  adTypeCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  adTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  adTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  offerSection: {
    padding: Spacing.lg,
  },
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  adTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adTypeBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  offerDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  codeBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  merchantName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  expiryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  viewOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  viewOfferText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  recentScansSection: {
    padding: Spacing.lg,
  },
  recentScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recentScanInfo: {
    flex: 1,
  },
  recentScanTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  recentScanMerchant: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
