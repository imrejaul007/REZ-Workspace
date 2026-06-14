# Restaurant Hub - REZ Revenue AI Integration Guide

## Quick Integration

### Step 1: Add to orders.service.ts

```typescript
// At top of file
import { RevenueAIIntegration } from './revenue-ai.integration';

// In constructor
constructor(
  private prisma: PrismaService,
  @Optional() @Inject(forwardRef(() => KdsGateway)) private readonly kdsGateway?: KdsGateway,
) {
  this.revenueAI = new RevenueAIIntegration();
}
```

### Step 2: Replace validateAndCalculateTotals

Replace the existing `validateAndCalculateTotals` with:

```typescript
private async validateAndCalculateTotals(items: OrderItemDto[]) {
  if (!items || items.length === 0) {
    throw new BadRequestException('Order must contain at least one item');
  }

  // Get menu items with costs
  const validatedItems: OrderItemDto[] = [];
  const menuItems = await this.getMenuItems(items.map(i => i.productId));
  
  const pricedItems = items.map(item => {
    const menuItem = menuItems.find(m => m.id === item.productId);
    return {
      productId: item.productId,
      productName: item.productName || menuItem?.name || 'Unknown',
      category: menuItem?.category || 'general',
      basePrice: item.price,
      cost: menuItem?.cost || item.price * 0.4,
      quantity: item.quantity,
    };
  });

  // Get dynamic pricing
  const result = await this.revenueAI.calculateDynamicPricing(pricedItems, {
    time: new Date(),
    restaurantId: items[0]?.restaurantId,
  });

  // Calculate GST
  const gstAmount = Math.round(result.subtotal * 0.18 * 100) / 100;
  const totalAmount = result.subtotal + gstAmount;

  return {
    subtotal: result.subtotal,
    gstAmount,
    totalAmount,
    items: result.items.map(i => ({
      productId: i.item.productId,
      productName: i.item.productName,
      quantity: i.item.quantity,
      price: i.dynamicPrice,
    })),
    pricingFactors: result.items,
    cashback: result.cashback,
  };
}
```

### Step 3: Add dynamic pricing response to order

```typescript
// In create order response, add:
{
  ...order,
  dynamicPricing: {
    applied: true,
    adjustment: pricing.totalAdjustment,
    factors: pricing.items.flatMap(i => i.factors),
    cashback: pricing.cashback,
  }
}
```

---

## Environment Variables

```bash
# Add to .env
REVENUE_AI_URL=http://localhost:4301
INTERNAL_SERVICE_TOKEN=your-token
```

---

## API Response Example

### Order with Dynamic Pricing

```json
{
  "id": "order_123",
  "orderNumber": "ORD-20260531-ABC123",
  "subtotal": 1150,
  "gstAmount": 207,
  "totalAmount": 1357,
  "dynamicPricing": {
    "applied": true,
    "adjustment": 150,
    "adjustmentPercent": 15,
    "factors": [
      {
        "name": "Peak Hour",
        "reason": "7 PM dinner rush",
        "contribution": 15
      }
    ],
    "cashback": {
      "amount": 57,
      "rate": 0.05,
      "reason": "Loyalty reward"
    }
  }
}
```

---

## Cashback Flow

### Enable Auto Cashback

```typescript
// After order is confirmed
if (orderDto.creditCashback && userId) {
  await this.revenueAI.creditCashback({
    userId,
    amount: cashback.amount,
    reason: `Order ${order.orderNumber} - ${cashback.reason}`,
    restaurantId: order.restaurantId,
    orderId: order.id,
  });
}
```

---

## Status

- [x] Integration file created
- [ ] Code updated in orders.service.ts
- [ ] Environment variables set
- [ ] Tested in staging
- [ ] Deployed to production
