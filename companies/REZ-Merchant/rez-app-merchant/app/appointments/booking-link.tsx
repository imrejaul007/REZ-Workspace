import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
  Platform,
  Clipboard,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

import QRCode from 'react-native-qrcode-svg';

interface StoreProfile {
  _id: string;
  name: string;
  slug?: string;
}

export default function BookingLinkScreen() {
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await apiClient.get<StoreProfile>('merchant/store-profile');
      if (res.data) setStoreProfile(res.data);
    } catch {
      // empty state handles this
    } finally {
      setLoading(false);
    }
  };

  const bookingUrl = storeProfile ? `https://rez.money/book/${storeProfile._id}` : '';

  const handleCopy = () => {
    if (!bookingUrl) return;
    Clipboard.setString(bookingUrl);
    setCopied(true);
    Toast.show({ type: 'success', text1: 'Link copied to clipboard' });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!storeProfile) return;
    try {
      await Share.share({
        message: `Book an appointment at ${storeProfile.name}!\n${bookingUrl}`,
        title: `Book at ${storeProfile.name}`,
        url: bookingUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const instagramCaption = storeProfile
    ? `Book your appointment at ${storeProfile.name} directly online!\n\nLink in bio: ${bookingUrl}\n\n#booking #appointments #${storeProfile.name.replace(/\s+/g, '')}`
    : '';

  const whatsappMessage = storeProfile
    ? `Hi! You can now book your appointment at ${storeProfile.name} online:\n${bookingUrl}`
    : '';

  const handleCopyCaption = (text: string, label: string) => {
    Clipboard.setString(text);
    Toast.show({ type: 'success', text1: `${label} copied` });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Public Booking Link</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : !storeProfile ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textSecondary} />
          <ThemedText style={styles.errorText}>Could not load store info</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.storeName}>{storeProfile.name}</ThemedText>

          {/* QR Code */}
          <View style={styles.qrCard}>
            <QRCode value={bookingUrl} size={220} color="#1a3a52" backgroundColor="#ffffff" />
          </View>

          {/* Instructions */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
            <ThemedText style={styles.infoText}>
              Add this link to your Instagram bio, Google Business profile, or website so customers
              can book directly.
            </ThemedText>
          </View>

          {/* URL display */}
          <ThemedText style={styles.sectionLabel}>Your Booking URL</ThemedText>
          <View style={styles.urlCard}>
            <ThemedText style={styles.urlText} numberOfLines={2}>
              {bookingUrl}
            </ThemedText>
          </View>

          {/* Primary actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color="#fff" />
              <ThemedText style={styles.actionBtnText}>
                {copied ? 'Copied!' : 'Copy Link'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={20} color={Colors.light.primary} />
              <ThemedText style={[styles.actionBtnText, { color: Colors.light.primary }]}>
                Share
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Social copy-paste section */}
          <ThemedText style={styles.sectionLabel}>Social Media Templates</ThemedText>

          {/* Instagram */}
          <View style={styles.socialCard}>
            <View style={styles.socialHeader}>
              <View style={styles.socialBadge}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <ThemedText style={[styles.socialName, { color: '#E1306C' }]}>
                  Instagram Caption
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => handleCopyCaption(instagramCaption, 'Instagram caption')}
                style={styles.copyBtn}
              >
                <Ionicons name="copy-outline" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.copyBtnText}>Copy</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.socialPreview}>{instagramCaption}</ThemedText>
          </View>

          {/* WhatsApp */}
          <View style={styles.socialCard}>
            <View style={styles.socialHeader}>
              <View style={styles.socialBadge}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <ThemedText style={[styles.socialName, { color: '#25D366' }]}>
                  WhatsApp Message
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => handleCopyCaption(whatsappMessage, 'WhatsApp message')}
                style={styles.copyBtn}
              >
                <Ionicons name="copy-outline" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.copyBtnText}>Copy</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.socialPreview}>{whatsappMessage}</ThemedText>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 15, color: Colors.light.textSecondary },
  scroll: { padding: 20, alignItems: 'center', gap: 16, paddingBottom: 48 },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: -8,
  },
  urlCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  urlText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  actionBtnPrimary: { backgroundColor: Colors.light.primary },
  actionBtnOutline: {
    backgroundColor: Colors.light.background,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  socialCard: {
    width: '100%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  socialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  socialBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socialName: { fontSize: 13, fontWeight: '700' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyBtnText: { fontSize: 13, color: Colors.light.primary, fontWeight: '600' },
  socialPreview: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
});
