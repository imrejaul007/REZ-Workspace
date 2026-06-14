/**
 * Payment Screen — QR code display + polling + WhatsApp share + cash payment.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
  Share,
  Alert,
} from 'react-native';
import {
  platformAlertSimple,
  platformAlertDestructive,
  platformAlert,
} from '@/utils/platformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Shadows } from '@/constants/DesignTokens';
import { posService, generateUPILink } from '@/services/api/pos';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

// ─── UPI Deep Link Configuration ──────────────────────────────────────────────

interface UPIAppConfig {
  name: string;
  package: string; // Android package name
  scheme: string; // iOS URL scheme
  deepLink: (amount: number, upiId: string, payeeName: string) => string;
}

// UPI apps configuration - supported apps with proper deep links for iOS and Android
const UPI_APPS: Record<string, UPIAppConfig> = {
  phonepe: {
    name: 'PhonePe',
    package: 'com.phonepe.app',
    scheme: 'phonepe://',
    deepLink: (amount, upiId, payeeName) =>
      `phonepe://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&mode=04`,
  },
  gpay: {
    name: 'Google Pay',
    package: 'com.google.android.apps.nbu.paisa.user',
    scheme: 'gpay://',
    deepLink: (amount, upiId, payeeName) =>
      `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`,
  },
  paytm: {
    name: 'Paytm',
    package: 'com.paytm.nativesplash',
    scheme: 'paytmmp://', // Note: paytmmp:// for Android, paytm:// for iOS
    deepLink: (amount, upiId, payeeName) =>
      `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`,
  },
  razorpay: {
    name: 'Razorpay',
    package: 'com.razorpay.m湘',
    scheme: 'razorpay://',
    deepLink: (amount, upiId, payeeName) =>
      `razorpay://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`,
  },
  bhim: {
    name: 'BHIM UPI',
    package: 'in.org.npci.upiapp',
    scheme: 'bhim://',
    deepLink: (amount, upiId, payeeName) =>
      `bhim://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`,
  },
  amazonpay: {
    name: 'Amazon Pay',
    package: 'in.amazon.mShop.android.shopping',
    scheme: 'amazonpay://',
    deepLink: (amount, upiId, payeeName) =>
      `amazonpay://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`,
  },
};

// Preference order for UPI apps (most popular first)
const UPI_PREFERENCE_ORDER = ['phonepe', 'gpay', 'paytm', 'razorpay', 'amazonpay', 'bhim'];

/**
 * Check if a UPI app is installed on the device.
 * Uses platform-specific detection methods.
 */
async function isAppInstalled(urlScheme: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(urlScheme);
    return canOpen;
  } catch {
    return false;
  }
}

/**
 * Get list of installed UPI apps on the device.
 * Checks each app's URL scheme.
 */
async function getInstalledUPIApps(): Promise<string[]> {
  const installed: string[] = [];

  for (const [appId, app] of Object.entries(UPI_APPS)) {
    // Use platform-specific scheme for Paytm
    const scheme = appId === 'paytm' && Platform.OS === 'ios' ? 'paytm://' : app.scheme;
    const isInstalled = await isAppInstalled(scheme);
    if (isInstalled) {
      installed.push(appId);
    }
  }

  return installed;
}

/**
 * Open UPI payment with deep link.
 * Tries each installed app in order of preference, falls back to generic UPI chooser.
 */
