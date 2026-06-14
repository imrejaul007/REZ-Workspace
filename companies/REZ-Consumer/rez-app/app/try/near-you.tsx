/**
 * ReZ Try - Near You Screen
 * Shows all trials near user's location
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import type { TrialCard } from '@/services/tryApi';
import * as Location from 'expo-location';

export default function NearYouScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();

  const [trials, setTrials] = useState<TrialCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrials = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await tryApi.getFeed(lat, lng);

      let filtered = data;
      if (category) {
        filtered = data.filter((t: TrialCard) =>
          t.category.toLowerCase() === category.toLowerCase()
        );
      }

      setTrials(filtered);
      setError(null);
    } catch (err) {
      setError('Failed to load trials');
    }
  }, [category]);

  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Default to Mumbai if permission denied
          const defaultLocation = { lat: 19.076, lng: 72.877 };
          setLocation(defaultLocation);
          await loadTrials(defaultLocation.lat, defaultLocation.lng);
        } else {
          const pos = await Location.getCurrentPositionAsync({});
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          await loadTrials(loc.lat, loc.lng);
        }
      } catch (err) {
        // Fallback location
        const defaultLocation = { lat: 19.076, lng: 72.877 };
        setLocation(defaultLocation);
        await loadTrials(defaultLocation.lat, defaultLocation.lng);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadTrials]);

  const handleRefresh = async () => {
    if (!location) return;
    setRefreshing(true);
    await loadTrials(location.lat, location.lng);
    setRefreshing(false);
  };

  const handleTrialPress = (trialId: string) => {
    router.push(`/try/${trialId}`);
  };

  const renderTrial = ({ item }: { item: TrialCard }) => (
    <Pressable
      style={styles.trialCard}
      onPress={() => handleTrialPress(item.id)}
    >
      <View style={styles.trialImage}>
        <Text style={styles.trialEmoji}>
          {item.categoryEmoji || '✨'}
        </Text>
      </View>
      <View style={styles.trialContent}>
        <Text style={styles.trialTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trialMerchant} numberOfLines={1}>
          {item.merchant.name}
        </Text>
        <View style={styles.trialMeta}>
          {item.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
          <Text style={styles.distance}>
            {item.distance} {item.distanceUnit}
          </Text>
        </View>
        <View style={styles.trialPrice}>
          <Text style={styles.coinPrice}>{item.coinPrice} 🪙</Text>
          <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {category ? `${category} Trials` : 'Trials Near You'}
      </Text>
      <Text style={styles.headerSubtitle}>
        {trials.length} trials found
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No trials found</Text>
      <Text style={styles.emptySubtitle}>
        {category
          ? `No ${category} trials near you right now`
          : 'No trials near you right now'}
      </Text>
      <Text style={styles.emptyHint}>
        Try expanding your search or check back later
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
          <Text style={styles.loadingText}>Finding trials near you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>Near You</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={trials}
        renderItem={renderTrial}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.purple}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: spacing.xs,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  trialCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  trialImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialEmoji: {
    fontSize: 36,
  },
  trialContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  trialTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  trialMerchant: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  trialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  distance: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  trialPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  coinPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.purple,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
