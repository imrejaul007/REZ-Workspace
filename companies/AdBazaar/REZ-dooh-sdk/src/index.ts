import logger from './utils/logger';

/**
 * REZ DOOH SDK - Digital Out of Home Advertising SDK
 *
 * Features:
 * - Screen registration
 * - Content management
 * - Scheduling
 * - Real-time updates
 * - Analytics
 */

import axios from 'axios';

// ============================================
// CONFIG
// ============================================

const DEFAULT_CONFIG = {
  apiUrl: 'https://dooh-service.onrender.com',
  refreshInterval: 30000,
  heartbeatInterval: 60000
};

interface DOOHConfig {
  apiUrl?: string;
  refreshInterval?: number;
  heartbeatInterval?: number;
  screenId: string;
  apiKey: string;
}

let config: DOOHConfig;
let heartbeatInterval: NodeJS.Timeout;
let contentRefreshInterval: NodeJS.Timeout;
let currentContent: unknown = null;
let onContentChange: ((content) => void) | null = null;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize DOOH SDK
 */
export function init(options: DOOHConfig): void {
  config = {
    ...DEFAULT_CONFIG,
    ...options
  };

  // Register screen
  registerScreen();

  // Start heartbeat
  startHeartbeat();

  // Start content refresh
  startContentRefresh();

  logger.info(`[DOOH SDK] Initialized for screen ${config.screenId}`);
}

/**
 * Register this screen with the DOOH service
 */
async function registerScreen(): Promise<void> {
  try {
    await axios.post(`${config.apiUrl}/api/screens/register`, {
      screen_id: config.screenId,
      timestamp: new Date().toISOString()
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });

    logger.info(`[DOOH SDK] Screen registered: ${config.screenId}`);
  } catch (error) {
    logger.error('[DOOH SDK] Failed to register screen:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Start heartbeat to keep screen alive
 */
function startHeartbeat(): void {
  heartbeatInterval = setInterval(async () => {
    try {
      await axios.post(`${config.apiUrl}/api/screens/heartbeat`, {
        screen_id: config.screenId,
        timestamp: new Date().toISOString()
      }, {
        headers: { 'X-API-Key': config.apiKey }
      });
    } catch (error) {
      logger.error('[DOOH SDK] Heartbeat failed:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, config.heartbeatInterval);
}

/**
 * Start content refresh loop
 */
function startContentRefresh(): void {
  contentRefreshInterval = setInterval(async () => {
    await refreshContent();
  }, config.refreshInterval);

  // Initial fetch
  refreshContent();
}

// ============================================
// CONTENT MANAGEMENT
// ============================================

/**
 * Get current content for this screen
 */
export async function getContent(): Promise<unknown> {
  try {
    const response = await axios.get(`${config.apiUrl}/api/screens/${config.screenId}/content`, {
      headers: { 'X-API-Key': config.apiKey }
    });

    return response.data;
  } catch (error) {
    logger.error('[DOOH SDK] Failed to get content:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Refresh content and notify listeners
 */
async function refreshContent(): Promise<void> {
  try {
    const content = await getContent();

    if (content && JSON.stringify(content) !== JSON.stringify(currentContent)) {
      currentContent = content;

      if (onContentChange) {
        onContentChange(content);
      }
    }
  } catch (error) {
    logger.error('[DOOH SDK] Content refresh failed:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Set callback for content changes
 */
export function onContentUpdate(callback: (content) => void): void {
  onContentChange = callback;

  // Immediately call with current content if available
  if (currentContent) {
    callback(currentContent);
  }
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Track impression
 */
export async function trackImpression(adId: string): Promise<void> {
  try {
    await axios.post(`${config.apiUrl}/api/analytics/impression`, {
      screen_id: config.screenId,
      ad_id: adId,
      timestamp: new Date().toISOString()
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });
  } catch (error) {
    logger.error('[DOOH SDK] Failed to track impression:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Track view duration
 */
export async function trackView(adId: string, duration: number): Promise<void> {
  try {
    await axios.post(`${config.apiUrl}/api/analytics/view`, {
      screen_id: config.screenId,
      ad_id: adId,
      duration_seconds: duration,
      timestamp: new Date().toISOString()
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });
  } catch (error) {
    logger.error('[DOOH SDK] Failed to track view:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Track click/interaction
 */
export async function trackInteraction(adId: string, type: string): Promise<void> {
  try {
    await axios.post(`${config.apiUrl}/api/analytics/interaction`, {
      screen_id: config.screenId,
      ad_id: adId,
      interaction_type: type,
      timestamp: new Date().toISOString()
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });
  } catch (error) {
    logger.error('[DOOH SDK] Failed to track interaction:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Report screen health
 */
export async function reportHealth(health: {
  cpu?: number;
  memory?: number;
  network?: string;
  display?: string;
}): Promise<void> {
  try {
    await axios.post(`${config.apiUrl}/api/screens/${config.screenId}/health`, {
      ...health,
      timestamp: new Date().toISOString()
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });
  } catch (error) {
    logger.error('[DOOH SDK] Failed to report health:', { error: error instanceof Error ? error.message : String(error) });
  }
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

/**
 * Get screen info
 */
export async function getScreenInfo(): Promise<unknown> {
  try {
    const response = await axios.get(`${config.apiUrl}/api/screens/${config.screenId}`, {
      headers: { 'X-API-Key': config.apiKey }
    });

    return response.data;
  } catch (error) {
    logger.error('[DOOH SDK] Failed to get screen info:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Update screen location
 */
export async function updateLocation(lat: number, lng: number): Promise<void> {
  try {
    await axios.patch(`${config.apiUrl}/api/screens/${config.screenId}`, {
      location: { lat, lng }
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });
  } catch (error) {
    logger.error('[DOOH SDK] Failed to update location:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Get playlist for this screen
 */
export async function getPlaylist(): Promise<unknown[]> {
  try {
    const response = await axios.get(`${config.apiUrl}/api/screens/${config.screenId}/playlist`, {
      headers: { 'X-API-Key': config.apiKey }
    });

    return response.data.playlist || [];
  } catch (error) {
    logger.error('[DOOH SDK] Failed to get playlist:', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Request specific content
 */
export async function requestContent(contentId: string): Promise<unknown> {
  try {
    const response = await axios.post(`${config.apiUrl}/api/screens/${config.screenId}/request`, {
      content_id: contentId
    }, {
      headers: { 'X-API-Key': config.apiKey }
    });

    return response.data;
  } catch (error) {
    logger.error('[DOOH SDK] Failed to request content:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// ============================================
// CLEANUP
// ============================================

/**
 * Cleanup and stop all intervals
 */
export function destroy(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  if (contentRefreshInterval) {
    clearInterval(contentRefreshInterval);
  }

  // Unregister screen
  axios.post(`${config.apiUrl}/api/screens/unregister`, {
    screen_id: config.screenId
  }, {
    headers: { 'X-API-Key': config.apiKey }
  }).catch(() => {});

  logger.info(`[DOOH SDK] Destroyed for screen ${config.screenId}`);
}

// ============================================
// EXPORTS
// ============================================

export default {
  init,
  getContent,
  onContentUpdate,
  trackImpression,
  trackView,
  trackInteraction,
  reportHealth,
  getScreenInfo,
  updateLocation,
  getPlaylist,
  requestContent,
  destroy
};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-dooh-sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
