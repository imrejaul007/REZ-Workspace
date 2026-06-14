/**
 * POS Shift Open Screen
 * Staff enters opening cash to start a new shift
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
import { logger } from '@/utils/logger';
import { storageService } from '@/services/storage';
import { useStore } from '@/contexts/StoreContext';
import { Colors, Shadows } from '@/constants/DesignTokens';

export default function ShiftOpenScreen() {
  const { activeStore } = useStore();
  const [openingCash, setOpeningCash] = useState('');
  const [staffName, setStaffName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStaffInfo();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStaffInfo = async () => {
    try {
      const merchantData = await storageService.getMerchantData<unknown>();
      setStaffName(merchantData?.staffName || merchantData?.name || 'Staff');
    } catch (error) {
      logger.error('[Shift Open] Failed to load staff info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    if (!openingCash.trim()) {
      platformAlertSimple('Required', 'Please enter opening cash amount');
      return;
    }

    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      platformAlertSimple('Invalid', 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const storeId = activeStore?._id;

      if (!storeId) {
        throw new Error('No active store selected. Please select a store first.');
      }

      const response = await apiClient.post('/merchant/pos/shift/open', {
        storeId,
        openingCash: amount,
        staffName: staffName || 'Staff',
        openedAt: new Date().toISOString(),
      });

      if (response.success || response.data?.shiftId) {
        platformAlert(
          'Shift Started',
          `Opening cash: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nReady to process sales!`,
          [{ text: 'OK', onPress: () => router.replace('/pos') }]
        );
      } else {
        throw new Error(response.message || 'Failed to open shift');
      }
    } catch (error) {
      logger.error('[Shift Open] Error:', error);
      platformAlertSimple('Error', error?.message || 'Failed to start shift. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

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
          {/* Header Section */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.headerSection}>
            <View style={styles.greeting}>
              <Ionicons name="sunny" size={32} color="#F59E0B" />
              <Text style={styles.greetingText}>Good morning!</Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </Animated.View>

          {/* Staff Name Card */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <Ionicons name="person-circle" size={40} color={Colors.primary[600]} />
              <View style={styles.staffInfo}>
                <Text style={styles.staffLabel}>Staff Member</Text>
                <Text style={styles.staffName}>{staffName}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Opening Cash Section */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.formSection}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Opening Cash</Text>
              <Ionicons name="cash" size={18} color={Colors.text.secondary} />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="decimal-pad"
                value={openingCash}
                onChangeText={setOpeningCash}
                editable={!submitting}
              />
            </View>

            <Text style={styles.helperText}>
              Enter the total cash amount in your register to begin the shift
            </Text>
          </Animated.View>

          {/* Summary Card */}
          {openingCash && !isNaN(parseFloat(openingCash)) && (
            <Animated.View entering={ZoomIn.delay(400)} style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shift Start Time</Text>
                <Text style={styles.summaryValue}>{formattedTime}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Opening Cash</Text>
                <Text style={styles.summaryAmount}>
                  ₹{parseFloat(openingCash).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Action Button */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.startButton, submitting && styles.disabledButton]}
            onPress={handleStartShift}
            disabled={submitting || !openingCash.trim()}
            activeOpacity={0.85}
          >
            {submitting ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.startButtonText}>Starting Shift...</Text>
              </>
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color="white" />
                <Text style={styles.startButtonText}>Start Shift</Text>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 140,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  staffCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  formSection: {
    marginBottom: 28,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border.light,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[600],
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  helperText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[600],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success[600],
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
  startButton: {
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
  startButtonText: {
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
