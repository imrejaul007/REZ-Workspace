// ── Phase 7: Order & Payment status contracts ──────────────────────────────────
export * from './orderStatuses';
export * from './paymentStatuses';
export { OrderItemDTO, OrderPaymentDTO, OrderDTO, PaginatedDtoResponse, DtoWalletCoinType } from './dtos';
// PaginatedResponse re-exported from types/api.ts (canonical version)
export * from './statusCompat';

// ── Canonical entity types (Phase 8+: single source of truth) ─────────────────
// Import entity types directly: import type { User, Order } from '@rez/shared'
export * from './types/user.types';
export * from './types/merchant.types';
export * from './types/offer.types';
export * from './types/order.types';
export * from './types/wallet.types';
export * from './types/booking.types';
export * from './types/campaign.types';

// ── Pre-existing shared exports ────────────────────────────────────────────────
// Types
export * from './types/wallet';
export * from './types/api';

// Utils
export * from './utils/currency';
export * from './utils/validation';
export * from './utils/date';

// Constants
export * from './constants/coins';
export * from './constants/errors';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-shared',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
