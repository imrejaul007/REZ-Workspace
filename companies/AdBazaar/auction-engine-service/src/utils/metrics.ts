import client, { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Auction-specific metrics

// Request counters by auction type
export const auctionRequestsTotal = new Counter({
  name: 'auction_requests_total',
  help: 'Total number of auction requests by type',
  labelNames: ['auction_type', 'status'],
  registers: [register],
});

// Auction duration histogram
export const auctionDurationSeconds = new Histogram({
  name: 'auction_duration_seconds',
  help: 'Auction processing duration in seconds',
  labelNames: ['auction_type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Total bids counter
export const auctionBidsTotal = new Counter({
  name: 'auction_bids_total',
  help: 'Total number of bids processed',
  labelNames: ['auction_type'],
  registers: [register],
});

// Wins counter by seat
export const auctionWinsTotal = new Counter({
  name: 'auction_wins_total',
  help: 'Total number of auction wins by seat',
  labelNames: ['seat_id', 'auction_type'],
  registers: [register],
});

// Revenue counter in cents
export const auctionRevenueCents = new Counter({
  name: 'auction_revenue_cents',
  help: 'Auction revenue in cents',
  labelNames: ['auction_type'],
  registers: [register],
});

// Auction price histogram
export const auctionPriceHistogram = new Histogram({
  name: 'auction_price_histogram',
  help: 'Distribution of auction prices',
  labelNames: ['auction_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register],
});

// No-fill counter
export const auctionNofillTotal = new Counter({
  name: 'auction_nofill_total',
  help: 'Total number of no-fill auctions',
  labelNames: ['auction_type', 'reason'],
  registers: [register],
});

// Active auctions gauge
export const activeAuctionsGauge = new Gauge({
  name: 'auction_active_auctions',
  help: 'Number of currently active auctions',
  registers: [register],
});

// Bid latency histogram
export const bidLatencySeconds = new Histogram({
  name: 'auction_bid_latency_seconds',
  help: 'Time from bid submission to auction completion',
  labelNames: ['auction_type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

// Quality score histogram (for weighted auctions)
export const qualityScoreHistogram = new Histogram({
  name: 'auction_quality_score_histogram',
  help: 'Distribution of quality scores in weighted auctions',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

// Effective bid histogram
export const effectiveBidHistogram = new Histogram({
  name: 'auction_effective_bid_histogram',
  help: 'Distribution of effective bids (price * quality)',
  labelNames: ['auction_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 25, 50],
  registers: [register],
});

// Export registry
export { register };

// Helper function to record auction metrics
export function recordAuctionMetrics(
  auctionType: string,
  status: 'completed' | 'no-fill' | 'error',
  duration: number,
  price: number,
  winnerSeatId?: string
) {
  auctionRequestsTotal.inc({ auction_type: auctionType, status });
 auctionDurationSeconds.observe({ auction_type: auctionType }, duration);
  auctionPriceHistogram.observe({ auction_type: auctionType }, price);

  if (status === 'completed' && winnerSeatId) {
    auctionWinsTotal.inc({ seat_id: winnerSeatId, auction_type: auctionType });
    auctionRevenueCents.inc({ auction_type: auctionType }, Math.round(price * 100));
  } else if (status === 'no-fill') {
    auctionNofillTotal.inc({ auction_type: auctionType, reason: 'reserve_not_met' });
  }
}

// Helper to record bid metrics
export function recordBidMetrics(auctionType: string, bidCount: number) {
  auctionBidsTotal.inc({ auction_type: auctionType }, bidCount);
}
