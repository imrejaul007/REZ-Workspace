/**
 * REZ Revenue AI - Core Pricing Engine
 * Dynamic pricing calculation with multi-factor optimization
 * Simplified version with flexible input
 */

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '5mb' }));

// ================== PRICING ENGINE ==================

interface PriceContext {
  entity: {
    id: string;
    type: string;
    category: string;
    vertical: string;
    name: string;
    basePrice: number;
    cost: number;
  };
  time?: {
    dayOfWeek?: number;
    hourOfDay?: number;
    isPeakHour?: boolean;
    isWeekend?: boolean;
    season?: string;
    month?: number;
  };
  demand?: { current?: number };
  inventory?: { slotsRemaining?: number; totalSlots?: number; percentage?: number };
  competition?: { avgPrice?: number; lowestPrice?: number; highestPrice?: number };
  location?: { city?: string; tier?: number };
  audience?: { segment?: string };
  constraints?: { minMargin?: number; maxSurge?: number };
  weather?: string;
}

interface PriceDecision {
  entityId: string;
  originalPrice: number;
  finalPrice: number;
  minPrice: number;
  maxPrice: number;
  adjustment: number;
  adjustmentType: string;
  factors: Array<{ name: string; reason: string; contribution: number }>;
  alternativePrices?: Array<{ label: string; price: number }>;
  pricingRange: {
    min: number;
    max: number;
    recommended: number;
    currency: string;
  };
}

/**
 * Calculate dynamic price
 */
function calculateDynamicPrice(ctx: PriceContext): PriceDecision {
  const entity = ctx.entity;
  const time = ctx.time || {};
  const inventory = ctx.inventory || {};
  const audience = ctx.audience || {};
  const constraints = ctx.constraints || {};

  let finalPrice = entity.basePrice;
  let adjustment = 0;
  const factors: Array<{ name: string; reason: string; contribution: number }> = [];

  // 1. TIME FACTORS
  const hour = time.hourOfDay ?? 12;
  const day = time.dayOfWeek ?? new Date().getDay();
  const isPeakHour = time.isPeakHour ?? ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21));
  const isWeekend = time.isWeekend ?? (day === 0 || day === 6);

  if (isPeakHour) {
    const surge = 0.15;
    factors.push({ name: 'Peak Hour', reason: 'High demand time', contribution: surge * 100 });
    finalPrice *= (1 + surge);
    adjustment += surge * 100;
  }

  if (isWeekend) {
    const surge = 0.10;
    factors.push({ name: 'Weekend', reason: 'Weekend pricing', contribution: surge * 100 });
    finalPrice *= (1 + surge);
    adjustment += surge * 100;
  }

  // 2. INVENTORY/SCARCITY FACTORS
  const slotsRemaining = inventory.slotsRemaining ?? 10;
  const totalSlots = inventory.totalSlots ?? 15;
  const occupancy = totalSlots > 0 ? 1 - (slotsRemaining / totalSlots) : 0;

  if (occupancy > 0.7) {
    const scarcitySurge = Math.round((occupancy - 0.7) * 100);
    factors.push({ name: 'High Demand', reason: `${Math.round(occupancy * 100)}% occupancy`, contribution: scarcitySurge });
    finalPrice *= (1 + scarcitySurge / 100);
    adjustment += scarcitySurge;
  }

  // 3. DEMAND FACTORS
  const demand = ctx.demand?.current ?? 50;
  if (demand > 80) {
    const demandSurge = (demand - 80) / 2;
    factors.push({ name: 'High Demand', reason: `${demand}% demand`, contribution: demandSurge });
    finalPrice *= (1 + demandSurge / 100);
    adjustment += demandSurge;
  }

  // 4. AUDIENCE SEGMENT FACTORS
  const segment = audience.segment ?? 'regular';
  if (segment === 'vip') {
    factors.push({ name: 'VIP', reason: 'Premium customer discount', contribution: -5 });
    finalPrice *= 0.95;
    adjustment -= 5;
  } else if (segment === 'new') {
    factors.push({ name: 'New Customer', reason: 'Welcome discount', contribution: -10 });
    finalPrice *= 0.90;
    adjustment -= 10;
  } else if (segment === 'at_risk') {
    factors.push({ name: 'At Risk', reason: 'Retention discount', contribution: -15 });
    finalPrice *= 0.85;
    adjustment -= 15;
  }

  // 5. COMPETITION FACTORS
  const competition = ctx.competition || {};
  if (competition.lowestPrice && entity.basePrice > competition.lowestPrice * 1.2) {
    factors.push({ name: 'Competitive Gap', reason: 'Price below market', contribution: -5 });
    finalPrice *= 0.95;
    adjustment -= 5;
  }

  // 6. CONSTRAINTS - Already applied above
  // 7. Calculate min/max prices
  const cost = entity.cost ?? (entity.basePrice * 0.4);
  const margin = entity.basePrice - cost;
  const surgeLimit = constraints.maxSurge ?? 2.0;
  const minPrice = Math.round(entity.basePrice * 0.85); // 15% minimum discount
  const maxPriceLimit = Math.round(entity.basePrice * surgeLimit);
  const finalMaxPrice = Math.min(maxPriceLimit, entity.basePrice * 2);

  // Round to nearest integer
  finalPrice = Math.round(finalPrice);

  const adjustmentType = adjustment > 5 ? 'surge' : adjustment < -5 ? 'discount' : 'none';

  return {
    entityId: entity.id,
    originalPrice: entity.basePrice,
    finalPrice,
    minPrice: Math.round(entity.basePrice * 0.85),
    maxPrice: finalMaxPrice,
    adjustment: Math.round(adjustment * 10) / 10,
    adjustmentType,
    factors,
    alternativePrices: [
      { label: 'Book off-peak', price: Math.round(entity.basePrice * 0.85) },
      { label: 'Bundle deal', price: Math.round(entity.basePrice * 0.90) },
    ],
    pricingRange: {
      min: Math.round(entity.basePrice * 0.85),
      max: finalMaxPrice,
      recommended: finalPrice,
      currency: 'INR',
    },
  };
}

