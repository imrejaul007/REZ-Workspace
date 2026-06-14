/**
 * Identity Graph Service
 * User identity resolution and profile unification
 */

import apiClient from './apiClient';
import type { ApiResponse } from './apiClient';

export interface IdentityProfile {
  odId: string;
  identifiers: {
    email?: string;
    phone?: string;
    deviceId?: string;
    sessionId?: string;
  };
  traits: {
    preferences: Record<string, unknown>;
    segments: string[];
    score: number;
  };
  lastSeen: string;
}

export async function resolveIdentity(identifiers: { email?: string; phone?: string }): Promise<ApiResponse<IdentityProfile>> {
  try {
    const response = await apiClient.post('/identity/resolve', { identifiers });
    return response as ApiResponse<IdentityProfile>;
  } catch (error) {
    return { success: false, error: 'Failed to resolve identity' };
  }
}

export async function mergeProfiles(primaryId: string, secondaryId: string): Promise<ApiResponse<{ merged: boolean }>> {
  try {
    const response = await apiClient.post('/identity/merge', { primaryId, secondaryId });
    return response as ApiResponse<{ merged: boolean }>;
  } catch {
    return { success: false, error: 'Failed to merge profiles' };
  }
}
