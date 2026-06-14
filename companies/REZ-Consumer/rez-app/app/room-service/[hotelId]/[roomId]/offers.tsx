/**
 * Offers Screen
 * Route: /room-service/[hotelId]/[roomId]/offers
 *
 * Shows hotel offers and packages
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const OFFERS = [
  {
    id: '1',
    title: 'Stay & Dine',
    desc: 'Get 20% off on restaurant orders when you stay with us',
    discount: '20% OFF',
    color: '#E07C24',
    icon: 'restaurant',
  },
  {
    id: '2',
    title: 'Spa Package',
    desc: 'Complimentary spa access with 45-min massage',
    discount: 'FREE',
    color: '#9B59B6',
    icon: 'flower',
  },
  {
    id: '3',
    title: 'Late Checkout',
    desc: 'Stay until 3 PM with no extra charge',
    discount: 'LATE OUT',
    color: '#3498DB',
    icon: 'time',
  },
  {
    id: '4',
    title: 'Airport Transfer',
    desc: 'Complimentary pickup/drop service',
    discount: 'FREE',
    color: '#5D8C5A',
    icon: 'car',
  },
];

export default function OffersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hotelId: string; roomId: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#D9656B', '#C0392B']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Special Offers</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Exclusive offers for our guests</Text>

        {OFFERS.map(offer => (
          <TouchableOpacity key={offer.id} style={styles.offerCard}>
            <View style={[styles.offerBadge, { backgroundColor: offer.color }]}>
              <Ionicons name={offer.icon as unknown} size={24} color="#fff" />
            </View>
            <View style={styles.offerContent}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <View style={[styles.discountBadge, { backgroundColor: offer.color + '20' }]}>
                  <Text style={[styles.discountText, { color: offer.color }]}>
                    {offer.discount}
                  </Text>
                </View>
              </View>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
              <TouchableOpacity style={[styles.claimBtn, { backgroundColor: offer.color }]}>
                <Text style={styles.claimText}>Claim Offer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
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
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerContent: { flex: 1, marginLeft: 16 },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  discountText: { fontSize: 12, fontWeight: '700' },
  offerDesc: { fontSize: 13, color: '#666', marginTop: 8 },
  claimBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  claimText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
