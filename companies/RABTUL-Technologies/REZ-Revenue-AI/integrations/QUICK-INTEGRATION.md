# REZ Revenue AI - Quick Integration Guide

## How to Connect ANY Merchant Service

### Step 1: Add to Your Service

```typescript
// Create a new file: src/utils/revenueAI.ts
import axios from 'axios';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const REVENUE_AGENT_URL = process.env.REVENUE_AGENT_URL || 'http://localhost:4330';

export class RevenueAIIntegration {
  /**
   * Calculate dynamic price
   */
  async calculatePrice(params: {
    entityId: string;
    entityName: string;
    category: string;
    basePrice: number;
    cost: number;
    vertical: 'restaurant' | 'hotel' | 'salon' | 'gym' | 'clinic' | 'retail';
    time: Date;
    slotsRemaining?: number;
    totalSlots?: number;
    customerSegment?: string;
  }) {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.entityId,
            type: 'product',
            category: params.category,
            vertical: params.vertical,
            name: params.entityName,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.time.getDay(),
            hourOfDay: params.time.getHours(),
            isPeakHour: this.isPeakHour(params.time, params.vertical),
            isWeekend: params.time.getDay() === 0 || params.time.getDay() === 6,
          },
          inventory: params.slotsRemaining !== undefined ? {
            slotsRemaining: params.slotsRemaining,
            totalSlots: params.totalSlots,
          } : undefined,
          audience: params.customerSegment ? {
            segment: params.customerSegment,
          } : undefined,
        },
      });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Pricing failed');
    }

    return this.localFallback(params);
  }

  /**
   * Get demand forecast
   */
  async getForecast(merchantId: string, vertical: string) {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical,
        category: 'general',
        location: {},
        horizon: 'week',
      });
      if (response.data.success) return response.data.data;
    } catch (error) {
      console.warn('[RevenueAI] Forecast failed');
    }
    return { peakHour: 19, avgDemand: 60, peakDay: 'Saturday' };
  }

  /**
   * Chat with Revenue Agent
   */
  async chat(merchantId: string, message: string) {
    try {
      const response = await axios.post(`${REVENUE_AGENT_URL}/api/v1/agent/chat`, {
        merchantId,
        message,
      });
      if (response.data.success) return response.data.data;
    } catch (error) {
      console.error('[RevenueAI] Chat failed');
    }
    return { response: 'Sorry, I had trouble processing that.' };
  }

  /**
   * Get benchmark score
   */
  async getBenchmark(merchantId: string) {
    try {
      const response = await axios.get(`${REVENUE_AI_URL}/api/v1/benchmarks/${merchantId}`);
      if (response.data.success) return response.data.data;
    } catch (error) {
      console.warn('[RevenueAI] Benchmark failed');
    }
    return { overallScore: 70, percentile: 'Top 50%', letterGrade: 'B' };
  }

  /**
   * Get optimal cashback
   */
  async getCashback(orderValue: number, segment: string) {
    const rates: Record<string, number> = {
      new: 0.15, regular: 0.05, vip: 0.03, at_risk: 0.15, dormant: 0.10,
    };
    const rate = rates[segment] || 0.05;
    return {
      cashbackAmount: Math.round(orderValue * rate),
      cashbackRate: rate,
      reason: 'Standard rate',
    };
  }

  private isPeakHour(time: Date, vertical: string): boolean {
    const hour = time.getHours();
    if (vertical === 'restaurant') return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
    if (vertical === 'salon') return [10, 11, 18, 19, 20].includes(hour);
    if (vertical === 'gym') return [7, 8, 9, 18, 19, 20].includes(hour);
    return hour >= 9 && hour <= 21;
  }

  private localFallback(params: any) {
    let adjustment = 0;
    const factors = [];

    if (this.isPeakHour(params.time, params.vertical)) {
      factors.push({ name: 'Peak Hour', reason: 'High demand', contribution: 15 });
      adjustment += 15;
    }
    if (params.time.getDay() === 5 || params.time.getDay() === 6) {
      factors.push({ name: 'Weekend', reason: 'Weekend pricing', contribution: 10 });
      adjustment += 10;
    }

    return {
      finalPrice: Math.round(params.basePrice * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : 'none',
      factors,
    };
  }
}

export const revenueAI = new RevenueAIIntegration();
```

### Step 2: Use in Your Service

