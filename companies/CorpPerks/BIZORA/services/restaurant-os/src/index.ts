/**
 * BIZORA Restaurant OS - Bridge Service
 *
 * This is a BRIDGE service that connects to REZ Merchant RestaurantHub.
 * Actual implementation is at: REZ-Merchant/industry-os/restauranthub/
 *
 * @module bizora/restaurant-os
 * @author RTNM Digital
 * @version 1.0.0
 *
 * Usage:
 *   Import from this bridge or directly from @rez-merchant/restaurant-service
 *
 * Documentation:
 *   - REZ-Merchant/industry-os/restauranthub/CLAUDE.md
 *   - REZ-Merchant/industry-os/REZ-restaurant-app/
 */

import express, { Request, Response } from 'express';

// REZ Merchant Restaurant Service URLs (from environment)
const REZ_RESTAURANT_SERVICE_URL = process.env.REZ_RESTAURANT_SERVICE_URL || 'http://localhost:4100';
const REZ_RESTAURANT_POS_URL = process.env.REZ_RESTAURANT_POS_URL || 'http://localhost:4101';
const REZ_RESTAURANT_ADMIN_URL = process.env.REZ_RESTAURANT_ADMIN_URL || 'http://localhost:4102';
const REZ_RESTAURANT_KDS_URL = process.env.REZ_RESTAURANT_KDS_URL || 'http://localhost:4103';
const REZ_RESTAURANT_ANALYTICS_URL = process.env.REZ_RESTAURANT_ANALYTICS_URL || 'http://localhost:4104';

// Bridge configuration
export const restaurantBridgeConfig = {
  name: 'BIZORA Restaurant OS Bridge',
  version: '1.0.0',
  type: 'bridge',
  connectsTo: {
    provider: 'REZ Merchant',
    ecosystem: 'restauranthub',
    services: [
      'rez-restaurant-service',
      'rez-restaurant-pos-service',
      'rez-restaurant-kds-service',
      'rez-restaurant-analytics-service',
      'rez-restaurant-crm-service',
      'rez-restaurant-inventory-service',
      'REZ-restaurant-app',
      'REZ-restaurant-admin-web',
    ],
  },
  endpoints: {
    restaurantService: REZ_RESTAURANT_SERVICE_URL,
    restaurantPOS: REZ_RESTAURANT_POS_URL,
    restaurantAdmin: REZ_RESTAURANT_ADMIN_URL,
    restaurantKDS: REZ_RESTAURANT_KDS_URL,
    restaurantAnalytics: REZ_RESTAURANT_ANALYTICS_URL,
  },
};

/**
 * Create Express router for Restaurant OS bridge
 */
