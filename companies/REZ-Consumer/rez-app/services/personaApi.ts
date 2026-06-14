/**
 * Persona API Service
 *
 * Handles user persona retrieval, feed configuration, and anchor location
 * management. Used by identity layer and persona-based homepage customisation.
 */

import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonaResponse {
  segment: string;
  statedIdentity: string | null;
  featureLevel: number;
  verificationSegment: string;
  instituteStatus: string;
  instituteName: string | null;
  companyName: string | null;
}

export interface FeedConfigSection {
  id: string;
  weight: number;
  enabled: boolean;
  personaRelevance: string[];
}

export interface FeedConfigResponse {
  sections: FeedConfigSection[];
  personaId: string;
  version: string;
}

export interface AnchorLocation {
  type: 'home' | 'work' | 'campus' | 'other';
  label: string;
  lat: number;
  lng: number;
  campusId?: string;
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetch the current user's persona from the backend.
 *
 * GET /api/persona/me
 */
export async function getMyPersona(): Promise<PersonaResponse | null> {
  try {
    const response = await apiClient.get<PersonaResponse>('/persona/me');
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch the server-side feed configuration for the current user's persona.
 * Used to override or supplement client-side section ordering.
 *
 * GET /api/persona/feed-config
 */
export async function getFeedConfig(): Promise<FeedConfigResponse | null> {
  try {
    const response = await apiClient.get<FeedConfigResponse>('/persona/feed-config');
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Update the user's anchor locations (home, work, campus).
 * Used to improve proximity-based section ranking.
 *
 * PUT /api/persona/anchor-locations
 */
export async function updateAnchorLocations(
  locations: AnchorLocation[]
): Promise<boolean> {
  try {
    const response = await apiClient.put<unknown>('/persona/anchor-locations', { locations });
    return !!response.success;
  } catch {
    return false;
  }
}

export default {
  getMyPersona,
  getFeedConfig,
  updateAnchorLocations,
};
