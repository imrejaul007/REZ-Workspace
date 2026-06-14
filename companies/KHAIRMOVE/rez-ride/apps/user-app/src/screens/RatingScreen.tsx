import { logger } from '../../shared/logger';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRideStore } from '../stores/ride.store';

interface RatingScreenProps {
  navigation: any;
  route?: any;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({ navigation }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { currentRide } = useRideStore();

  const handleSubmit = async () => {
    if (currentRide && rating > 0) {
      // Submit rating
      try {
        // API call would go here
      } catch (error) {
        logger.error('Failed to submit rating:', error);
      }
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate Your Ride</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>⭐</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingText}>
        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : rating === 1 ? 'Very Bad' : 'Tap to rate'}
      </Text>

      <View style={styles.tags}>
        {['Clean ride', 'On time', 'Good behavior', 'Safe driving', 'Polite'].map(tag => (
          <TouchableOpacity key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Additional comments (optional)"
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 40 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  star: { fontSize: 48, opacity: 0.3 },
  starActive: { opacity: 1 },
  ratingText: { textAlign: 'center', fontSize: 18, color: '#666', marginTop: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 24, justifyContent: 'center' },
  tag: { backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, margin: 4 },
  tagText: { fontSize: 14 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginTop: 24, minHeight: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 24 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default RatingScreen;
