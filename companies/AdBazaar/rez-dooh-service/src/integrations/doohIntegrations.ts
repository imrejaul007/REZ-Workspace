/**
 * REZ Ecosystem Integrations for DOOH Service
 *
 * Connects DOOH to:
 * - RABTUL Platform (Analytics, Notifications)
 * - REZ Intelligence (Intent Prediction, Targeting, Segments)
 * - REZ Media (Ad Attribution, Karma)
 */

import axios from 'axios';

// Configuration
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4016';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

// Types
interface Screen {
  screenId: string;
  type: 'cab_tablet' | 'retail_kiosk' | 'elevator_screen' | 'billboard_led' | 'restaurant_order';
  location: { lat: number; lng: number; address: string };
  ownerId: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface AdContent {
  adId: string;
  content: string;
  duration: number;
  targetSegments: string[];
}

interface ViewingEvent {
  screenId: string;
  userId?: string;
  timestamp: string;
  duration: number;
  impression: boolean;
}

class DOOHIntegrations {
  /**
   * Select optimal ad content based on nearby users' intent
   */
  async selectAdContent(screen: Screen, _time: Date): Promise<{
    ad: AdContent;
    targetCount: number;
    intent: string;
    confidence: number;
  }> {
    try {
      // Get nearby users
      const nearbyUsers = await this.getNearbyUsers(screen.location, 500); // 500m radius

      if (nearbyUsers.length === 0) {
        return {
          ad: await this.getDefaultAd(),
          targetCount: 0,
          intent: 'general',
          confidence: 0,
        };
      }

      // Get intent predictions for nearby users
      const intentPredictions = await Promise.all(
        nearbyUsers.map(userId =>
          axios.post(
            `${INTELLIGENCE_URL}/api/intent/predict`,
            { userId },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
              },
            }
          ).catch(() => null)
        )
      );

      // Aggregate intents
      const intentCounts: Record<string, number> = {};
      let totalConfidence = 0;

      intentPredictions.forEach(pred => {
        if (pred?.data?.primaryIntent) {
          intentCounts[pred.data.primaryIntent] = (intentCounts[pred.data.primaryIntent] || 0) + 1;
          totalConfidence += pred.data.confidence || 0;
        }
      });

      // Find dominant intent
      const dominantIntent = Object.entries(intentCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general';

      // Get ad for this intent
      const ad = await this.getAdForIntent(dominantIntent, screen.type);

      return {
        ad,
        targetCount: nearbyUsers.length,
        intent: dominantIntent,
        confidence: intentPredictions.length > 0 ? totalConfidence / intentPredictions.length : 0,
      };
    } catch (error) {
      logger.error('Ad content selection failed:', error);
      return {
        ad: await this.getDefaultAd(),
        targetCount: 0,
        intent: 'general',
        confidence: 0,
      };
    }
  }

  /**
   * Get ad content for specific intent
   */
  private async getAdForIntent(intent: string, screenType: string): Promise<AdContent> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/recommend/dooh-content`,
        {
          intent,
          screenType,
          limit: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data.ad || await this.getDefaultAd();
    } catch {
      return this.getDefaultAd();
    }
  }

  /**
   * Get default ad content
   */
  private async getDefaultAd(): Promise<AdContent> {
    return {
      adId: 'default',
      content: 'ReZ - Your Digital Lifestyle',
      duration: 15,
      targetSegments: ['general'],
    };
  }

  /**
   * Get users near a location
   */
  private async getNearbyUsers(location: { lat: number; lng: number }, radius: number): Promise<string[]> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/location/nearby-users`,
        {
          lat: location.lat,
          lng: location.lng,
          radius,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data.users || [];
    } catch {
      return [];
    }
  }

  /**
   * Track viewing event
   */
  async trackViewing(event: ViewingEvent): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    // Track in analytics
    await axios.post(
      `${ANALYTICS_URL}/api/events`,
      {
        event: 'dooh_view',
        properties: {
          screenId: event.screenId,
          duration: event.duration,
          impression: event.impression,
          timestamp: event.timestamp,
        },
        userId: event.userId,
      },
      { headers }
    );

    // If impression, track for attribution
    if (event.impression && event.userId) {
      await axios.post(
        `${INTELLIGENCE_URL}/api/attribution/track`,
        {
          userId: event.userId,
          event: 'impression',
          channel: 'dooh',
          metadata: {
            screenId: event.screenId,
            duration: event.duration,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
    }
  }

  /**
   * Get screen analytics
   */
  async getScreenAnalytics(screenId: string, period: 'day' | 'week' | 'month'): Promise<{
    views: number;
    uniqueUsers: number;
    avgDuration: number;
    conversions: number;
  }> {
    try {
      const response = await axios.post(
        `${ANALYTICS_URL}/api/metrics`,
        {
          metric: 'dooh_views',
          screenId,
          period,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
          },
        }
      );
      return response.data;
    } catch {
      return { views: 0, uniqueUsers: 0, avgDuration: 0, conversions: 0 };
    }
  }

  /**
   * Get CPM prediction for screen
   */
  async getCPMPrediction(screen: Screen): Promise<{
    cpm: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/predict/dooh-cpm`,
        {
          screenType: screen.type,
          location: screen.location,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch {
      // Default CPM by screen type
      const defaultCPM: Record<string, number> = {
        'cab_tablet': 20,
        'retail_kiosk': 15,
        'elevator_screen': 12,
        'billboard_led': 100,
        'restaurant_order': 15,
      };
      return {
        cpm: defaultCPM[screen.type] || 15,
        confidence: 0.5,
        factors: ['screen_type', 'default'],
      };
    }
  }

  /**
   * Notify screen owner
   */
  async notifyOwner(ownerId: string, screenId: string, type: 'alert' | 'earnings' | 'update', message: string): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    await axios.post(
      `${NOTIFICATION_URL}/api/notifications/send`,
      {
        userId: ownerId,
        type: 'push',
        title: type === 'alert' ? 'Screen Alert' : type === 'earnings' ? 'Earnings Update' : 'Update',
        message,
        data: { type, screenId },
      },
      { headers }
    );
  }

  /**
   * Award karma for viewing
   */
  async awardViewKarma(userId: string, screenId: string, duration: number): Promise<void> {
    // Only award for extended viewing (30+ seconds)
    if (duration < 30 || !userId) return;

    try {
      await axios.post(
        `${INTELLIGENCE_URL}/api/karma/award`,
        {
          userId,
          action: 'dooh_view',
          value: Math.floor(duration / 10), // 1 karma per 10 seconds
          metadata: { screenId, duration },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
    } catch (error) {
      logger.error('Karma award failed:', error);
    }
  }
}

export const doohIntegrations = new DOOHIntegrations();
export default doohIntegrations;
