/**
 * IDENTITY GRAPH API SERVICE
 * Integration with REZ Identity Graph
 *
 * Service: rez-identity-graph
 * URL: https://rez-identity-graph.onrender.com
 *
 * Features:
 * - Unified identity resolution
 * - Cross-device tracking
 * - Identity linking
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface Identity {
  id: string;
  userId: string;
  identifiers: Identifier[];
  devices: Device[];
  sessions: Session[];
}

export interface Identifier {
  type: 'email' | 'phone' | 'device' | 'cookie';
  value: string;
  verified: boolean;
  linkedAt: string;
}

export interface Device {
  id: string;
  type: 'mobile' | 'desktop' | 'tablet';
  fingerprint: string;
  lastSeen: string;
}

export interface Session {
  id: string;
  deviceId: string;
  startedAt: string;
  endedAt?: string;
}

/**
 * Get identity
 */
export async function getIdentity(userId: string): Promise<ApiResponse<Identity>> {
  try {
    return await apiClient.get(`/identity/${userId}`);
  } catch (error) {
    logger.error('identityGraphApi.getIdentity', { userId, error });
    throw error;
  }
}

/**
 * Link identifier
 */
export async function linkIdentifier(userId: string, type: Identifier['type'], value: string): Promise<ApiResponse<Identity>> {
  try {
    return await apiClient.post(`/identity/${userId}/identifiers`, { type, value });
  } catch (error) {
    logger.error('identityGraphApi.linkIdentifier', { userId, type, error });
    throw error;
  }
}

/**
 * Unlink identifier
 */
export async function unlinkIdentifier(userId: string, type: Identifier['type'], value: string): Promise<ApiResponse<Identity>> {
  try {
    return await apiClient.delete(`/identity/${userId}/identifiers/${type}/${encodeURIComponent(value)}`);
  } catch (error) {
    logger.error('identityGraphApi.unlinkIdentifier', { userId, type, value, error });
    throw error;
  }
}

/**
 * Resolve identity (by identifier)
 */
export async function resolveIdentity(type: Identifier['type'], value: string): Promise<ApiResponse<{ userId: string }>> {
  try {
    return await apiClient.get(`/identity/resolve?type=${type}&value=${encodeURIComponent(value)}`);
  } catch (error) {
    logger.error('identityGraphApi.resolveIdentity', { type, value, error });
    throw error;
  }
}

/**
 * Merge identities
 */
export async function mergeIdentities(sourceUserId: string, targetUserId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/identity/merge', { sourceUserId, targetUserId });
  } catch (error) {
    logger.error('identityGraphApi.merge', { sourceUserId, targetUserId, error });
    throw error;
  }
}

export default {
  getIdentity,
  linkIdentifier,
  unlinkIdentifier,
  resolveIdentity,
  mergeIdentities,
};
