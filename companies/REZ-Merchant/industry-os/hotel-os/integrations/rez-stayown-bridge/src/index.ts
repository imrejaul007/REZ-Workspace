import { logger } from '../../shared/logger';
/**
 * StayOwn Hotel OS Integration Service
 *
 * Unified integration layer that connects:
 * - StayOwn Guest Services (ai-front-desk, rez-stayown-service)
 * - REZ-Merchant Hotel OS (PMS, Housekeeping, Maintenance, etc.)
 * - RidZa Hotel OTA (Booking website, Admin panels)
 * - HOJAI AI (Staybot, Memory, Agents)
 *
 * This service ensures all components work together seamlessly.
 */

import express from 'express';
import cors from 'cors';
import { createClient, RedisClientType } from 'redis';
import fetch from 'node-fetch';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4865', 10);
const REDIS_URL = process.env.REDIS_URL || 4865'redis://localhost:6379';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/integration.log' })
  ]
});

// Service URLs - The single source of truth
const SERVICES = {
  // StayOwn Guest Services
  aiFrontDesk: process.env.AI_FRONT_DESK_URL || 4865'http://localhost:3800',
  rezStayown: process.env.REZ_STAYOWN_URL || 4865'http://localhost:4015',
  hotelHabixo: process.env.HOTEL_HABIXO_URL || 4865'http://localhost:3007',

  // REZ-Merchant Hotel OS
  pms: process.env.REZ_PMS_URL || 4865'http://localhost:4031',
  hotelService: process.env.REZ_HOTEL_SERVICE_URL || 4865'http://localhost:4020',
  housekeeping: process.env.REZ_HOUSEKEEPING_URL || 4865'http://localhost:4021',
  maintenance: process.env.REZ_MAINTENANCE_URL || 4865'http://localhost:4019',
  messaging: process.env.REZ_MESSAGING_URL || 4865'http://localhost:4024',
  analytics: process.env.REZ_ANALYTICS_URL || 4865'http://localhost:4025',
  mind: process.env.REZ_MIND_URL || 4865'http://localhost:4017',
  channelManager: process.env.REZ_CHANNEL_URL || 4865'http://localhost:4022',
  roomService: process.env.REZ_ROOM_SERVICE_URL || 4865'http://localhost:4043',
  spa: process.env.REZ_SPA_URL || 4865'http://localhost:4049',
  laundry: process.env.REZ_LAUNDRY_URL || 4865'http://localhost:4048',
  dynamicPricing: process.env.REZ_PRICING_URL || 4865'http://localhost:4040',
  bookingEngine: process.env.REZ_BOOKING_ENGINE_URL || 4865'http://localhost:4042',
  guestMobile: process.env.REZ_GUEST_MOBILE_URL || 4865'http://localhost:4028',

  // HOJAI AI
  staybot: process.env.STAYBOT_URL || 4865'http://localhost:4840',
  memory: process.env.HOJAI_MEMORY_URL || 4865'http://localhost:4520',
  agents: process.env.HOJAI_AGENTS_URL || 4865'http://localhost:4550',
  genie: process.env.HOJAI_GENIE_URL || 4865'http://localhost:4703',

  // RABTUL Infrastructure
  auth: process.env.REZ_AUTH_URL || 4865'http://localhost:4002',
  payment: process.env.REZ_PAYMENT_URL || 4865'http://localhost:4001',
  wallet: process.env.REZ_WALLET_URL || 4865'http://localhost:4004',
  notifications: process.env.REZ_NOTIFICATIONS_URL || 4865'http://localhost:4011',

  // RTNM Ecosystem Bridges
  airzyBridge: process.env.AIRZY_BRIDGE_URL || 4865'http://stayown-airzy-bridge:3891',
  corpIntegration: process.env.CORP_INTEGRATION_URL || 4865'http://stayown-corp-integration:3890',
  staybotRouter: process.env.STAYBOT_ROUTER_URL || 4865'http://staybot-service-router:4841',

  // RTNM Sister Companies
  airzy: process.env.AIRZY_URL || 4865'http://airzy:3000', // Flight tracking
  corpPerks: process.env.CORPPERKS_URL || 4865'http://corpperks:4700', // HR/Staff
  khairMove: process.env.KHAIRMOVE_URL || 4865'http://khaimove:4000', // Transport
  nexha: process.env.NEXHA_URL || 4865'http://nexha:4600', // Procurement
  ridza: process.env.RIDZA_URL || 4865'http://ridza:4500', // Finance
  adBazaar: process.env.ADBazaar_URL || 4865'http://adbazaar:4500', // Marketing
  brandPulse: process.env.BRANDPULSE_URL || 4865'http://brandpulse:4770', // Reputation

  // StayOwn Hotel Services
  minibar: process.env.MINIBAR_URL || 4865'http://localhost:3810',
  restaurant: process.env.RESTAURANT_URL || 4865'http://localhost:3811',
  smartLock: process.env.SMART_LOCK_URL || 4865'http://localhost:3825',
  roomControls: process.env.ROOM_CONTROLS_URL || 4865'http://localhost:3814',
  upsell: process.env.UPSELL_URL || 4865'http://localhost:3817',
};

