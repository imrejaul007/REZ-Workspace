import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * REZ-Intelligence Integration
 * Interfaces with Consumer 360 Profile, REZ-Mind, REZ-Intent-Graph, and Karma (Agent OS)
 */

interface ConsumerProfile {
 userId: string;
 name?: string;
 email?: string;
 phone?: string;
 avatar?: string;
 location?: {
   city?: string;
   state?: string;
   coordinates?: { lat: number; lng: number };
 };
 karmaScore?: number;
 trustLevel?: string;
 preferences?: Record<string, unknown>;
 tags?: string[];
}

interface SpamCheckResult {
 isSpam: boolean;
 confidence: number;
 reason?: string;
}

interface IntentEvent {
 eventType: string;
 source: string;
 data: Record<string, unknown>;
 timestamp: string;
}

// Create axios instance for REZ-Intelligence services
const getClient = (baseUrl: string): AxiosInstance => {
 return axios.create({
   baseURL: baseUrl,
   timeout: 10000,
   headers: {
     'Content-Type': 'application/json',
     'X-Internal-Token': config.internalToken,
   },
 });
};

/**
 * Consumer 360 Profile Integration
 */
export const consumer360 = {
 /**
  * Get consumer profile from REZ-Intent-Graph
  */
 async getProfile(userId: string): Promise<ConsumerProfile | null> {
   try {
     const client = getClient(config.rezIntelligence.intentGraph.url);
     const response = await client.get(`/api/profiles/consumer/${userId}`);
     return response.data;
   } catch (error: unknown) {
     logger.error('Consumer 360 profile fetch failed:', String(error));
     return null;
   }
 },

 /**
  * Update consumer profile
  */
 async updateProfile(
   userId: string,
   updates: Partial<ConsumerProfile>
 ): Promise<boolean> {
   try {
     const client = getClient(config.rezIntelligence.intentGraph.url);
     await client.patch(`/api/profiles/consumer/${userId}`, updates);
     return true;
   } catch (error: unknown) {
     logger.error('Consumer 360 profile update failed:', String(error));
     return false;
   }
 },

 /**
  * Enrich Safe QR profile with consumer data
  */
 async enrichProfile(
   ownerId: string,
   profileData: Record<string, unknown>
 ): Promise<Record<string, unknown>> {
   const consumer = await this.getProfile(ownerId);

   if (!consumer) {
     return profileData;
   }

   return {
     ...profileData,
     ownerName: consumer.name || 'Anonymous',
     ownerAvatar: consumer.avatar,
     ownerLocation: consumer.location,
     ownerTrustLevel: consumer.trustLevel,
     ownerKarmaScore: consumer.karmaScore,
     showContact: consumer.preferences?.safeQRShowContact || false,
   };
 },
};

/**
 * REZ-Mind Spam Detection Integration
 */
export const rezMind = {
 /**
  * Check if content is spam
  */
 async checkSpam(content: string): Promise<boolean> {
   try {
     const client = getClient(config.rezIntelligence.mind.url);
     const response = await client.post<SpamCheckResult>('/api/moderate', {
       text: content,
       context: 'safe_qr_message',
     });
     return response.data.isSpam;
   } catch (error: unknown) {
     logger.error('REZ-Mind spam check failed:', String(error));
     // Fail open for now
     return false;
   }
 },

 /**
  * Check user trust score
  */
 async getTrustScore(userId: string): Promise<number> {
   try {
     const client = getClient(config.rezIntelligence.mind.url);
     const response = await client.get<{ score: number }>(`/api/trust/${userId}`);
     return response.data.score;
   } catch (error: unknown) {
     logger.error('REZ-Mind trust score fetch failed:', String(error));
     return 50; // Default neutral score
   }
 },

 /**
  * Update user trust score
  */
 async updateTrustScore(userId: string, delta: number): Promise<boolean> {
   try {
     const client = getClient(config.rezIntelligence.mind.url);
     await client.post(`/api/trust/${userId}`, { delta });
     return true;
   } catch (error: unknown) {
     logger.error('REZ-Mind trust score update failed:', String(error));
     return false;
   }
 },
};

/**
 * REZ-Intent-Graph Integration
 */
export const intentGraph = {
 /**
  * Track Safe QR scan intent
  */
 async trackIntent(intent: IntentEvent): Promise<void> {
   try {
     const client = getClient(config.rezIntelligence.intentGraph.url);
     await client.post('/api/events', intent);
   } catch (error: unknown) {
     logger.error('Intent tracking failed:', String(error));
     // Non-critical, don't throw
   }
 },

 /**
  * Track scan event
  */
 async trackScan(
   userId: string | undefined,
   safeQRId: string,
   mode: string,
   action: string,
   metadata?: Record<string, unknown>
 ): Promise<void> {
   await this.trackIntent({
     eventType: 'safe_qr_scan',
     source: 'safe-qr-service',
     data: {
       userId,
       safeQRId,
       mode,
       action,
       ...metadata,
     },
     timestamp: new Date().toISOString(),
   });
 },

 /**
  * Get analytics for Safe QR
  */
 async getAnalytics(safeQRId: string): Promise<unknown | null> {
   try {
     const client = getClient(config.rezIntelligence.intentGraph.url);
     const response = await client.get(`/api/analytics/safe-qr/${safeQRId}`);
     return response.data;
   } catch (error: unknown) {
     logger.error('Analytics fetch failed:', String(error));
     return null;
   }
 },
};

/**
 * REZ-Agent OS (Karma) Integration
 */
export const rezAgentOS = {
 /**
  * Sync karma event to Agent OS
  */
 async syncKarmaEvent(event): Promise<boolean> {
   try {
     const client = getClient(config.rezIntelligence.agentOs.url);
     await client.post('/api/karma/events', {
       source: 'safe-qr-service',
       event,
     });
     return true;
   } catch (error: unknown) {
     logger.error('Karma sync failed:', String(error));
     return false;
   }
 },

 /**
  * Get karma leaderboard from Agent OS
  */
 async getLeaderboard(limit = 10): Promise<unknown[]> {
   try {
     const client = getClient(config.rezIntelligence.agentOs.url);
     const response = await client.get(`/api/karma/leaderboard?limit=${limit}`);
     return response.data;
   } catch (error: unknown) {
     logger.error('Leaderboard fetch failed:', String(error));
     return [];
   }
 },

 /**
  * Get karma state from Agent OS
  */
 async getKarmaState(userId: string): Promise<unknown | null> {
   try {
     const client = getClient(config.rezIntelligence.agentOs.url);
     const response = await client.get(`/api/karma/state/${userId}`);
     return response.data;
   } catch (error: unknown) {
     logger.error('Karma state fetch failed:', String(error));
     return null;
   }
 },

 /**
  * Distribute karma feed post to nearby users
  */
 async distributeFeedPost(post): Promise<boolean> {
   try {
     const client = getClient(config.rezIntelligence.agentOs.url);
     await client.post('/api/karma/feed', {
       source: 'safe-qr-service',
       post,
     });
     return true;
   } catch (error: unknown) {
     logger.error('Feed distribution failed:', String(error));
     return false;
   }
 },
};

/**
 * Unified sync function
 */
export async function syncToRezIntelligence(
 type: 'karma' | 'feed',
 data: Record<string, unknown>
): Promise<void> {
 if (type === 'karma') {
   await rezAgentOS.syncKarmaEvent(data.event as unknown);
 } else if (type === 'feed') {
   await rezAgentOS.distributeFeedPost(data.post as unknown);
 }
}
