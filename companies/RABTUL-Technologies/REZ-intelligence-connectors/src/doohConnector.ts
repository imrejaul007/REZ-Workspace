/**
 * DOOH Service - Event Connector
 *
 * Hook into DOOH service to emit events
 */

import { eventConnector } from './eventConnectors';

export interface DOOHConnector {
  /**
   * Hook: Ad impression
   */
  onAdImpression(ad: {
    screenId: string;
    userId?: string;
    campaignId: string;
    adId: string;
    location?: { lat: number; lng: number };
    viewerCount?: number;
  }): void;

  /**
   * Hook: Ad viewed (meaningful view)
   */
  onAdViewed(ad: {
    screenId: string;
    userId?: string;
    campaignId: string;
    adId: string;
    viewDuration: number;
    location?: { lat: number; lng: number };
  }): void;

  /**
   * Hook: Ad interaction
   */
  onAdInteraction(ad: {
    screenId: string;
    userId?: string;
    campaignId: string;
    adId: string;
    interactionType: 'tap' | 'scan_qr' | 'call' | 'directions' | 'website';
    location?: { lat: number; lng: number };
  }): void;

  /**
   * Hook: Ad conversion
   */
  onAdConversion(ad: {
    screenId: string;
    userId: string;
    campaignId: string;
    adId: string;
    conversionType: 'order' | 'visit' | 'call' | 'website';
    value?: number;
  }): void;

  /**
   * Hook: Screen content changed
   */
  onScreenContentChanged(screen: {
    screenId: string;
    contentType: 'ad' | 'weather' | 'news' | 'promo';
    contentId?: string;
  }): void;

  /**
   * Hook: Screen online/offline
   */
  onScreenStatusChanged(screen: {
    screenId: string;
    status: 'online' | 'offline' | 'error';
    reason?: string;
  }): void;
}

export function createDOOHConnector(): DOOHConnector {
  return {
    onAdImpression: (ad) => {
      eventConnector.emit('dooh.ad.impression', {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        adId: ad.adId,
        location: ad.location,
        viewerCount: ad.viewerCount,
        impressionAt: new Date().toISOString()
      }, {
        userId: ad.userId,
        correlationId: ad.campaignId
      });
    },

    onAdViewed: (ad) => {
      eventConnector.emit('dooh.ad.viewed', {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        adId: ad.adId,
        viewDuration: ad.viewDuration,
        location: ad.location,
        viewedAt: new Date().toISOString()
      }, {
        userId: ad.userId,
        correlationId: ad.campaignId
      });
    },

    onAdInteraction: (ad) => {
      eventConnector.emit('dooh.ad.interaction', {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        adId: ad.adId,
        interactionType: ad.interactionType,
        location: ad.location,
        interactedAt: new Date().toISOString()
      }, {
        userId: ad.userId,
        correlationId: ad.campaignId
      });
    },

    onAdConversion: (ad) => {
      eventConnector.emit('dooh.ad.conversion', {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        adId: ad.adId,
        conversionType: ad.conversionType,
        value: ad.value,
        convertedAt: new Date().toISOString()
      }, {
        userId: ad.userId,
        correlationId: ad.campaignId
      });
    },

    onScreenContentChanged: (screen) => {
      eventConnector.emit('dooh.screen.content_changed', {
        screenId: screen.screenId,
        contentType: screen.contentType,
        contentId: screen.contentId,
        changedAt: new Date().toISOString()
      }, {
        correlationId: screen.screenId
      });
    },

    onScreenStatusChanged: (screen) => {
      eventConnector.emit('dooh.screen.status_changed', {
        screenId: screen.screenId,
        status: screen.status,
        reason: screen.reason,
        changedAt: new Date().toISOString()
      }, {
        correlationId: screen.screenId
      });
    }
  };
}

export const doohConnector = createDOOHConnector();
export default doohConnector;
