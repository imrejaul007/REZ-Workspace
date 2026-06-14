/**
 * POS Shift Close Screen
 * Staff counts cash, reviews summary, closes shift
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';
import { Colors, Shadows } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

interface ShiftSummary {
  // Map from backend PosShift._id. The backend returns Mongo `_id`, not
  // `shiftId` — we normalise on read so the rest of this screen doesn't
  // need to care about Mongo vs DTO shapes.
  shiftId: string;
  openedAt: string;
  openingCash: number;
  // Sales totals. These are populated by the backend /shifts/active
  // endpoint aggregating PosBill within the shift window. If backend
  // hasn't wired the aggregation yet, they default to 0 so the UI
  // doesn't crash on `.toLocaleString()` of undefined.
  totalBills: number;
  totalRevenue: number;
  cashRevenue: number;
  upiRevenue: number;
  cardRevenue: number;
  tips: number;
}

export default function ShiftCloseScreen() {
  const { activeStore } = useStore();
  const [shift, setShift] = useState<ShiftSummary | null>(null);
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeStore?._id) loadActiveShift();
  }, [activeStore?._id]);

  const loadActiveShift = async () => {
    try {
      const storeId = activeStore?._id;

      if (!storeId) {
        throw new Error('No active store selected');
      }

      const response = await apiClient.get<unknown>(
        `/merchant/pos/shifts/active?storeId=${encodeURIComponent(storeId)}`
      );

      if (response.success && response.data) {
        // Backend may return either { shift } or the shift directly, and the
        // shift doc carries `_id` (raw Mongo) rather than `shiftId`. Normalise
        // both shapes so downstream code can depend on `shift.shiftId`.
        // Sales breakdown fields default to 0 when the backend aggregation
        // hasn't populated them — the UI formats them with `.toLocaleString()`
        // which crashes on undefined.
        const raw: unknown = response.data.shift ?? response.data;
        setShift({
          shiftId: raw.shiftId || raw._id?.toString?.() || raw._id || '',
          openedAt: raw.openedAt,
          openingCash: Number(raw.openingCash) || 0,
          totalBills: Number(raw.totalBills) || 0,
          totalRevenue: Number(raw.totalRevenue) || 0,
          cashRevenue: Number(raw.cashRevenue) || 0,
          upiRevenue: Number(raw.upiRevenue) || 0,
          cardRevenue: Number(raw.cardRevenue) || 0,
          tips: Number(raw.tips) || 0,
        });
      } else {
        throw new Error(response.message || 'No active shift found');
      }
    } catch (error) {
      logger.error('[Shift Close] Error loading shift:', error);
      platformAlert('Error', error?.message || 'Failed to load shift information', [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!countedCash.trim()) {
      platformAlertSimple('Required', 'Please enter the cash count amount');
      return;
    }

    const counted = parseFloat(countedCash);
    if (isNaN(counted) || counted < 0) {
      platformAlertSimple('Invalid', 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const storeId = activeStore?._id;

      if (!storeId || !shift) {
        throw new Error('Missing shift or store information');
      }

      // Backend at merchantroutes/pos.ts:189 requires `closingCash`, NOT
      // `countedCash` — previously every shift close returned 400.
      const response = await apiClient.post('/merchant/pos/shift/close', {
        storeId,
        shiftId: shift.shiftId,
        closingCash: counted,
        notes: notes.trim(),
        closedAt: new Date().toISOString(),
      });

      if (response.success) {
        const expected = shift.openingCash + shift.cashRevenue;
        const difference = counted - expected;

        platformAlert(
          'Shift Closed',
          `Expected Cash: ₹${expected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
            `Counted Cash: ₹${counted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
            `Difference: ${difference >= 0 ? '+' : ''}₹${Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          [{ text: 'OK', onPress: () => router.replace('/pos') }]
        );
      } else {
        throw new Error(response.message || 'Failed to close shift');
      }
    } catch (error) {
      logger.error('[Shift Close] Error:', error);
      platformAlertSimple('Error', error?.message || 'Failed to close shift. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !shift) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading shift summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const shiftDuration = new Date().getTime() - new Date(shift.openedAt).getTime();
  const hours = Math.floor(shiftDuration / 3600000);
  const minutes = Math.floor((shiftDuration % 3600000) / 60000);

  const expectedCash = shift.openingCash + shift.cashRevenue;
  const countedAmount = countedCash ? parseFloat(countedCash) : 0;
  const difference = countedAmount - expectedCash;
  const shortage = difference < 0 ? Math.abs(difference) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.headerSection}>
            <Text style={styles.title}>Close Shift</Text>
            <Text style={styles.subtitle}>Complete the cash count to close your shift</Text>
          </Animated.View>

          {/* Shift Duration Card */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.shiftCard}>
            <View style={styles.shiftRow}>
              <View style={styles.shiftLeft}>
                <Ionicons name="time" size={24} color={Colors.primary[600]} />
                <View>
                  <Text style={styles.shiftLabel}>Shift Duration</Text>
                  <Text style={styles.shiftValue}>
                    {hours}h {minutes}m
                  </Text>
                </View>
              </View>
              <View style={styles.shiftRight}>
                <Ionicons name="cash" size={24} color={Colors.success[600]} />
                <View>
                  <Text style={styles.shiftLabel}>Opening Cash</Text>
                  <Text style={styles.shiftValue}>
                    ₹{shift.openingCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Sales Breakdown */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Sales Breakdown</Text>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownLabel}>Total Bills</Text>
                <Text style={styles.breakdownValue}>{shift.totalBills}</Text>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={styles.breakdownLabel}>Total Revenue</Text>
                <Text style={styles.breakdownAmount}>
                  ₹{shift.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentMethods}>
              <View style={[styles.methodRow, { borderLeftColor: '#10B981' }]}>
                <Ionicons name="cash" size={16} color="#10B981" />
                <Text style={styles.methodLabel}>Cash</Text>
                <Text style={styles.methodAmount}>
                  ₹{shift.cashRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.methodRow, { borderLeftColor: '#7C3AED' }]}>
                <Ionicons name="phone-portrait" size={16} color="#7C3AED" />
                <Text style={styles.methodLabel}>UPI</Text>
                <Text style={styles.methodAmount}>
                  ₹{shift.upiRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.methodRow, { borderLeftColor: '#3B82F6' }]}>
                <Ionicons name="card" size={16} color="#3B82F6" />
                <Text style={styles.methodLabel}>Card</Text>
                <Text style={styles.methodAmount}>
                  ₹{shift.cardRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.methodRow, { borderLeftColor: '#F59E0B' }]}>
                <Ionicons name="heart" size={16} color="#F59E0B" />
                <Text style={styles.methodLabel}>Tips</Text>
                <Text style={styles.methodAmount}>
                  ₹{shift.tips.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Cash Count Section */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.countSection}>
            <Text style={styles.sectionTitle}>Cash Count</Text>

            <View style={styles.countInfo}>
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Opening Cash</Text>
                <Text style={styles.countValue}>
                  ₹{shift.openingCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Cash Sales</Text>
                <Text style={styles.countValue}>
                  ₹{shift.cashRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.countRow, styles.countRowHighlight]}>
                <Text style={styles.countLabelHighlight}>Expected Total</Text>
                <Text style={styles.countValueHighlight}>
                  ₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Actual Cash Counted</Text>
                {countedAmount > 0 && (
                  <View
                    style={[
                      styles.statusBadge,
                      shortage > 0
                        ? styles.shortageBadge
                        : difference >= 0
                          ? styles.matchBadge
                          : styles.overBadge,
                    ]}
                  >
                    <Ionicons
                      name={
                        shortage > 0 ? 'warning' : difference >= 0 ? 'checkmark-circle' : 'arrow-up'
                      }
                      size={12}
                      color={shortage > 0 ? '#DC2626' : difference >= 0 ? '#10B981' : '#F59E0B'}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        shortage > 0
                          ? { color: '#DC2626' }
                          : difference >= 0
                            ? { color: '#10B981' }
                            : { color: '#F59E0B' },
                      ]}
                    >
                      {shortage > 0
                        ? `₹${shortage.toLocaleString('en-IN', { minimumFractionDigits: 2 })} short`
                        : difference >= 0
                          ? 'Match'
                          : `₹${Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })} over`}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="decimal-pad"
                  value={countedCash}
                  onChangeText={setCountedCash}
                  editable={!submitting}
                />
              </View>

              {countedAmount > 0 && (
                <View style={styles.differenceBox}>
                  <Text style={styles.differenceLabel}>Difference</Text>
                  <Text
                    style={[
                      styles.differenceValue,
                      shortage > 0
                        ? styles.shortageText
                        : difference >= 0
                          ? styles.matchText
                          : styles.overText,
                    ]}
                  >
                    {difference >= 0 ? '+' : ''}₹
                    {difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Notes Section */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add unknown notes about the cash count or shift..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              editable={!submitting}
            />
          </Animated.View>
        </ScrollView>

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.closeButton, submitting && styles.disabledButton]}
            onPress={handleCloseShift}
            disabled={submitting || !countedCash.trim()}
            activeOpacity={0.85}
          >
            {submitting ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.closeButtonText}>Closing Shift...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color="white" />
                <Text style={styles.closeButtonText}>Close Shift</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.text.secondary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  shiftCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  shiftRow: {
    flexDirection: 'row',
    gap: 24,
  },
  shiftLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  shiftRight: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  shiftLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shiftValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 16,
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownRight: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success[600],
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 16,
  },
  paymentMethods: {
    gap: 12,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  methodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  countSection: {
    marginBottom: 24,
  },
  countInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  countRowHighlight: {
    backgroundColor: Colors.primary[50],
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: 10,
    paddingBottom: 12,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  countLabelHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  countValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  countValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  inputSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shortageBadge: {
    backgroundColor: '#FEE2E2',
  },
  matchBadge: {
    backgroundColor: '#F0FDF4',
  },
  overBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary[600],
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  differenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  differenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
  },
  differenceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  shortageText: {
    color: '#DC2626',
  },
  matchText: {
    color: '#10B981',
  },
  overText: {
    color: '#F59E0B',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    fontSize: 14,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    ...Shadows.lg,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    marginBottom: 12,
    ...Shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
