/**
 * RendezPartnerSection — REZ × Rendez cross-promo card
 *
 * Displayed on the Play & Earn screen.
 * Tapping opens the Rendez app via deep link, or falls back to the App Store / Play Store.
 *
 * Why here: Rendez meetups earn REZ coins. The Earn tab is the natural home
 * for showing another way to earn.
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const RENDEZ_SCHEME = 'rendez://';
const RENDEZ_APP_STORE = 'https://apps.apple.com/app/rendez/id0000000000'; // replace with real ID
const RENDEZ_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.rendez.app';

async function openRendez() {
  try {
    const canOpen = await Linking.canOpenURL(RENDEZ_SCHEME);
    if (canOpen) {
      await Linking.openURL(RENDEZ_SCHEME);
    } else {
      // Rendez not installed — send to store
      const storeUrl = Platform.OS === 'ios' ? RENDEZ_APP_STORE : RENDEZ_PLAY_STORE;
      await Linking.openURL(storeUrl);
    }
  } catch {
    // Ignore — user cancelled or no handler
  }
}

export default function RendezPartnerSection() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>REZ Partner</Text>

      <TouchableOpacity onPress={openRendez} activeOpacity={0.85}>
        <LinearGradient
          colors={['#1a1a2e', '#3b0764']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Left content */}
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
              <Text style={styles.partnerTag}>REZ Ecosystem Partner</Text>
            </View>

            <Text style={styles.title}>Rendez</Text>
            <Text style={styles.sub}>
              Meet real people at REZ-verified spots. Earn REZ coins every time you both show up.
            </Text>

            <View style={styles.coinsRow}>
              <Text style={styles.coinsEmoji}>🪙</Text>
              <Text style={styles.coinsText}>Up to 500 coins per verified meetup</Text>
            </View>

            <View style={styles.ctaBtn}>
              <Text style={styles.ctaText}>Open Rendez →</Text>
            </View>
          </View>

          {/* Right emoji */}
          <View style={styles.rightEmoji}>
            <Text style={{ fontSize: 56 }}>💜</Text>
            <Text style={{ fontSize: 22, marginTop: 4 }}>🍽️</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  card:         {
    borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
  },

  badgeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge:        { backgroundColor: '#7c3aed', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:    { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  partnerTag:   { fontSize: 10, color: '#a78bfa', fontWeight: '600' },

  title:        { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  sub:          { fontSize: 12, color: '#c4b5fd', lineHeight: 18, marginBottom: 12 },

  coinsRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  coinsEmoji:   { fontSize: 14 },
  coinsText:    { fontSize: 12, color: '#e9d5ff', fontWeight: '600' },

  ctaBtn:       { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' },
  ctaText:      { color: '#fff', fontWeight: '700', fontSize: 13 },

  rightEmoji:   { alignItems: 'center', marginLeft: 12 },
});
