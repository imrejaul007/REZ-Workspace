// Habixo Wishlist Screen
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const MOCK_WISHLIST = [
  { id: '1', title: 'Modern Apartment Koramangala', location: 'Koramangala, Bangalore', price: 2500, rating: 4.8, image: 'https://picsum.photos/300/200?random=1' },
  { id: '2', title: 'Beach Villa Goa', location: 'Anjuna, Goa', price: 5500, rating: 4.7, image: 'https://picsum.photos/300/200?random=3' },
];

export default function HabixoWishlist() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState(MOCK_WISHLIST);

  const removeFromWishlist = (id: string) => {
    setWishlist(wishlist.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Wishlist</Text>
        <Text style={styles.count}>{wishlist.length} saved</Text>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💝</Text>
          <Text style={styles.emptyTitle}>No saved properties</Text>
          <Text style={styles.emptyDesc}>Start exploring and save your favorite stays!</Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/habixo/stays')}>
            <Text style={styles.exploreText}>Explore Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={wishlist}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/habixo/property/${item.id}`)}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => removeFromWishlist(item.id)}
              >
                <Text style={styles.heart}>❤️</Text>
              </TouchableOpacity>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.location}>{item.location}</Text>
                <View style={styles.meta}>
                  <Text style={styles.price}>₹{item.price}/night</Text>
                  <Text style={styles.rating}>⭐ {item.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          estimatedItemSize={150}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  count: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  image: { width: '100%', height: 180 },
  heartButton: { position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  heart: { fontSize: 18 },
  info: { padding: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  location: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  rating: { fontSize: 14, color: '#374151' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  exploreButton: { backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  exploreText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
