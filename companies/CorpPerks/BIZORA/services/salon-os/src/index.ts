/**
 * BIZORA Salon OS - Bridge Service
 *
 * This is a BRIDGE service that connects to REZ Merchant Salon Ecosystem.
 * Actual implementation is at: REZ-Merchant/industry-os/REZ-salon-ecosystem/
 *
 * @module bizora/salon-os
 * @author RTNM Digital
 * @version 1.0.0
 */

import express, { Request, Response } from 'express';

// REZ Merchant Salon Service URLs (from environment)
const REZ_SALON_SERVICE_URL = process.env.REZ_SALON_SERVICE_URL || 'http://localhost:4200';
const REZ_SALON_POS_URL = process.env.REZ_SALON_POS_URL || 'http://localhost:4201';
const REZ_SALON_ADMIN_URL = process.env.REZ_SALON_ADMIN_URL || 'http://localhost:4202';
const REZ_SALON_ANALYTICS_URL = process.env.REZ_SALON_ANALYTICS_URL || 'http://localhost:4203';

// Bridge configuration
export const salonBridgeConfig = {
  name: 'BIZORA Salon OS Bridge',
  version: '1.0.0',
  type: 'bridge',
  connectsTo: {
    provider: 'REZ Merchant',
    ecosystem: 'REZ-salon-ecosystem',
    services: [
      'REZ-salon-app',
      'REZ-salon-ecosystem',
      'rez-ai-salon-fitness',
    ],
  },
  endpoints: {
    salonService: REZ_SALON_SERVICE_URL,
    salonPOS: REZ_SALON_POS_URL,
    salonAdmin: REZ_SALON_ADMIN_URL,
    salonAnalytics: REZ_SALON_ANALYTICS_URL,
  },
};

/**
 * Create Express router for Salon OS bridge
 */
export function createSalonBridgeRouter(): express.Router {
  const router = express.Router();

  /**
   * Health check
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Salon OS Bridge',
      status: 'active',
      type: 'bridge',
      connectsTo: 'REZ Merchant Salon Ecosystem',
      version: salonBridgeConfig.version,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get bridge configuration
   */
  router.get('/config', (req: Request, res: Response) => {
    res.json({
      config: salonBridgeConfig,
      message: 'This is a bridge service. Use REZ Merchant services for actual functionality.',
      documentation: {
        mainRepo: 'REZ-Merchant/industry-os/REZ-salon-ecosystem/',
        mobileApp: 'REZ-Merchant/industry-os/REZ-salon-app/',
      },
    });
  });

  /**
   * Services - proxy to REZ Merchant
   */
  router.get('/api/services', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_SALON_SERVICE_URL}/api/services`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: 'REZ Merchant Salon Service unavailable',
        bridge: true,
        fallback: 'Use REZ-Merchant/industry-os/REZ-salon-ecosystem directly',
      });
    }
  });

  /**
   * Appointments
   */
  router.get('/api/appointments', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_SALON_SERVICE_URL}/api/appointments`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: 'Service unavailable', bridge: true });
    }
  });

  /**
   * POS
   */
  router.get('/api/pos/orders', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${REZ_SALON_POS_URL}/api/orders`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: 'POS unavailable', bridge: true });
    }
  });

  /**
   * Documentation endpoint
   */
  router.get('/docs', (req: Request, res: Response) => {
    res.json({
      service: 'BIZORA Salon OS Bridge',
      description: 'This service bridges to REZ Merchant Salon Ecosystem',
      architecture: {
        thisService: 'Bridge (no local implementation)',
        realImplementation: 'REZ-Merchant/industry-os/REZ-salon-ecosystem',
      },
      apps: [
        { name: 'REZ-salon-app', type: 'Mobile', platform: 'React Native' },
        { name: 'REZ-salon-ecosystem', type: 'Full platform' },
      ],
    });
  });

  return router;
}

// Export for use in other services
export const salonServiceEndpoints = {
  services: `${REZ_SALON_SERVICE_URL}/api/services`,
  appointments: `${REZ_SALON_SERVICE_URL}/api/appointments`,
  pos: `${REZ_SALON_POS_URL}/api/pos`,
  analytics: `${REZ_SALON_ANALYTICS_URL}/api/analytics`,
  admin: `${REZ_SALON_ADMIN_URL}/api/admin`,
};

// Default export
export default {
  config: salonBridgeConfig,
  createRouter: createSalonBridgeRouter,
  endpoints: salonServiceEndpoints,
};