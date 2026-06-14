// ExploreMapScreen - Full screen map view for venue exploration
// Features: User location, venue markers, selected venue card

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Locate, X, List, ArrowLeft } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { useChatStore } from '@/stores';
import { rezApi, Entity } from '@/services/rezApi';
import { VenueCallout } from '@/components/VenueCallout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Map configuration
const DEFAULT_REGION: Region = {
  latitude: 12.9716, // Bangalore, India (default)
  longitude: 77.5946,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Category emoji mapping
const CATEGORY_EMOJI: Record<string, string> = {
  restaurants: '🍽️',
  cafes: '☕',
  trials: '✨',
  spa: '💆',
  events: '🎭',
  fitness: '💪',
  default: '📍',
};

// Venue type with coordinates for map display
interface VenueMapItem extends Entity {
  latitude: number;
  longitude: number;
  cuisine?: string;
}

// Generate mock coordinates around user's location
const generateVenueCoordinates = (
  venues: Entity[],
  userLat: number,
  userLng: number
): VenueMapItem[] => {
  return venues.map((venue, index) => {
    // Distribute venues around the user's location
    const angle = (index / Math.max(venues.length, 1)) * 2 * Math.PI;
    const distance = 0.005 + Math.random() * 0.015; // 0.5-2km radius
    return {
      ...venue,
      latitude: userLat + Math.cos(angle) * distance,
      longitude: userLng + Math.sin(angle) * distance,
    };
  });
};

interface ExploreMapScreenProps {
  onClose?: () => void;
  onVenueSelect?: (venueId: string) => void;
}

export const ExploreMapScreen: React.FC<ExploreMapScreenProps> = ({
  onClose,
  onVenueSelect,
}) => {
  const { colors, shadows } = useTheme();
  const { location, setLocation } = useChatStore();

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [venues, setVenues] = useState<VenueMapItem[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueMapItem | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // Request location permission and get user location
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);

      if (granted) {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userPos = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };

        setUserLocation(userPos);
        setLocation({
          lat: userPos.latitude,
          lng: userPos.longitude,
        });

        // Center map on user
        const newRegion: Region = {
          ...userPos,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocationPermission(false);
    }
  }, [setLocation]);

  // Load venues from API
  const loadVenues = useCallback(async () => {
    try {
      const lat = userLocation?.latitude || region.latitude;
      const lng = userLocation?.longitude || region.longitude;

      const [trendingRes, nearbyRes] = await Promise.all([
        rezApi.getTrending(lat, lng),
        rezApi.getNearby({ lat, lng, limit: 30 }),
      ]);

      const allVenues = [...trendingRes, ...nearbyRes];
      const venuesWithCoords = generateVenueCoordinates(
        allVenues,
        userLocation?.latitude || region.latitude,
        userLocation?.longitude || region.longitude
      );

      setVenues(venuesWithCoords);
    } catch (error) {
      console.error('Failed to load venues:', error);
      Alert.alert('Error', 'Failed to load nearby places');
    } finally {
      setLoading(false);
    }
  }, [userLocation, region.latitude, region.longitude]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await requestLocationPermission();
      setLoading(false);
    };
    initialize();
  }, []);

  // Load venues when location is available
  useEffect(() => {
    if (userLocation || locationPermission === false) {
      loadVenues();
    }
  }, [userLocation, locationPermission, loadVenues]);

  // Handle marker press
  const handleMarkerPress = useCallback((venueId: string) => {
    const venue = venues.find((v) => v.id === venueId);
    setSelectedVenue(venue || null);

    if (venue) {
      mapRef.current?.animateToRegion(
        {
          latitude: venue.latitude,
          longitude: venue.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        300
      );
    }
  }, [venues]);

  // Handle venue card press - navigate to details
  const handleVenuePress = useCallback((venueId: string) => {
    onVenueSelect?.(venueId);
    // In a real app, this would navigate to venue detail screen
    Alert.alert('Venue Selected', `View details for venue: ${venueId}`);
  }, [onVenueSelect]);

  // Handle directions
  const handleDirections = useCallback(async (venue: VenueMapItem) => {
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = Platform.OS === 'ios'
      ? `${scheme}?daddr=${venue.latitude},${venue.longitude}`
      : `${scheme}${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open maps application');
    }
  }, []);

  // Center on user location
  const handleCenterOnUser = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        300
      );
    } else {
      requestLocationPermission();
    }
  }, [userLocation, requestLocationPermission]);

  // Handle map region change
  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Render user location marker
  const renderUserMarker = () => {
    if (!userLocation) return null;

    return (
      <Marker coordinate={userLocation} tracksViewChanges={false}>
        <View style={styles.userMarkerContainer}>
          <View style={[styles.userMarkerInner, { backgroundColor: colors.systemBlue }]} />
          <View style={[styles.userMarkerOuter, { borderColor: colors.systemBlue }]} />
        </View>
      </Marker>
    );
  };

  // Render venue markers
  const renderVenueMarkers = () => {
    return venues.map((venue) => {
      const emoji = CATEGORY_EMOJI[venue.category] || CATEGORY_EMOJI.default;
      const isSelected = selectedVenue?.id === venue.id;

      return (
        <Marker
          key={venue.id}
          coordinate={{
            latitude: venue.latitude,
            longitude: venue.longitude,
          }}
          onPress={() => handleMarkerPress(venue.id)}
          tracksViewChanges={false}
        >
          <View
            style={[
              styles.venueMarkerContainer,
              isSelected && styles.venueMarkerSelected,
              isSelected && shadows.lg,
              {
                backgroundColor: isSelected ? colors.primary : colors.backgroundElevated,
              },
            ]}
          >
            <Text style={styles.venueMarkerEmoji}>{emoji}</Text>
          </View>
        </Marker>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapPadding={{ top: 0, right: 0, bottom: selectedVenue ? 280 : 100, left: 0 }}
        userInterfaceStyle={colors.background === '#000000' ? 'dark' : 'light'}
      >
        {renderUserMarker()}
        {renderVenueMarkers()}
      </MapView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.label }]}>
            Finding places near you...
          </Text>
        </View>
      )}

      {/* Location Permission Alert */}
      {locationPermission === false && !loading && (
        <View style={[styles.permissionBanner, { backgroundColor: colors.systemOrange }]}>
          <MapPin size={20} color="#FFFFFF" />
          <Text style={styles.permissionText}>
            Enable location to see nearby places
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBarContent}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.backgroundElevated }, shadows.sm]}
            onPress={handleClose}
          >
            <X size={22} color={colors.label} />
          </TouchableOpacity>
          <View style={[styles.mapHeaderTitle, { backgroundColor: colors.backgroundElevated }, shadows.sm]}>
            <MapIcon size={16} color={colors.primary} />
            <Text style={[styles.mapHeaderTitleText, { color: colors.label }]}>
              Map View
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.backgroundElevated },
            shadows.md,
          ]}
          onPress={handleCenterOnUser}
        >
          <Locate size={24} color={userLocation ? colors.primary : colors.label} />
        </TouchableOpacity>
      </View>

      {/* Selected Venue Card */}
      {selectedVenue && (
        <View
          style={[
            styles.selectedVenueContainer,
            { bottom: Platform.OS === 'ios' ? 34 : 16 },
          ]}
        >
          <VenueCallout
            id={selectedVenue.id}
            name={selectedVenue.name}
            image={selectedVenue.image}
            category={selectedVenue.category || 'default'}
            cuisine={selectedVenue.cuisine || selectedVenue.subtitle}
            distance={selectedVenue.distance}
            rating={selectedVenue.rating}
            reviewCount={selectedVenue.reviewCount}
            priceRange={selectedVenue.priceRange}
            karmaDiscount={selectedVenue.karmaDiscount}
            onPress={handleVenuePress}
            onDirections={handleDirections}
          />

          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: colors.backgroundElevated },
              shadows.sm,
            ]}
            onPress={() => setSelectedVenue(null)}
          >
            <X size={20} color={colors.label} />
          </TouchableOpacity>
        </View>
      )}

      {/* Venue Count Badge */}
      {!selectedVenue && venues.length > 0 && (
        <View
          style={[
            styles.venueCountBadge,
            { backgroundColor: colors.backgroundElevated },
            shadows.md,
          ]}
        >
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.venueCountText, { color: colors.label }]}>
            {venues.length} places nearby
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  permissionBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    zIndex: 50,
  },
  permissionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mapHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  mapHeaderTitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    position: 'absolute',
    right: 16,
    bottom: 150,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedVenueContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: -60,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueMarkerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueMarkerSelected: {
    transform: [{ scale: 1.15 }],
  },
  venueMarkerEmoji: {
    fontSize: 24,
  },
  userMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  userMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  userMarkerOuter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    opacity: 0.3,
  },
  venueCountBadge: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  venueCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExploreMapScreen;
