/**
 * Guest Preference Service - Memory & Personalization
 * Stores and retrieves guest preferences using REZ Intent Graph
 * Enables personalized service recommendations and remembers guest requests
 */

import { authClient } from '@/lib/api/client';
import { publicClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import type { GuestPreferences, RoomPreference } from '@/lib/types';
import { randomBytes } from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────────────

export type PreferenceType = RoomPreference['preferenceType'];

export interface SavePreferencePayload {
  guestId: string;
  roomId: string;
  preferenceType: PreferenceType;
  value: string;
  notes?: string;
}

export interface PreferenceQuery {
  guestId?: string;
  roomId?: string;
  preferenceType?: PreferenceType;
  limit?: number;
}

export interface IntentGraphMemory {
  id: string;
  entityType: 'guest_preference' | 'service_request' | 'feedback' | 'checkout';
  entityId: string;
  guestId: string;
  roomId?: string;
  data: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestMemory {
  id: string;
  guestId: string;
  roomId: string;
  serviceType: string;
  description: string;
  timestamp: string;
  completed: boolean;
  feedback?: {
    rating: number;
    comment?: string;
  };
}

// ── Intent Graph Integration ─────────────────────────────────────────────────────

const INTENT_GRAPH_BASE = process.env.NEXT_PUBLIC_INTENT_GRAPH_URL || 'https://intent.rez.money';
const INTENT_GRAPH_API_KEY = process.env.INTENT_GRAPH_API_KEY || '';

/**
 * Store memory in REZ Intent Graph
 */
async function storeInIntentGraph(
  entityType: IntentGraphMemory['entityType'],
  entityId: string,
  guestId: string,
  data: Record<string, unknown>,
  tags: string[] = [],
  roomId?: string
): Promise<IntentGraphMemory | null> {
  try {
    const response = await publicClient.post(`${INTENT_GRAPH_BASE}/api/memory`, {
      entityType,
      entityId,
      guestId,
      roomId,
      data,
      tags,
    });

    if (response.data.success) {
      return response.data.memory as IntentGraphMemory;
    }
    return null;
  } catch (error) {
    logger.error('Failed to store in intent graph', { entityType, entityId, error });
    return null;
  }
}

/**
 * Retrieve memories from REZ Intent Graph
 */
async function getFromIntentGraph(
  query: PreferenceQuery
): Promise<IntentGraphMemory[]> {
  try {
    const params: Record<string, string> = {};
    if (query.guestId) params.guestId = query.guestId;
    if (query.roomId) params.roomId = query.roomId;
    if (query.preferenceType) params.preferenceType = query.preferenceType;
    if (query.limit) params.limit = query.limit.toString();

    const response = await publicClient.get(`${INTENT_GRAPH_BASE}/api/memory`, { params });

    if (response.data.success) {
      return response.data.memories as IntentGraphMemory[];
    }
    return [];
  } catch (error) {
    logger.error('Failed to retrieve from intent graph', { query, error });
    return [];
  }
}

/**
 * Search memories in REZ Intent Graph
 */
async function searchIntentGraph(
  guestId: string,
  searchQuery: string,
  limit = 10
): Promise<IntentGraphMemory[]> {
  try {
    const response = await publicClient.post(`${INTENT_GRAPH_BASE}/api/memory/search`, {
      guestId,
      query: searchQuery,
      limit,
    });

    if (response.data.success) {
      return response.data.results as IntentGraphMemory[];
    }
    return [];
  } catch (error) {
    logger.error('Failed to search intent graph', { guestId, searchQuery, error });
    return [];
  }
}

// ── Preference Service Functions ─────────────────────────────────────────────────

/**
 * Get guest preferences (from API first, fallback to Intent Graph)
 */
export async function getGuestPreferences(
  guestId: string,
  roomId: string
): Promise<GuestPreferences> {
  try {
    // Try API first
    const { data } = await authClient.get(`/api/room/preferences/${guestId}`, {
      params: { roomId },
    });

    if (data.success) {
      return data.preferences as GuestPreferences;
    }
  } catch (error) {
    logger.error('Failed to fetch preferences from API', { guestId, error });
  }

  // Fallback to Intent Graph
  const memories = await getFromIntentGraph({
    guestId,
    roomId,
    preferenceType: undefined,
    limit: 50,
  });

  const preferences: RoomPreference[] = memories
    .filter((m) => m.entityType === 'guest_preference')
    .map((m) => ({
      preferenceType: (m.data.preferenceType as PreferenceType) || 'general',
      value: m.data.value as string,
      notes: m.data.notes as string | undefined,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

  return {
    guestId,
    roomId,
    preferences,
  };
}

/**
 * Save a guest preference
 */
export async function savePreference(
  payload: SavePreferencePayload
): Promise<RoomPreference | null> {
  const { guestId, roomId, preferenceType, value, notes } = payload;

  try {
    // Save to API
    const { data } = await authClient.post('/api/room/preferences', {
      guestId,
      roomId,
      preferenceType,
      value,
      notes,
    });

    if (data.success) {
      const preference = data.preference as RoomPreference;

      // Also store in Intent Graph for ML/analytics
      await storeInIntentGraph(
        'guest_preference',
        preference.preferenceType + '-' + Date.now(),
        guestId,
        {
          preferenceType,
          value,
          notes,
        },
        ['preference', preferenceType, guestId],
        roomId
      );

      logger.info('Preference saved', { guestId, roomId, preferenceType, value });
      return preference;
    }
  } catch (error) {
    logger.error('Failed to save preference', { payload, error });
  }

  return null;
}

/**
 * Update a guest preference
 */
export async function updatePreference(
  guestId: string,
  roomId: string,
  preferenceType: PreferenceType,
  value: string,
  notes?: string
): Promise<RoomPreference | null> {
  try {
    const { data } = await authClient.put(`/api/room/preferences/${guestId}/${preferenceType}`, {
      roomId,
      value,
      notes,
    });

    if (data.success) {
      return data.preference as RoomPreference;
    }
  } catch (error) {
    logger.error('Failed to update preference', { guestId, preferenceType, error });
  }

  return null;
}

/**
 * Delete a guest preference
 */
export async function deletePreference(
  guestId: string,
  roomId: string,
  preferenceType: PreferenceType
): Promise<boolean> {
  try {
    const { data } = await authClient.delete(
      `/api/room/preferences/${guestId}/${preferenceType}?roomId=${roomId}`
    );

    if (data.success) {
      logger.info('Preference deleted', { guestId, roomId, preferenceType });
      return true;
    }
  } catch (error) {
    logger.error('Failed to delete preference', { guestId, preferenceType, error });
  }

  return false;
}

/**
 * Get preference history for a guest
 */
export async function getPreferenceHistory(
  guestId: string,
  limit = 50
): Promise<RoomPreference[]> {
  try {
    const { data } = await authClient.get(`/api/room/preferences/${guestId}/history`, {
      params: { limit },
    });

    if (data.success) {
      return data.preferences as RoomPreference[];
    }
  } catch (error) {
    logger.error('Failed to fetch preference history', { guestId, error });
  }

  return [];
}

// ── Service Request Memory ───────────────────────────────────────────────────────

/**
 * Remember a service request for future personalization
 */
export async function rememberServiceRequest(
  guestId: string,
  roomId: string,
  serviceType: string,
  description: string,
  completed = false
): Promise<ServiceRequestMemory | null> {
  const memory: ServiceRequestMemory = {
    id: `sr-${Date.now()}-${randomBytes(8).toString('hex')}`,
    guestId,
    roomId,
    serviceType,
    description,
    timestamp: new Date().toISOString(),
    completed,
  };

  // Store in Intent Graph
  const stored = await storeInIntentGraph(
    'service_request',
    memory.id,
    guestId,
    memory as unknown as Record<string, unknown>,
    ['service_request', serviceType, guestId],
    roomId
  );

  if (stored) {
    return memory;
  }

  return null;
}

/**
 * Get service request history for a guest
 */
export async function getServiceRequestHistory(
  guestId: string,
  roomId?: string
): Promise<ServiceRequestMemory[]> {
  const memories = await getFromIntentGraph({
    guestId,
    roomId,
    limit: 100,
  });

  return memories
    .filter((m) => m.entityType === 'service_request')
    .map((m) => m.data as unknown as ServiceRequestMemory);
}

// ── AI-Powered Suggestions ────────────────────────────────────────────────────────

/**
 * Get AI-powered suggestions based on guest history
 */
export async function getAISuggestions(
  guestId: string,
  roomId: string,
  context: 'checkin' | 'checkout' | 'mid-stay' = 'mid-stay'
): Promise<string[]> {
  try {
    const response = await authClient.post('/api/room/ai/suggestions', {
      guestId,
      roomId,
      context,
    });

    if (response.data.success) {
      return response.data.suggestions as string[];
    }
  } catch (error) {
    logger.error('Failed to get AI suggestions', { guestId, context, error });
  }

  return [];
}

/**
 * Analyze guest patterns and return insights
 */
export async function getGuestInsights(
  guestId: string
): Promise<{
  preferredServices: string[];
  frequentRequests: string[];
  averageStayDuration: number;
  preferredCheckInTime?: string;
  dietaryRestrictions: string[];
}> {
  const memories = await getFromIntentGraph({
    guestId,
    limit: 100,
  });

  // Analyze patterns
  const serviceCounts: Record<string, number> = {};
  const requestDescriptions: string[] = [];

  memories.forEach((m) => {
    if (m.entityType === 'service_request') {
      const sr = m.data as unknown as ServiceRequestMemory;
      serviceCounts[sr.serviceType] = (serviceCounts[sr.serviceType] || 0) + 1;
      requestDescriptions.push(sr.description);
    }
    if (m.entityType === 'guest_preference') {
      const pref = m.data as Record<string, unknown>;
      if (pref.preferenceType === 'dietary') {
        // Track dietary preferences
      }
    }
  });

  const preferredServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([service]) => service);

  return {
    preferredServices,
    frequentRequests: requestDescriptions.slice(0, 5),
    averageStayDuration: 2, // Calculate from booking data
    dietaryRestrictions: [],
  };
}

// ── Common Preference Templates ──────────────────────────────────────────────────

export const COMMON_PREFERENCES = {
  pillow: ['firm', 'soft', 'extra-firm', 'memory-foam', 'down'],
  towel: ['bath-sheet', 'hand-towel', 'washcloth', 'extra-soft'],
  temperature: ['cool', 'warm', 'cold', 'extra-warm'],
  lighting: ['dim', 'bright', 'night-light'],
  noise: ['silent', 'some-noise-ok', 'white-noise'],
  wakeup: ['phone-call', 'knock', 'alarm-only'],
  dietary: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'nut-allergy', 'dairy-free'],
};

export const ROOM_AMENITY_PREFERENCES = [
  { type: 'pillow' as PreferenceType, label: 'Pillow Type', options: COMMON_PREFERENCES.pillow },
  { type: 'towel' as PreferenceType, label: 'Towel Preference', options: COMMON_PREFERENCES.towel },
  { type: 'temperature' as PreferenceType, label: 'Room Temperature', options: COMMON_PREFERENCES.temperature },
  { type: 'lighting' as PreferenceType, label: 'Lighting Preference', options: COMMON_PREFERENCES.lighting },
  { type: 'noise' as PreferenceType, label: 'Noise Tolerance', options: COMMON_PREFERENCES.noise },
  { type: 'wakeup' as PreferenceType, label: 'Wake-up Method', options: COMMON_PREFERENCES.wakeup },
];