export function createRestaurantBridgeRouter(): express.Router {
  const router = express.Router();

  /**
   * Health check - verify bridge is active
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Restaurant OS Bridge',
      status: 'active',
      type: 'bridge',
      connectsTo: 'REZ Merchant RestaurantHub',
      version: restaurantBridgeConfig.version,
      endpoints: {
        restaurantService: REZ_RESTAURANT_SERVICE_URL,
        restaurantPOS: REZ_RESTAURANT_POS_URL,
        restaurantAdmin: REZ_RESTAURANT_ADMIN_URL,
        restaurantKDS: REZ_RESTAURANT_KDS_URL,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get bridge configuration
   */
  router.get('/config', (req: Request, res: Response) => {
    res.json({
      config: restaurantBridgeConfig,
      message: 'This is a bridge service. Use REZ Merchant services for actual functionality.',
      documentation: {
        mainRepo: 'REZ-Merchant/industry-os/restauranthub/',
        mobileApp: 'REZ-Merchant/industry-os/REZ-restaurant-app/',
        adminWeb: 'REZ-Merchant/industry-os/REZ-restaurant-admin-web/',
      },
    });
  });

  /**
   * Restaurant info - redirect to REZ Merchant
   */
  router.get('/api/restaurant/info', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Restaurant OS',
      bridge: true,
      redirectTo: REZ_RESTAURANT_SERVICE_URL,
      endpoints: {
        menu: `${REZ_RESTAURANT_SERVICE_URL}/api/menu`,
        orders: `${REZ_RESTAURANT_SERVICE_URL}/api/orders`,
        tables: `${REZ_RESTAURANT_SERVICE_URL}/api/tables`,
      },
    });
  });

  /**
   * Menu - proxy to REZ Merchant
   */
  router.get('/api/menu', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_SERVICE_URL}/api/menu`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Restaurant Service unavailable',
        bridge: true,
        fallback: 'Use REZ-Merchant/industry-os/restauranthub directly',
      });
    }
  });

  /**
   * Orders - proxy to REZ Merchant
   */
  router.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_SERVICE_URL}/api/orders`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Restaurant Service unavailable',
        bridge: true,
      });
    }
  });

  /**
   * POS - proxy to REZ Merchant POS
   */
  router.get('/api/pos/orders', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_POS_URL}/api/orders`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Restaurant POS unavailable',
        bridge: true,
      });
    }
  });

  /**
   * KDS - proxy to REZ Merchant Kitchen Display
   */
  router.get('/api/kds/orders', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_KDS_URL}/api/orders`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant KDS unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Analytics - proxy to REZ Merchant Analytics
   */
  router.get('/api/analytics/sales', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_ANALYTICS_URL}/api/sales`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Restaurant Analytics unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Tables - proxy to REZ Merchant
   */
  router.get('/api/tables', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_SERVICE_URL}/api/tables`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Restaurant Service unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Admin dashboard - proxy to REZ Merchant Admin
   */
  router.get('/api/admin/dashboard', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_RESTAURANT_ADMIN_URL}/api/dashboard`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Restaurant Admin unavailable',
        bridge: true,
      });
    }
  });

  /**
   * Documentation endpoint
   */
  router.get('/docs', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Restaurant OS Bridge',
      description: 'This service bridges to REZ Merchant RestaurantHub',
      architecture: {
        thisService: 'Bridge (no local implementation)',
        realImplementation: 'REZ-Merchant/industry-os/restauranthub',
      },
      services: [
        { name: 'rez-restaurant-service', port: '4100', purpose: 'Core restaurant management' },
        { name: 'rez-restaurant-pos-service', port: '4101', purpose: 'Point of Sale' },
        { name: 'rez-restaurant-kds-service', port: '4103', purpose: 'Kitchen Display System' },
        { name: 'rez-restaurant-analytics-service', port: '4104', purpose: 'Analytics & reporting' },
        { name: 'rez-restaurant-crm-service', purpose: 'Customer relationship management' },
        { name: 'rez-restaurant-inventory-service', purpose: 'Inventory management' },
      ],
      apps: [
        { name: 'REZ-restaurant-app', type: 'Mobile', platform: 'React Native' },
        { name: 'REZ-restaurant-admin-web', type: 'Web', framework: 'Next.js' },
      ],
      restaurants: [
        { name: 'RestoPapa', location: 'CorpPerks/restopapa/', purpose: 'Restaurant platform' },
      ],
    });
  });

  return router;
}

// Export for use in other services
export const restaurantServiceEndpoints = {
  menu: `${REZ_RESTAURANT_SERVICE_URL}/api/menu`,
  orders: `${REZ_RESTAURANT_SERVICE_URL}/api/orders`,
  tables: `${REZ_RESTAURANT_SERVICE_URL}/api/tables`,
  pos: `${REZ_RESTAURANT_POS_URL}/api/pos`,
  kds: `${REZ_RESTAURANT_KDS_URL}/api/kds`,
  analytics: `${REZ_RESTAURANT_ANALYTICS_URL}/api/analytics`,
  admin: `${REZ_RESTAURANT_ADMIN_URL}/api/admin`,
};

// Default export
export default {
  config: restaurantBridgeConfig,
  createRouter: createRestaurantBridgeRouter,
  endpoints: restaurantServiceEndpoints,
};