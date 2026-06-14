/**
 * NBKC Service API
 * Handles all Namma Bengaluru Karma Corps API calls.
 * Routes through: /api/karma/civic-corps/* endpoints.
 */

import apiClient, { ApiResponse } from './apiClient';
import type {
  NBKCStatus,
  NBKCMission,
  LeaderboardEntry,
  JoinMissionsResult,
  CompleteMissionResult,
  GreenActionType,
} from '@/types/entities/nbkc';

export interface JoinCivicCorpsParams {
  ward: string;
  skills?: string[];
  hasVehicle?: boolean;
}

export interface AddGreenActionParams {
  actionType: GreenActionType;
  ward?: string;
  verified?: boolean;
}

export interface MissionListParams {
  ward?: string;
  category?: string;
  limit?: number;
  page?: number;
}

// ── Status ─────────────────────────────────────────────────────────────────────

export async function getCivicCorpsStatus(): Promise<ApiResponse<NBKCStatus>> {
  return apiClient.get<NBKCStatus>('/karma/civic-corps/status');
}

// ── Membership ────────────────────────────────────────────────────────────────

export async function joinCivicCorps(
  params: JoinCivicCorpsParams
): Promise<ApiResponse<{ membership: NBKCStatus['membership']; greenScore: number; greenBengaluruScore: number }>> {
  return apiClient.post('/karma/civic-corps/join', params);
}

// ── Missions ─────────────────────────────────────────────────────────────────

export async function listMissions(
  params?: MissionListParams
): Promise<ApiResponse<{ missions: NBKCMission[]; total: number; page: number }>> {
  return apiClient.get('/karma/civic-corps/missions', params as Record<string, string>);
}

export async function getMission(
  missionId: string
): Promise<ApiResponse<NBKCMission>> {
  return apiClient.get<NBKCMission>(`/karma/civic-corps/missions/${missionId}`);
}

export async function enrollInMission(
  missionId: string
): Promise<ApiResponse<JoinMissionsResult>> {
  return apiClient.post(`/karma/civic-corps/missions/${missionId}/enroll`, {});
}

export async function checkInToMission(
  missionId: string
): Promise<ApiResponse<{ success: boolean; checkedInAt: string }>> {
  return apiClient.post(`/karma/civic-corps/missions/${missionId}/checkin`, {});
}

export async function completeMission(
  missionId: string,
  hoursVolunteered: number,
  verified = false
): Promise<ApiResponse<CompleteMissionResult>> {
  return apiClient.post(`/karma/civic-corps/missions/${missionId}/complete`, {
    hoursVolunteered,
    verified,
  });
}

// ── Green Actions ─────────────────────────────────────────────────────────────

export async function addGreenAction(
  params: AddGreenActionParams
): Promise<ApiResponse<{ greenScore: number; greenBengaluruScore: number; environmentalPoints: number }>> {
  return apiClient.post('/karma/civic-corps/green-action', params);
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export async function getWardLeaderboard(
  ward: string,
  limit = 20
): Promise<ApiResponse<LeaderboardEntry[]>> {
  return apiClient.get<LeaderboardEntry[]>('/karma/civic-corps/leaderboard', { ward, limit: String(limit) });
}

export async function getGlobalLeaderboard(
  limit = 20
): Promise<ApiResponse<LeaderboardEntry[]>> {
  return apiClient.get<LeaderboardEntry[]>('/karma/civic-corps/leaderboard', { limit: String(limit) });
}
