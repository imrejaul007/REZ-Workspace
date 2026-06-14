/**
 * REZ DOOH → Offline Tracker Connector
 *
 * Connects DOOH screens to REZ Intelligence
 *
 * Tracks:
 * - DOOH impression
 * - QR scan from DOOH
 * - Store visit after DOOH
 * - Purchase after DOOH
 *
 * Enables true offline attribution.
 */

import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const OFFLINE_TRACKER_URL = process.env.OFFLINE_TRACKER_URL || 'http://localhost:4125';
const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://localhost:4129';
const ATTRIBUTION_URL = process.env.ATTRIBUTION_URL || 'http://localhost:4061';

// ============================================================================
// Types
// ============================================================================

export interface DOOHImpression {
  screenId: string;
  campaignId: string;
  adId: string;
  userId?: string;
  viewerCount: number;
  location: { lat: number; lng: number };
  timestamp: string;
}

export interface DOOHQRConversion {
  screenId: string;
  campaignId: string;
  adId: string;
  userId?: string;
  qrCode: string;
  merchantId?: string;
  location: { lat: number; lng: number };
  timestamp: string;
}

export interface DOOHStoreVisit {
  screenId: string;
  campaignId: string;
  userId: string;
  merchantId: string;
  storeVisitId: string;
  distanceFromDOOH: number; // meters
  timestamp: string;
}

export interface DOOHPurchase {
  screenId: string;
  campaignId: string;
  userId: string;
  merchantId: string;
  purchaseId: string;
  amount: number;
  attributionWindow: number; // minutes
  timestamp: string;
}

// ============================================================================
// DOOH Attribution Connector
// ============================================================================

class DOOHOfflineConnector {
  // Track impression → visit window (in minutes)
  private readonly ATTRIBUTION_WINDOW = 60; // 1 hour

  // ============================================
  // Track DOOH Funnel
  // ============================================

  /**
   * Track: DOOH Impression
   */
  async trackImpression(impression: DOOHImpression): Promise<string> {
    const impressionId = `dooh_imp_${Date.now()}`;

    // Emit event
    await this.emitEvent({
      type: 'dooh.impression',
      data: {
        impressionId,
        screenId: impression.screenId,
        campaignId: impression.campaignId,
        adId: impression.adId,
        viewerCount: impression.viewerCount,
        location: impression.location
      }
    });

    // Update graph
    if (impression.userId) {
      await this.updateGraph({
        type: 'dooh_exposed',
        userId: impression.userId,
        entityId: impression.screenId,
        properties: {
          impressionId,
          campaignId: impression.campaignId,
          timestamp: impression.timestamp
        }
      });
    }

    return impressionId;
  }

  /**
   * Track: QR Scan from DOOH
   */
  async trackQRConversion(conversion: DOOHQRConversion): Promise<string> {
    const conversionId = `dooh_qr_${Date.now()}`;

    // Emit event
    await this.emitEvent({
      type: 'dooh.qr_scan',
      data: {
        conversionId,
        screenId: conversion.screenId,
        campaignId: conversion.campaignId,
        qrCode: conversion.qrCode,
        merchantId: conversion.merchantId
      }
    });

    // Update attribution
    await this.updateAttribution({
      touchpoint: 'dooh_qr',
      campaignId: conversion.campaignId,
      userId: conversion.userId,
      timestamp: conversion.timestamp
    });

    // Update graph
    if (conversion.userId) {
      await this.updateGraph({
        type: 'dooh_scanned',
        userId: conversion.userId,
        entityId: conversion.screenId,
        properties: {
          conversionId,
          merchantId: conversion.merchantId,
          timestamp: conversion.timestamp
        }
      });
    }

    return conversionId;
  }

