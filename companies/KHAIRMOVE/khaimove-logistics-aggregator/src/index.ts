import { logger } from '../../shared/logger';
// KHAIRMOVE Logistics Aggregator - Multi-carrier shipping with real APIs
// Port: 4604

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { Location } from '../../shared/types';
import {
  authenticate,
  corsMiddleware,
  createGlobalLimiter,
  requestIdMiddleware,
  requestLoggingMiddleware,
  validateRequiredEnvVars,
} from '../../shared';
import {
  createCarrierClient,
  getCarrierCredentials,
  CarrierType,
  ShipmentOrder,
} from './carriers';

const PORT = process.env.PORT || 4604;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaimove_logistics';

// ============================================
// MONGODB SCHEMA (replaces in-memory storage)
// ============================================

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, index: true },
  carrier: { type: String, enum: ['delhivery', 'bluedart', 'dtdc', 'fedex', 'dhl'], index: true },
  status: { type: String, default: 'created', index: true },
  awbNumber: { type: String, sparse: true, index: true },
  trackingUrl: String,
  labelUrl: String,
  pickup: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number,
  },
  delivery: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number,
  },
  items: [{
    name: String,
    quantity: Number,
    weight: Number,
    value: Number,
    sku: String,
  }],
  weight: Number,
  dimensions: {
    length: Number,
    breadth: Number,
    height: Number,
  },
  serviceType: String,
  cod: { type: Boolean, default: false },
  codAmount: Number,
  insurance: { type: Boolean, default: false },
  insuranceAmount: Number,
  charges: {
    base: Number,
    fuel: Number,
    insurance: Number,
    cod: Number,
    total: Number,
  },
  estimatedDelivery: Date,
  events: [{
    timestamp: { type: Date, default: Date.now },
    status: String,
    location: String,
    description: String,
  }],
}, { timestamps: true });

// Compound indexes for common queries
shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ carrier: 1, status: 1 });
shipmentSchema.index({ 'pickup.city': 1, 'delivery.city': 1 });
shipmentSchema.index({ createdAt: -1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

// ============================================
// APP SETUP
// ============================================

const app = express();

// Apply middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use('/api/', createGlobalLimiter());
app.use(express.json({ limit: '10mb' })); // Prevent large payload DoS

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// HEALTH CHECKS (Production Ready)
// ============================================

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', service: 'khaimove-logistics', timestamp: new Date() });
});

app.get('/health/ready', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'not_ready', mongodb: 'disconnected' });
    }
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', mongodb: 'connected' });
  } catch {
    res.status(503).json({ status: 'not_ready', mongodb: 'error' });
  }
});

// Legacy health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'khaimove-logistics-aggregator',
    version: '1.0.0',
    carriers: ['delhivery', 'bluedart', 'dtdc', 'fedex', 'dhl'],
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

// ============================================
// API ROUTES (All require authentication)
// ============================================

// Get available carriers
app.get('/api/carriers', authenticate(), (req, res) => {
  const carriers = [
    { id: 'delhivery', name: 'Delhivery', coverage: 'Pan India', services: ['standard', 'express'], logo: 'delhivery.png' },
    { id: 'bluedart', name: 'BlueDart', coverage: 'Pan India', services: ['standard', 'express', 'overnight'], logo: 'bluedart.png' },
    { id: 'dtdc', name: 'DTDC', coverage: 'Pan India', services: ['standard', 'express'], logo: 'dtdc.png' },
    { id: 'fedex', name: 'FedEx', coverage: 'International + India', services: ['express', 'international'], logo: 'fedex.png' },
    { id: 'dhl', name: 'DHL', coverage: 'International + India', services: ['express', 'international'], logo: 'dhl.png' },
  ];
  res.json({ success: true, data: carriers });
});

interface CarrierRateResult {
  carrier: CarrierType;
  carrierName: string;
  rate: number;
  estimatedDays: number;
  serviceType: string;
  available: boolean;
  error?: string;
}

async function getCarrierRate(
  carrier: CarrierType,
  pickup: Location,
  drop: Location,
  weight: number
): Promise<CarrierRateResult> {
  try {
    const credentials = getCarrierCredentials(carrier);
    const client = createCarrierClient(carrier, credentials);
    const rateResult = await client.getRates(pickup, drop, weight);
    return {
      carrier,
      carrierName: carrier.charAt(0).toUpperCase() + carrier.slice(1),
      rate: rateResult.rate as number,
      estimatedDays: rateResult.estimatedDays as number,
      serviceType: 'standard',
      available: true,
    };
  } catch (error) {
    logger.warn(`Failed to get rate from ${carrier}:`, error);
    return {
      carrier,
      carrierName: carrier.charAt(0).toUpperCase() + carrier.slice(1),
      rate: 0,
      estimatedDays: 0,
      serviceType: 'standard',
      available: false,
      error: error instanceof Error ? error.message : 'Service unavailable',
    };
  }
}

