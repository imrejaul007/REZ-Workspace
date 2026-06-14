import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Text, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { platformAlertSimple } from '@/utils/platformAlert';
import storesApi, { Store } from '@/services/storesApi';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { logger } from '@/utils/logger';

interface NearbyStore extends Store {
  distance?: number;
}

function StoreMapScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [mapRef, setMapRef] = useState<MapView | null>(null);

  // Request location permission and get current location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted()) {
            setLocationPermission(false);
            setLoading(false);
          }
          return;
        }

        if (isMounted()) {
          setLocationPermission(true);
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted()) {
          setLocation(currentLocation);
        }
      } catch (error) {
        if (__DEV__) logger.error('Location error:', error);
        if (isMounted()) {
          setLocationPermission(false);
          setLoading(false);
        }
      }
    };

    initializeLocation();
  }, [isMounted]);

  // Fetch nearby stores once location is available
  useEffect(() => {
    const fetchNearbyStores = async () => {
      if (!location) return;

      try {
        const response = await storesApi.getNearbyStores(
          location.coords.latitude,
          location.coords.longitude,
          5, // 5km radius
          20, // limit to 20 stores
        );

        if (isMounted()) {
          if (response.success && response.data) {
            setStores(response.data);
          } else {
            platformAlertSimple('Error', 'Failed to load nearby stores');
          }
          setLoading(false);
        }
      } catch (error) {
        if (__DEV__) logger.error('Fetch stores error:', error);
        if (isMounted()) {
          platformAlertSimple('Error', 'Failed to load nearby stores');
          setLoading(false);
        }
      }
    };

    fetchNearbyStores();
  }, [location, isMounted]);

  const handleMarkerPress = useCallback(
    (store: NearbyStore) => {
      if (mapRef && store.location?.coordinates) {
        mapRef.animateToRegion({
          latitude: store.location.coordinates[0],
          longitude: store.location.coordinates[1],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    },
    [mapRef],
  );

  const handleNavigateToStore = useCallback(
    (storeId: string) => {
      router.push({
        pathname: '/store/[id]',
        params: { id: storeId },
      });
    },
    [router],
  );

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 12.9716, // Default Bangalore
        longitude: 77.5946,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  // locationPermission === null means the permission request hasn't resolved yet (still loading)
  // locationPermission === false means the user explicitly denied permission
  if (locationPermission === false) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Store Locator',
            headerStyle: { backgroundColor: colors.secondary[600] },
            headerTintColor: '#fff',
            headerTitleStyle: { fontSize: 16, fontWeight: '600' },
          }}
        />
        <Ionicons name="location-outline" size={48} color={colors.secondary[600]} />
        <Text style={styles.errorTitle}>Location Access Denied</Text>
        <Text style={styles.errorText}>Please enable location permissions to see nearby stores.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setLocation(null);
            setLocationPermission(null);
            Location.requestForegroundPermissionsAsync().then(({ status }) => {
              if (status === 'granted') {
                Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                }).then((loc) => {
                  if (isMounted()) {
                    setLocation(loc);
                    setLocationPermission(true);
                  }
                });
              } else {
                if (isMounted()) {
                  setLocationPermission(false);
                  setLoading(false);
                }
              }
            });
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Store Locator',
            headerStyle: { backgroundColor: colors.secondary[600] },
            headerTintColor: '#fff',
            headerTitleStyle: { fontSize: 16, fontWeight: '600' },
          }}
        />
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading nearby stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Store Locator',
          headerStyle: { backgroundColor: colors.secondary[600] },
          headerTintColor: '#fff',
          headerTitleStyle: { fontSize: 16, fontWeight: '600' },
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/near-u')}
              style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="list" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <MapView ref={setMapRef} style={styles.map} initialRegion={initialRegion} showsUserLocation followsUserLocation>
        {stores.map((store) => {
          const coords = store.location?.coordinates;
          if (!coords) return null;
          return (
            <Marker
              key={store.id}
              coordinate={{
                latitude: coords[0],
                longitude: coords[1],
              }}
              onPress={() => handleMarkerPress(store)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
              </View>
              <Callout tooltip onPress={() => handleNavigateToStore(store.id)}>
                <View style={styles.callout}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  {(() => {
                    const catName = typeof store.category === 'string' ? store.category : store.category?.name;
                    return catName ? <Text style={styles.category}>{catName}</Text> : null;
                  })()}
                  {store.distance && (
                    <Text style={styles.distance}>
                      {typeof store.distance === 'number' ? `${store.distance.toFixed(1)} km away` : store.distance}
                    </Text>
                  )}
                  <Text style={styles.tapHint}>Tap to view details</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {stores.length === 0 && (
        <View style={styles.noStoresContainer}>
          <Ionicons name="storefront-outline" size={48} color={colors.gray[400]} />
          <Text style={styles.noStoresText}>No stores found nearby</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {stores.length} store{stores.length !== 1 ? 's' : ''} found
        </Text>
      </View>
    </View>
  );
}

export default withErrorBoundary(StoreMapScreen, 'NearUMap');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: 200,
    ...shadows.md,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary[600],
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: 12,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  distance: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  tapHint: {
    fontSize: 11,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  headerButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  statsContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary[600],
    textAlign: 'center',
  },
  noStoresContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  noStoresText: {
    fontSize: 16,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary[600],
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: spacing.md,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary[600],
  },
});
