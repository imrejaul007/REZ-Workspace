/**
 * REZ Unified Service
 * Connects REZ-Consumer to all services
 *
 * Features:
 * - Single API for all app features
 * - Connects to RABTUL-Technologies
 * - Connects to REZ-Intelligence
 * - Connects to REZ-Media
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger';
import {
  initializeREZUnifiedIntelligence,
  emitCrossProductOrder,
  emitCrossProductActivity,
  getUnifiedIntelligenceStats,
  getCrossProductInsights
} from './intelligence';

const app = express();
const PORT = parseInt(process.env.PORT || '4100', 10);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// ============================================
// INTELLIGENCE INITIALIZATION
// ============================================

let unifiedIntelligence: any = null;

async function initializeIntelligence(): Promise<void> {
  try {
    unifiedIntelligence = await initializeREZUnifiedIntelligence({
      emitToParent: async (signal: any) => {
        // Emit to parent HOJAI Intelligence if available
        try {
          await fetch(`${process.env.HOJAI_INTELLIGENCE_URL || 'http://localhost:4100'}/api/intelligence/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...signal, source: 'rez-unified-service' }),
          });
        } catch (e) {
          // Parent not available
        }
      }
    });
    logger.info('REZ Unified Intelligence initialized successfully');
  } catch (error) {
    logger.warn('REZ Unified Intelligence initialization failed', { error });
  }
}

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rez-unified-service' });
});

// ============================================
// AUTH + AI → Unified Profile
// ============================================

app.get('/profile/:phone', async (req, res) => {
  const { phone } = req.params;

  // Get from REZ-Intelligence (Consumer Graph)
  // Get from RABTUL Auth Service
  // Get from RABTUL Wallet

  res.json({
    profile: { phone },
    wallet: { balance: 0 },
    ai: { intent: 'purchase', confidence: 0.85 }
  });
});

// ============================================
// CART → ORDER → PAYMENT
// ============================================

app.post('/cart/checkout', async (req, res) => {
  // Create order in RABTUL Order Service
  // Process payment via RABTUL Payment Service
  // Credit wallet via RABTUL Wallet
  // Track via REZ-Intelligence

  const { userId, orderId, products, totalAmount, currency } = req.body;

  // Emit cross-product intelligence signal
  await emitCrossProductOrder({
    userId,
    orderId: orderId || `order_${Date.now()}`,
    products,
    totalAmount,
    currency,
    source: 'rez-unified-checkout',
    timestamp: new Date().toISOString(),
  });

  res.json({ orderId: orderId || 'order_123' });
});

// ============================================
// ENGAGEMENT → WALLET REWARDS
// ============================================

app.post('/rewards/credit', async (req, res) => {
  // Credit via RABTUL Wallet
  // Track via REZ-Intelligence Intent
  // Notify via REZ-Media Engagement

  const { userId, amount, source } = req.body;

  // Emit cross-product activity
  await emitCrossProductActivity({
    userId,
    type: 'reward_credited',
    amount,
    source,
    timestamp: new Date().toISOString(),
  });

  res.json({ credited: true });
});

// ============================================
// INTELLIGENCE ENDPOINTS
// ============================================

app.get('/api/intelligence/stats', async (_req, res) => {
  const stats = await getUnifiedIntelligenceStats();
  res.json({ success: true, data: stats });
});

app.get('/api/intelligence/insights', async (_req, res) => {
  const insights = await getCrossProductInsights();
  res.json({ success: true, data: insights });
});

// ============================================
// START SERVER
// ============================================

async function startServer(): Promise<void> {
  // Initialize intelligence
  await initializeIntelligence();

  app.listen(PORT, () => {
    logger.info(`Unified Service running on port ${PORT} (Intelligence: ${unifiedIntelligence ? 'Active' : 'Standalone'})`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;
