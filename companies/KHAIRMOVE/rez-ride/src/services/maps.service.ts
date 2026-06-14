import { logger } from '../../shared/logger';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Route {
  distanceKm: number;
  distanceMeters: number;
  durationMinutes: number;
  durationSeconds: number;
  polyline?: string;
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  startLocation: Location;
  endLocation: Location;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
}

@Injectable()
export class MapsService {
  private readonly googleMapsApiKey: string;
  private readonly mapboxToken: string;

  constructor(private configService: ConfigService) {
    this.googleMapsApiKey = configService.get('GOOGLE_MAPS_API_KEY', '');
    this.mapboxToken = configService.get('MAPBOX_ACCESS_TOKEN', '');
  }

  /**
   * Get route between two points
   */
  async getRoute(origin: Location, destination: Location): Promise<Route | null> {
    try {
      // Try Google Maps first
      if (this.googleMapsApiKey) {
        return await this.getGoogleRoute(origin, destination);
      }

      // Fallback to Mapbox
      if (this.mapboxToken) {
        return await this.getMapboxRoute(origin, destination);
      }

      // Fallback to Haversine distance
      return this.getHaversineRoute(origin, destination);
    } catch (error) {
      logger.error('Route calculation error:', error);
      return this.getHaversineRoute(origin, destination);
    }
  }

  /**
   * Get route using Google Maps
   */
  private async getGoogleRoute(origin: Location, destination: Location): Promise<Route | null> {
    const url = `https://maps.googleapis.com/maps/api/directions/json`;

    const response = await axios.get(url, {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: this.googleMapsApiKey,
        mode: 'driving',
      },
    });

