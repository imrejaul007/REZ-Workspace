/**
 * BIZORA Hotel OS - Bridge Service
 *
 * This is a BRIDGE service that connects to REZ Merchant Hotel Ecosystem.
 * Actual implementation is at: REZ-Merchant/industry-os/hotel-ecosystem/
 *
 * @module bizora/hotel-os
 * @author RTNM Digital
 * @version 1.0.0
 *
 * Usage:
 *   Import from this bridge or directly from @rez-merchant/hotel-service
 *
 * Documentation:
 *   - REZ-Merchant/industry-os/hotel-ecosystem/CLAUDE.md
 *   - REZ-Merchant/industry-os/REZ-hotel-app/
 */

import express, { Request, Response } from 'express';

// REZ Merchant Hotel Service URLs (from environment)
const REZ_HOTEL_SERVICE_URL = process.env.REZ_HOTEL_SERVICE_URL || 'http://localhost:4300';
const REZ_HOTEL_POS_URL = process.env.REZ_HOTEL_POS_URL || 'http://localhost:4301';
const REZ_HOTEL_ADMIN_URL = process.env.REZ_HOTEL_ADMIN_URL || 'http://localhost:4302';
const REZ_HOTEL_HOUSEKEEPING_URL = process.env.REZ_HOTEL_HOUSEKEEPING_URL || 'http://localhost:4303';
const REZ_HOTEL_ANALYTICS_URL = process.env.REZ_HOTEL_ANALYTICS_URL || 'http://localhost:4304';

// Bridge configuration
export const hotelBridgeConfig = {
  name: 'BIZORA Hotel OS Bridge',
  version: '1.0.0',
  type: 'bridge',
  connectsTo: {
    provider: 'REZ Merchant',
    ecosystem: 'hotel-ecosystem',
    services: [
      'rez-hotel-service',
      'rez-hotel-pos-service',
      'rez-hotel-housekeeping-service',
      'rez-hotel-maintenance-service',
      'rez-hotel-analytics-service',
      'REZ-hotel-app',
      'REZ-hotel-admin-web',
    ],
  },
  endpoints: {
    hotelService: REZ_HOTEL_SERVICE_URL,
    hotelPOS: REZ_HOTEL_POS_URL,
    hotelAdmin: REZ_HOTEL_ADMIN_URL,
    housekeeping: REZ_HOTEL_HOUSEKEEPING_URL,
    analytics: REZ_HOTEL_ANALYTICS_URL,
  },
};

/**
 * Create Express router for Hotel OS bridge
 */
export function createHotelBridgeRouter(): express.Router {
  const router = express.Router();

  /**
   * Health check - verify bridge is active
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Hotel OS Bridge',
      status: 'active',
      type: 'bridge',
      connectsTo: 'REZ Merchant Hotel Ecosystem',
      version: hotelBridgeConfig.version,
      endpoints: {
        hotelService: REZ_HOTEL_SERVICE_URL,
        hotelPOS: REZ_HOTEL_POS_URL,
        hotelAdmin: REZ_HOTEL_ADMIN_URL,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get bridge configuration
   */
  router.get('/config', (req: Request, res: Response) => {
    res.json({
      config: hotelBridgeConfig,
      message: 'This is a bridge service. Use REZ Merchant services for actual functionality.',
      documentation: {
        mainRepo: 'REZ-Merchant/industry-os/hotel-ecosystem/',
        mobileApp: 'REZ-Merchant/industry-os/REZ-hotel-app/',
        adminWeb: 'REZ-Merchant/industry-os/REZ-hotel-admin-web/',
      },
    });
  });

  /**
   * Hotel endpoints - redirect to REZ Merchant
   */
  router.get('/api/hotel/info', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Hotel OS',
      bridge: true,
      redirectTo: REZ_HOTEL_SERVICE_URL,
      endpoints: {
        rooms: `${REZ_HOTEL_SERVICE_URL}/api/rooms`,
        reservations: `${REZ_HOTEL_SERVICE_URL}/api/reservations`,
        frontdesk: `${REZ_HOTEL_SERVICE_URL}/api/frontdesk`,
      },
    });
  });

  /**
   * Room management - proxy to REZ Merchant
   */
  router.get('/api/rooms', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_HOTEL_SERVICE_URL}/api/rooms`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Hotel Service unavailable',
        bridge: true,
        fallback: 'Use REZ-Merchant/industry-os/hotel-ecosystem directly',
      });
    }
  });

  /**
   * POS - proxy to REZ Merchant POS
   */
  router.get('/api/pos/orders', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_HOTEL_POS_URL}/api/orders`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Hotel POS unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Analytics - proxy to REZ Merchant Analytics
   */
  router.get('/api/analytics/occupancy', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_HOTEL_ANALYTICS_URL}/api/occupancy`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Analytics unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Housekeeping - proxy to REZ Merchant Housekeeping
   */
  router.get('/api/housekeeping/tasks', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_HOTEL_HOUSEKEEPING_URL}/api/tasks`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Housekeeping unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Admin dashboard - proxy to REZ Merchant Admin
   */
  router.get('/api/admin/dashboard', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_HOTEL_ADMIN_URL}/api/dashboard`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Hotel Admin unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Documentation endpoint
   */
  router.get('/docs', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Hotel OS Bridge',
      description: 'This service bridges to REZ Merchant Hotel Ecosystem',
      architecture: {
        thisService: 'Bridge (no local implementation)',
        realImplementation: 'REZ-Merchant/industry-os/hotel-ecosystem',
      },
      services: [
        { name: 'rez-hotel-service', port: '4300', purpose: 'Core hotel management' },
        { name: 'rez-hotel-pos-service', port: '4301', purpose: 'Point of Sale' },
        { name: 'rez-hotel-housekeeping', port: '4303', purpose: 'Housekeeping management' },
        { name: 'rez-hotel-analytics', port: '4304', purpose: 'Analytics & reporting' },
      ],
      apps: [
        { name: 'REZ-hotel-app', type: 'Mobile', platform: 'React Native' },
        { name: 'REZ-hotel-admin-web', type: 'Web', framework: 'Next.js' },
      ],
    });
  });

  return router;
}

// Export for use in other services
export const hotelServiceEndpoints = {
  rooms: `${REZ_HOTEL_SERVICE_URL}/api/rooms`,
  reservations: `${REZ_HOTEL_SERVICE_URL}/api/reservations`,
  frontdesk: `${REZ_HOTEL_SERVICE_URL}/api/frontdesk`,
  pos: `${REZ_HOTEL_POS_URL}/api/pos`,
  housekeeping: `${REZ_HOTEL_HOUSEKEEPING_URL}/api/housekeeping`,
  analytics: `${REZ_HOTEL_ANALYTICS_URL}/api/analytics`,
  admin: `${REZ_HOTEL_ADMIN_URL}/api/admin`,
};

// Default export
export default {
  config: hotelBridgeConfig,
  createRouter: createHotelBridgeRouter,
  endpoints: hotelServiceEndpoints,
};