// Get rates from all carriers
app.post('/api/rates', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      pickup: locationSchema,
      drop: locationSchema,
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number().int().min(1),
        weight: z.number().min(1),
        value: z.number().min(1),
      })),
      serviceType: z.enum(['standard', 'express', 'overnight']).default('standard'),
      insurance: z.boolean().default(false),
      cod: z.boolean().default(false),
    });

    const validated = schema.parse(req.body);

    const totalWeight = validated.items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
    const totalValue = validated.items.reduce((sum, item) => sum + item.value * item.quantity, 0);

    // Get rates from all carriers in parallel
    const carrierRates = await Promise.allSettled([
      getCarrierRate('delhivery', validated.pickup as Location, validated.drop as Location, totalWeight),
      getCarrierRate('bluedart', validated.pickup as Location, validated.drop as Location, totalWeight),
      getCarrierRate('dtdc', validated.pickup as Location, validated.drop as Location, totalWeight),
    ]);

    const rates = carrierRates
      .filter((r): r is PromiseFulfilledResult<CarrierRateResult> => r.status === 'fulfilled')
      .map(r => r.value);

    // Sort by price
    rates.sort((a, b) => a.rate - b.rate);

    res.json({
      success: true,
      data: {
        rates,
        comparison: {
          cheapest: rates[0],
          fastest: rates.reduce((min, r) => r.estimatedDays < min.estimatedDays ? r : min, rates[0]),
          recommended: rates[0],
        },
        inputDetails: { totalWeight, totalValue, itemCount: validated.items.length },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      logger.error('Rate calculation error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get rates' } });
    }
  }
});

// Create shipment with real carrier
app.post('/api/shipments', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      carrier: z.enum(['delhivery', 'bluedart', 'dtdc', 'fedex', 'dhl']),
      pickup: locationSchema,
      drop: locationSchema,
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number().int().min(1),
        weight: z.number().min(1),
        value: z.number().min(1),
        sku: z.string().optional(),
      })),
      serviceType: z.enum(['standard', 'express', 'overnight']).default('standard'),
      insurance: z.boolean().default(false),
      cod: z.boolean().default(false),
      codAmount: z.number().optional(),
      dimensions: z.object({
        length: z.number().min(1),
        width: z.number().min(1),
        height: z.number().min(1),
      }).optional(),
    });

    const validated = schema.parse(req.body);

    const totalWeight = validated.items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
    const totalValue = validated.items.reduce((sum, item) => sum + item.value * item.quantity, 0);

    // Get rate first
    const credentials = getCarrierCredentials(validated.carrier);
    const client = createCarrierClient(validated.carrier, credentials);
    const rateResult = await client.getRates(validated.pickup as Location, validated.drop as Location, totalWeight);

    // Create shipment order
    const orderId = generateSecureId();
    const order: ShipmentOrder = {
      orderId,
      pickup: validated.pickup as Location,
      drop: validated.drop as Location,
      items: validated.items as ShipmentOrder['items'],
      serviceType: validated.serviceType as 'standard' | 'express' | 'overnight',
      insurance: validated.insurance,
      cod: validated.cod,
      codAmount: validated.codAmount,
      dimensions: validated.dimensions as { length: number; width: number; height: number },
    };

    // Create shipment with carrier
    const result = await client.createShipment(order);

    // Calculate our charges
    const baseCharge = rateResult.rate as number;
    const fuelSurcharge = baseCharge * 0.15;
    const insuranceCharge = validated.insurance ? Math.min(totalValue * 0.01, 100) : 0;
    const codCharge = validated.cod ? Math.min((rateResult.rate as number) * 0.02, 100) : 0;
    const totalCharge = baseCharge + fuelSurcharge + insuranceCharge + codCharge;

    // Create shipment record in MongoDB
    const shipmentId = generateSecureId();
    const shipment = new Shipment({
      shipmentId,
      orderId,
      carrier: validated.carrier,
      awbNumber: result.awbNumber,
      trackingUrl: result.trackingUrl,
      labelUrl: result.labelUrl,
      status: 'created',
      pickup: {
        ...validated.pickup,
        name: 'Shipper',
        phone: '9999999999',
      },
      delivery: {
        ...validated.drop,
        name: 'Customer',
        phone: '9999999999',
      },
      items: validated.items,
      weight: totalWeight,
      dimensions: validated.dimensions ? {
        length: validated.dimensions.length,
        breadth: validated.dimensions.width,
        height: validated.dimensions.height,
      } : undefined,
      serviceType: validated.serviceType,
      cod: validated.cod,
      codAmount: validated.codAmount,
      insurance: validated.insurance,
      insuranceAmount: insuranceCharge,
      charges: {
        base: Math.round(baseCharge * 100) / 100,
        fuel: Math.round(fuelSurcharge * 100) / 100,
        insurance: Math.round(insuranceCharge * 100) / 100,
        cod: Math.round(codCharge * 100) / 100,
        total: Math.round(totalCharge * 100) / 100,
      },
      estimatedDelivery: result.pickupScheduledDate ? new Date(result.pickupScheduledDate) : undefined,
      events: [{
        timestamp: new Date(),
        status: 'created',
        location: validated.pickup.city || 'Unknown',
        description: 'Shipment created',
      }],
    });

    await shipment.save();

    res.status(201).json({
      success: true,
      data: {
        shipment,
        label: {
          url: result.labelUrl,
          trackingId: result.awbNumber,
        },
        charges: shipment.charges,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      logger.error('Shipment creation error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create shipment' } });
    }
  }
});

