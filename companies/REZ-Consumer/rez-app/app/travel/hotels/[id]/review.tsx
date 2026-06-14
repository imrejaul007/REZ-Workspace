// @ts-nocheck
/**
 * Hotel Review Screen
 * Route: /travel/hotels/[id]/review
 * Params: id (hotelId), bookingRef, hotelName
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitHotelReview } from '@/services/hotelOtaApi';

const RATINGS = [
  { key: 'overall', label: 'Overall' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'service', label: 'Service' },
  { key: 'location', label: 'Location' },
  { key: 'value', label: 'Value for Money' },
];

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable key={s} onPress={() => onChange(s)} hitSlop={6}>
            <Ionicons
              name={s <= value ? 'star' : 'star-outline'}
              size={26}
              color={s <= value ? '#F59E0B' : '#CBD5E1'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function HotelReviewScreen() {
  const { id, bookingRef, hotelName } = useLocalSearchParams<{ id: string; bookingRef: string; hotelName: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0,
    cleanliness: 0,
    service: 0,
    location: 0,
    value: 0,
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      setError('Please give an overall rating');
      return;
    }
    if (body.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitHotelReview({
        hotelId: id,
        bookingRef: bookingRef || undefined,
        overallRating: ratings.overall,
        cleanlinessRating: ratings.cleanliness || ratings.overall,
        serviceRating: ratings.service || ratings.overall,
        locationRating: ratings.location || ratings.overall,
        valueRating: ratings.value || ratings.overall,
        title: title || undefined,
        body,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
        <Text style={styles.successTitle}>Review Submitted!</Text>
        <Text style={styles.successSub}>Thank you for sharing your experience.</Text>
        <Pressable style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Review {hotelName || 'Hotel'}
        </Text>
        <View style={{ width: 30 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {bookingRef && (
          <View style={styles.refBadge}>
            <Ionicons name="receipt-outline" size={14} color="#0891B2" />
            <Text style={styles.refText}>Booking: {bookingRef}</Text>
          </View>
        )}

        {/* Rating rows */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Ratings</Text>
          {RATINGS.map((r) => (
            <StarRow
              key={r.key}
              label={r.label}
              value={ratings[r.key] ?? 0}
              onChange={(v) => setRatings((prev) => ({ ...prev, [r.key]: v }))}
            />
          ))}
        </View>

        {/* Written review */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Write Your Review</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Review title (optional)"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Share details of your experience — what you liked, what could be better..."
            placeholderTextColor="#94A3B8"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
            maxLength={1500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{body.length}/1500</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={styles.submitText}>Submit Review</Text>
            </>
          )}
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: 16 },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  refText: { fontSize: 12, color: '#0891B2', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  starRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  starLabel: { fontSize: 14, color: '#334155', flex: 1 },
  stars: { flexDirection: 'row', gap: 4 },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 110,
  },
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 4 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891B2',
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 20, marginBottom: 8 },
  successSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  doneBtn: { backgroundColor: '#0891B2', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
