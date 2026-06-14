// ReZ Schedule - REZ Intelligence Integration
import axios from 'axios';
import { logger } from '../utils/logger';

const REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface IntelligenceEvent {
  type: 'booking_created' | 'booking_cancelled' | 'booking_completed' | 'booking_no_show';
  userId: string;
  eventTypeId: string;
  eventTypeTitle: string;
  hostId: string;
  bookingUid: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class IntelligenceService {
  /**
   * Emit booking event to REZ Intelligence
   */
  async emitBookingEvent(event: IntelligenceEvent): Promise<void> {
    try {
      await axios.post(
        `${REZ_INTELLIGENCE_URL}/api/events/booking`,
        {
          type: event.type,
          userId: event.userId,
          entityId: event.bookingUid,
          entityType: 'booking',
          properties: {
            eventTypeId: event.eventTypeId,
            eventTypeTitle: event.eventTypeTitle,
            hostId: event.hostId,
            ...event.metadata,
          },
          timestamp: event.timestamp.toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      logger.info(`[Intelligence] Emitted ${event.type} event for booking ${event.bookingUid}`);
    } catch (error) {
      // Don't fail the booking if intelligence is unavailable
      logger.warn(`[Intelligence] Failed to emit event:`, error);
    }
  }

  /**
   * Get booking prediction (no-show risk)
   */
  async getBookingPrediction(bookingUid: string): Promise<{
    noShowRisk: number;
    confidence: number;
  } | null> {
    try {
      const response = await axios.post(
        `${REZ_INTELLIGENCE_URL}/api/predict/no-show`,
        { bookingUid },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.warn(`[Intelligence] Failed to get prediction for ${bookingUid}:`, error);
      return null;
    }
  }

  /**
   * Get scheduling recommendations for a user
   */
  async getSchedulingRecommendations(userId: string): Promise<{
    optimalSlots: string[];
    busyHours: string[];
    popularDurations: number[];
  } | null> {
    try {
      const response = await axios.get(
        `${REZ_INTELLIGENCE_URL}/api/recommendations/scheduling`,
        {
          params: { userId },
          headers: {
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.warn(`[Intelligence] Failed to get recommendations for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get personalized event type suggestions for a user
   */
  async getEventTypeSuggestions(userId: string): Promise<{
    popularTypes: string[];
    suggestedDurations: number[];
    recommendedLocations: string[];
  } | null> {
    try {
      const response = await axios.get(
        `${REZ_INTELLIGENCE_URL}/api/recommendations/event-types`,
        {
          params: { userId },
          headers: {
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.warn(`[Intelligence] Failed to get event type suggestions:`, error);
      return null;
    }
  }

  /**
   * Analyze booking patterns for a host
   */
  async getHostAnalytics(userId: string, startDate: Date, endDate: Date): Promise<{
    totalBookings: number;
    cancellationRate: number;
    noShowRate: number;
    averageRating: number;
    peakHours: string[];
    popularDays: string[];
  } | null> {
    try {
      const response = await axios.get(
        `${REZ_INTELLIGENCE_URL}/api/analytics/host`,
        {
          params: {
            userId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          headers: {
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.warn(`[Intelligence] Failed to get host analytics:`, error);
      return null;
    }
  }

  /**
   * Get attendee insights (for repeat booking prediction)
   */
  async getAttendeeInsights(attendeeEmail: string): Promise<{
    totalBookings: number;
    cancellationRate: number;
    averageNoShowRate: number;
    preferredEventTypes: string[];
    preferredTimes: string[];
  } | null> {
    try {
      const response = await axios.get(
        `${REZ_INTELLIGENCE_URL}/api/insights/attendee`,
        {
          params: { email: attendeeEmail },
          headers: {
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.warn(`[Intelligence] Failed to get attendee insights:`, error);
      return null;
    }
  }
}

export const intelligenceService = new IntelligenceService();
export default intelligenceService;
