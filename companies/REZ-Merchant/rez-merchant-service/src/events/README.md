# Inventory Events Integration

This module emits `inventory.low` events to the REZ Event Platform.

## Setup

1. **Environment Variables**

Add to your `.env`:
```bash
EVENT_PLATFORM_URL=http://localhost:4008
ENABLE_EVENT_EMISSION=true
INTERNAL_SERVICE_TOKEN=your-service-token
```

2. **Install Dependencies**

```bash
npm install axios uuid
```

## Usage

### Option 1: Check and Emit

```typescript
import { checkAndEmitInventoryLow } from './events/inventory.events';
import Product from '../models/Product';

// When updating product stock
const product = await Product.findById(productId);
const oldStock = product.inventory.stock;
const newStock = oldStock - quantitySold;

product.inventory.stock = newStock;
await product.save();

// This emits only if stock crosses threshold
await checkAndEmitInventoryLow(product, newStock);
```

### Option 2: Manual Emit

```typescript
import { emitInventoryLow } from './events/inventory.events';

await emitInventoryLow({
  merchant_id: merchantId,
  store_id: storeId,
  item_id: productId,
  item_name: productName,
  current_stock: 3,
  threshold: 5,
  unit: 'units'
});
```

### Option 3: Monitor with Callbacks

```typescript
import { inventoryMonitor } from './events/inventory.events';

await inventoryMonitor.onStockUpdate(
  productId,
  productName,
  storeId,
  merchantId,
  oldStock,    // 10
  newStock,    // 3
  threshold     // 5
);
// Only emits because oldStock (10) > threshold (5) && newStock (3) <= threshold (5)
```

## Disabling Events

Set the environment variable:
```bash
ENABLE_EVENT_EMISSION=false
```

Or per-product by setting `inventory.unlimited = true`.

## Event Schema

```typescript
{
  event: 'inventory.low',
  version: 'v1',
  correlation_id: 'uuid',
  source: 'rez-merchant-service',
  timestamp: 1714567890000,
  data: {
    merchant_id: 'merchant_123',
    store_id: 'store_456',
    item_id: 'product_789',
    item_name: 'Chicken Biryani',
    current_stock: 3,
    threshold: 5,
    unit: 'units'
  }
}
```

## Testing

```typescript
import { emitInventoryLow } from './events/inventory.events';

// Should work when ENABLE_EVENT_EMISSION=true
const result = await emitInventoryLow({
  merchant_id: 'test',
  store_id: 'test',
  item_id: 'test',
  item_name: 'Test Item',
  current_stock: 2,
  threshold: 5,
  unit: 'units'
});

// Should skip when ENABLE_EVENT_EMISSION=false
const noop = await emitInventoryLow({ ... });
// Returns null, logs skipped
```
