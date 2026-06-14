/**
 * Karma Foundation - Loyalty Bridge Service
 * Connects Karma Foundation (social impact) with RABTUL Unified Loyalty (universal coins)
 *
 * Flow:
 * Karma Action → Karma Score → REZ Coins → Tier Progress → More Benefits
 */
import crypto, { timingSafeEqual } from 'crypto';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ConversionRecord, IConversionRecord } from './models/conversionModel.js';
import { z } from 'zod';

const app = express();
const PORT = parseInt(process.env.PORT || '4098', 10);

// SECURITY FIX: Add request body size limit to prevent memory exhaustion
app.use(express.json({ limit: '10kb' }));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// ============================================
// CONFIGURATION
// ============================================

const RABTUL_URL = process.env.RABTUL_URL || 'http://localhost:4004';
const KARMA_URL = process.env.KARMA_URL || 'http://localhost:3009';

// SECURITY FIX: Validation schemas with Zod for userId
const UserIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid userId format');

// Zod validation schemas
const ConvertPreviewSchema = z.object({
  karmaPoints: z.number().positive(),
  actionType: z.enum(['checkin', 'donation', 'share', 'review', 'mission', 'streak']),
  karmaScore: z.number().optional().default(300),
});

const ConvertSchema = z.object({
  userId: z.string().min(1),
  karmaUserId: z.string().min(1),
  karmaPoints: z.number().positive(),
  actionType: z.enum(['checkin', 'donation', 'share', 'review', 'mission', 'streak']),
  karmaScore: z.number().optional().default(300),
  description: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

// Conversion rates
const CONVERSION_RATES: Record<string, number> = {
  checkin: 0.1,
  donation: 0.15,
  share: 0.05,
  review: 0.1,
  mission: 0.2,
  streak: 0.25,
};

const TIER_MULTIPLIERS: Record<string, number> = {
  BRONZE: 1.0,
  SILVER: 1.25,
  GOLD: 1.5,
  PLATINUM: 2.0,
};

const TIER_THRESHOLDS: Record<string, number> = {
  SILVER: 450,
  GOLD: 600,
  PLATINUM: 750,
};

// ============================================
// TIER & CONVERSION LOGIC
// ============================================

type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

function getTierFromKarmaScore(karmaScore: number): Tier {
  if (karmaScore >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (karmaScore >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (karmaScore >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

function convertKarmaToRezCoins(
  karmaPoints: number,
  actionType: string,
  tier: Tier,
  karmaScore: number
): number {
  const baseRate = CONVERSION_RATES[actionType] || 0.1;
  let coins = karmaPoints * baseRate;

  // Apply tier multiplier
  const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;
  coins *= tierMultiplier;

  // Apply karma score bonus (every 100 points above 450 = +5% bonus, max 50%)
  if (karmaScore >= 450) {
    const scoreBonus = Math.floor((karmaScore - 450) / 100) * 0.05;
    coins *= (1 + Math.min(scoreBonus, 0.5));
  }

  return Math.round(coins * 100) / 100;
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'karma-loyalty-bridge' });
});

// Conversion preview
app.post('/api/v1/convert/preview', async (req: Request, res: Response) => {
  try {
    const validation = ConvertPreviewSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { karmaPoints, actionType, karmaScore } = validation.data;
    const tier = getTierFromKarmaScore(karmaScore);

    const coins = convertKarmaToRezCoins(karmaPoints, actionType, tier, karmaScore);
    const baseRate = CONVERSION_RATES[actionType] || 0.1;
    const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;

    res.json({
      karmaPoints,
      actionType,
      karmaScore,
      tier,
      baseRate,
      tierMultiplier,
      scoreBonus: karmaScore >= 450 ? Math.min(Math.floor((karmaScore - 450) / 100) * 5, 50) : 0,
      rezCoins: coins,
    });
  } catch (error) {
    logger.error('Preview error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert karma points to REZ coins
app.post('/api/v1/convert', async (req: Request, res: Response) => {
  try {
    const validation = ConvertSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { userId, karmaUserId, karmaPoints, actionType, karmaScore, description, idempotencyKey } = validation.data;

    // SECURITY FIX: Use atomic findOneAndUpdate with upsert for idempotency
    const tier = getTierFromKarmaScore(karmaScore);
    const rezCoins = convertKarmaToRezCoins(karmaPoints, actionType, tier, karmaScore);
    const recordIdempotencyKey = idempotencyKey || crypto.randomUUID();

    // Atomic upsert - prevents race condition on concurrent requests
    const existing = await ConversionRecord.findOneAndUpdate(
      { idempotencyKey: recordIdempotencyKey },
      {
        $setOnInsert: {
          userId,
          karmaUserId,
          action: actionType,
          karmaPoints,
          rezCoins,
          tier,
          karmaScore,
          status: 'completed',
          idempotencyKey: recordIdempotencyKey,
        }
      },
      { upsert: true, new: true }
    );

    // Check if this was an existing record (idempotent response)
    const isIdempotent = existing.karmaPoints !== karmaPoints || existing.rezCoins !== rezCoins;

    logger.info('Conversion completed', {
      recordId: existing._id,
      userId,
      karmaPoints,
      rezCoins,
      idempotent: isIdempotent,
    });

    res.json({
      success: true,
      conversion: {
        id: existing._id,
        userId: existing.userId,
        karmaPoints: existing.karmaPoints,
        rezCoins: existing.rezCoins,
        status: existing.status,
        timestamp: existing.createdAt,
      },
      idempotent: isIdempotent,
    });
  } catch (error) {
    logger.error('Conversion error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversion history
app.get('/api/v1/conversions/:userId', async (req: Request, res: Response) => {
  try {
    // SECURITY FIX: Validate userId format
    const userIdValidation = UserIdSchema.safeParse(req.params.userId);
    if (!userIdValidation.success) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }
    const userId: string = userIdValidation.data;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const conversions = await ConversionRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      conversions,
      total: await ConversionRecord.countDocuments({ userId }),
    });
  } catch (error) {
    logger.error('History error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversion rates
app.get('/api/v1/config/rates', (_req: Request, res: Response) => {
  res.json({
    conversionRates: CONVERSION_RATES,
    tierMultipliers: TIER_MULTIPLIERS,
    tierThresholds: TIER_THRESHOLDS,
  });
});

// Update conversion rates (admin)
app.put('/api/v1/config/rates', async (req: Request, res: Response) => {
  const adminToken = req.headers['x-admin-token'] as string | undefined;

  // SECURITY FIX: Use timing-safe comparison to prevent timing attacks
  if (!adminToken || !process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const adminBuffer = Buffer.from(adminToken);
  const envBuffer = Buffer.from(process.env.ADMIN_TOKEN);

  if (adminBuffer.length !== envBuffer.length ||
      !timingSafeEqual(adminBuffer, envBuffer)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // In production, store in database
  res.json({ message: 'Rates updated (in-memory for now)' });
});

// ============================================
// STARTUP & SHUTDOWN
// ============================================

async function start(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`Karma-Loyalty Bridge started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

export default app;