```typescript
// In your Order/POS service
import { revenueAI } from '../utils/revenueAI';

class OrderService {
  async createOrder(orderData: any) {
    // Calculate dynamic prices
    const items = await Promise.all(
      orderData.items.map(async (item: any) => {
        const price = await revenueAI.calculatePrice({
          entityId: item.productId,
          entityName: item.name,
          category: item.category,
          basePrice: item.price,
          cost: item.cost,
          vertical: 'restaurant',
          time: new Date(),
          customerSegment: orderData.customerSegment,
        });

        return { ...item, unitPrice: price.finalPrice, pricingFactors: price.factors };
      })
    );

    // Calculate cashback
    const subtotal = items.reduce((sum: number, i: any) => sum + (i.unitPrice * i.quantity), 0);
    const cashback = await revenueAI.getCashback(subtotal, orderData.customerSegment);

    return { items, subtotal, cashback };
  }
}
```

---

## Integration by Service

### Restaurant Hub (NestJS)

```typescript
// In orders.service.ts
import { RevenueAIService } from './revenue-ai.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly revenueAI: RevenueAIService,
  ) {}

  async calculateOrderPricing(orderId: string) {
    const order = await this.getOrder(orderId);
    const prices = await this.revenueAI.calculatePrices(order.items, {
      time: new Date(),
      customerSegment: order.customer?.segment,
    });
    return prices;
  }
}
```

### Hotel POS

```typescript
// In booking.service.ts
import { RevenueAIIntegration } from './revenueAI';

class BookingService {
  private revenueAI = new RevenueAIIntegration();

  async calculateRoomRate(roomType: string, checkIn: Date) {
    const room = await this.getRoomType(roomType);
    return this.revenueAI.calculatePrice({
      entityId: room.id,
      entityName: room.name,
      category: room.category,
      basePrice: room.baseRate,
      cost: room.cost,
      vertical: 'hotel',
      time: checkIn,
      slotsRemaining: room.available,
      totalSlots: room.total,
    });
  }
}
```

### Salon Service

```typescript
// In appointment.service.ts
import { RevenueAIIntegration } from './revenueAI';

class AppointmentService {
  private revenueAI = new RevenueAIIntegration();

  async calculateServicePrice(service: any, slot: Date) {
    return this.revenueAI.calculatePrice({
      entityId: service.id,
      entityName: service.name,
      category: service.category,
      basePrice: service.price,
      cost: service.cost,
      vertical: 'salon',
      time: slot,
      slotsRemaining: await this.getAvailableSlots(service.id, slot),
      totalSlots: service.dailySlots,
    });
  }
}
```

### Fitness Service

```typescript
// In class.service.ts
import { RevenueAIIntegration } from './revenueAI';

class FitnessClassService {
  private revenueAI = new RevenueAIIntegration();

  async calculateClassPrice(fitnessClass: any, classTime: Date) {
    return this.revenueAI.calculatePrice({
      entityId: fitnessClass.id,
      entityName: fitnessClass.name,
      category: fitnessClass.category,
      basePrice: fitnessClass.price,
      cost: fitnessClass.cost,
      vertical: 'gym',
      time: classTime,
      slotsRemaining: fitnessClass.capacity - fitnessClass.booked,
      totalSlots: fitnessClass.capacity,
      customerSegment: fitnessClass.member?.tier,
    });
  }
}
```

---

## Environment Variables

```bash
# Add to .env
REVENUE_AI_URL=http://localhost:4301
REVENUE_AGENT_URL=http://localhost:4330
```

---

## API Endpoints Available

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/pricing/calculate` | POST | Dynamic pricing |
| `/api/v1/forecast` | POST | Demand forecast |
| `/api/v1/offers/optimize` | POST | Offer optimization |
| `/api/v1/cashback/optimize` | POST | Cashback optimization |
| `/api/v1/benchmarks/:id` | GET | Revenue benchmark |
| `/api/v1/segments/:id` | GET | Customer segments |
| `/api/v1/campaigns/generate` | POST | Campaign generator |
| `/api/v1/copilot/revenue-plan` | POST | Revenue plan |
| `/api/v1/agent/chat` | POST | AI Chat |
| `/api/v1/agent/actions/:id` | GET | Autonomous actions |

---

## Testing

```bash
# Test pricing
curl -X POST http://localhost:4301/api/v1/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"context":{"entity":{"id":"pizza","type":"product","category":"main","vertical":"restaurant","name":"Pizza","basePrice":450,"cost":180},"time":{"dayOfWeek":5,"hourOfDay":19,"isWeekend":true}}}'

# Test chat
curl -X POST http://localhost:4330/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"merchantId":"test","message":"How to increase revenue?"}'
```

---

## Status

- [x] SDK created
- [x] Integration templates ready
- [ ] Restaurant Hub connected
- [ ] Hotel POS connected
- [ ] Salon connected
- [ ] Fitness connected
- [ ] Healthcare connected
- [ ] Retail connected
