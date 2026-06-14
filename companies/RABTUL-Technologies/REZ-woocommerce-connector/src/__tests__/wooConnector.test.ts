/**
 * WooCommerce Connector Tests
 * Tests for sync, webhooks, and product mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface WooProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  status: string;
  categories: { id: number; name: string }[];
  tags: { id: number; name: string }[];
  images: { src: string }[];
  stock_quantity: number | null;
  manage_stock: boolean;
}

interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  status: 'active' | 'inactive';
  category: string;
  tags: string[];
  images: string[];
  stock: number;
  manageStock: boolean;
}

interface SyncLog {
  id: string;
  direction: 'woo_to_local' | 'local_to_woo';
  entityType: 'product' | 'order' | 'customer';
  entityId: string;
  status: 'success' | 'failed' | 'partial';
  changes: Record<string, { from: unknown; to: unknown }>;
  timestamp: Date;
  error?: string;
}

// Product mapping
function mapWooToLocal(woo: WooProduct): LocalProduct {
  return {
    id: String(woo.id),
    name: woo.name,
    sku: woo.sku,
    price: parseFloat(woo.price) || 0,
    status: woo.status === 'publish' ? 'active' : 'inactive',
    category: woo.categories[0]?.name || 'Uncategorized',
    tags: woo.tags.map(t => t.name),
    images: woo.images.map(i => i.src),
    stock: woo.stock_quantity ?? 0,
    manageStock: woo.manage_stock,
  };
}

function mapLocalToWoo(local: LocalProduct): Partial<WooProduct> {
  return {
    name: local.name,
    sku: local.sku,
    price: String(local.price),
    status: local.status === 'active' ? 'publish' : 'draft',
    stock_quantity: local.manageStock ? local.stock : null,
    manage_stock: local.manageStock,
  };
}

// Diff detection
interface ProductDiff {
  field: string;
  wooValue: unknown;
  localValue: unknown;
}

function detectDifferences(
  woo: WooProduct,
  local: LocalProduct,
  fieldMappings: Record<string, (woo: WooProduct, local: LocalProduct) => { woo: unknown; local: unknown }>
): ProductDiff[] {
  const differences: ProductDiff[] = [];

  for (const [field, mapper] of Object.entries(fieldMappings)) {
    const { woo: wooVal, local: localVal } = mapper(woo, local);
    if (wooVal !== localVal) {
      differences.push({ field, wooValue: wooVal, localValue: localVal });
    }
  }

  return differences;
}

const FIELD_MAPPINGS: Record<string, (woo: WooProduct, local: LocalProduct) => { woo: unknown; local: unknown }> = {
  name: (w, l) => ({ woo: w.name, local: l.name }),
  price: (w, l) => ({ woo: parseFloat(w.price) || 0, local: l.price }),
  status: (w, l) => ({
    woo: w.status === 'publish' ? 'active' : 'inactive',
    local: l.status,
  }),
  stock: (w, l) => ({ woo: w.stock_quantity ?? 0, local: l.stock }),
};

// Sync conflict resolution
type ConflictResolution = 'woo_wins' | 'local_wins' | 'latest' | 'manual';

function resolveConflict(
  diff: ProductDiff,
  resolution: ConflictResolution,
  wooUpdatedAt: Date,
  localUpdatedAt: Date
): unknown {
  switch (resolution) {
    case 'woo_wins': return diff.wooValue;
    case 'local_wins': return diff.localValue;
    case 'latest': return wooUpdatedAt > localUpdatedAt ? diff.wooValue : diff.localValue;
    default: return undefined;
  }
}

// Webhook event handling
interface WebhookEvent {
  event: string;
  data: { id: number; [key: string]: unknown };
  createdAt: Date;
}

function parseWebhookEvent(event: string): { type: string; action: string } {
  const parts = event.split('.');
  return { type: parts[0], action: parts[1] || 'updated' };
}

function shouldSync(event: WebhookEvent, enabledEvents: string[]): boolean {
  if (enabledEvents.includes('*')) return true;
  return enabledEvents.includes(event.event);
}

// Sync log management
function createSyncLog(
  direction: SyncLog['direction'],
  entityType: SyncLog['entityType'],
  entityId: string,
  status: SyncLog['status'],
  changes?: Record<string, { from: unknown; to: unknown }>,
  error?: string
): SyncLog {
  return {
    id: `sync_${Date.now()}`,
    direction,
    entityType,
    entityId,
    status,
    changes: changes || {},
    timestamp: new Date(),
    error,
  };
}

describe('Product Mapping', () => {
  const wooProduct: WooProduct = {
    id: 123,
    name: 'Test Product',
    sku: 'TEST-001',
    price: '99.99',
    status: 'publish',
    categories: [{ id: 1, name: 'Electronics' }],
    tags: [{ id: 1, name: 'New' }],
    images: [{ src: 'https://example.com/image.jpg' }],
    stock_quantity: 50,
    manage_stock: true,
  };

  it('should map WooCommerce to local product', () => {
    const local = mapWooToLocal(wooProduct);

    expect(local.id).toBe('123');
    expect(local.name).toBe('Test Product');
    expect(local.price).toBe(99.99);
    expect(local.status).toBe('active');
    expect(local.category).toBe('Electronics');
    expect(local.stock).toBe(50);
  });

  it('should map local to WooCommerce product', () => {
    const local: LocalProduct = {
      id: '456',
      name: 'Local Product',
      sku: 'LOCAL-001',
      price: 49.99,
      status: 'active',
      category: 'Fashion',
      tags: ['sale'],
      images: [],
      stock: 25,
      manageStock: true,
    };

    const woo = mapLocalToWoo(local);

    expect(woo.name).toBe('Local Product');
    expect(woo.price).toBe('49.99');
    expect(woo.status).toBe('publish');
    expect(woo.stock_quantity).toBe(25);
  });

  it('should handle missing values', () => {
    const partialWoo: WooProduct = {
      ...wooProduct,
      categories: [],
      tags: [],
      images: [],
      stock_quantity: null,
    };

    const local = mapWooToLocal(partialWoo);

    expect(local.category).toBe('Uncategorized');
    expect(local.tags).toEqual([]);
    expect(local.images).toEqual([]);
    expect(local.stock).toBe(0);
  });
});

describe('Difference Detection', () => {
  const woo: WooProduct = {
    id: 1,
    name: 'Updated Name',
    sku: 'SKU-001',
    price: '149.99',
    status: 'publish',
    categories: [],
    tags: [],
    images: [],
    stock_quantity: 100,
    manage_stock: true,
  };

  const local: LocalProduct = {
    id: '1',
    name: 'Original Name',
    sku: 'SKU-001',
    price: 99.99,
    status: 'active',
    category: 'Electronics',
    tags: [],
    images: [],
    stock: 50,
    manageStock: true,
  };

  it('should detect name difference', () => {
    const diffs = detectDifferences(woo, local, FIELD_MAPPINGS);
    const nameDiff = diffs.find(d => d.field === 'name');

    expect(nameDiff).toBeDefined();
    expect(nameDiff?.wooValue).toBe('Updated Name');
    expect(nameDiff?.localValue).toBe('Original Name');
  });

  it('should detect price difference', () => {
    const diffs = detectDifferences(woo, local, FIELD_MAPPINGS);
    const priceDiff = diffs.find(d => d.field === 'price');

    expect(priceDiff).toBeDefined();
    expect(priceDiff?.wooValue).toBe(149.99);
    expect(priceDiff?.localValue).toBe(99.99);
  });

  it('should detect stock difference', () => {
    const diffs = detectDifferences(woo, local, FIELD_MAPPINGS);
    const stockDiff = diffs.find(d => d.field === 'stock');

    expect(stockDiff).toBeDefined();
    expect(stockDiff?.wooValue).toBe(100);
    expect(stockDiff?.localValue).toBe(50);
  });
});

describe('Conflict Resolution', () => {
  const diff: ProductDiff = {
    field: 'price',
    wooValue: 100,
    localValue: 90,
  };

  it('should resolve with WooCommerce value', () => {
    const resolved = resolveConflict(diff, 'woo_wins', new Date(), new Date());
    expect(resolved).toBe(100);
  });

  it('should resolve with local value', () => {
    const resolved = resolveConflict(diff, 'local_wins', new Date(), new Date());
    expect(resolved).toBe(90);
  });

  it('should resolve based on timestamp', () => {
    const wooNewer = resolveConflict(
      diff,
      'latest',
      new Date('2024-01-02'),
      new Date('2024-01-01')
    );
    expect(wooNewer).toBe(100);

    const localNewer = resolveConflict(
      diff,
      'latest',
      new Date('2024-01-01'),
      new Date('2024-01-02')
    );
    expect(localNewer).toBe(90);
  });
});

describe('Webhook Event Handling', () => {
  it('should parse event type', () => {
    expect(parseWebhookEvent('product.created')).toEqual({
      type: 'product',
      action: 'created',
    });
  });

  it('should handle update event', () => {
    expect(parseWebhookEvent('product.updated')).toEqual({
      type: 'product',
      action: 'updated',
    });
  });

  it('should check if should sync', () => {
    const event: WebhookEvent = {
      event: 'product.created',
      data: { id: 123 },
      createdAt: new Date(),
    };

    expect(shouldSync(event, ['product.created', 'product.updated'])).toBe(true);
    expect(shouldSync(event, ['order.created'])).toBe(false);
    expect(shouldSync(event, ['*'])).toBe(true);
  });
});

describe('Sync Logging', () => {
  it('should create success log', () => {
    const log = createSyncLog(
      'woo_to_local',
      'product',
      '123',
      'success',
      { price: { from: 100, to: 99 } }
    );

    expect(log.id).toMatch(/^sync_/);
    expect(log.direction).toBe('woo_to_local');
    expect(log.status).toBe('success');
    expect(log.changes.price.from).toBe(100);
  });

  it('should create failure log', () => {
    const log = createSyncLog(
      'local_to_woo',
      'product',
      '456',
      'failed',
      undefined,
      'Connection timeout'
    );

    expect(log.status).toBe('failed');
    expect(log.error).toBe('Connection timeout');
  });
});

describe('Stock Sync', () => {
  function syncStock(
    wooStock: number | null,
    manageStock: boolean,
    localStock: number
  ): number {
    if (!manageStock) return localStock;
    return wooStock ?? localStock;
  }

  it('should sync when managed in WooCommerce', () => {
    expect(syncStock(100, true, 50)).toBe(100);
  });

  it('should keep local stock when not managed', () => {
    expect(syncStock(100, false, 50)).toBe(50);
  });

  it('should handle null WooCommerce stock', () => {
    expect(syncStock(null, true, 50)).toBe(50);
  });
});

describe('SKU Generation', () => {
  function generateSku(prefix: string, id: string): string {
    const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `${prefix}-${sanitizedId}`.substring(0, 20);
  }

  it('should generate valid SKU', () => {
    const sku = generateSku('WOOCOM', '123');
    expect(sku).toBe('WOOCOM-123');
  });

  it('should handle special characters', () => {
    const sku = generateSku('WOOCOM', 'abc-123_xyz');
    expect(sku).toBe('WOOCOM-ABC123XYZ');
  });

  it('should limit length', () => {
    const sku = generateSku('W', '12345678901234567890');
    expect(sku.length).toBeLessThanOrEqual(20);
  });
});
