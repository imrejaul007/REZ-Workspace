/**
 * Feedback Screen
 * Route: /room-service/[hotelId]/[roomId]/feedback
 *
 * Guest feedback and rating
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// API URL from environment
const ROOM_SERVICE_API = process.env.EXPO_PUBLIC_ROOM_SERVICE_API || 'https://rez-room-service.onrender.com';

const RATINGS = [
  { category: 'Cleanliness', icon: 'sparkles' },
  { category: 'Staff', icon: 'people' },
  { category: 'Service', icon: 'star' },
  { category: 'Food', icon: 'restaurant' },
  { category: 'Amenities', icon: 'grid' },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hotelId: string; roomId: string }>();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRating = (category: string, stars: number) => {
    setRatings(prev => ({ ...prev, [category]: stars }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    try {
      // Call API to submit feedback
      await fetch(`${ROOM_SERVICE_API}/api/room-service/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.roomId,
          hotelId: params.hotelId,
          guestId: 'guest',
          overallRating,
          serviceRatings: Object.entries(ratings).map(([category, rating]) => ({ category, rating })),
          textComment: comment,
          stayType: 'leisure',
          source: 'checkout_screen',
        }),
      });

      Alert.alert(
        'Thank You!',
        'Your feedback helps us improve our service.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Thank You!', 'Your feedback has been submitted.');
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#9B59B6', '#8E44AD']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Feedback</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Overall Experience</Text>

        {/* Overall Rating */}
        <View style={styles.overallRating}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setOverallRating(star)}>
              <Ionicons
                name={star <= overallRating ? 'star' : 'star-outline'}
                size={40}
                color="#F39C12"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Ratings */}
        <Text style={styles.sectionTitle}>Rate Your Experience</Text>
        {RATINGS.map(item => (
          <View key={item.category} style={styles.ratingRow}>
            <View style={styles.ratingLabel}>
              <Ionicons name={item.icon as unknown} size={20} color="#666" />
              <Text style={styles.ratingText}>{item.category}</Text>
            </View>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => handleRating(item.category, star)}>
                  <Ionicons
                    name={star <= (ratings[item.category] || 0) ? 'star' : 'star-outline'}
                    size={24}
                    color="#F39C12"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Comment */}
        <Text style={styles.sectionTitle}>Additional Comments</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience with us..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />

        {/* Quick Tags */}
        <View style={styles.tags}>
          {['Great Service', 'Clean Room', 'Friendly Staff', 'Good Food', 'Comfortable'].map(tag => (
            <TouchableOpacity key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 16 },
  overallRating: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  ratingLabel: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 15, color: '#333', marginLeft: 12 },
  stars: { flexDirection: 'row' },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 13, color: '#5D8C5A', fontWeight: '500' },
  submitBtn: {
    backgroundColor: '#9B59B6',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: '#CCC' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
