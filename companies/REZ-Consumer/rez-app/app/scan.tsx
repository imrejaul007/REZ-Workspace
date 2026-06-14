/**
 * /scan — unified QR scan entry point (Phase I wire-up).
 *
 * One top-level route that accepts ANY ReZ QR and routes to the right
 * screen via `UnifiedQrScanner` → `routeFromPayload`. Legacy scanners
 * (`/karma/scan`, `/wallet/transfer`, the store-payment QRScanner)
 * stay in place — merchants/customers can still deep-link to those
 * flows directly. This route is the "just scan, figure it out"
 * surface for cases where the user doesn't know what kind of QR it is.
 *
 * Intent routing covered:
 *   store-visit      → /qr-checkin
 *   pay-bill         → /pay-in-store
 *   redeem-deal      → /my-vouchers
 *   redeem-voucher   → /my-vouchers
 *   claim-stamp      → /qr-checkin
 *   event-checkin    → /karma/scan
 *   referral         → /referral
 *   wallet-transfer  → /wallet/transfer
 *   short-url        → resolved via GET /api/qr/resolve, then routed
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import UnifiedQrScanner from '@/components/qr/UnifiedQrScanner';
import type { QrPayload } from '@/utils/qr/qrPayload';
import { logger } from '@/utils/logger';

export default function ScanScreen() {
  const router = useRouter();

  const handleScanned = useCallback((payload: QrPayload) => {
    // Analytics hook — leave narrow for now. The scanner's own router
    // call handles navigation; this is here so future observability
    // (PostHog / Mixpanel / etc.) has a single funnel event.
    logger.debug('[scan] routed to intent', { intent: payload.intent }, 'Scan');
  }, []);

  const handleError = useCallback((_msg: string) => {
    // Scanner displays its own error banner; swallowing here keeps the
    // top-level screen free of duplicate alerts. A future enhancement
    // could surface a toast for repeated errors.
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <UnifiedQrScanner onScanned={handleScanned} onError={handleError} />

      {/* Close button — scanner takes the full screen, so give the user
          an explicit escape hatch back to wherever they came from. */}
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="Close scanner"
      >
        <Ionicons name="close" size={24} color="#ffffff" />
      </Pressable>

      <View style={styles.helpHint} pointerEvents="none">
        <Text style={styles.helpText}>
          Scan unknown ReZ QR — store, deal, bill, voucher, event, referral, or wallet transfer.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpHint: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  helpText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
  },
});
