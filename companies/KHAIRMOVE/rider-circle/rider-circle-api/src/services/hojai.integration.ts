/**
 * HOJAI Integration Service
 * Connects RiderCircle to HOJAI Genie, Memory, and Knowledge Graph
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { Ride } from '../models/ride';
import { RiderProfile } from '../models/rider';
import { BikeDigitalTwin } from '../models/bike';

// HOJAI Service URLs
const HOJAI_SERVICES = {
  genie: process.env.HOJAI_AGENT_URL || 'http://localhost:4700',
  memory: process.env.HOJAI_MEMORY_URL || 'http://localhost:4015',
  knowledgeGraph: process.env.HOJAI_KG_URL || 'http://localhost:4786',
  vector: process.env.HOJAI_VECTOR_URL || 'http://localhost:4720',
};

export interface GenieResponse {
  response: string;
  action?: string;
  data?: Record<string, any>;
}

export interface MemoryContext {
  riderId: string;
  recentRides?: string[];
  preferredRoutes?: string[];
  bikePreferences?: string[];
  ridingStyle?: string;
}

export interface KnowledgeEntity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  relationships?: {
    type: string;
    target: string;
    properties?: Record<string, any>;
  }[];
}

export class HOJAIIntegration {
  private genieClient: AxiosInstance;
  private memoryClient: AxiosInstance;
  private kgClient: AxiosInstance;
  private vectorClient: AxiosInstance;

  constructor() {
    this.genieClient = axios.create({
      baseURL: HOJAI_SERVICES.genie,
      timeout: 30000,
    });

    this.memoryClient = axios.create({
      baseURL: HOJAI_SERVICES.memory,
      timeout: 15000,
    });

    this.kgClient = axios.create({
      baseURL: HOJAI_SERVICES.knowledgeGraph,
      timeout: 15000,
    });

    this.vectorClient = axios.create({
      baseURL: HOJAI_SERVICES.vector,
      timeout: 15000,
    });
  }

  // ==========================================
  // GENIE AI ASSISTANT
  // ==========================================

  /**
   * Send a message to Genie AI
   */
  async chatWithGenie(
    riderId: string,
    message: string,
    context?: {
      currentRide?: string;
      location?: [number, number];
      bikeId?: string;
    }
  ): Promise<GenieResponse> {
    try {
      const response = await this.genieClient.post('/api/genie/chat', {
        rider_id: riderId,
        message,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug(`Genie response for ${riderId}:`, response.data);
      return response.data;
    } catch (error) {
      logger.error('Genie chat failed:', error);

      // Fallback response
      return {
        response: "I'm having trouble connecting to Genie. Please try again later.",
        action: 'error',
      };
    }
  }

  /**
   * Get route recommendations from Genie
   */
  async getRouteRecommendation(
    riderId: string,
    preferences: {
      startLocation: [number, number];
      distance?: 'short' | 'medium' | 'long';
      difficulty?: 'easy' | 'moderate' | 'hard';
      style?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.genieClient.post('/api/routes/recommend', {
        rider_id: riderId,
        current_location: {
          lat: preferences.startLocation[1],
          lng: preferences.startLocation[0],
        },
        distance_preference: preferences.distance || 'medium',
        difficulty_preference: preferences.difficulty || 'moderate',
        riding_style: preferences.style || 'tourer',
      });

      return response.data;
    } catch (error) {
      logger.error('Route recommendation failed:', error);
      return { routes: [], reasoning: 'Unable to get recommendations at this time.' };
    }
  }

  /**
   * Get bike maintenance advice from Genie
   */
  async getMaintenanceAdvice(bikeId: string): Promise<any> {
    try {
      const bike = await BikeDigitalTwin.findById(bikeId);
      if (!bike) {
        return { recommendations: ['Bike not found.'] };
      }

      const response = await this.genieClient.post('/api/bike/health', {
        bike_id: bikeId,
        odometer: bike.odometer,
        tire_health_front: bike.tireHealth.front,
        tire_health_rear: bike.tireHealth.rear,
        chain_condition: bike.chainCondition,
        brake_health_front: bike.brakeHealth.front,
        brake_health_rear: bike.brakeHealth.rear,
        oil_condition: bike.oilCondition,
        battery_health: bike.batteryHealth,
        insurance_expiry: bike.documents.insurance.expiryDate,
        puc_expiry: bike.documents.pollution?.expiryDate,
      });

      return response.data;
    } catch (error) {
      logger.error('Maintenance advice failed:', error);
      return {
        recommendations: ['Unable to get maintenance advice at this time.'],
        predictions: {},
      };
    }
  }

  // ==========================================
  // MEMORY PLATFORM
  // ==========================================

  /**
   * Store ride memory in HOJAI Memory
   */
  async storeRideMemory(
    riderId: string,
    rideData: {
      rideId: string;
      title: string;
      story: string;
      distance: number;
      duration: number;
      companions?: string[];
      locations?: string[];
    }
  ): Promise<void> {
    try {
      // Store structured memory
      await this.memoryClient.post('/api/v1/memories', {
        userId: riderId,
        type: 'ride_experience',
        content: `Ride: ${rideData.title}\n\n${rideData.story}`,
        metadata: {
          rideId: rideData.rideId,
          distance: rideData.distance,
          duration: rideData.duration,
          companions: rideData.companions,
          locations: rideData.locations,
          timestamp: new Date().toISOString(),
        },
        tags: [
          'ridercircle',
          'ride',
          'motorcycle',
          `distance_${Math.round(rideData.distance / 50) * 50}km`,
        ],
      });

      logger.debug(`Memory stored for rider ${riderId}, ride ${rideData.rideId}`);
    } catch (error) {
      logger.error('Failed to store memory:', error);
    }
  }

  /**
   * Search rider's memory
   */
  async searchMemory(riderId: string, query: string): Promise<any[]> {
    try {
      const response = await this.memoryClient.post('/api/v1/memories/search', {
        userId: riderId,
        query,
        limit: 10,
      });

      return response.data.memories || [];
    } catch (error) {
      logger.error('Memory search failed:', error);
      return [];
    }
  }

  /**
   * Get rider context for personalization
   */
  async getRiderContext(riderId: string): Promise<MemoryContext> {
    try {
      // Get recent rides
      const recentRides = await Ride.find({ riderId })
        .sort({ startTime: -1 })
        .limit(10)
        .select('_id route.name');

      const recentRideIds = recentRides.map(r => r._id.toString());

      // Get rider profile
      const rider = await RiderProfile.findById(riderId);
      const bikes = await BikeDigitalTwin.find({ riderId });

      return {
        riderId,
        recentRides: recentRideIds,
        preferredRoutes: recentRides
          .filter(r => r.route?.name)
          .map(r => r.route.name!),
        bikePreferences: bikes.map(b => `${b.make} ${b.model}`),
        ridingStyle: rider?.ridingStyle,
      };
    } catch (error) {
      logger.error('Failed to get rider context:', error);
      return { riderId };
    }
  }

  // ==========================================
  // KNOWLEDGE GRAPH
  // ==========================================

  /**
   * Get recommendations based on knowledge graph
   */
  async getGraphRecommendations(
    riderId: string,
    type: 'riders' | 'routes' | 'destinations' | 'groups'
  ): Promise<any[]> {
    try {
      const response = await this.kgClient.get(`/api/${type}/recommendations/${riderId}`);
      return response.data.data || [];
    } catch (error) {
      logger.error(`Graph recommendations (${type}) failed:`, error);
      return [];
    }
  }

  /**
   * Create knowledge graph entity
   */
  async createGraphEntity(entity: KnowledgeEntity): Promise<void> {
    try {
      await this.kgClient.post('/api/entities', entity);
      logger.debug(`Graph entity created: ${entity.type} - ${entity.name}`);
    } catch (error) {
      logger.error('Failed to create graph entity:', error);
    }
  }

  /**
   * Create relationship in knowledge graph
   */
  async createGraphRelationship(
    fromId: string,
    toId: string,
    relationshipType: string,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      await this.kgClient.post('/api/relationships', {
        from: fromId,
        to: toId,
        type: relationshipType,
        properties,
      });
      logger.debug(`Graph relationship created: ${fromId} -${relationshipType}-> ${toId}`);
    } catch (error) {
      logger.error('Failed to create graph relationship:', error);
    }
  }

  /**
   * Search knowledge graph
   */
  async searchGraph(query: string, types?: string[]): Promise<any[]> {
    try {
      const response = await this.kgClient.get('/api/search', {
        params: {
          q: query,
          types: types?.join(','),
        },
      });
      return response.data.data || [];
    } catch (error) {
      logger.error('Graph search failed:', error);
      return [];
    }
  }

  // ==========================================
  // VECTOR EMBEDDINGS
  // ==========================================

  /**
   * Get embedding for text
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.vectorClient.post('/api/embed', {
        text,
      });
      return response.data.embedding || [];
    } catch (error) {
      logger.error('Embedding failed:', error);
      return [];
    }
  }

  /**
   * Search similar content using embeddings
   */
  async semanticSearch(
    riderId: string,
    query: string,
    limit = 5
  ): Promise<any[]> {
    try {
      // Get query embedding
      const embedding = await this.getEmbedding(query);
      if (!embedding.length) return [];

      const response = await this.vectorClient.post('/api/search', {
        userId: riderId,
        embedding,
        limit,
      });

      return response.data.results || [];
    } catch (error) {
      logger.error('Semantic search failed:', error);
      return [];
    }
  }

  // ==========================================
  // RIDE EVENTS
  // ==========================================

  /**
   * Handle ride completed - sync to HOJAI
   */
  async onRideCompleted(ride: any): Promise<void> {
    const riderId = ride.riderId.toString();

    // Store memory
    await this.storeRideMemory(riderId, {
      rideId: ride._id.toString(),
      title: ride.title,
      story: ride.memory?.story || 'Completed a ride.',
      distance: ride.route.distance,
      duration: ride.duration || 0,
    });

    // Create graph relationships
    await this.createGraphRelationship(
      riderId,
      ride._id.toString(),
      'COMPLETED',
      { distance: ride.route.distance, date: ride.startTime }
    );

    // Update trust score based on ride
    if (ride.route.distance > 100) {
      const rider = await RiderProfile.findById(riderId);
      if (rider) {
        // Increase trust score for longer rides
        const trustIncrease = Math.min(5, ride.route.distance / 50);
        rider.trustScore = Math.min(100, rider.trustScore + trustIncrease);
        await rider.save();
      }
    }
  }

  /**
   * Handle SOS event - notify nearby riders
   */
  async onSOSTriggered(sosData: {
    sosId: string;
    riderId: string;
    coordinates: [number, number];
    type: string;
  }): Promise<void> {
    try {
      // Get nearby riders from knowledge graph
      const nearbyRiders = await this.kgClient.get('/api/riders/nearby', {
        params: {
          lat: sosData.coordinates[1],
          lng: sosData.coordinates[0],
          radius: 20, // km
        },
      });

      // Return list for notification service
      return nearbyRiders.data.data || [];
    } catch (error) {
      logger.error('Failed to get nearby riders for SOS:', error);
      return [];
    }
  }
}

// Singleton instance
let hojaiIntegration: HOJAIIntegration | null = null;

export function getHOJAIIntegration(): HOJAIIntegration {
  if (!hojaiIntegration) {
    hojaiIntegration = new HOJAIIntegration();
  }
  return hojaiIntegration;
}