// ================== ENDPOINTS ==================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-revenue-ai-pricing-engine', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.post('/api/v1/pricing/calculate', (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const ctx = req.body.context || req.body;
    const result = calculateDynamicPrice(ctx as PriceContext);

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Pricing calculation failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATION_ERROR', message: 'Failed to calculate price' },
    });
  }
});

app.post('/api/v1/pricing/batch', (req: Request, res: Response) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'items must be an array' },
    });
  }

  const results = items.map((ctx: PriceContext) => calculateDynamicPrice(ctx));

  res.json({
    success: true,
    data: { items: results, count: results.length },
  });
});

app.get('/api/v1/verticals', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      verticals: ['restaurant', 'hotel', 'salon', 'gym', 'clinic', 'retail', 'ride'],
    },
  });
});

// MERCHANT ENDPOINTS - Simple pricing for merchants
app.post('/api/v1/merchant/price-range', (req: Request, res: Response) => {
  const { basePrice, cost, vertical, category, name } = req.body;

  if (!basePrice) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'basePrice is required' },
    });
  }

  const price = basePrice;
  const itemCost = cost || (basePrice * 0.4);
  const margin = price - itemCost;

  res.json({
    success: true,
    data: {
      item: { name: name || 'Item', category: category || 'general', vertical: vertical || 'restaurant' },
      pricing: {
        cost: itemCost,
        minPrice: Math.round(price * 0.85),
        basePrice: price,
        maxPrice: Math.round(price * 2.0),
        suggestedPrices: {
          budget: Math.round(price * 0.85),
          standard: price,
          premium: Math.round(price * 1.15),
          luxury: Math.round(price * 1.5),
        },
        margin: {
          minMargin: Math.round((price * 0.85 - itemCost) / price * 100),
          baseMargin: Math.round(margin / price * 100),
          maxMargin: Math.round((price * 2 - itemCost) / (price * 2) * 100),
        },
      },
      formula: 'minPrice = basePrice × 0.85, maxPrice = basePrice × 2.0',
    },
  });
});

app.get('/api/v1/merchant/price-check', (req: Request, res: Response) => {
  const { basePrice, cost, sellingPrice } = req.query;

  if (!basePrice) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'basePrice is required' },
    });
  }

  const price = parseFloat(basePrice as string);
  const itemCost = parseFloat(cost as string) || (price * 0.4);
  const sellPrice = sellingPrice ? parseFloat(sellingPrice as string) : null;
  const margin = price - itemCost;

  const minPrice = Math.round(price * 0.85);
  const maxPrice = Math.round(price * 2.0);

  const response: any = {
    success: true,
    data: {
      basePrice: price,
      cost: itemCost,
      minPrice,
      maxPrice,
      range: {
        min: minPrice,
        max: maxPrice,
        spread: maxPrice - minPrice,
      },
      margin: {
        atMin: Math.round((minPrice - itemCost) / minPrice * 100),
        atBase: Math.round(margin / price * 100),
        atMax: Math.round((maxPrice - itemCost) / maxPrice * 100),
      },
    },
  };

  if (sellPrice) {
    const inRange = sellPrice >= minPrice && sellPrice <= maxPrice;
    response.data.sellingPrice = sellPrice;
    response.data.valid = inRange;
    response.data.message = inRange
      ? `₹${sellPrice} is within valid range`
      : sellPrice < minPrice
        ? `⚠️ ₹${sellPrice} is BELOW minimum (₹${minPrice})`
        : `⚠️ ₹${sellPrice} is ABOVE maximum (₹${maxPrice})`;
  }

  res.json(response);
});

const PORT = process.env.PORT || 4301;
app.listen(PORT, () => {
  logger.info(`REZ Revenue AI Pricing Engine started on port ${PORT}`);
});

export default app;
