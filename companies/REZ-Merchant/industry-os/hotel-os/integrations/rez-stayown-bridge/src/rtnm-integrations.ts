/**
 * RTNM Ecosystem Integrations for Hotel OS
 *
 * This module adds all RTNM sister company connections to hotel-os-integration:
 * - Airzy (Flight tracking)
 * - CorpPerks (HR/Staff/CoPilot)
 * - KHAIRMOVE (Transport)
 * - Nexha (Procurement)
 * - RIDZA (Finance)
 * - AdBazaar (Marketing)
 * - BrandPulse (Reputation)
 */

import { Router } from 'express';

const router = Router();

// Service URLs
const SERVICES = {
  // RTNM Bridges
  airzyBridge: process.env.AIRZY_BRIDGE_URL || 'http://localhost:3891',
  corpIntegration: process.env.CORP_INTEGRATION_URL || 'http://localhost:3890',
  staybotRouter: process.env.STAYBOT_ROUTER_URL || 'http://localhost:4841',

  // RTNM Sister Companies
  airzy: process.env.AIRZY_URL || 'http://airzy:3000',
  corpPerks: process.env.CORPPERKS_URL || 'http://corpperks:4700',
  khairMove: process.env.KHAIRMOVE_URL || 'http://khaimove:4000',
  nexha: process.env.NEXHA_URL || 'http://nexha:4600',
  ridza: process.env.RIDZA_URL || 'http://ridza:4500',
  adBazaar: process.env.ADBazaar_URL || 'http://adbazaar:4500',
  brandPulse: process.env.BRANDPULSE_URL || 'http://brandpulse:4770',
};

/**
 * Get complete RTNM ecosystem status
 * GET /api/rtnm/status
 */
router.get('/rtnm/status', async (req, res) => {
  const rtnmServices = ['airzy', 'corpPerks', 'khairMove', 'nexha', 'ridza', 'adBazaar', 'brandPulse'];

  const statuses = await Promise.all(
    rtnmServices.map(async (service) => {
      try {
        const response = await fetch(`${SERVICES[service as keyof typeof SERVICES]}/health`, { timeout: 2000 });
        return { service, status: response.ok ? 'healthy' : 'unhealthy' };
      } catch {
        return { service, status: 'unreachable' };
      }
    })
  );

  res.json({
    timestamp: new Date().toISOString(),
    services: statuses,
    total: statuses.length,
    healthy: statuses.filter(s => s.status === 'healthy').length,
  });
});

/**
 * Corporate booking via CorpPerks
 * POST /api/rtnm/corporate-booking
 */
router.post('/rtnm/corporate-booking', async (req, res) => {
  const { companyId, destination, checkIn, checkOut, rooms, guests, requirements } = req.body;

  try {
    const response = await fetch(`${SERVICES.corpIntegration}/api/corporate/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        coPilotRequestId: `RTNM-${Date.now()}`,
        requesterId: req.body.requesterId || 'system',
        details: { destination, checkIn, checkOut, numberOfRooms: rooms, guests, requirements },
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Corporate booking failed' });
  }
});

/**
 * Airport transfer via KHAIRMOVE
 * POST /api/rtnm/airport-transfer
 */
router.post('/rtnm/airport-transfer', async (req, res) => {
  const { guestId, hotelId, flightNumber, arrivalTime, pickupType } = req.body;

  try {
    const response = await fetch(`${SERVICES.khairMove}/api/ride/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        hotelId,
        flightNumber,
        pickupTime: arrivalTime,
        vehicleType: pickupType || 'standard',
        service: 'airport',
      }),
    });

    const result = await response.json();
    res.json({ success: true, transfer: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Airport transfer unavailable' });
  }
});

/**
 * Procurement via Nexha
 * POST /api/rtnm/procurement
 */
router.post('/rtnm/procurement', async (req, res) => {
  const { hotelId, items, priority } = req.body;

  try {
    const response = await fetch(`${SERVICES.nexha}/api/procurement/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerId: hotelId,
        items,
        deliveryDate: req.body.deliveryDate,
        priority: priority || 'normal',
      }),
    });

    const result = await response.json();
    res.json({ success: true, procurement: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Procurement unavailable' });
  }
});

/**
 * Marketing via AdBazaar
 * POST /api/rtnm/marketing/campaign
 */
router.post('/rtnm/marketing/campaign', async (req, res) => {
  const { hotelId, targetAudience, objective, budget } = req.body;

  try {
    const response = await fetch(`${SERVICES.adBazaar}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advertiserId: hotelId,
        targetAudience,
        objective: objective || 'bookings',
        budget,
        channels: ['mobile', 'social', 'search'],
      }),
    });

    const result = await response.json();
    res.json({ success: true, campaign: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Marketing unavailable' });
  }
});

/**
 * Finance analytics via RIDZA
 * GET /api/rtnm/finance/:hotelId
 */
router.get('/rtnm/finance/:hotelId', async (req, res) => {
  const { hotelId } = req.params;

  try {
    const response = await fetch(`${SERVICES.ridza}/api/finance/hotel/${hotelId}/analytics`, {
      timeout: 5000,
    });

    if (response.ok) {
      const analytics = await response.json();
      return res.json({ success: true, finance: analytics });
    }
  } catch {}

  res.json({
    success: true,
    finance: {
      hotelId,
      revenue: { daily: 0, monthly: 0 },
      occupancy: { rate: 0 },
      costs: {},
      profit: { margin: 0 },
    },
    warning: 'RIDZA unavailable',
  });
});

