// @ts-nocheck
/**
 * Guest Feedback Screen
 * Post-stay survey for hotel bookings
 * Route: /travel/hotels/booking/[id]/feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '@/services/apiClient';
import { colors } from '@/constants/theme';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  cyan: colors.brand?.cyan ?? '#06B6D4',
  cyanDark: colors.cyanDark ?? '#0891B2',
  navy: '#0F172A',
  slate: '#64748B',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  gold: '#F59E0B',
  green: '#16A34A',
  red: '#EF4444',
};

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({
  rating,
  setRating,
  size = 40,
  editable = true,
}: {
  rating: number;
  setRating?: (r: number) => void;
  size?: number;
  editable?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => editable && setRating?.(star)}
          disabled={!editable}
        >
          <Ionicons
            name={rating >= star ? 'star' : 'star-outline'}
            size={size}
            color={rating >= star ? C.gold : C.slate200}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Service Rating Row ─────────────────────────────────────────────────────────
function ServiceRatingRow({
  category,
  label,
  icon,
  rating,
  onRate,
}: {
  category: string;
  label: string;
  icon: string;
  rating: number;
  onRate: (category: string, rating: number) => void;
}) {
  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceLabel}>
        <Ionicons name={icon as unknown} size={20} color={C.cyanDark} />
        <Text style={styles.serviceLabelText}>{label}</Text>
      </View>
      <StarRating
        rating={rating}
        setRating={(r) => onRate(category, r)}
        size={28}
      />
    </View>
  );
}

// ─── NPS Selector ────────────────────────────────────────────────────────────────
function NpsSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const getColor = (n: number) => {
    if (n <= 6) return C.red;
    if (n <= 8) return C.gold;
    return C.green;
  };

  const getLabel = (n: number) => {
    if (n <= 6) return 'Not likely';
    if (n <= 8) return 'Maybe';
    return 'Very likely';
  };

  return (
    <View style={styles.npsContainer}>
      <Text style={styles.npsQuestion}>How likely are you to recommend us?</Text>
      <View style={styles.npsRow}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.npsButton,
              value === n && { backgroundColor: getColor(n) },
            ]}
          >
            <Text
              style={[
                styles.npsButtonText,
                value === n && { color: C.white, fontWeight: '700' },
              ]}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.npsHint, { color: getColor(value) }]}>
        {getLabel(value)}
      </Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function FeedbackScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [serviceRatings, setServiceRatings] = useState<Record<string, number>>({
    cleanliness: 0,
    staff: 0,
    amenities: 0,
    food: 0,
    location: 0,
    value: 0,
  });

  // Comment state
  const [textComment, setTextComment] = useState('');
  const [npsScore, setNpsScore] = useState(7);
  const [stayType, setStayType] = useState<string>('leisure');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Load existing feedback if any
  useEffect(() => {
    if (!bookingId) return;

    const loadFeedback = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/room-service/feedback/${bookingId}`);
        if (response.data?.success && response.data?.data) {
          const existing = response.data.data;
          setOverallRating(existing.overallRating);
          setTextComment(existing.textComment || '');
          setNpsScore(existing.recommendLikelihood || 7);
          setStayType(existing.stayType || 'leisure');

          // Set service ratings
          const ratings: Record<string, number> = {};
          existing.serviceRatings?.forEach((sr: { category: string; rating: number }) => {
            ratings[sr.category] = sr.rating;
          });
          setServiceRatings({ ...serviceRatings, ...ratings });

          if (existing.submittedAt) {
            setSubmitted(true);
          }
        }
      } catch {
        // No existing feedback - that's fine
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [bookingId]);

  const handleServiceRating = (category: string, rating: number) => {
    setServiceRatings((prev) => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating for your stay.');
      return;
    }

    setSubmitting(true);
    try {
      const serviceRatingsArray = Object.entries(serviceRatings)
        .filter(([, rating]) => rating > 0)
        .map(([category, rating]) => ({ category, rating }));

      const response = await apiClient.post('/room-service/feedback', {
        bookingId,
        hotelId: 'hotel-001', // Will be set by backend based on booking
        guestId: 'guest-001', // Will be set from auth
        overallRating,
        serviceRatings: serviceRatingsArray,
        textComment: textComment.trim() || undefined,
        recommendLikelihood: npsScore,
        stayType,
        source: 'checkout_screen',
        isAnonymous,
      });

      if (response.data?.success) {
        setSubmitted(true);
        Alert.alert(
          'Thank You!',
          response.data?.data?.thankYouMessage || 'Your feedback helps us improve.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit feedback.');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.cyan} />
        <Text style={styles.loadingText}>Loading feedback...</Text>
      </View>
    );
  }

  if (submitted && !submitting) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.successCard}>
          <LinearGradient colors={[C.cyan, C.cyanDark]} style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={C.white} />
          </LinearGradient>
          <Text style={styles.successTitle}>Feedback Submitted</Text>
          <Text style={styles.successSubtitle}>
            Thank you for sharing your experience!
          </Text>
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <LinearGradient colors={[C.cyan, C.cyanDark]} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Share Your Experience</Text>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How was your stay?</Text>
            <Text style={styles.sectionSubtitle}>Rate your overall experience</Text>
            <View style={styles.overallRatingContainer}>
              <StarRating rating={overallRating} setRating={setOverallRating} size={44} />
              <Text style={styles.ratingLabel}>
                {overallRating === 0
                  ? 'Tap to rate'
                  : overallRating === 1
                  ? 'Poor'
                  : overallRating === 2
                  ? 'Fair'
                  : overallRating === 3
                  ? 'Good'
                  : overallRating === 4
                  ? 'Very Good'
                  : 'Excellent'}
              </Text>
            </View>
          </View>

          {/* Service Ratings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Specific Services</Text>
            <Text style={styles.sectionSubtitle}>Help us understand what we did well</Text>

            <View style={styles.serviceCard}>
              <ServiceRatingRow
                category="cleanliness"
                label="Room Cleanliness"
                icon="sparkles-outline"
                rating={serviceRatings.cleanliness}
                onRate={handleServiceRating}
              />
              <View style={styles.divider} />
              <ServiceRatingRow
                category="staff"
                label="Staff Hospitality"
                icon="people-outline"
                rating={serviceRatings.staff}
                onRate={handleServiceRating}
              />
              <View style={styles.divider} />
              <ServiceRatingRow
                category="amenities"
                label="Room Amenities"
                icon="bed-outline"
                rating={serviceRatings.amenities}
                onRate={handleServiceRating}
              />
              <View style={styles.divider} />
              <ServiceRatingRow
                category="food"
                label="Food & Dining"
                icon="restaurant-outline"
                rating={serviceRatings.food}
                onRate={handleServiceRating}
              />
              <View style={styles.divider} />
              <ServiceRatingRow
                category="location"
                label="Hotel Location"
                icon="location-outline"
                rating={serviceRatings.location}
                onRate={handleServiceRating}
              />
              <View style={styles.divider} />
              <ServiceRatingRow
                category="value"
                label="Value for Money"
                icon="wallet-outline"
                rating={serviceRatings.value}
                onRate={handleServiceRating}
              />
            </View>
          </View>

          {/* Stay Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purpose of Stay</Text>
            <View style={styles.stayTypeRow}>
              {[
                { key: 'leisure', label: 'Leisure' },
                { key: 'business', label: 'Business' },
                { key: 'family', label: 'Family' },
                { key: 'couple', label: 'Couple' },
                { key: 'solo', label: 'Solo' },
              ].map(({ key, label }) => (
                <Pressable
                  key={key}
                  style={[
                    styles.stayTypeChip,
                    stayType === key && styles.stayTypeChipActive,
                  ]}
                  onPress={() => setStayType(key)}
                >
                  <Text
                    style={[
                      styles.stayTypeChipText,
                      stayType === key && styles.stayTypeChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* NPS */}
          <View style={styles.section}>
            <NpsSelector value={npsScore} onChange={setNpsScore} />
          </View>

          {/* Comments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Comments</Text>
            <Text style={styles.sectionSubtitle}>
              Share unknown suggestions or highlights from your stay
            </Text>
            <View style={styles.commentCard}>
              <TextInput
                style={styles.commentInput}
                placeholder="Tell us more about your experience..."
                placeholderTextColor={C.slate}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={textComment}
                onChangeText={setTextComment}
                maxLength={2000}
              />
              <Text style={styles.charCount}>{textComment.length}/2000</Text>
            </View>
          </View>

          {/* Anonymous Toggle */}
          <Pressable
            style={styles.anonymousRow}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <Ionicons
              name={isAnonymous ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isAnonymous ? C.cyanDark : C.slate200}
            />
            <Text style={styles.anonymousText}>Submit anonymously</Text>
          </Pressable>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {overallRating > 0 ? 'Submit Feedback' : 'Select Rating to Continue'}
              </Text>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  loadingText: { color: C.slate, marginTop: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.navy, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: C.slate, marginBottom: 16 },
  overallRatingContainer: { alignItems: 'center', paddingVertical: 20 },
  ratingLabel: { fontSize: 16, fontWeight: '600', color: C.cyanDark, marginTop: 12 },
  serviceCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceLabelText: { fontSize: 14, color: C.navy, fontWeight: '500' },
  divider: { height: 1, backgroundColor: C.slate100 },
  stayTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stayTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.slate200,
    backgroundColor: C.white,
  },
  stayTypeChipActive: { backgroundColor: C.cyanDark, borderColor: C.cyanDark },
  stayTypeChipText: { fontSize: 13, fontWeight: '600', color: C.navy },
  stayTypeChipTextActive: { color: C.white },
  npsContainer: { backgroundColor: C.white, borderRadius: 16, padding: 20 },
  npsQuestion: { fontSize: 15, fontWeight: '600', color: C.navy, marginBottom: 16 },
  npsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  npsButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: C.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  npsButtonText: { fontSize: 13, fontWeight: '600', color: C.slate },
  npsHint: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  commentCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  commentInput: {
    fontSize: 15,
    color: C.navy,
    minHeight: 100,
    padding: 0,
  },
  charCount: { fontSize: 11, color: C.slate, textAlign: 'right', marginTop: 8 },
  anonymousRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  anonymousText: { fontSize: 14, color: C.slate },
  submitButton: {
    backgroundColor: C.cyanDark,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: C.white, fontSize: 16, fontWeight: '700' },
  successCard: { alignItems: 'center', padding: 32 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: C.navy, marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: C.slate, textAlign: 'center', marginBottom: 24 },
  doneButton: {
    backgroundColor: C.cyanDark,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  doneButtonText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
