// @ts-nocheck
/**
 * Nearby Stores Map
 *
 * Uses react-native-maps (v1.20.1, installed) and expo-location.
 * Shows user's current position and markers for nearby stores.
 * Tapping a marker navigates to /store-detail?storeId=<id>.
 * A floating "List View" button returns to the previous screen.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import apiClient from '@/services/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NearbyStore {
  _id: string;
  name: string;
  cashbackPercent?: number;
  cashback?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  logo?: string;
  address?: string;
}

interface Coords {
  lat: number;
  lng: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#1a3a52';
const GOLD = '#FFD700';
const BG = '#F7F9FC';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#475569';
const TEXT_MUTED = '#94A3B8';
const BORDER = '#E2E8F0';
const MAP_DELTA = 0.02;

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchNearbyStores(lat: number, lng: number): Promise<NearbyStore[]> {
  const res = await apiClient.get<unknown>(`/stores/feed?lat=${lat}&lng=${lng}&limit=20`);
  const payload = (res as unknown)?.data ?? res;
  return Array.isArray(payload?.stores) ? payload.stores : Array.isArray(payload) ? payload : [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoreLat(store: NearbyStore): number | null {
  const v = store.lat ?? store.latitude;
  return typeof v === 'number' ? v : null;
}

function getStoreLng(store: NearbyStore): number | null {
  const v = store.lng ?? store.longitude;
  return typeof v === 'number' ? v : null;
}

function getCashback(store: NearbyStore): number {
  return store.cashbackPercent ?? store.cashback ?? 0;
}

// ─── StoreListItem ────────────────────────────────────────────────────────────

// eslint-disable-next-line react/display-name
const StoreListItem = React.memo(({ store, onPress }: { store: NearbyStore; onPress: (id: string) => void }) => (
  <Pressable
    style={({ pressed }) => [styles.storeRow, pressed && { opacity: 0.8 }]}
    onPress={() => onPress(store._id)}
    accessibilityRole="button"
    accessibilityLabel={`${store.name}, ${getCashback(store)}% cashback`}
  >
    <View style={styles.storeIconBox}>
      <Ionicons name="storefront-outline" size={22} color={PRIMARY} />
    </View>
    <View style={styles.storeInfo}>
      <Text style={styles.storeName} numberOfLines={1}>
        {store.name}
      </Text>
      {store.address ? (
        <Text style={styles.storeAddress} numberOfLines={1}>
          {store.address}
        </Text>
      ) : null}
    </View>
    {getCashback(store) > 0 && (
      <View style={styles.cashbackBadge}>
        <Text style={styles.cashbackText}>{getCashback(store)}% back</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
  </Pressable>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NearbyMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);
  const [showList, setShowList] = useState(false);

  // Fetch user location then nearby stores
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setLocationError('Location permission denied. Enable it in Settings to see nearby stores.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLoadingLocation(false);
        setLoadingStores(true);
        const nearby = await fetchNearbyStores(coords.lat, coords.lng);
        if (!cancelled) setStores(nearby);
      } catch (err) {
        if (!cancelled) setLocationError(err?.message || 'Failed to get location');
      } finally {
        if (!cancelled) {
          setLoadingLocation(false);
          setLoadingStores(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStorePress = useCallback(
    (storeId: string) => {
      router.push(`/store-detail?storeId=${storeId}` as unknown as string);
    },
    [router],
  );

  const region: Region | undefined = userCoords
    ? {
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      }
    : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  const renderListItem = useCallback(
    ({ item }: { item: NearbyStore }) => <StoreListItem store={item} onPress={handleStorePress} />,
    [handleStorePress],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>Nearby Stores</Text>
        <Pressable
          style={styles.toggleBtn}
          onPress={() => setShowList((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={showList ? 'Show map' : 'Show list'}
        >
          <Ionicons name={showList ? 'map-outline' : 'list-outline'} size={22} color={PRIMARY} />
          <Text style={styles.toggleText}>{showList ? 'Map' : 'List'}</Text>
        </Pressable>
      </View>

      {/* Loading / Error states */}
      {loadingLocation ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.statusText}>Getting your location…</Text>
        </View>
      ) : locationError ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={56} color={TEXT_MUTED} />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      ) : showList ? (
        // ── List View ────────────────────────────────────────────────────────
        <View style={styles.listContainer}>
          {userCoords && (
            <View style={styles.coordsBanner}>
              <Ionicons name="navigate-circle-outline" size={16} color={PRIMARY} />
              <Text style={styles.coordsText}>
                {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
              </Text>
            </View>
          )}
          {loadingStores ? (
            <View style={styles.centered}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : stores.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="storefront-outline" size={56} color={TEXT_MUTED} />
              <Text style={styles.statusText}>No stores found nearby</Text>
            </View>
          ) : (
            <FlatList
              data={stores}
              keyExtractor={(item) => item._id}
              renderItem={renderListItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        // ── Map View ─────────────────────────────────────────────────────────
        <View style={styles.mapContainer}>
          {region && (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              showsUserLocation={true}
              showsMyLocationButton={true}
              toolbarEnabled={false}
            >
              {stores.map((store) => {
                const lat = getStoreLat(store);
                const lng = getStoreLng(store);
                if (lat === null || lng === null) return null;
                return (
                  <Marker
                    key={store._id}
                    coordinate={{ latitude: lat, longitude: lng }}
                    pinColor={GOLD}
                    onCalloutPress={() => handleStorePress(store._id)}
                  >
                    <Callout tooltip={false}>
                      <View style={styles.callout}>
                        <Text style={styles.calloutName} numberOfLines={1}>
                          {store.name}
                        </Text>
                        {getCashback(store) > 0 && (
                          <Text style={styles.calloutCashback}>{getCashback(store)}% cashback</Text>
                        )}
                        <Text style={styles.calloutTap}>Tap to view</Text>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          )}

          {loadingStores && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator color={PRIMARY} />
              <Text style={styles.mapLoadingText}>Loading stores…</Text>
            </View>
          )}

          {/* Floating List View button */}
          <Pressable
            style={styles.floatingListBtn}
            onPress={() => setShowList(true)}
            accessibilityRole="button"
            accessibilityLabel="Switch to list view"
          >
            <Ionicons name="list" size={18} color="#FFFFFF" />
            <Text style={styles.floatingListText}>List View</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  statusText: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 21,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  mapLoadingText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  floatingListBtn: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  floatingListText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  callout: {
    minWidth: 140,
    maxWidth: 200,
    padding: 10,
  },
  calloutName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  calloutCashback: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutTap: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  listContainer: {
    flex: 1,
  },
  coordsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  coordsText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '500',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  storeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  cashbackBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
});
