import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/services/api/client';
import { Colors } from '@/constants/Colors';

// react-native-qrcode-svg is in package.json — import it
import QRCode from 'react-native-qrcode-svg';

// react-native-view-shot — optional, use if installed
let ViewShot: unknown = null;
let captureRef: ((ref, options?) => Promise<string>) | null = null;
try {
  const vs = require('react-native-view-shot');
  ViewShot = vs.default ?? vs.ViewShot;
  captureRef = vs.captureRef;
} catch {
  // not installed — download button will be a no-op with comment
}

// expo-sharing is in package.json
import * as ExpoSharing from 'expo-sharing';

interface StoreProfile {
  _id: string;
  name: string;
  slug?: string;
}

export default function QRGeneratorScreen() {
  const router = useRouter();
  const qrContainerRef = useRef<unknown>(null);

  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchStoreProfile();
  }, []);

  const fetchStoreProfile = async () => {
    try {
      const res = await apiClient.get<StoreProfile>('merchant/store-profile');
      if (res.data) {
        setStoreProfile(res.data);
      }
    } catch {
      // handled via empty state below
    } finally {
      setLoading(false);
    }
  };

  const checkinUrl = storeProfile ? `https://rez.money/checkin?storeId=${storeProfile._id}` : '';

  const qrData = storeProfile
    ? JSON.stringify({ storeId: storeProfile._id, action: 'checkin' })
    : '';

  const handleShare = async () => {
    if (!storeProfile) return;
    try {
      await Share.share({
        message: `Scan to check in at ${storeProfile.name} and earn REZ coins!\n${checkinUrl}`,
        title: `${storeProfile.name} — REZ Check-in`,
        url: checkinUrl,
      });
    } catch {
      // user cancelled share sheet
    }
  };

  const handlePreviewWebMenu = async () => {
    if (!storeProfile) return;
    // Use slug if available, otherwise use store ID
    const slug = storeProfile.slug || storeProfile._id;
    const webMenuBase = process.env.EXPO_PUBLIC_WEB_MENU_URL || 'https://menu.rez.money';
    const previewUrl = `${webMenuBase}/${slug}`;
    const canOpen = await Linking.canOpenURL(previewUrl);
    if (canOpen) {
      await Linking.openURL(previewUrl);
    }
  };

  const handleDownload = async () => {
    if (!captureRef || !qrContainerRef.current) {
      // react-native-view-shot not installed — cannot capture
      return;
    }
    setDownloading(true);
    try {
      const uri = await captureRef(qrContainerRef, { format: 'png', quality: 1.0 });
      const canShare = await ExpoSharing.isAvailableAsync();
      if (canShare) {
        await ExpoSharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2d5a7b" />
          </View>
        ) : !storeProfile ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textMuted} />
            <Text style={styles.errorText}>Could not load store info</Text>
          </View>
        ) : (
          <>
            <Text style={styles.storeName}>{storeProfile.name}</Text>

            {/* QR display card — wrapped in ref for optional view-shot capture */}
            <View ref={qrContainerRef} style={styles.qrCard} collapsable={false}>
              <QRCode value={qrData} size={220} color="#1a3a52" backgroundColor="#ffffff" />
            </View>

            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
              <Text style={styles.instructionText}>
                Display this QR code at your counter for customers to scan and earn coins
              </Text>
            </View>

            <Text style={styles.urlLabel}>Check-in URL</Text>
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={2}>
                {checkinUrl}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.actionBtnOutline,
                  !captureRef && styles.actionBtnDisabled,
                ]}
                onPress={handleDownload}
                disabled={!captureRef || downloading}
                activeOpacity={0.8}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#2d5a7b" />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={captureRef ? '#2d5a7b' : Colors.light.textMuted}
                    />
                    <Text
                      style={[
                        styles.actionBtnTextOutline,
                        !captureRef && styles.actionBtnTextDisabled,
                      ]}
                    >
                      Download
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {storeProfile && (
              <View style={[styles.actionRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={handlePreviewWebMenu}
                >
                  <Ionicons name="eye-outline" size={18} color="#2d5a7b" />
                  <Text style={styles.actionBtnTextOutline}>Preview Web Menu</Text>
                </TouchableOpacity>
              </View>
            )}

            {!captureRef && (
              <Text style={styles.downloadHint}>
                Install react-native-view-shot to enable QR image download
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  center: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textMuted,
  },

  storeName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textHeading,
    textAlign: 'center',
  },

  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },

  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 19,
  },

  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },
  urlBox: {
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  urlText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2d5a7b',
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnOutline: {
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: '#2d5a7b',
  },
  actionBtnDisabled: {
    borderColor: Colors.light.border,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnTextOutline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d5a7b',
  },
  actionBtnTextDisabled: {
    color: Colors.light.textMuted,
  },

  downloadHint: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
