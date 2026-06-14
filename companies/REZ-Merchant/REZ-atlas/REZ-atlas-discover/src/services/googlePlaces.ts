/**
 * REZ Atlas Discover - Google Places Service
 */

import axios from 'axios';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  phone?: string;
  website?: string;
  rating?: {
    overall: number;
    count: number;
  };
}

interface SearchOptions {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
}

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  }

  /**
   * Search places by text query
   */
  async searchPlaces(options: SearchOptions): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return [];
    }

    try {
      const params: any = {
        key: this.apiKey,
        query: options.query,
        language: 'en'
      };

      if (options.lat && options.lng) {
        params.location = `${options.lat},${options.lng}`;
        params.radius = options.radius || 5000;
      }

      const response = await axios.get(`${this.baseUrl}/textsearch/json`, { params });

      return this.transformResults(response.data.results || []);
    } catch (error) {
      console.error('Google Places search error:', error);
      return [];
    }
  }

  /**
   * Search nearby places
   */
  async nearbySearch(options: SearchOptions): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return [];
    }

    try {
      const params: any = {
        key: this.apiKey,
        location: `${options.lat},${options.lng}`,
        radius: options.radius || 5000,
        language: 'en'
      };

      if (options.type) {
        params.type = options.type;
      }

      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, { params });

      return this.transformResults(response.data.results || []);
    } catch (error) {
      console.error('Google Places nearby search error:', error);
      return [];
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          key: this.apiKey,
          place_id: placeId,
          fields: 'name,formatted_address,geometry,formatted_phone_number,website,rating,types'
        }
      });

      const result = response.data.result;
      if (!result) return null;

      return {
        placeId,
        name: result.name,
        address: result.formatted_address,
        lat: result.geometry?.location?.lat || 0,
        lng: result.geometry?.location?.lng || 0,
        category: result.types?.[0] || 'business',
        phone: result.formatted_phone_number,
        website: result.website,
        rating: result.rating ? { overall: result.rating, count: 0 } : undefined
      };
    } catch (error) {
      console.error('Google Places details error:', error);
      return null;
    }
  }

  /**
   * Transform Google Places results to our format
   */
  private transformResults(results: any[]): PlaceResult[] {
    return results.map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity,
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
      category: place.types?.[0] || 'business',
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating ? { overall: place.rating, count: place.user_ratings_total || 0 } : undefined
    }));
  }
}