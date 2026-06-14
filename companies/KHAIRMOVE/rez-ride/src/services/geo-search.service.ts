import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * GeoSearch Service - Location search using Google Places / Mapbox
 */

@Injectable()
export class GeoSearchService {
  private readonly logger = new Logger('GeoSearchService');

  private readonly GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  private readonly MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  private readonly CACHE_TTL = 3600; // 1 hour

  // Cache for search results
  private searchCache = new Map<string, { data: any; expires: number }>();

  /**
   * Search for places using text query
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<SearchResult[]> {
    if (!query || query.length < 3) {
      return [];
    }

    const cacheKey = `search:${query}:${location?.lat}:${location?.lng}`;

    // Check cache
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      let results: SearchResult[] = [];

      if (this.MAPBOX_ACCESS_TOKEN) {
        results = await this.searchMapbox(query, location);
      } else if (this.GOOGLE_MAPS_API_KEY) {
        results = await this.searchGoogle(query, location);
      } else {
        // Fallback to mock data
        results = this.getMockResults(query);
      }

      // Cache results
      this.searchCache.set(cacheKey, {
        data: results,
        expires: Date.now() + this.CACHE_TTL * 1000,
      });

      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      return this.getMockResults(query);
    }
  }

  /**
   * Search using Mapbox
   */
  private async searchMapbox(query: string, location?: { lat: number; lng: number }): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      access_token: this.MAPBOX_ACCESS_TOKEN!,
      types: 'poi,address',
      limit: '10',
    });

    if (location) {
      params.set('proximity', `${location.lng},${location.lat}`);
    }

    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
      { params }
    );

    return response.data.features.map((f: any) => ({
      id: f.id,
      address: f.place_name,
      name: f.text,
      lat: f.center[1],
      lng: f.center[0],
      type: this.getTypeFromLayer(f.place_type),
      placeId: f.id,
    }));
  }

  /**
   * Search using Google Places
   */
  private async searchGoogle(query: string, location?: { lat: number; lng: number }): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      key: this.GOOGLE_MAPS_API_KEY!,
      query,
      language: 'en-IN',
    });

    if (location) {
      params.set('location', `${location.lat},${location.lng}`);
      params.set('radius', '5000');
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      { params }
    );

    return response.data.results.map((r: any) => ({
      id: r.place_id,
      address: r.formatted_address,
      name: r.name,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      type: r.types[0],
      placeId: r.place_id,
      rating: r.rating,
      openNow: r.opening_hours?.open_now,
    }));
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!placeId) return null;

    try {
      if (this.GOOGLE_MAPS_API_KEY) {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/details/json',
          {
            params: {
              key: this.GOOGLE_MAPS_API_KEY,
              place_id: placeId,
              fields: 'formatted_address,name,geometry,opening_hours,photos,rating,reviews',
            },
          }
        );

        const r = response.data.result;
        return {
          address: r.formatted_address,
          name: r.name,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          openingHours: r.opening_hours?.weekday_text,
          photos: r.photos?.map((p: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${this.GOOGLE_MAPS_API_KEY}`),
          rating: r.rating,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Get details failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get current location
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      if (this.MAPBOX_ACCESS_TOKEN) {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
          { params: { access_token: this.MAPBOX_ACCESS_TOKEN, types: 'address' } }
        );

        return response.data.features[0]?.place_name || null;
      }

      if (this.GOOGLE_MAPS_API_KEY) {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/geocode/json',
          { params: { latlng: `${lat},${lng}`, key: this.GOOGLE_MAPS_API_KEY } }
        );

        return response.data.results[0]?.formatted_address || null;
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      this.logger.error(`Reverse geocode failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private getTypeFromLayer(types: string[]): string {
    if (types.includes('poi')) return 'landmark';
    if (types.includes('address')) return 'address';
    return types[0] || 'place';
  }

  private getMockResults(query: string): SearchResult[] {
    const allPlaces = [
      { id: '1', name: 'MG Road Metro Station', address: 'MG Road, Bangalore', lat: 12.9758, lng: 77.5964, type: 'train_station' },
      { id: '2', name: 'Koramangala 5th Block', address: 'Koramangala 5th Block, Bangalore', lat: 12.9352, lng: 77.6245, type: 'neighborhood' },
      { id: '3', name: 'Indiranagar 100ft Road', address: 'Indiranagar, Bangalore', lat: 12.9784, lng: 77.6408, type: 'road' },
      { id: '4', name: 'Bangalore International Airport', address: 'Devanahalli, Bangalore', lat: 13.1979, lng: 77.7063, type: 'airport' },
      { id: '5', name: 'Majestic Bus Station', address: 'Majestic, Bangalore', lat: 12.9762, lng: 77.5715, type: 'bus_station' },
      { id: '6', name: 'Bangalore City Railway Station', address: 'City Railway Station, Bangalore', lat: 12.9784, lng: 77.5712, type: 'train_station' },
      { id: '7', name: 'Forum Mall Koramangala', address: 'Forum Mall, Hosur Road, Bangalore', lat: 12.9351, lng: 77.6102, type: 'mall' },
      { id: '8', name: 'UB City', address: 'Vittal Mallya Road, Bangalore', lat: 12.9716, lng: 77.5920, type: 'mall' },
      { id: '9', name: 'Phoenix Marketcity', address: 'Whitefield, Bangalore', lat: 12.9852, lng: 77.6972, type: 'mall' },
      { id: '10', name: 'ISKCON Temple', address: 'Hare Krishna Hill, Bangalore', lat: 13.0096, lng: 77.5510, type: 'temple' },
      { id: '11', name: 'Lalbagh Botanical Garden', address: 'Lalbagh, Bangalore', lat: 12.9507, lng: 77.5848, type: 'park' },
      { id: '12', name: 'Cubbon Park', address: 'Cubbon Park, Bangalore', lat: 12.9755, lng: 77.5918, type: 'park' },
    ];

    const q = query.toLowerCase();
    return allPlaces.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  }
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  placeId?: string;
  rating?: number;
  openNow?: boolean;
}

export interface PlaceDetails {
  address: string;
  name: string;
  lat: number;
  lng: number;
  openingHours?: string[];
  photos?: string[];
  rating?: number;
}
