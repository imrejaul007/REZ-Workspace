/**
 * Social Booking Integrations Settings Screen
 * Allows merchants to configure their booking page links for Instagram,
 * Google My Business, and Facebook so clients can book directly from social media.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { storageService } from '@/services/storage';
import { useStore } from '@/contexts/StoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformConfig {
  key: 'instagram' | 'google' | 'facebook';
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  placeholder: string;
}

interface SocialBookingLinks {
  instagram: string;
  google: string;
  facebook: string;
}

const STORAGE_KEY = 'social_booking_links';

const PLATFORMS: PlatformConfig[] = [
  {
    key: 'instagram',
    name: 'Instagram',
    description: "Clients can tap 'Book' on your Instagram profile",
    icon: 'logo-instagram',
    iconColor: '#E1306C',
    placeholder: 'https://...',
  },
  {
    key: 'google',
    name: 'Google My Business',
    description: 'Let customers book from your Google Business listing',
    icon: 'logo-google',
    iconColor: '#4285F4',
    placeholder: 'https://...',
  },
  {
    key: 'facebook',
    name: 'Facebook',
    description: "Add a 'Book Now' button to your Facebook page",
    icon: 'logo-facebook',
    iconColor: '#1877F2',
    placeholder: 'https://...',
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SocialBookingScreen() {
  const { activeStore } = useStore();

  const storeId = activeStore?._id ?? 'your-store';
  const rezBookingLink = `https://rez.money/book/${storeId}`;

  const [links, setLinks] = useState<SocialBookingLinks>({
    instagram: '',
    google: '',
    facebook: '',
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Toast
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      toastOpacity.setValue(1);
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    },
    [toastOpacity]
  );

  // Load saved links on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await storageService.get<SocialBookingLinks>(STORAGE_KEY);
        if (saved) {
          setLinks(saved);
        }
      } catch {
        // Non-critical — use defaults
      }
    })();
  }, []);

  const handleSave = useCallback(
    async (platform: PlatformConfig['key']) => {
      if (saving) return;
      setSaving(platform);
      try {
        const updated = { ...links };
        await storageService.set(STORAGE_KEY, updated);
        showToast('Link saved');
      } catch {
        Alert.alert('Error', 'Failed to save link. Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [links, saving, showToast]
  );

  const handleCopyLink = useCallback(() => {
    // Clipboard API — use Alert fallback since @react-native-clipboard/clipboard
    // is not in the dependencies. Show the link in an Alert with select-all hint.
    Alert.alert('Your REZ Booking Link', rezBookingLink, [{ text: 'Close', style: 'cancel' }]);
    setCopied(true);
    showToast('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [rezBookingLink, showToast]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Social Booking</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Let clients book directly from your social media profiles
        </Text>

        {/* REZ Booking Link section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={15} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>YOUR REZ BOOKING LINK</Text>
          </View>
          <View style={styles.bookingLinkRow}>
            <Text style={styles.bookingLinkUrl} numberOfLines={1}>
              {rezBookingLink}
            </Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnActive]}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copied ? Colors.light.success : Colors.light.primary}
              />
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bookingLinkHint}>
            Share this link on your social profiles so clients can book directly.
          </Text>
        </View>

        {/* Platform cards */}
        <Text style={styles.cardsLabel}>Connect Your Profiles</Text>

        {PLATFORMS.map((platform) => {
          const url = links[platform.key];
          const isConnected = url.trim().length > 0;
          const isSaving = saving === platform.key;

          return (
            <View key={platform.key} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View
                  style={[styles.platformIconBg, { backgroundColor: `${platform.iconColor}18` }]}
                >
                  <Ionicons name={platform.icon} size={24} color={platform.iconColor} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  <Text style={styles.platformDescription}>{platform.description}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    isConnected ? styles.badgeConnected : styles.badgeNotConfigured,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isConnected ? styles.badgeTextConnected : styles.badgeTextNotConfigured,
                    ]}
                  >
                    {isConnected ? 'Connected' : 'Not configured'}
                  </Text>
                </View>
              </View>

              {/* URL Input */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={platform.placeholder}
                  placeholderTextColor={Colors.light.textMuted}
                  value={url}
                  onChangeText={(text) => setLinks((prev) => ({ ...prev, [platform.key]: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  editable={!isSaving}
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={() => handleSave(platform.key)}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isSaving ? 'hourglass-outline' : 'save-outline'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={18} color={Colors.light.success} />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },

  // REZ booking link section
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    backgroundColor: Colors.light.primaryLight2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bookingLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 8,
  },
  bookingLinkUrl: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textDark,
    fontFamily: 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  copyBtnActive: {
    borderColor: Colors.light.success,
    backgroundColor: Colors.light.successLight,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  copyBtnTextActive: {
    color: Colors.light.success,
  },
  bookingLinkHint: {
    fontSize: 12,
    color: Colors.light.textMuted,
    paddingHorizontal: 14,
    paddingBottom: 14,
    lineHeight: 18,
  },

  // Platform cards
  cardsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  platformIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  platformDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeConnected: {
    backgroundColor: Colors.light.successLight,
  },
  badgeNotConfigured: {
    backgroundColor: Colors.light.backgroundTertiary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextConnected: {
    color: Colors.light.success,
  },
  badgeTextNotConfigured: {
    color: Colors.light.textMuted,
  },
  inputRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 14,
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.light.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
