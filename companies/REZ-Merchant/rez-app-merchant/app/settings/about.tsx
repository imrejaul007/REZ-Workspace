/**
 * Sprint 15: App Info / About Screen
 * Shows app version, build number, support contact, legal links,
 * rate-the-app button, and share-app button.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants, { PlatformManifest } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/ThemedText';

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER =
  String(
    (Constants.expoConfig?.ios as PlatformManifest)?.buildNumber ??
    (Constants.expoConfig?.android as PlatformManifest)?.versionCode ??
    1
  );

const SUPPORT_EMAIL = 'support@rezapp.com';
const PRIVACY_POLICY_URL = 'https://rezapp.com/privacy';
const TERMS_URL = 'https://rezapp.com/terms';

// App Store / Play Store IDs — update with real IDs before release
const IOS_APP_ID = '0000000000';
const ANDROID_PACKAGE = 'com.rez.merchant';

const APP_STORE_URL =
  Platform.OS === 'ios'
    ? `https://apps.apple.com/app/id${IOS_APP_ID}`
    : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

// ─── Row Component ────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
}

function InfoRow({ icon, iconColor, label, value, onPress, chevron, last }: InfoRowProps) {
  const Inner = (
    <View style={[rowStyles.row, last && rowStyles.rowLast]}>
      <View style={[rowStyles.iconBg, { backgroundColor: `${iconColor}1A` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <ThemedText style={rowStyles.label}>{label}</ThemedText>
      <View style={rowStyles.rightWrap}>
        {value ? <ThemedText style={rowStyles.value}>{value}</ThemedText> : null}
        {chevron ? <Ionicons name="chevron-forward" size={18} color="#9CA3AF" /> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {Inner}
      </TouchableOpacity>
    );
  }
  return Inner;
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const handleOpenBrowser = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support - REZ Merchant App v${APP_VERSION}`);
  };

  const handleRateApp = () => {
    Linking.openURL(APP_STORE_URL);
  };

  const handleShareApp = async () => {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      // Fallback: copy link via Linking
      Linking.openURL(APP_STORE_URL);
      return;
    }
    // expo-sharing requires a file URI; for sharing a URL we use the Share API
    const { Share } = await import('react-native');
    Share.share({
      title: 'REZ Merchant App',
      message: `Manage your store on the go with the REZ Merchant App!\n${APP_STORE_URL}`,
      url: APP_STORE_URL,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <ThemedText style={styles.navTitle}>About</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* App Logo / Branding */}
        <View style={styles.brandSection}>
          <View style={styles.appIcon}>
            <Ionicons name="storefront" size={40} color="#fff" />
          </View>
          <ThemedText style={styles.appName}>REZ Merchant</ThemedText>
          <ThemedText style={styles.appTagline}>Your business, beautifully managed</ThemedText>
        </View>

        {/* Version info */}
        <View style={styles.section}>
          <InfoRow
            icon="information-circle-outline"
            iconColor="#6366F1"
            label="App Version"
            value={APP_VERSION}
            last={false}
          />
          <InfoRow
            icon="code-slash-outline"
            iconColor="#8B5CF6"
            label="Build Number"
            value={String(BUILD_NUMBER)}
            last
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <InfoRow
            icon="mail-outline"
            iconColor="#3B82F6"
            label="Contact Support"
            value={SUPPORT_EMAIL}
            onPress={handleEmail}
            chevron
            last
          />
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <InfoRow
            icon="lock-closed-outline"
            iconColor="#10B981"
            label="Privacy Policy"
            onPress={() => handleOpenBrowser(PRIVACY_POLICY_URL)}
            chevron
          />
          <InfoRow
            icon="document-text-outline"
            iconColor="#F59E0B"
            label="Terms of Service"
            onPress={() => handleOpenBrowser(TERMS_URL)}
            chevron
            last
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <InfoRow
            icon="star-outline"
            iconColor="#F59E0B"
            label="Rate the App"
            onPress={handleRateApp}
            chevron
          />
          <InfoRow
            icon="share-social-outline"
            iconColor="#7C3AED"
            label="Share App"
            onPress={handleShareApp}
            chevron
            last
          />
        </View>

        <ThemedText style={styles.copyright}>
          © {new Date().getFullYear()} REZ Technologies. All rights reserved.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    paddingBottom: 48,
  },
  brandSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 4,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