interface ServiceHealth {
  name: string;
  url: string;
  status: 'up' | 'down' | 'unknown';
  latency?: number;
  error?: string;
}

interface IntegrationFlow {
  name: string;
  description: string;
  steps: string[];
  services: string[];
}

class HotelOSIntegration {
  private app: express.Application;
  private redis: RedisClientType;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'hotel-os-integration',
        port: PORT,
        timestamp: new Date().toISOString()
      });
    });

    // Service registry - all StayOwn/REZ-Merchant Hotel services
    this.app.get('/registry/services', (req, res) => {
      const serviceList = Object.entries(SERVICES).map(([key, url]) => ({
        name: key,
        url,
        category: this.categorizeService(key)
      }));
      res.json({ services: serviceList });
    });

    // Health check all services
    this.app.get('/registry/health', async (req, res) => {
      const health = await this.checkAllServices();
      res.json({
        timestamp: new Date().toISOString(),
        services: health
      });
    });

    // Integration flows
    this.app.get('/flows', (req, res) => {
      const flows: IntegrationFlow[] = [
        {
          name: 'Guest Booking Flow',
          description: 'Guest books through OTA → PMS receives → Guest Twin created',
          steps: [
            '1. Guest books via RidZa Hotel OTA',
            '2. Booking synced to REZ-Merchant PMS',
            '3. Guest Twin created in StayOwn',
            '4. Welcome message sent via AI Front Desk',
            '5. Pre-arrival preferences collected'
          ],
          services: ['hotel-ota', 'pms', 'guest-twin', 'ai-front-desk']
        },
        {
          name: 'Check-in Flow',
          description: 'Guest arrives → Digital check-in → Room assigned → Key activated',
          steps: [
            '1. Guest completes digital check-in via StayOwn',
            '2. PMS room status updated',
            '3. Housekeeping notified of room preparation',
            '4. Digital key activated',
            '5. AI concierge sends welcome'
          ],
          services: ['rez-stayown', 'pms', 'housekeeping', 'ai-front-desk']
        },
        {
          name: 'Stay Services Flow',
          description: 'Guest requests service → Service routed → Completed → Billed',
          steps: [
            '1. Guest scans Room QR or uses app',
            '2. Service request created in rez-stayown',
            '3. Request routed to appropriate service (housekeeping/maintenance/spa)',
            '4. Staff receives task notification',
            '5. Task completed',
            '6. Charges added to folio'
          ],
          services: ['rez-stayown', 'housekeeping', 'maintenance', 'spa', 'pms']
        },
        {
          name: 'AI Concierge Flow',
          description: 'Guest queries → AI processes → Action taken → Response sent',
          steps: [
            '1. Guest sends message via app/chat/voice',
            '2. AI Front Desk receives query',
            '3. Fast path: local pattern match',
            '4. Complex: HOJAI Staybot processes',
            '5. Action taken (booking, request, info)',
            '6. Response sent to guest'
          ],
          services: ['ai-front-desk', 'staybot', 'rez-stayown', 'pms']
        },
        {
          name: 'Checkout Flow',
          description: 'Guest checks out → Bill calculated → Paid → Key revoked',
          steps: [
            '1. Guest initiates checkout (app/QR)',
            '2. Final bill calculated from all charges',
            '3. Payment processed via RABTUL',
            '4. Invoice generated',
            '5. Digital key revoked',
            '6. Housekeeping notified for cleaning',
            '7. NPS survey sent'
          ],
          services: ['rez-stayown', 'pms', 'payment', 'housekeeping']
        }
      ];
      res.json({ flows });
    });

    // Proxy to specific service (for debugging)
    this.app.all('/proxy/:service/*', async (req, res) => {
      const { service } = req.params;
      const path = req.params[0];
      const serviceUrl = SERVICES[service as keyof typeof SERVICES];

      if (!serviceUrl) {
        return res.status(404).json({ error: 'Service not found' });
      }

      try {
        const url = `${serviceUrl}/${path}`;
        const response = await fetch(url, {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Integration-Service': 'hotel-os-integration'
          },
          body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.json();
        res.json({ service, path, ...data });
      } catch (error: any) {
        res.status(502).json({ error: error.message, service });
      }
    });

    // Guest journey - complete view
    this.app.get('/guest/:guestId/journey', async (req, res) => {
      const { guestId } = req.params;

      try {
        // Get from multiple sources
        const [guestTwin, pmsGuest, recentBookings] = await Promise.all([
          this.fetchFromService('rezStayown', `/guest-twin/${guestId}`).catch(() => null),
          this.fetchFromService('pms', `/api/guests/${guestId}`).catch(() => null),
          this.fetchFromService('hotelService', `/api/bookings?guestId=${guestId}`).catch(() => null)
        ]);

        res.json({
          guestId,
          guestTwin,
          pmsGuest,
          recentBookings,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        logger.error('Failed to get guest journey', { guestId, error: error.message });
        res.status(500).json({ error: 'Failed to get guest journey' });
      }
    });

    // Hotel overview - all metrics
    this.app.get('/hotel/:hotelId/overview', async (req, res) => {
      const { hotelId } = req.params;

      try {
        const [pmsStats, analytics, occupancy] = await Promise.all([
          this.fetchFromService('pms', `/api/stats/${hotelId}`).catch(() => null),
          this.fetchFromService('analytics', `/stats/${hotelId}`).catch(() => null),
          this.fetchFromService('hotelService', `/api/rooms/availability?hotelId=${hotelId}`).catch(() => null)
        ]);

        res.json({
          hotelId,
          pms: pmsStats,
          analytics,
          occupancy,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        logger.error('Failed to get hotel overview', { hotelId, error: error.message });
        res.status(500).json({ error: 'Failed to get hotel overview' });
      }
    });

    // ============================================
    // RTNM INTEGRATION ENDPOINTS
    // ============================================

    // Airzy Flight Integration - Flight update notifications
    this.app.post('/airzy/flight/update', async (req, res) => {
      const { bookingId, userId, flightNumber, carrier, status, delayMinutes } = req.body;
      logger.info('Airzy flight update received', { bookingId, flightNumber, status, delayMinutes });

      // Store flight update for guest lookup
      if (this.redis) {
        await this.redis.setEx(`flight:update:${bookingId}`, 86400, JSON.stringify(req.body));
      }

      res.json({ success: true, message: 'Flight update processed' });
    });

    // Get guest transfer requests for KHAIRMOVE
    this.app.get('/hotels/:hotelId/transfer-requests', async (req, res) => {
      const { hotelId } = req.params;
      const { date } = req.query;

      // Return scheduled airport transfers for the hotel
      const requests = [];
      res.json({ success: true, data: requests });
    });

    // Book guest transfer from KHAIRMOVE
    this.app.post('/transfers/book', async (req, res) => {
      const { hotelId, guestName, pickupLocation, dropoffLocation, pickupTime } = req.body;
      logger.info('Guest transfer booked', { hotelId, guestName });

      const transfer = {
        id: `transfer_${Date.now()}`,
        hotelId,
        guestName,
        pickupLocation,
        dropoffLocation,
        pickupTime,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: transfer });
    });

    // Update transfer status
    this.app.post('/transfers/:transferId/status', async (req, res) => {
      const { transferId } = req.params;
      const { status, driverLocation, eta, driverName } = req.body;
      logger.info('Transfer status updated', { transferId, status });

      res.json({ success: true, data: { transferId, status, driverLocation, eta, driverName } });
    });

    // Get hotel guest info
    this.app.get('/guests/:guestId', async (req, res) => {
      const { guestId } = req.params;

      const guest = {
        id: guestId,
        name: 'Guest',
        email: '',
        phone: '',
        currentBooking: null,
        preferences: {}
      };

      res.json({ success: true, data: guest });
    });

    // Link ride to hotel booking
    this.app.post('/rides/link', async (req, res) => {
      const { rideId, hotelBookingId, guestId } = req.body;
      logger.info('Ride linked to hotel booking', { rideId, hotelBookingId });

      res.json({ success: true, message: 'Ride linked to hotel booking' });
    });

    // Hotel procurement requirements (for Nexha)
    this.app.get('/hotels/:hotelId/procurement-requirements', async (req, res) => {
      const { hotelId } = req.params;

      const requirements = {
        hotelId,
        items: [],
        lastUpdated: new Date().toISOString()
      };

      res.json({ success: true, data: requirements });
    });

    // Submit hotel supply order
    this.app.post('/hotels/:hotelId/supply-orders', async (req, res) => {
      const { hotelId } = req.params;
      const { items, deliveryDate, notes } = req.body;

      const order = {
        id: `order_${Date.now()}`,
        hotelId,
        items,
        deliveryDate,
        notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: order });
    });

    // Hotel approved suppliers
    this.app.get('/hotels/:hotelId/approved-suppliers', async (req, res) => {
      const { hotelId } = req.params;
      const { category } = req.query;

      const suppliers = [];
      res.json({ success: true, data: suppliers });
    });

    // Hotel finance overview (for RidZa)
    this.app.get('/hotels/:hotelId/finance-overview', async (req, res) => {
      const { hotelId } = req.params;

      const overview = {
        hotelId,
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        occupancyRate: 0,
        averageDailyRate: 0,
        revPAR: 0,
        period: '30d'
      };

      res.json({ success: true, data: overview });
    });

    // Hotel revenue analytics
    this.app.get('/hotels/:hotelId/revenue-analytics', async (req, res) => {
      const { hotelId } = req.params;
      const { period } = req.query;

      const analytics = {
        hotelId,
        period: period || 4865'30d',
        roomRevenue: 0,
        fnbRevenue: 0,
        spaRevenue: 0,
        otherRevenue: 0,
        totalRevenue: 0,
        trends: []
      };

      res.json({ success: true, data: analytics });
    });

    // Hotel expense breakdown
    this.app.get('/hotels/:hotelId/expense-breakdown', async (req, res) => {
      const { hotelId } = req.params;
      const { period } = req.query;

      const breakdown = {
        hotelId,
        period: period || 4865'30d',
        staffCosts: 0,
        utilities: 0,
        supplies: 0,
        maintenance: 0,
        marketing: 0,
        other: 0,
        total: 0
      };

      res.json({ success: true, data: breakdown });
    });

    // Hotel occupancy analytics
    this.app.get('/hotels/:hotelId/occupancy-analytics', async (req, res) => {
      const { hotelId } = req.params;
      const { period } = req.query;

      const analytics = {
        hotelId,
        period: period || 4865'30d',
        occupancyRate: 0,
        averageDailyRate: 0,
        revPAR: 0,
        trends: []
      };

      res.json({ success: true, data: analytics });
    });

    // Hotel guests for AdBazaar marketing
    this.app.get('/hotels/:hotelId/guests', async (req, res) => {
      const { hotelId } = req.params;
      const { checkIn, checkOut, segment } = req.query;

      const guests = [];
      res.json({ success: true, data: guests });
    });

    // Hotel marketing campaigns
    this.app.post('/hotels/:hotelId/marketing/campaigns', async (req, res) => {
      const { hotelId } = req.params;
      const { name, type, targetSegments, content, targeting } = req.body;

      const campaign = {
        id: `campaign_${Date.now()}`,
        hotelId,
        name,
        type,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: campaign });
    });

    // Campaign performance
    this.app.get('/campaigns/:campaignId/performance', async (req, res) => {
      const { campaignId } = req.params;

      const performance = {
        campaignId,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        conversionRate: 0
      };

      res.json({ success: true, data: performance });
    });

    // Track campaign conversion
    this.app.post('/campaigns/:campaignId/track', async (req, res) => {
      const { campaignId } = req.params;
      const { guestId, action, value } = req.body;

      res.json({ success: true, message: 'Conversion tracked' });
    });

    // Guest preferences
    this.app.get('/guests/:guestId/preferences', async (req, res) => {
      const { guestId } = req.params;

      const preferences = {
        guestId,
        roomType: 'standard',
        dietary: [],
        amenities: [],
        interests: []
      };

      res.json({ success: true, data: preferences });
    });

    // Loyalty program members
    this.app.get('/hotels/:hotelId/loyalty/members', async (req, res) => {
      const { hotelId } = req.params;
      const { tier } = req.query;

      const members = [];
      res.json({ success: true, data: members });
    });

    // Send guest offer
    this.app.post('/guests/:guestId/offers', async (req, res) => {
      const { guestId } = req.params;
      const { hotelId, offerType, offerValue, validUntil } = req.body;

      const offer = {
        id: `offer_${Date.now()}`,
        guestId,
        hotelId,
        offerType,
        offerValue,
        validUntil,
        status: 'sent',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: offer });
    });
  }

  private categorizeService(name: string): string {
    if (['aiFrontDesk', 'rezStayown', 'hotelHabixo'].includes(name)) return 'StayOwn Guest';
    if (['pms', 'hotelService'].includes(name)) return 'Hotel Core';
    if (['housekeeping', 'maintenance', 'roomService', 'spa', 'laundry'].includes(name)) return 'Hotel Ops';
    if (['messaging', 'analytics', 'mind', 'dynamicPricing', 'bookingEngine'].includes(name)) return 'Hotel Intelligence';
    if (['staybot', 'memory', 'agents'].includes(name)) return 'HOJAI AI';
    if (['auth', 'payment', 'wallet', 'notifications'].includes(name)) return 'RABTUL Infra';
    return 'Other';
  }

  private async checkAllServices(): Promise<ServiceHealth[]> {
    const results: ServiceHealth[] = [];

    for (const [name, url] of Object.entries(SERVICES)) {
      const health: ServiceHealth = {
        name,
        url,
        status: 'unknown'
      };

      try {
        const start = Date.now();
        const response = await fetch(`${url}/health`, { timeout: 3000 });
        health.latency = Date.now() - start;
        health.status = response.ok ? 'up' : 'down';
        if (!response.ok) {
          health.error = `HTTP ${response.status}`;
        }
      } catch (error: any) {
        health.status = 'down';
        health.error = error.message;
      }

      results.push(health);
    }

    return results;
  }

  private async fetchFromService(serviceKey: keyof typeof SERVICES, path: string): Promise<any> {
    const baseUrl = SERVICES[serviceKey];
    const response = await fetch(`${baseUrl}${path}`, {
      timeout: 5000
    });
    if (!response.ok) {
      throw new Error(`${serviceKey} returned ${response.status}`);
    }
    return response.json();
  }

  async start(): Promise<void> {
    this.app.listen(PORT, () => {
      logger.info(`Hotel OS Integration Service started on port ${PORT}`);
      logger.info(🔗 Hotel OS Integration running on port ${PORT}`);
      logger.info('\n📋 Connected Services:');
      logger.info('   StayOwn Guest Services: ai-front-desk, rez-stayown, hotel-habixo');
      logger.info('   REZ-Merchant Hotel OS: PMS, Housekeeping, Maintenance, etc.');
      logger.info('   HOJAI AI: Staybot, Memory, Agents');
      logger.info('   RABTUL: Auth, Payment, Wallet, Notifications');
    });
  }
}

// Start
const integration = new HotelOSIntegration();
integration.start().catch(err => {
  logger.error('Failed to start integration service', { error: err.message });
  process.exit(1);
});