// Get shipment by ID
app.get('/api/shipments/:id', authenticate(), async (req, res) => {
  const shipment = await Shipment.findOne({ shipmentId: req.params.id });
  if (!shipment) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
  }
  res.json({ success: true, data: shipment });
});

// Track shipment (from carrier API)
app.get('/api/shipments/:id/track', authenticate(), async (req, res) => {
  const shipment = await Shipment.findOne({ shipmentId: req.params.id });
  if (!shipment) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
  }

  if (!shipment.awbNumber) {
    return res.json({
      success: true,
      data: {
        status: shipment.status,
        events: shipment.events,
        message: 'Tracking not yet available',
      },
    });
  }

  try {
    const credentials = getCarrierCredentials(shipment.carrier);
    const client = createCarrierClient(shipment.carrier, credentials);
    const trackingResult = await client.trackShipment(shipment.awbNumber);

    res.json({
      success: true,
      data: {
        trackingId: shipment.awbNumber,
        carrier: shipment.carrier,
        currentStatus: trackingResult.currentStatus,
        estimatedDelivery: trackingResult.estimatedDelivery,
        events: trackingResult.events,
        lastUpdate: new Date(),
      },
    });
  } catch (error) {
    // Return stored events if tracking fails
    res.json({
      success: true,
      data: {
        trackingId: shipment.awbNumber,
        carrier: shipment.carrier,
        currentStatus: shipment.status,
        events: shipment.events,
        message: 'Live tracking unavailable, showing last known status',
      },
    });
  }
});

// Webhook for carrier status updates (internal only)
app.post('/api/shipments/:id/status', authenticate(), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ shipmentId: req.params.id });
    if (!shipment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    const schema = z.object({
      status: z.string(),
      location: z.string(),
      description: z.string(),
      timestamp: z.string().datetime().optional(),
    });

    const validated = schema.parse(req.body);

    shipment.events.push({
      timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date(),
      status: validated.status,
      location: validated.location,
      description: validated.description,
    });
    shipment.status = validated.status;
    await shipment.save();

    res.json({ success: true, data: shipment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
    }
  }
});

// Get shipments with pagination
app.get('/api/shipments', authenticate(), async (req, res) => {
  const { orderId, status, carrier, limit = '20', offset = '0' } = req.query;

  const query: Record<string, unknown> = {};
  if (orderId) query.orderId = orderId;
  if (status) query.status = status;
  if (carrier) query.carrier = carrier;

  const total = await Shipment.countDocuments(query);
  const shipments = await Shipment.find(query)
    .sort({ createdAt: -1 })
    .skip(parseInt(offset as string))
    .limit(Math.min(parseInt(limit as string), 100)); // Cap at 100

  res.json({
    success: true,
    data: { shipments, total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
  });
});

// Cancel shipment
app.post('/api/shipments/:id/cancel', authenticate(), async (req, res) => {
  const shipment = await Shipment.findOne({ shipmentId: req.params.id });
  if (!shipment) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
  }

  if (['delivered', 'cancelled', 'in_transit'].includes(shipment.status)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Cannot cancel shipment in current status' },
    });
  }

  // Try to cancel with carrier
  if (shipment.awbNumber) {
    try {
      const credentials = getCarrierCredentials(shipment.carrier);
      const client = createCarrierClient(shipment.carrier, credentials);
      await client.cancelShipment(shipment.awbNumber);
    } catch (error) {
      logger.warn('Carrier cancellation failed:', error);
    }
  }

  shipment.status = 'cancelled';
  shipment.events.push({
    timestamp: new Date(),
    status: 'cancelled',
    location: shipment.pickup?.city || 'Unknown',
    description: 'Shipment cancelled',
  });
  await shipment.save();

  res.json({ success: true, data: shipment });
});

// Get label URL
app.get('/api/shipments/:id/label', authenticate(), async (req, res) => {
  const shipment = await Shipment.findOne({ shipmentId: req.params.id });
  if (!shipment) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
  }

  res.json({
    success: true,
    data: {
      labelUrl: shipment.labelUrl || (shipment.trackingUrl ? `${shipment.trackingUrl}/label` : null),
      trackingUrl: shipment.trackingUrl,
      trackingId: shipment.awbNumber,
      carrier: shipment.carrier,
    },
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// SERVER STARTUP
// ============================================

async function start() {
  try {
    // Validate environment in production
    if (process.env.NODE_ENV === 'production') {
      const result = validateRequiredEnvVars(['PORT', 'MONGODB_URI', 'INTERNAL_SERVICE_TOKEN']);
      if (!result.valid) {
        throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
      }
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`KHAIRMOVE Logistics Aggregator running on port ${PORT}`);
      logger.info('Real carrier integrations:');
      logger.info('  - Delhivery (India)');
      logger.info('  - BlueDart (India)');
      logger.info('  - DTDC (India)');
      logger.info('  - FedEx (International)');
      logger.info('  - DHL (International)');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };
