import axios from 'axios';
import logger from '../config/logger.js';
import { externalServiceCalls, externalServiceDuration } from '../config/metrics.js';

const EVENT_GRAPH_SERVICE_URL = process.env.EVENT_GRAPH_SERVICE_URL || 'http://localhost:4880';
const PLACE_GRAPH_INDEX_URL = process.env.PLACE_GRAPH_INDEX_URL || 'http://localhost:4816';
const APARTMENT_TARGETING_SERVICE_URL = process.env.APARTMENT_TARGETING_SERVICE_URL || 'http://localhost:4815';

interface VenueData {
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
}

interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  distance: number;
  address: string;
}

interface ApartmentData {
  id: string;
  name: string;
  distance: number;
  residents: number;
}

// Event Graph Integration Service
export class EventGraphService {
  async syncEventToGraph(eventId: string, eventData: {
    name: string;
    sport: string;
    venue: VenueData;
    startDate: string;
    endDate?: string;
  }): Promise<boolean> {
    const startTime = Date.now();
    try {
      await axios.post(`${EVENT_GRAPH_SERVICE_URL}/api/events`, {
        eventId,
        ...eventData,
        source: 'sports-graph-service',
        tags: ['sports', eventData.sport.toLowerCase()]
      }, {
        timeout: 5000,
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      externalServiceCalls.inc({ service: 'event-graph', endpoint: 'syncEvent', status: 'success' });
      logger.info('Event synced to event-graph-service', { eventId });
      return true;
    } catch (error) {
      const err = error as Error;
      externalServiceCalls.inc({ service: 'event-graph', endpoint: 'syncEvent', status: 'error' });
      logger.error('Failed to sync event to event-graph-service', { eventId, error: err.message });
      return false;
    } finally {
      externalServiceDuration.observe(
        { service: 'event-graph', endpoint: 'syncEvent' },
        (Date.now() - startTime) / 1000
      );
    }
  }

  async getRelatedEvents(eventId: string): Promise<string[]> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${EVENT_GRAPH_SERVICE_URL}/api/events/${eventId}/related`, {
        timeout: 5000,
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      externalServiceCalls.inc({ service: 'event-graph', endpoint: 'getRelated', status: 'success' });
      return response.data.relatedEventIds || [];
    } catch (error) {
      externalServiceCalls.inc({ service: 'event-graph', endpoint: 'getRelated', status: 'error' });
      logger.warn('Failed to get related events', { eventId });
      return [];
    } finally {
      externalServiceDuration.observe(
        { service: 'event-graph', endpoint: 'getRelated' },
        (Date.now() - startTime) / 1000
      );
    }
  }
}

// Place Graph Integration Service
export class PlaceGraphService {
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<NearbyPlace[]> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${PLACE_GRAPH_INDEX_URL}/api/places/nearby`, {
        params: { latitude, longitude, radius: radiusKm },
        timeout: 5000,
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      externalServiceCalls.inc({ service: 'place-graph', endpoint: 'getNearby', status: 'success' });
      return response.data.places || [];
    } catch (error) {
      externalServiceCalls.inc({ service: 'place-graph', endpoint: 'getNearby', status: 'error' });
      logger.warn('Failed to get nearby places', { latitude, longitude, radiusKm });
      return this.generateMockNearbyPlaces(latitude, longitude, radiusKm);
    } finally {
      externalServiceDuration.observe(
        { service: 'place-graph', endpoint: 'getNearby' },
        (Date.now() - startTime) / 1000
      );
    }
  }

  // Mock data for development/testing
  private generateMockNearbyPlaces(lat: number, lng: number, radius: number): NearbyPlace[] {
    const categories = ['restaurant', 'bar', 'hotel', 'retail', 'entertainment'];
    const places: NearbyPlace[] = [];

    for (let i = 0; i < Math.floor(radius * 10); i++) {
      places.push({
        id: `place-${i}`,
        name: `${categories[i % categories.length]} ${i + 1}`,
        category: categories[i % categories.length],
        distance: Math.random() * radius,
        address: `${100 + i} Main Street`
      });
    }

    return places;
  }

  async getMerchantCategoryCount(
    latitude: number,
    longitude: number,
    radiusKm: number,
    category?: string
  ): Promise<{ category: string; count: number }[]> {
    const places = await this.getNearbyPlaces(latitude, longitude, radiusKm);

    const categoryMap = new Map<string, number>();
    for (const place of places) {
      const cat = category || place.category;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
}

// Apartment Targeting Integration Service
export class ApartmentTargetingService {
  async getTargetableApartments(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<ApartmentData[]> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${APARTMENT_TARGETING_SERVICE_URL}/api/apartments/nearby`, {
        params: { latitude, longitude, radius: radiusKm },
        timeout: 5000,
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      externalServiceCalls.inc({ service: 'apartment-targeting', endpoint: 'getNearby', status: 'success' });
      return response.data.apartments || [];
    } catch (error) {
      externalServiceCalls.inc({ service: 'apartment-targeting', endpoint: 'getNearby', status: 'error' });
      logger.warn('Failed to get targetable apartments', { latitude, longitude, radiusKm });
      return this.generateMockApartments(latitude, longitude, radiusKm);
    } finally {
      externalServiceDuration.observe(
        { service: 'apartment-targeting', endpoint: 'getNearby' },
        (Date.now() - startTime) / 1000
      );
    }
  }

  private generateMockApartments(lat: number, lng: number, radius: number): ApartmentData[] {
    const apartments: ApartmentData[] = [];

    for (let i = 0; i < Math.floor(radius * 5); i++) {
      apartments.push({
        id: `apt-${i}`,
        name: `Apartment Complex ${i + 1}`,
        distance: Math.random() * radius,
        residents: Math.floor(Math.random() * 500) + 100
      });
    }

    return apartments;
  }

  async getApartmentSegments(
    apartmentIds: string[]
  ): Promise<{ demographic: string; percentage: number }[]> {
    const startTime = Date.now();
    try {
      const response = await axios.post(
        `${APARTMENT_TARGETING_SERVICE_URL}/api/apartments/segments`,
        { apartmentIds },
        {
          timeout: 5000,
          headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
        }
      );

      externalServiceCalls.inc({ service: 'apartment-targeting', endpoint: 'getSegments', status: 'success' });
      return response.data.segments || [];
    } catch (error) {
      externalServiceCalls.inc({ service: 'apartment-targeting', endpoint: 'getSegments', status: 'error' });
      logger.warn('Failed to get apartment segments');
      // Return default segments
      return [
        { demographic: 'young_adults', percentage: 35 },
        { demographic: 'families', percentage: 40 },
        { demographic: 'corporate', percentage: 25 }
      ];
    } finally {
      externalServiceDuration.observe(
        { service: 'apartment-targeting', endpoint: 'getSegments' },
        (Date.now() - startTime) / 1000
      );
    }
  }
}

export const eventGraphService = new EventGraphService();
export const placeGraphService = new PlaceGraphService();
export const apartmentTargetingService = new ApartmentTargetingService();