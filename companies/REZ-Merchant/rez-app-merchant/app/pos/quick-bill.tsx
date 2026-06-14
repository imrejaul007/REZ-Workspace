/**
 * Quick Bill Screen — Fast amount entry with number pad.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/DesignTokens';
import { posService } from '@/services/api/pos';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

// ─── Number Pad ───────────────────────────────────────────────────────────────

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

interface NumberPadProps {
  onKey: (key: string) => void;
}

const NumberPad = ({ onKey }: NumberPadProps) => (
  <View style={padStyles.grid}>
    {PAD_KEYS.map((key) => (
      <TouchableOpacity
        key={key}
        style={[padStyles.key, key === '⌫' && padStyles.backKey]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onKey(key);
        }}
        activeOpacity={0.7}
      >
        {key === '⌫' ? (
          <Ionicons name="backspace-outline" size={22} color={Colors.error[600]} />
        ) : (
          <Text style={padStyles.keyText}>{key}</Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

const padStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  key: {
    width: '33.33%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border.light,
    backgroundColor: 'white',
  },
  backKey: {
    backgroundColor: Colors.error[50],
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.text.primary,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function QuickBillScreen() {
  const { merchant } = useAuth();
  const { activeStore, isLoading: storeLoading } = useStore();
  // Accept amount / description as route params so /pos/offline can hand
  // off an amount the user already keyed in on its number pad without
  // forcing them to retype it here.
  const params = useLocalSearchParams<{ amount?: string; description?: string }>();
  const [amountStr, setAmountStr] = useState(params.amount || '');
  const [description, setDescription] = useState(params.description || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExtras, setShowExtras] = useState(Boolean(params.description));
  const [submitting, setSubmitting] = useState(false);

  const amount = parseFloat(amountStr) || 0;

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.' && amountStr.includes('.')) return;
    const parts = amountStr.split('.');
    if (parts[1]?.length >= 2) return;
    if (amountStr === '' && key === '.') {
      setAmountStr('0.');
      return;
    }
    setAmountStr((prev) => prev + key);
  };

  const handleGenerate = async () => {
    if (amount <= 0) {
      platformAlertSimple('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }
    // Guard against missing active store. Without this, the backend
    // store-payment/quick-bill endpoint 400s with "storeId is required"
    // and the user just sees a useless error toast.
    if (!activeStore?._id) {
      platformAlertSimple(
        storeLoading ? 'Loading store…' : 'No store selected',
        storeLoading
          ? 'Please wait a moment for your store to finish loading, then try again.'
          : 'Please select an active store from the store switcher before generating a bill.'
      );
      return;
    }
    // Prevent double submissions
    if (submitting) return;
    setSubmitting(true);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const bill = await posService.quickBill(
        amount,
        description.trim() || undefined,
        customerPhone.trim() || undefined,
        activeStore?._id
      );
      router.push({
        pathname: '/pos/payment',
        params: { billId: bill.billId, amount: String(bill.amount) },
      });
      // Reset submitting after navigation so user can re-submit
      // if they navigate back — without this, the guard stays true forever.
      setSubmitting(false);
    } catch (e) {
      platformAlertSimple('Error', e.message || 'Failed to generate bill.');
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const displayAmount = amountStr
    ? `₹${parseFloat(amountStr || '0').toLocaleString('en-IN', {
        minimumFractionDigits: amountStr.includes('.')
          ? Math.min(amountStr.split('.')[1]?.length || 0, 2)
          : 0,
        maximumFractionDigits: 2,
      })}`
    : '₹0';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Amount Display */}
      <Animated.View entering={FadeInDown.delay(50)} style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Enter Amount</Text>
        <Text style={styles.amountDisplay} numberOfLines={1} adjustsFontSizeToFit>
          {displayAmount}
        </Text>
        {amount > 0 && (
          <TouchableOpacity onPress={() => setAmountStr('')} style={styles.clearAmount}>
            <Text style={styles.clearAmountText}>Clear</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Number Pad */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.padContainer}>
        <NumberPad onKey={handleKey} />
      </Animated.View>

      {/* Optional Fields Toggle */}
      <TouchableOpacity
        style={styles.extrasToggle}
        onPress={() => setShowExtras(!showExtras)}
        activeOpacity={0.8}
      >
        <Text style={styles.extrasToggleText}>
          {showExtras ? 'Hide' : 'Add'} description & customer details
        </Text>
        <Ionicons
          name={showExtras ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.primary[500]}
        />
      </TouchableOpacity>

      {/* Optional Fields */}
      {showExtras && (
        <Animated.View entering={FadeInDown.springify()} style={styles.extrasContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Coffee, Lunch, Repair..."
              placeholderTextColor={Colors.text.tertiary}
              maxLength={100}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer Phone (optional)</Text>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="e.g. 9876543210"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </Animated.View>
      )}

      {/* Generate Button */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (amount <= 0 || loading || submitting) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={amount <= 0 || loading || submitting}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={22} color="white" />
              <Text style={styles.generateButtonText}>
                Generate Bill{amount > 0 ? ` — ${displayAmount}` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {[50, 100, 200, 500, 1000].map((quick) => (
            <TouchableOpacity
              key={quick}
              style={styles.quickAmount}
              onPress={() => {
                Haptics.selectionAsync();
                setAmountStr(String(quick));
              }}
            >
              <Text style={styles.quickAmountText}>₹{quick}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    paddingBottom: 40,
  },
  amountContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountDisplay: {
    fontSize: 52,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: -1,
    minWidth: '100%',
    textAlign: 'center',
  },
  clearAmount: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.error[50],
  },
  clearAmountText: {
    color: Colors.error[600],
    fontSize: 13,
    fontWeight: '600',
  },
  padContainer: {
    backgroundColor: 'white',
    marginTop: 12,
    ...Shadows.sm,
  },
  extrasToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
  },
  extrasToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  extrasContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    padding: 16,
    gap: 14,
    ...Shadows.sm,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    ...Shadows.md,
  },
  generateButtonDisabled: {
    opacity: 0.4,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAmount: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    alignItems: 'center',
    ...Shadows.sm,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
});
