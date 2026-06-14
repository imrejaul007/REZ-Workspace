type Intent =
  | 'order'
  | 'recommend'
  | 'track'
  | 'cancel'
  | 'help'
  | 'menu'
  | 'unknown';

interface DetectedIntent {
  intent: Intent;
  confidence: number;
  entities?: Record<string, string>;
}

const INTENT_PATTERNS = {
  order: [
    /order/i,
    /place.*order/i,
    /buy/i,
    /get.*food/i,
    /i want.*(biryani|pizza|burger|coffee|tea)/i,
  ],
  recommend: [
    /recommend/i,
    /suggest/i,
    /what.*should.*(i|we)/i,
    /surprise.*me/i,
    /something.*new/i,
  ],
  track: [
    /where.*(order|food)/i,
    /track/i,
    /status/i,
    /how.*long/i,
  ],
  cancel: [
    /cancel/i,
    /refund/i,
    /delete.*order/i,
  ],
  menu: [
    /menu/i,
    /what.*(available|serve)/i,
    /show.*(items|food)/i,
  ],
  help: [
    /help/i,
    /support/i,
    /speak.*(someone|agent)/i,
  ],
};

export function detectIntent(query: string): DetectedIntent {
  const lowerQuery = query.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerQuery)) {
        return { intent: intent as Intent, confidence: 0.9 };
      }
    }
  }

  return { intent: 'unknown', confidence: 0.5 };
}

export function extractEntities(query: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Extract items
  const items = ['biryani', 'pizza', 'burger', 'coffee', 'tea', 'dosa', 'idli', 'samosa'];
  for (const item of items) {
    if (query.toLowerCase().includes(item)) {
      entities.item = item;
      break;
    }
  }

  // Extract quantities
  const quantityMatch = query.match(/(\d+)\s*(?:plates?|orders?|items?|pieces?)/i);
  if (quantityMatch) {
    entities.quantity = quantityMatch[1];
  }

  return entities;
}
