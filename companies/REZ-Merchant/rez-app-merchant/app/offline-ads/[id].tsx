/**
 * Offline Ad Details Screen
 *
 * Displays detailed information about a single offline ad:
 * - QR codes for each location
 * - Scan and view analytics
 * - Location management
 * - Ad status controls
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/Colors';
import { useMerchant } from '@/contexts/MerchantContext';
import { offlineAdsService, OfflineAd, AdType, AdStatus, ScanEvent } from '@/services/offlineAdsService';
import { logger } from '@/utils/logger';

// Ad type configuration
const AD_TYPE_CONFIG: Record<AdType, { label: string; icon: string }> = {
  rickshaw: { label: 'Rickshaw', icon: 'car-outline' },
  bus: { label: 'Bus', icon: 'bus-outline' },
  hoarding: { label: 'Hoarding', icon: 'albums-outline' },
  billboard: { label: 'Billboard', icon: 'grid-outline' },
};

// Status configuration
const STATUS_CONFIG: Record<AdStatus, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: '#d1fae5', text: '#059669' },
  paused: { label: 'Paused', bg: '#fef3c7', text: '#d97706' },
  completed: { label: 'Completed', bg: '#dbeafe', text: '#1d4ed8' },
  draft: { label: 'Draft', bg: '#f3f4f6', text: '#6b7280' },
};

export default function AdDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { merchant } = useMerchant();

  const [ad, setAd] = useState<OfflineAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQRLocation, setSelectedQRLocation] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanEvent[]>([]);
  const [analytics, setAnalytics] = useState({
    todayScans: 0,
    weekScans: 0,
    monthScans: 0,
    avgDailyScans: 0,
  });

  const merchantId = merchant?._id || '';
  const qrRef = useRef<unknown>(null);

  const fetchAdDetails = useCallback(async () => {
    if (!id || !merchantId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await offlineAdsService.getOfflineAd(merchantId, id);
      if (result.success && result.data) {
        setAd(result.data);

        // Calculate analytics
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayScans = result.data.scanHistory?.filter(
          (s) => new Date(s.timestamp) >= today
        ).length || 0;

        const weekScans = result.data.scanHistory?.filter(
          (s) => new Date(s.timestamp) >= weekAgo
        ).length || 0;

        const monthScans = result.data.scanHistory?.filter(
          (s) => new Date(s.timestamp) >= monthAgo
        ).length || 0;

        setAnalytics({
          todayScans,
          weekScans,
          monthScans,
          avgDailyScans: monthScans / 30,
        });

        setScanHistory(result.data.scanHistory || []);
      } else {
        setError(result.error || 'Failed to load ad details');
      }
    } catch (err) {
      logger.error('[AdDetails] Error:', err);
      setError(err?.message || 'Failed to load ad details');
    } finally {
      setLoading(false);
    }
  }, [id, merchantId]);

  useEffect(() => {
    fetchAdDetails();
  }, [fetchAdDetails]);

  const handleShareQR = useCallback(async () => {
    if (!ad || !selectedQRLocation) return;

    const qrData = JSON.stringify({
      adId: ad.id || ad._id,
      location: selectedQRLocation,
      merchantId,
      action: 'offline_ad_scan',
    });

    try {
      await Share.share({
        message: `Scan this QR code to view the ad at ${selectedQRLocation}!`,
        title: `${ad.title} - ${selectedQRLocation}`,
        url: `https://rez.money/scan?data=${encodeURIComponent(qrData)}`,
      });
    } catch {
      // User cancelled
    }
  }, [ad, selectedQRLocation, merchantId]);

  const handleToggleStatus = useCallback(() => {
    if (!ad) return;

    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'pause';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Ad`,
      `Are you sure you want to ${action} this ad?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const result = await offlineAdsService.updateOfflineAd(merchantId, ad.id || ad._id!, {
                status: newStatus,
              });
              if (result.success) {
                setAd((prev) => (prev ? { ...prev, status: newStatus } : null));
              }
            } catch (err) {
              Alert.alert('Error', err?.message || `Failed to ${action} ad`);
            }
          },
        },
      ]
    );
  }, [ad, merchantId]);

  const handleDeleteAd = useCallback(() => {
    if (!ad) return;

    Alert.alert(
      'Delete Ad',
      `Are you sure you want to delete "${ad.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await offlineAdsService.deleteOfflineAd(merchantId, ad.id || ad._id!);
              if (result.success) {
                router.back();
              }
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete ad');
            }
          },
        },
      ]
    );
  }, [ad, merchantId]);

  const generateQRData = (location: string) => {
    if (!ad) return '';
    return JSON.stringify({
      adId: ad.id || ad._id,
      location,
      merchantId,
      title: ad.title,
      type: ad.type,
      attachedOffer: ad.attachedOffer,
      action: 'offline_ad_scan',
      timestamp: new Date().toISOString(),
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading ad details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !ad) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.light.danger} />
        <Text style={styles.errorTitle}>Failed to load ad</Text>
        <Text style={styles.errorText}>{error || 'Ad not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAdDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const typeConfig = AD_TYPE_CONFIG[ad.type] || AD_TYPE_CONFIG.rickshaw;
  const statusConfig = STATUS_CONFIG[ad.status] || STATUS_CONFIG.draft;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.typeIconContainer}>
              <Ionicons name={typeConfig.icon as unknown} size={28} color={Colors.light.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.adTitle}>{ad.title}</Text>
              <Text style={styles.adType}>{typeConfig.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {ad.description && (
            <Text style={styles.description}>{ad.description}</Text>
          )}

          {ad.attachedOffer && (
            <View style={styles.offerBadge}>
              <Ionicons name="gift" size={16} color={Colors.light.secondary} />
              <Text style={styles.offerText}>{ad.attachedOffer}</Text>
            </View>
          )}

          <View style={styles.dateInfo}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.light.icon} />
              <Text style={styles.dateLabel}>Start:</Text>
              <Text style={styles.dateValue}>{formatDate(ad.startDate)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.light.icon} />
              <Text style={styles.dateLabel}>End:</Text>
              <Text style={styles.dateValue}>{formatDate(ad.endDate)}</Text>
            </View>
          </View>
        </View>

        {/* Analytics Card */}
        <View style={styles.analyticsCard}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{ad.scanCount?.toLocaleString() || 0}</Text>
              <Text style={styles.analyticsLabel}>Total Scans</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{ad.viewCount?.toLocaleString() || 0}</Text>
              <Text style={styles.analyticsLabel}>Total Views</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.todayScans}</Text>
              <Text style={styles.analyticsLabel}>Today</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.weekScans}</Text>
              <Text style={styles.analyticsLabel}>This Week</Text>
            </View>
          </View>

          <View style={styles.conversionRow}>
            <View style={styles.conversionItem}>
              <Text style={styles.conversionValue}>
                {ad.scanCount && ad.viewCount && ad.viewCount > 0
                  ? ((ad.scanCount / ad.viewCount) * 100).toFixed(1)
                  : '0'}%
              </Text>
              <Text style={styles.conversionLabel}>Scan Rate</Text>
            </View>
            <View style={styles.conversionItem}>
              <Text style={styles.conversionValue}>
                {analytics.avgDailyScans.toFixed(1)}
              </Text>
              <Text style={styles.conversionLabel}>Avg Daily</Text>
            </View>
            <View style={styles.conversionItem}>
              <Text style={styles.conversionValue}>{ad.locations?.length || 0}</Text>
              <Text style={styles.conversionLabel}>Locations</Text>
            </View>
          </View>
        </View>

        {/* QR Codes Section */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>QR Codes</Text>
          <Text style={styles.sectionSubtitle}>
            Scan these QR codes to view the ad at each location
          </Text>

          <View style={styles.qrGrid}>
            {ad.locations?.map((location) => (
              <TouchableOpacity
                key={location}
                style={styles.qrCard}
                onPress={() => {
                  setSelectedQRLocation(location);
                  setShowQRModal(true);
                }}
              >
                <View style={styles.qrPreview}>
                  <Ionicons name="qr-code" size={40} color={Colors.light.primary} />
                </View>
                <Text style={styles.qrLocation} numberOfLines={2}>
                  {location}
                </Text>
                <View style={styles.qrScanCount}>
                  <Ionicons name="scan-outline" size={12} color={Colors.light.icon} />
                  <Text style={styles.qrScanCountText}>
                    {scanHistory.filter((s) => s.location === location).length} scans
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Locations List */}
        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.locationsList}>
            {ad.locations?.map((location, index) => (
              <View key={location} style={styles.locationItem}>
                <View style={styles.locationNumber}>
                  <Text style={styles.locationNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location}</Text>
                  <Text style={styles.locationScans}>
                    {scanHistory.filter((s) => s.location === location).length} scans
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.locationQRButton}
                  onPress={() => {
                    setSelectedQRLocation(location);
                    setShowQRModal(true);
                  }}
                >
                  <Ionicons name="qr-code-outline" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <View style={styles.recentScansSection}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {scanHistory.slice(0, 10).map((scan, index) => (
              <View key={scan.id || index} style={styles.scanItem}>
                <View style={styles.scanIcon}>
                  <Ionicons name="scan" size={18} color={Colors.light.primary} />
                </View>
                <View style={styles.scanInfo}>
                  <Text style={styles.scanLocation}>{scan.location}</Text>
                  <Text style={styles.scanTime}>{formatDateTime(scan.timestamp)}</Text>
                </View>
                {scan.deviceInfo && (
                  <View style={styles.scanDevice}>
                    <Ionicons name="phone-portrait-outline" size={14} color={Colors.light.icon} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={handleToggleStatus}
          >
            <Ionicons
              name={ad.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={22}
              color="#fff"
            />
            <Text style={styles.actionButtonText}>
              {ad.status === 'active' ? 'Pause Ad' : 'Activate Ad'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAd}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.light.danger} />
            <Text style={[styles.actionButtonText, { color: Colors.light.danger }]}>
              Delete Ad
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        {ad.terms && (
          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{ad.terms}</Text>
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>QR Code</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedQRLocation && (
              <>
                <Text style={styles.modalLocation}>{selectedQRLocation}</Text>

                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={generateQRData(selectedQRLocation)}
                    size={250}
                    color="#1a3a52"
                    backgroundColor="#ffffff"
                    getRef={(ref) => (qrRef.current = ref)}
                  />
                </View>

                <Text style={styles.qrInstruction}>
                  Scan this QR code to view the advertisement
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalShareButton}
                    onPress={handleShareQR}
                  >
                    <Ionicons name="share-social" size={20} color="#fff" />
                    <Text style={styles.modalShareButtonText}>Share QR Code</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.scanStatsContainer}>
                  <View style={styles.scanStatItem}>
                    <Text style={styles.scanStatValue}>
                      {scanHistory.filter((s) => s.location === selectedQRLocation).length}
                    </Text>
                    <Text style={styles.scanStatLabel}>Total Scans</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.icon,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  adType: {
    fontSize: 13,
    color: Colors.light.icon,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 16,
    lineHeight: 20,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.successLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  offerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  dateInfo: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  analyticsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.icon,
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  analyticsItem: {
    width: '47%',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  analyticsLabel: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 4,
  },
  conversionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  conversionItem: {
    flex: 1,
    alignItems: 'center',
  },
  conversionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  conversionLabel: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  qrSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  qrCard: {
    width: '30%',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  qrPreview: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrLocation: {
    fontSize: 10,
    color: Colors.light.textHeading,
    textAlign: 'center',
    fontWeight: '500',
  },
  qrScanCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  qrScanCountText: {
    fontSize: 9,
    color: Colors.light.icon,
  },
  locationsSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  locationsList: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  locationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    color: Colors.light.textHeading,
    fontWeight: '500',
  },
  locationScans: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  locationQRButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentScansSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  scanIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  scanLocation: {
    fontSize: 14,
    color: Colors.light.textHeading,
    fontWeight: '500',
  },
  scanTime: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  scanDevice: {
    marginLeft: 8,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  statusButton: {
    backgroundColor: Colors.light.primary,
  },
  deleteButton: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  termsSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  termsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  modalLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  qrInstruction: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginTop: 24,
  },
  modalActions: {
    marginTop: 24,
    width: '100%',
  },
  modalShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  modalShareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  scanStatsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 24,
  },
  scanStatItem: {
    alignItems: 'center',
  },
  scanStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  scanStatLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
});
