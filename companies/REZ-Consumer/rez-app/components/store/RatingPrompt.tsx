/**
 * RatingPrompt
 *
 * Shown 2 seconds after a successful QR check-in.
 * Allows the user to leave a 1-5 star rating plus an optional comment.
 * Submits to POST /api/stores/:storeId/reviews.
 * Tracks visited stores in AsyncStorage to avoid duplicate prompts per visit.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeSearchService } from '@/services/storeSearchService';
import { colors } from '@/constants/theme';

const STORAGE_KEY = 'rez_rated_stores';
const DELAY_MS = 2000;

// ── helpers ──────────────────────────────────────────────────────────────────

async function hasRatedRecently(storeId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const map: Record<string, string> = JSON.parse(raw);
    if (!map[storeId]) return false;
    // Considered "recent" if rated within the last 7 days
    const last = new Date(map[storeId]).getTime();
    return Date.now() - last < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

async function markRated(storeId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[storeId] = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // non-critical
  }
}

// ── Star row ─────────────────────────────────────────────────────────────────

interface StarRowProps {
  value: number;
  onChange: (star: number) => void;
}

function StarRow({ value, onChange }: StarRowProps) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={32}
            color={star <= value ? colors.lightMustard : colors.neutral[300]}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface RatingPromptProps {
  storeId: string;
  storeName: string;
  /** Trigger to show the prompt. Increment this to open after check-in. */
  triggerCount: number;
  onDismiss?: () => void;
}

export default function RatingPrompt({
  storeId,
  storeName,
  triggerCount,
  onDismiss,
}: RatingPromptProps) {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (triggerCount === 0) return;

    let mounted = true;
    hasRatedRecently(storeId).then((already) => {
      if (!mounted || already) return;
      delayTimer.current = setTimeout(() => {
        if (!mounted) return;
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, DELAY_MS);
    });

    return () => {
      mounted = false;
      if (delayTimer.current) clearTimeout(delayTimer.current);
    };
  }, [triggerCount, storeId, fadeAnim]);

  const dismiss = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setRating(0);
      setComment('');
      setSubmitted(false);
      onDismiss?.();
    });
  }, [fadeAnim, onDismiss]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await storeSearchService.createReview({
        storeId,
        rating,
        comment: comment.trim(),
      });
      await markRated(storeId);
      setSubmitted(true);
      setTimeout(dismiss, 1500);
    } catch {
      // silently dismiss so the check-in flow isn't blocked
      dismiss();
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment, storeId, dismiss]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismiss}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.sheet, { opacity: fadeAnim }]}>
          {/* Dismiss button */}
          <Pressable style={styles.closeBtn} onPress={dismiss} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.midGray} />
          </Pressable>

          {submitted ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.successText}>Thanks for your review!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>How was your visit?</Text>
              <Text style={styles.storeName} numberOfLines={1}>
                {storeName}
              </Text>

              <StarRow value={rating} onChange={setRating} />

              <TextInput
                style={styles.commentInput}
                placeholder="Tell us about your visit (optional)"
                placeholderTextColor={colors.neutral[400]}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={500}
                returnKeyType="done"
                blurOnSubmit
              />

              <Pressable
                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={rating === 0 || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.nileBlue} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                )}
              </Pressable>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: 4,
    textAlign: 'center',
  },
  storeName: {
    fontSize: 14,
    color: colors.midGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.nileBlue,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: colors.lightMustard,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.nileBlue,
  },
});
