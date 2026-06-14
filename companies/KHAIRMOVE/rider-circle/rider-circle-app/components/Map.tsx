/**
 * Map Components
 * Using react-native-maps for map display
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// Note: In production, install react-native-maps
// npm install react-native-maps
// For now, we use a placeholder

interface MapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  children?: React.ReactNode;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onRegionChange?: (region: any) => void;
  onPress?: (event: any) => void;
}

export function MapView(props: MapViewProps) {
  const { style, initialRegion, children } = props;

  // Placeholder map view
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapText}>
          {initialRegion
            ? `${initialRegion.latitude.toFixed(4)}, ${initialRegion.longitude.toFixed(4)}`
            : 'Map View'}
        </Text>
        {children}
      </View>
    </View>
  );
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
}

export function Marker(props: MarkerProps) {
  const { coordinate, title, pinColor = '#e94560' } = props;

  return (
    <View style={styles.markerContainer}>
      <View style={[styles.marker, { backgroundColor: pinColor }]}>
        <Text style={styles.markerIcon}>📍</Text>
      </View>
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </View>
  );
}

interface PolylineProps {
  coordinates: Array<{ latitude: number; longitude: number }>;
  strokeColor?: string;
  strokeWidth?: number;
}

export function Polyline(props: PolylineProps) {
  const { coordinates, strokeColor = '#e94560', strokeWidth = 3 } = props;

  if (coordinates.length < 2) return null;

  return (
    <View style={styles.polylineContainer}>
      {/* In production, this would render actual polyline */}
      <Text style={styles.polylineInfo}>
        Route: {coordinates.length} points
      </Text>
    </View>
  );
}

interface CircleProps {
  center: { latitude: number; longitude: number };
  radius?: number;
  fillColor?: string;
  strokeColor?: string;
}

export function Circle(props: CircleProps) {
  const { center, radius = 1000, fillColor = 'rgba(233, 69, 96, 0.2)' } = props;

  return (
    <View style={styles.circleContainer}>
      <View
        style={[
          styles.circle,
          {
            width: radius / 10,
            height: radius / 10,
            borderRadius: radius / 20,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

interface CalloutProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Callout(props: CalloutProps) {
  const { title, description, children } = props;

  return (
    <View style={styles.calloutContainer}>
      {title && <Text style={styles.calloutTitle}>{title}</Text>}
      {description && <Text style={styles.calloutDescription}>{description}</Text>}
      {children}
    </View>
  );
}

// Map region helpers
export function regionFrom(lat: number, lng: number, latDelta = 0.01, lngDelta = 0.01) {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  mapText: {
    fontSize: 14,
    color: '#888',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 20,
  },
  markerTitle: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  polylineContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#1a1a2e',
    padding: 8,
    borderRadius: 8,
  },
  polylineInfo: {
    fontSize: 12,
    color: '#888',
  },
  circleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderWidth: 2,
    borderColor: 'rgba(233, 69, 96, 0.5)',
  },
  calloutContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
  },
});
