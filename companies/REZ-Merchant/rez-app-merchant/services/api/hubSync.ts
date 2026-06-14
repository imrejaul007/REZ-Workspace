/**
 * Hub Sync API Service
 *
 * Handles the "Post to RestaurantHub" flow for staff shift gaps.
 * Step 1: exchanges the REZ merchant token for a RestaurantHub JWT via
 *         the REZ backend bridge endpoint (POST /auth/rez-bridge).
 * Step 2: calls RestaurantHub /jobs/sync-shifts with the third-party JWT.
 *
 * Replaces the raw `fetch` calls that were inline in
 * staff-shifts/post-to-hub.tsx (MER-HIGH-07 fix).
 */

import axios from 'axios';
import { apiClient } from './client';

export interface DraftJob {
  id: string;
  title: string;
  role: string;
  status: string;
  source: string;
  rezShiftDate?: string;
}

export interface HubSyncResult {
  draftsCreated: number;
  jobs: DraftJob[];
}

const HUB_API_URL =
  (process.env.EXPO_PUBLIC_RESTAURANTHUB_API_URL as string | undefined) ??
  'https://restauranthub.app/api';

const HUB_SYNC_TIMEOUT_MS = 15000;

class HubSyncService {
  /**
   * Exchange the REZ merchant token for a RestaurantHub access token via
   * the REZ backend bridge, then sync shift gaps as draft jobs.
   */
  async syncShifts(rezToken: string): Promise<HubSyncResult> {
    // Step 1: REZ bridge — exchange merchant token for RestaurantHub JWT.
    // Uses the centralized apiClient so the bridge call goes through the
    // normal auth interceptor and path-routing logic.
    const bridgeRes = await apiClient.post<{
      accessToken: string;
      restauranthubUserId: string;
    }>('/auth/rez-bridge', { rezToken });

    const accessToken = (bridgeRes.data as unknown)?.accessToken;
    if (!accessToken) {
      throw new Error('Failed to authenticate with RestaurantHub. Try again later.');
    }

    // Step 2: POST to RestaurantHub with the third-party JWT.
    // Uses axios directly since this call is to an external service that
    // accepts its own Bearer token — the REZ apiClient would inject the
    // wrong token and the path routing would send it to the wrong host.
    const res = await axios.post<HubSyncResult>(
      `${HUB_API_URL}/jobs/sync-shifts`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: HUB_SYNC_TIMEOUT_MS,
      }
    );

    return res.data;
  }
}

export const hubSyncService = new HubSyncService();
export default hubSyncService;