async function openUPIPayment(
  amount: number,
  upiId: string,
  payeeName: string
): Promise<{ success: boolean; appUsed?: string }> {
  // First, try to find installed apps
  const installedApps = await getInstalledUPIApps();

  // Try each installed app in order of preference
  for (const appId of UPI_PREFERENCE_ORDER) {
    if (!installedApps.includes(appId)) continue;

    const app = UPI_APPS[appId];
    // Use platform-specific scheme for Paytm
    const scheme = appId === 'paytm' && Platform.OS === 'ios' ? 'paytm://' : app.scheme;
    const deepLink = app.deepLink(amount, upiId, payeeName).replace(app.scheme, scheme);

    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
        return { success: true, appUsed: app.name };
      }
    } catch {
      // Try next app
      continue;
    }
  }

  // Fallback: Open generic UPI chooser (works on all devices with UPI)
  const genericUPI = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&mc=0000&mode=04&purpose=00`;

  try {
    const canOpenGeneric = await Linking.canOpenURL(genericUPI);
    if (canOpenGeneric) {
      await Linking.openURL(genericUPI);
      return { success: true, appUsed: 'UPI Chooser' };
    }
  } catch {
    // Generic UPI failed
  }

  // Last resort: Show error
  return { success: false };
}

// ─── QR Code View ──────────────────────────────────────────────────────────────

/**
 * Renders a real scannable QR code using react-native-qrcode-svg.
 * The QR encodes the UPI payment string so customers can scan directly.
 */
const PaymentLinkDisplay = ({
  amount,
  billId,
  qrData,
}: {
  amount: number;
  billId: string;
  qrData: string;
}) => (
  <View style={qrStyles.container}>
    <View style={qrStyles.qrPlaceholder}>
      <QRCode value={qrData} size={200} backgroundColor="white" color="#000000" quietZone={8} />
    </View>
    <View style={qrStyles.upiInfo}>
      <Ionicons name="phone-portrait-outline" size={16} color={Colors.text.secondary} />
      <Text style={qrStyles.upiText} selectable numberOfLines={1}>
        {qrData.slice(0, 50)}...
      </Text>
    </View>
  </View>
);

const qrStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10 },
  qrPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  upiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    maxWidth: 280,
  },
  upiText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    flex: 1,
  },
});

// ─── Timer ────────────────────────────────────────────────────────────────────

const useTimer = (startTime: number) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// ─── Pulsing Indicator ────────────────────────────────────────────────────────

const PulsingDot = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.2, { duration: 800 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[pulseStyles.dot, style]} />;
};

const pulseStyles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success[500],
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TIP_PRESETS = [0, 20, 50, 100, 200];

export default function PaymentScreen() {
  const { billId, amount: amountParam } = useLocalSearchParams<{
    billId: string;
    amount: string;
  }>();
  const { merchant } = useAuth();
  // H6 FIX: use activeStore.name instead of non-existent merchant.storeName
  const { activeStore } = useStore();
  const amount = parseFloat(amountParam || '0');
  const [status, setStatus] = useState<'pending' | 'paid' | 'cancelled' | 'expired'>('pending');
  const [polling, setPolling] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [installedUPIApps, setInstalledUPIApps] = useState<string[]>([]);
  const [checkingApps, setCheckingApps] = useState(false);
  const startTime = useRef(Date.now());
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  // MA-GAP-143: Replaced isMounted with AbortController for proper cancellation
  const abortRef = useRef<AbortController | null>(null);
  const timer = useTimer(startTime.current);

  // Check for installed UPI apps on mount
  useEffect(() => {
    const checkInstalledApps = async () => {
      setCheckingApps(true);
      const installed = await getInstalledUPIApps();
      setInstalledUPIApps(installed);
      setCheckingApps(false);
    };
    checkInstalledApps();
  }, []);

  // Track mount state to prevent setState after unmount
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Don't generate QR when billId is missing/unknown — render an
  // error state instead. A QR with billId='unknown' cannot be resolved by the backend.
  const validBillId = billId && billId !== 'unknown' ? billId : null;
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // BUG FIX (P2-C1): Read the store's configured UPI ID so the QR routes to
  // the merchant's own bank account, not the central platform fallback.
  // If the store hasn't configured one yet, `generateUPILink` throws with a
  // clear message and we surface it to the cashier.
  const storeUpiId = activeStore?.paymentSettings?.upiId;
  const storeUpiName =
    activeStore?.paymentSettings?.upiName ||
    activeStore?.name ||
    merchant?.businessName ||
    'Rez Merchant';

  useEffect(() => {
    if (!validBillId) {
      setQrData(null);
      return;
    }
    setQrError(null);
    posService
      .generateQR(validBillId, amount, storeUpiName, storeUpiId)
      .then((link) => {
        setQrData(link);
        setQrError(null);
      })
      .catch((err) => {
        setQrData(null);
        setQrError(
          err?.message || "Couldn't generate UPI QR. Please check your store payment settings."
        );
      });
  }, [validBillId, amount, storeUpiName, storeUpiId]);

  // ─── Polling ──────────────────────────────────────────────────────────────

  const checkStatus = useCallback(async () => {
    if (!billId) return;
    try {
      const result = await posService.checkPaymentStatus(billId);
      if (abortRef.current?.signal.aborted) return;
      if (result.status === 'paid') {
        setStatus('paid');
        setPolling(false);
        setCoinsEarned(result.coinsEarned || 0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
          pathname: '/pos/success',
          params: {
            billId,
            amount: amountParam,
            coinsEarned: String(result.coinsEarned || 0),
            paymentMethod: result.paymentMethod || 'qr',
          },
        });
      } else if (result.status === 'cancelled' || result.status === 'expired') {
        setStatus(result.status);
        setPolling(false);
      }
    } catch {
      // ignore polling errors
    }
  }, [billId, amountParam]);

  useEffect(() => {
    // Stop polling if we're no longer pending — once status is paid/
    // cancelled/expired there's nothing to poll for and any in-flight tick
    // risks racing against handleMarkPaid's router.replace.
    if (!polling || status !== 'pending') return;
    pollInterval.current = setInterval(checkStatus, 3000);
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [polling, status, checkStatus]);

  // Stop polling after 15 minutes
  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (abortRef.current?.signal.aborted) return;
        setPolling(false);
        setStatus('expired');
      },
      15 * 60 * 1000
    );
    return () => clearTimeout(timeout);
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleMarkPaid = async (method: 'cash' | 'card') => {
    if (!validBillId) return;
    // Kill the 3s poller IMMEDIATELY — before awaiting markAsPaid. Otherwise
    // a concurrent poll tick can see status='paid' on the server (because
    // another cashier device marked it, or a QR payment just landed) and
    // fire its own router.replace, causing two overlapping navigations.
    // Setting polling=false stops the interval effect; setting status='paid'
    // short-circuits any re-render paths that depended on the old status.
    setPolling(false);
    setStatus('paid');
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    setMarkingPaid(true);
    try {
      const finalAmount = amount + tipAmount;
      // Pass finalAmount so backend records tip-inclusive total
      await posService.markAsPaid(validBillId, method, finalAmount);
      router.replace({
        pathname: '/pos/success',
        params: {
          billId,
          amount: String(finalAmount),
          coinsEarned: '0',
          paymentMethod: method,
          tipAmount: String(tipAmount),
        },
      });
    } catch (e) {
      // MA-GAP-142: Rollback optimistic update on failure
      setStatus('pending');
      setPolling(true);
      platformAlertSimple('Error', e.message || 'Failed to mark payment.');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const storeName = activeStore?.name || merchant?.businessName || 'Rez Merchant';
    const msg = `Pay ₹${amount.toLocaleString('en-IN')} to ${storeName}${qrData ? `\n\nPayment Link: ${qrData}` : ''}\n\nBill ID: ${billId}`;
    try {
      const waUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) {
        await Linking.openURL(waUrl);
      } else {
        // Fallback to native share
        await Share.share({ message: msg, title: `Pay ₹${amount}` });
      }
    } catch {
      await Share.share({ message: msg });
    }
  };

  const handleShare = async () => {
    const storeName = activeStore?.name || merchant?.businessName || 'Rez Merchant';
    await Share.share({
      message: `Pay ₹${amount.toLocaleString('en-IN')} to ${storeName}\nBill ID: ${billId}`,
      title: 'Payment Request',
    });
  };

  const handleOpenUPIApps = async () => {
    if (!storeUpiId) {
      platformAlertSimple('Error', 'UPI ID not configured. Please update your store payment settings.');
      return;
    }

    const finalAmount = Math.round((amount + tipAmount) * 100) / 100; // Round to 2 decimal places

    // If multiple apps installed, let user choose
    if (installedUPIApps.length > 1) {
      const options = installedUPIApps
        .map(appId => {
          const app = UPI_APPS[appId];
          return {
            text: `Pay with ${app.name}`,
            onPress: async () => {
              const deepLink = app.deepLink(finalAmount, storeUpiId, storeUpiName);
              try {
                await Linking.openURL(deepLink);
              } catch {
                platformAlertSimple('Error', `Could not open ${app.name}. Please try again.`);
              }
            },
          };
        })
        .concat([{ text: 'Cancel', style: 'cancel' }] as unknown);

      Alert.alert('Select Payment App', 'Choose a UPI app to pay with', options);
    } else if (installedUPIApps.length === 1) {
      // Only one app installed, use it directly
      const appId = installedUPIApps[0];
      const app = UPI_APPS[appId];
      const deepLink = app.deepLink(finalAmount, storeUpiId, storeUpiName);
      try {
        await Linking.openURL(deepLink);
      } catch {
        // Fallback to generic UPI
        const result = await openUPIPayment(finalAmount, storeUpiId, storeUpiName);
        if (!result.success) {
          platformAlertSimple('Error', 'No UPI payment app available. Please install one.');
        }
      }
    } else {
      // No apps detected, try generic UPI chooser
      const result = await openUPIPayment(finalAmount, storeUpiId, storeUpiName);
      if (!result.success) {
        platformAlertSimple(
          'No UPI Apps Found',
          'Please install a UPI payment app like PhonePe, Google Pay, or Paytm.'
        );
      }
    }
  };

  const handleCancel = () => {
    platformAlertDestructive(
      'Cancel Payment',
      'Cancel this payment request?',
      async () => {
        if (billId) await posService.cancelBill(billId);
        router.back();
      },
      'Yes, Cancel',
      'No'
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Show error when billId is missing/invalid — don't render QR
  if (!validBillId) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[400]} />
        <Text style={styles.errorTitle}>Invalid Bill</Text>
        <Text style={styles.errorSubtitle}>
          No valid bill ID was provided. Please go back and create a new bill.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (status === 'expired' || status === 'cancelled') {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Ionicons name="time-outline" size={64} color={Colors.error[400]} />
        <Text style={styles.errorTitle}>
          {status === 'expired' ? 'Bill Expired' : 'Bill Cancelled'}
        </Text>
        <Text style={styles.errorSubtitle}>This payment request is no longer valid.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.amountSection}>
          <Text style={styles.amountLabel}>AMOUNT TO COLLECT</Text>
          <Text style={styles.amountDisplay}>
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.timerRow}>
            <PulsingDot />
            <Text style={styles.timerText}>Waiting for payment • {timer}</Text>
          </View>
        </Animated.View>

        {/* QR / Payment Display */}
        <Animated.View entering={FadeIn.delay(150)} style={styles.qrSection}>
          {qrData ? (
            <PaymentLinkDisplay amount={amount} billId={validBillId} qrData={qrData} />
          ) : qrError ? (
            <View style={{ alignItems: 'center', padding: 16, gap: 8 }}>
              <Ionicons name="warning-outline" size={40} color={Colors.error[400]} />
              <Text style={[styles.scanHint, { color: Colors.error[500], textAlign: 'center' }]}>
                {qrError}
              </Text>
              <Text style={[styles.scanHint, { fontSize: 11 }]}>
                You can still collect payment manually using Cash / Card below.
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 24 }} />
          )}
          {!qrError && (
            <Text style={styles.scanHint}>Customer scans UPI QR or opens payment link</Text>
          )}
        </Animated.View>

        {/* Tip Selection */}
        <Animated.View entering={FadeInDown.delay(180)} style={styles.tipSection}>
          <Text style={styles.tipLabel}>Add Tip</Text>
          <View style={styles.tipPresetsRow}>
            {TIP_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => setTipAmount(preset)}
                style={[styles.tipPreset, tipAmount === preset && styles.tipPresetActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tipPresetText, tipAmount === preset && styles.tipPresetTextActive]}
                >
                  {preset === 0 ? 'No tip' : `₹${preset}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tipAmount > 0 && (
            <Text style={styles.tipTotal}>Total with tip: ₹{(amount + tipAmount).toFixed(2)}</Text>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.actions}>
          {/* Share via WhatsApp */}
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleShareWhatsApp}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={22} color="white" />
            <Text style={styles.whatsappButtonText}>Share via WhatsApp</Text>
          </TouchableOpacity>

          {/* Open UPI App */}
          {storeUpiId && (
            <TouchableOpacity
              style={styles.upiAppButton}
              onPress={handleOpenUPIApps}
              disabled={checkingApps}
              activeOpacity={0.85}
            >
              {checkingApps ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <>
                  <Ionicons name="apps-outline" size={20} color="#7C3AED" />
                  <Text style={styles.upiAppButtonText}>
                    {installedUPIApps.length > 0
                      ? `Pay with UPI App (${installedUPIApps.length})`
                      : 'Open UPI Payment'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Share */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={20} color="#7C3AED" />
            <Text style={styles.shareButtonText}>Share Payment Link</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ACCEPT MANUALLY</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Cash Payment */}
          <TouchableOpacity
            style={styles.cashButton}
            onPress={() => {
              platformAlert('Mark as Paid', 'How was the payment received?', [
                { text: 'Cash', onPress: () => handleMarkPaid('cash') },
                { text: 'Card / POS', onPress: () => handleMarkPaid('card') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            disabled={markingPaid}
            activeOpacity={0.85}
          >
            {markingPaid ? (
              <ActivityIndicator size="small" color={Colors.text.secondary} />
            ) : (
              <>
                <Ionicons name="cash-outline" size={20} color={Colors.text.secondary} />
                <Text style={styles.cashButtonText}>Mark as Paid (Cash / Card)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
            <Text style={styles.cancelButtonText}>Cancel Payment Request</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bill Info */}
        <View style={styles.billInfo}>
          <Ionicons name="receipt-outline" size={14} color={Colors.text.tertiary} />
          <Text style={styles.billInfoText}>Bill ID: {billId}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    paddingBottom: 60,
  },
  amountSection: {
    backgroundColor: 'white',
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: 6,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  amountDisplay: {
    fontSize: 52,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: -1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timerText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginTop: 12,
    gap: 12,
  },
  scanHint: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  tipSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  tipPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tipPreset: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  tipPresetActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#FFF9E6',
  },
  tipPresetText: {
    fontWeight: '600',
    color: Colors.text.secondary,
    fontSize: 12,
  },
  tipPresetTextActive: {
    color: '#7C3AED',
  },
  tipTotal: {
    color: Colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  actions: {
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    backgroundColor: '#25D366',
    ...Shadows.md,
  },
  whatsappButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  upiAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  upiAppButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  shareButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.default,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.tertiary,
    letterSpacing: 0.5,
  },
  cashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  cashButtonText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: Colors.error[500],
    fontSize: 14,
    fontWeight: '600',
  },
  billInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  billInfoText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  errorSubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