  /**
   * Track: Store Visit after DOOH
   */
  async trackStoreVisit(visit: DOOHStoreVisit): Promise<{
    visitId: string;
    attributedToDOOH: boolean;
    attributionWeight: number;
  }> {
    const visitId = visit.storeVisitId;

    // Check if visit is within attribution window
    const attributed = await this.checkAttribution(visit.userId, visit.timestamp);

    const result = {
      visitId,
      attributedToDOOH: attributed.found,
      attributionWeight: attributed.weight
    };

    // Emit event
    await this.emitEvent({
      type: 'dooh.store_visit',
      data: {
        visitId,
        screenId: visit.screenId,
        campaignId: visit.campaignId,
        merchantId: visit.merchantId,
        attributed: result.attributedToDOOH,
        weight: result.attributionWeight
      }
    });

    // Update offline tracker
    await this.updateOfflineTracker({
      userId: visit.userId,
      merchantId: visit.merchantId,
      visitId,
      source: 'dooh',
      metadata: {
        screenId: visit.screenId,
        campaignId: visit.campaignId,
        attributed: result.attributedToDOOH
      }
    });

    return result;
  }

  /**
   * Track: Purchase after DOOH
   */
  async trackPurchase(purchase: DOOHPurchase): Promise<{
    purchaseId: string;
    attribution: {
      doohContribution: number;
      firstTouch: string;
      lastTouch: string;
    };
  }> {
    // Get attribution
    const attribution = await this.getAttribution(purchase.userId, purchase.timestamp);

    const result = {
      purchaseId: purchase.purchaseId,
      attribution: {
        doohContribution: attribution.doohWeight,
        firstTouch: attribution.firstTouch || 'direct',
        lastTouch: attribution.lastTouch || 'direct'
      }
    };

    // Emit event
    await this.emitEvent({
      type: 'dooh.purchase',
      data: {
        purchaseId: purchase.purchaseId,
        campaignId: purchase.campaignId,
        amount: purchase.amount,
        attribution: result.attribution
      }
    });

    // Update attribution system
    await this.updateAttribution({
      touchpoint: 'dooh_purchase',
      campaignId: purchase.campaignId,
      userId: purchase.userId,
      amount: purchase.amount,
      timestamp: purchase.timestamp
    });

    return result;
  }

  // ============================================
  // Attribution Logic
  // ============================================

  private async checkAttribution(
    userId: string,
    visitTimestamp: string
  ): Promise<{ found: boolean; weight: number }> {
    // Check if user was exposed to DOOH within attribution window
    try {
      const response = await axios.get(
        `${ATTRIBUTION_URL}/api/attribution/check`,
        {
          params: {
            userId,
            visitTimestamp,
            windowMinutes: this.ATTRIBUTION_WINDOW
          },
          timeout: 3000
        }
      );

      return response.data;
    } catch (error) {
      return { found: false, weight: 0 };
    }
  }

  private async getAttribution(
    userId: string,
    purchaseTimestamp: string
  ): Promise<{
    doohWeight: number;
    firstTouch?: string;
    lastTouch?: string;
  }> {
    try {
      const response = await axios.get(
        `${ATTRIBUTION_URL}/api/attribution/user/${userId}`,
        {
          params: { timestamp: purchaseTimestamp },
          timeout: 3000
        }
      );

      return response.data;
    } catch (error) {
      return { doohWeight: 0 };
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async emitEvent(event: {
    type: string;
    userId?: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(
        `${process.env.EVENT_BUS_URL || 'http://localhost:4025'}/api/events`,
        {
          ...event,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to emit DOOH event:', error);
    }
  }

  private async updateGraph(data: {
    type: string;
    userId?: string;
    entityId: string;
    properties: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${GRAPH_SERVICE_URL}/api/signals`, data);
    } catch (error) {
      console.error('Failed to update graph:', error);
    }
  }

  private async updateOfflineTracker(data: {
    userId: string;
    merchantId: string;
    visitId: string;
    source: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${OFFLINE_TRACKER_URL}/api/visits`, data);
    } catch (error) {
      console.error('Failed to update offline tracker:', error);
    }
  }

  private async updateAttribution(data: {
    touchpoint: string;
    campaignId: string;
    userId?: string;
    amount?: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await axios.post(`${ATTRIBUTION_URL}/api/events`, data);
    } catch (error) {
      console.error('Failed to update attribution:', error);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const doohConnector = new DOOHOfflineConnector();
export default doohConnector;