    if (response.data.status !== 'OK' || !response.data.routes[0]) {
      return null;
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      distanceKm: leg.distance.value / 1000,
      distanceMeters: leg.distance.value,
      durationMinutes: Math.ceil(leg.duration.value / 60),
      durationSeconds: leg.duration.value,
      polyline: route.overview_polyline.points,
      steps: leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distanceMeters: step.distance.value,
        durationSeconds: step.duration.value,
        startLocation: {
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        },
        endLocation: {
          lat: step.end_location.lat,
          lng: step.end_location.lng,
        },
      })),
    };
  }

  /**
   * Get route using Mapbox
   */
  private async getMapboxRoute(origin: Location, destination: Location): Promise<Route | null> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

    const response = await axios.get(url, {
      params: {
        access_token: this.mapboxToken,
        geometries: 'polyline',
        steps: true,
      },
    });

    if (!response.data.routes?.[0]) {
      return null;
    }

    const route = response.data.routes[0];
    const legs = route.legs;

    return {
      distanceKm: route.distance / 1000,
      distanceMeters: route.distance,
      durationMinutes: Math.ceil(route.duration / 60),
      durationSeconds: route.duration,
      polyline: route.geometry,
      steps: legs.flatMap((leg: any) =>
        leg.steps.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distanceMeters: step.distance,
          durationSeconds: step.duration,
          startLocation: {
            lat: step.maneuver.location[1],
            lng: step.maneuver.location[0],
          },
          endLocation: {
            lat: step.maneuver.location[1],
            lng: step.maneuver.location[0],
          },
        }))
      ),
    };
  }

  /**
   * Fallback: Calculate straight-line distance using Haversine formula
   */
  private getHaversineRoute(origin: Location, destination: Location): Route {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLng = this.toRad(destination.lng - origin.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(origin.lat)) *
        Math.cos(this.toRad(destination.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate time: assume average speed of 30 km/h for city driving
    const durationMinutes = Math.ceil((distanceKm / 30) * 60);

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMeters: Math.round(distanceKm * 1000),
      durationMinutes,
      durationSeconds: durationMinutes * 60,
    };
  }

  /**
   * Geocode address to coordinates
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    try {
      if (this.googleMapsApiKey) {
        return await this.googleGeocode(address);
      }

      if (this.mapboxToken) {
        return await this.mapboxGeocode(address);
      }

      return null;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Google Maps geocoding
   */
  private async googleGeocode(address: string): Promise<GeocodingResult | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;

    const response = await axios.get(url, {
      params: {
        address,
        key: this.googleMapsApiKey,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results[0]) {
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const getComponent = (type: string) =>
      result.address_components.find((c: any) => c.types.includes(type))?.long_name;

    return {
      lat: location.lat,
      lng: location.lng,
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      city: getComponent('locality') || getComponent('sublocality'),
      state: getComponent('administrative_area_level_1'),
      country: getComponent('country'),
      pincode: getComponent('postal_code'),
    };
  }

  /**
   * Mapbox geocoding
   */
  private async mapboxGeocode(address: string): Promise<GeocodingResult | null> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;

    const response = await axios.get(url, {
      params: {
        access_token: this.mapboxToken,
        limit: 1,
      },
    });

    if (!response.data.features?.[0]) {
      return null;
    }

    const result = response.data.features[0];
    const [lng, lat] = result.center;

    return {
      lat,
      lng,
      address: result.place_name,
      formattedAddress: result.place_name,
      city: result.context?.find((c: any) => c.id.startsWith('place'))?.text,
      state: result.context?.find((c: any) => c.id.startsWith('region'))?.text,
      country: result.context?.find((c: any) => c.id.startsWith('country'))?.text,
      pincode: result.context?.find((c: any) => c.id.startsWith('postcode'))?.text,
    };
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      if (this.googleMapsApiKey) {
        return await this.googleReverseGeocode(lat, lng);
      }

      if (this.mapboxToken) {
        return await this.mapboxReverseGeocode(lat, lng);
      }

      return null;
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Google Maps reverse geocoding
   */
  private async googleReverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;

    const response = await axios.get(url, {
      params: {
        latlng: `${lat},${lng}`,
        key: this.googleMapsApiKey,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results[0]) {
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    const getComponent = (type: string) =>
      result.address_components.find((c: any) => c.types.includes(type))?.long_name;

    return {
      lat: location.lat,
      lng: location.lng,
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      city: getComponent('locality') || getComponent('sublocality'),
      state: getComponent('administrative_area_level_1'),
      country: getComponent('country'),
      pincode: getComponent('postal_code'),
    };
  }

  /**
   * Mapbox reverse geocoding
   */
  private async mapboxReverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;

    const response = await axios.get(url, {
      params: {
        access_token: this.mapboxToken,
        types: 'address',
        limit: 1,
      },
    });

    if (!response.data.features?.[0]) {
      return null;
    }

    const result = response.data.features[0];

    return {
      lat,
      lng,
      address: result.place_name,
      formattedAddress: result.place_name,
    };
  }

  /**
   * Autocomplete address suggestions
   */
  async autocomplete(query: string, location?: Location): Promise<AutocompleteResult[]> {
    try {
      if (this.googleMapsApiKey) {
        return await this.googleAutocomplete(query, location);
      }

      if (this.mapboxToken) {
        return await this.mapboxAutocomplete(query, location);
      }

      return [];
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Google Maps autocomplete
   */
  private async googleAutocomplete(query: string, location?: Location): Promise<AutocompleteResult[]> {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;

    const params: any = {
      input: query,
      key: this.googleMapsApiKey,
      types: 'address',
    };

    if (location) {
      params.location = `${location.lat},${location.lng}`;
      params.radius = 50000;
    }

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK') {
      return [];
    }

    return response.data.predictions.map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
      lat: 0, // Would need another API call to get coordinates
      lng: 0,
    }));
  }

  /**
   * Mapbox autocomplete
   */
  private async mapboxAutocomplete(query: string, location?: Location): Promise<AutocompleteResult[]> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

    const params: any = {
      access_token: this.mapboxToken,
      types: 'address',
      limit: 5,
    };

    if (location) {
      params.proximity = `${location.lng},${location.lat}`;
    }

    const response = await axios.get(url, { params });

    return response.data.features.map((feature: any) => {
      const [lng, lat] = feature.center;
      return {
        placeId: feature.id,
        description: feature.place_name,
        mainText: feature.text,
        secondaryText: feature.place_name.replace(feature.text + ', ', ''),
        lat,
        lng,
      };
    });
  }

  /**
   * Calculate ETA between two points
   */
  async getETA(origin: Location, destination: Location): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route?.durationMinutes || 30;
  }

  /**
   * Calculate distance between two points
   */
  async getDistance(origin: Location, destination: Location): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route?.distanceKm || 0;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
