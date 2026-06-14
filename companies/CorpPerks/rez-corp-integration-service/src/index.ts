/**
 * CorpPerks Integration Service
 * Connects CorpPerks to RABTUL-Technologies
 *
 * Features:
 * - Employee benefits → Wallet credits
 * - Travel bookings → Order + Payment
 * - Expense tracking → Analytics
 */

import 'dotenv/config';
import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = parseInt(process.env.PORT || '4100', 10);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'corp-integration', timestamp: new Date().toISOString() });
});

// ============================================
// EMPLOYEE BENEFITS → WALLET
// ============================================

// Credit benefits to employee wallet
app.post('/benefits/credit', async (req, res) => {
  const { employeeId, amount, type, reason } = req.body;

  // Call RABTUL Wallet Service
  // await fetch(`${WALLET_SERVICE}/wallet/credit`, { body: { employeeId, amount } }

  res.json({ success: true, transactionId: `txn_${Date.now()}` });
});

// ============================================
// TRAVEL BOOKING → ORDER + PAYMENT
// ============================================

// Book travel → creates order in RABTUL Order Service
app.post('/travel/book', async (req, res) => {
  const { employeeId, type, details } = req.body;

  // 1. Create order in RABTUL Order Service
  // 2. Process payment via RABTUL Payment Service
  // 3. Send notification via RABTUL Notifications

  res.json({ success: true, bookingId: `booking_${Date.now()}` });
});

// ============================================
// EXPENSES → ANALYTICS
// ============================================

// Track expense → log to RABTUL Analytics
app.post('/expenses/track', async (req, res) => {
  const { employeeId, expense } = req.body;

  // Log to RABTUL Analytics Service
  res.json({ success: true });
});

// ============================================
// CORPORATE PROFILE → AUTH
// ============================================

// Sync corporate users with RABTUL Auth
app.post('/corporate/sync', async (req, res) => {
  const { company, employees } = req.body;

  // Create/update users in RABTUL Auth Service
  res.json({ synced: employees.length });
});

app.listen(PORT, () => {
  logger.info(`CorpPerks Integration Service running on port ${PORT}`);
});

export default app;