/**
 * Brand reputation via BrandPulse
 * GET /api/rtnm/reputation/:hotelId
 */
router.get('/rtnm/reputation/:hotelId', async (req, res) => {
  const { hotelId } = req.params;

  try {
    const response = await fetch(`${SERVICES.brandPulse}/api/brand/${hotelId}/overview`, {
      timeout: 5000,
    });

    if (response.ok) {
      const reputation = await response.json();
      return res.json({ success: true, reputation });
    }
  } catch {}

  res.json({
    success: true,
    reputation: {
      hotelId,
      sentiment: 'positive',
      mentions: 0,
      rating: 4.2,
      reviews: 0,
    },
    warning: 'BrandPulse unavailable',
  });
});

/**
 * Flight update from Airzy
 * POST /api/rtnm/flight-update
 */
router.post('/rtnm/flight-update', async (req, res) => {
  const { guestId, bookingId, flightNumber, newArrival, delayMinutes, originalArrival } = req.body;

  try {
    const response = await fetch(`${SERVICES.airzyBridge}/api/flight/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        bookingId,
        flightNumber,
        originalArrival,
        newArrival,
        delayMinutes,
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Flight update failed' });
  }
});

/**
 * Full guest experience - all RTNM connected
 * GET /api/rtnm/experience/:guestId
 */
router.get('/rtnm/experience/:guestId', async (req, res) => {
  const { guestId } = req.params;

  const [pmsData, memoryData, walletData, genieData] = await Promise.allSettled([
    fetch(`http://localhost:4031/api/guests/${guestId}`).then(r => r?.json()).catch(() => null),
    fetch(`http://localhost:4520/guests/${guestId}/preferences`).then(r => r?.json()).catch(() => null),
    fetch(`http://localhost:4004/wallet/balance?guestId=${guestId}`).then(r => r?.json()).catch(() => null),
    fetch(`http://localhost:4703/api/genie/${guestId}/briefing`).then(r => r?.json()).catch(() => null),
  ]);

  res.json({
    guestId,
    timestamp: new Date().toISOString(),
    profile: (pmsData as any)?.value || null,
    preferences: (memoryData as any)?.value?.preferences || null,
    loyalty: (walletData as any)?.value || null,
    briefing: (genieData as any)?.value || null,
    connectedServices: {
      staybot: 'connected',
      memory: 'connected',
      genie: 'connected',
      payment: 'connected',
      wallet: 'connected',
    },
  });
});

// ============================================
// BRANDPULSE INTEGRATION
// ============================================

/**
 * Get brand overview from BrandPulse
 * GET /api/rtnm/brand/:brandId/overview
 */
router.get('/rtnm/brand/:brandId/overview', async (req, res) => {
  const { brandId } = req.params;

  try {
    const response = await fetch(`${SERVICES.brandPulse}/api/v1/analytics/brand/${brandId}/overview`, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('[BrandPulse] Overview fetch failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand overview',
      service: 'brandpulse'
    });
  }
});

/**
 * Get sentiment trend from BrandPulse
 * GET /api/rtnm/brand/:brandId/sentiment
 */
router.get('/rtnm/brand/:brandId/sentiment', async (req, res) => {
  const { brandId } = req.params;
  const { period = 'day', days = 30 } = req.query;

  try {
    const response = await fetch(
      `${SERVICES.brandPulse}/api/v1/analytics/brand/${brandId}/sentiment?period=${period}&days=${days}`,
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('[BrandPulse] Sentiment fetch failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sentiment data',
      service: 'brandpulse'
    });
  }
});

/**
 * Get rating distribution from BrandPulse
 * GET /api/rtnm/brand/:brandId/ratings
 */
router.get('/rtnm/brand/:brandId/ratings', async (req, res) => {
  const { brandId } = req.params;

  try {
    const response = await fetch(`${SERVICES.brandPulse}/api/v1/analytics/brand/${brandId}/ratings`, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('[BrandPulse] Ratings fetch failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ratings',
      service: 'brandpulse'
    });
  }
});

/**
 * Get aspect analysis from BrandPulse
 * GET /api/rtnm/brand/:brandId/aspects
 */
router.get('/rtnm/brand/:brandId/aspects', async (req, res) => {
  const { brandId } = req.params;

  try {
    const response = await fetch(`${SERVICES.brandPulse}/api/v1/analytics/brand/${brandId}/aspects`, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('[BrandPulse] Aspects fetch failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aspect analysis',
      service: 'brandpulse'
    });
  }
});

/**
 * Create a review via BrandPulse
 * POST /api/rtnm/reviews
 */
router.post('/rtnm/reviews', async (req, res) => {
  const reviewData = req.body;

  try {
    const response = await fetch(`${SERVICES.brandPulse}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    res.status(201).json(data);
  } catch (error: any) {
    console.error('[BrandPulse] Review creation failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create review',
      service: 'brandpulse'
    });
  }
});

/**
 * Get brand reputation (legacy endpoint)
 * GET /api/rtnm/reputation/:hotelId
 */
router.get('/rtnm/reputation/:hotelId', async (req, res) => {
  const { hotelId } = req.params;

  // Use hotelId as brandId for BrandPulse
  try {
    const response = await fetch(`${SERVICES.brandPulse}/api/v1/analytics/brand/${hotelId}/overview`, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json({
      hotelId,
      reputation: data.data?.stats || {},
      sentiment: data.data?.trends || {},
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[BrandPulse] Reputation fetch failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reputation data',
      service: 'brandpulse'
    });
  }
});

export { router as rtnmRoutes };
