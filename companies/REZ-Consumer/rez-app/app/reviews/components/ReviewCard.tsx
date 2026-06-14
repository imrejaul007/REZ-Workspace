/**
 * ReviewCard Component - Extracted from review screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface ReviewCardProps {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
  helpful?: number;
  onPress?: () => void;
}

export default function ReviewCard({ userName, userImage, rating, comment, date, images, helpful, onPress }: ReviewCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        {userImage ? (
          <Image source={{ uri: userImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.rating}>
            {stars.map((filled, i) => (
              <Ionicons key={i} name={filled ? 'star' : 'star-outline'} size={12} color="#F59E0B" />
            ))}
            <Text style={styles.date}>{date}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.comment}>{comment}</Text>
      {images && images.length > 0 && (
        <View style={styles.images}>
          {images.slice(0, 3).map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.reviewImage} />
          ))}
        </View>
      )}
      {helpful !== undefined && (
        <View style={styles.footer}>
          <Pressable style={styles.helpful}>
            <Ionicons name="thumbs-up-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.helpfulText}>Helpful ({helpful})</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background.primary, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  header: { flexDirection: 'row', marginBottom: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.sm },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[500] ?? '#FF6B35', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  date: { marginLeft: spacing.sm, fontSize: 12, color: colors.text.tertiary },
  comment: { fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  images: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  reviewImage: { width: 60, height: 60, borderRadius: borderRadius.md },
  footer: { flexDirection: 'row', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border.default },
  helpful: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helpfulText: { fontSize: 12, color: colors.text.tertiary },
});
