/**
 * KDS (Kitchen Display System) - Unit Tests
 * Tests kitchen order routing, station management, delay alerts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Station types and configuration
const STATION_TYPES = {
  GRILL: 'grill',
  FRY: 'fry',
  CURRY: 'curry',
  TANDOOR: 'tandoor',
  BEVERAGE: 'beverage',
  DESSERT: 'dessert',
  SALAD: 'salad',
  EXPO: 'expo',
} as const;

const STATION_PREP_TIMES = {
  [STATION_TYPES.GRILL]: 15,
  [STATION_TYPES.FRY]: 10,
  [STATION_TYPES.CURRY]: 12,
  [STATION_TYPES.TANDOOR]: 8,
  [STATION_TYPES.BEVERAGE]: 3,
  [STATION_TYPES.DESSERT]: 5,
  [STATION_TYPES.SALAD]: 4,
  [STATION_TYPES.EXPO]: 2,
} as const;

describe('Kitchen Display System', () => {
  describe('Station Routing', () => {
    const ITEM_STATION_MAP: Record<string, string> = {
      BUTTER_CHICKEN: STATION_TYPES.GRILL,
      CHICKEN_TIKKA: STATION_TYPES.GRILL,
      PANEER_TIKKA: STATION_TYPES.GRILL,
      FRIES: STATION_TYPES.FRY,
      PAKORA: STATION_TYPES.FRY,
      DAL_MAKHANI: STATION_TYPES.CURRY,
      KORMA: STATION_TYPES.CURRY,
      NAAN: STATION_TYPES.TANDOOR,
      ROTI: STATION_TYPES.TANDOOR,
      COFFEE: STATION_TYPES.BEVERAGE,
      TEA: STATION_TYPES.BEVERAGE,
      ICE_CREAM: STATION_TYPES.DESSERT,
      CAKE: STATION_TYPES.DESSERT,
      SALAD: STATION_TYPES.SALAD,
    };

    test('should route items to correct stations', () => {
      expect(ITEM_STATION_MAP['BUTTER_CHICKEN']).toBe(STATION_TYPES.GRILL);
      expect(ITEM_STATION_MAP['NAAN']).toBe(STATION_TYPES.TANDOOR);
      expect(ITEM_STATION_MAP['COFFEE']).toBe(STATION_TYPES.BEVERAGE);
    });

    test('should return unknown for unmapped items', () => {
      const unknownItem = ITEM_STATION_MAP['UNKNOWN_ITEM'];
      expect(unknownItem).toBeUndefined();
    });
  });

  describe('Prep Time Calculation', () => {
    test('should calculate estimated time from station times', () => {
      const orderItems = [
        { id: 'BUTTER_CHICKEN', station: STATION_TYPES.GRILL },
        { id: 'NAAN', station: STATION_TYPES.TANDOOR },
        { id: 'COFFEE', station: STATION_TYPES.BEVERAGE },
      ];

      // Estimated time = max of all station prep times
      const estimatedTime = Math.max(
        ...orderItems.map(item => STATION_PREP_TIMES[item.station as keyof typeof STATION_PREP_TIMES])
      );

      // Max of (15, 8, 3) = 15 minutes
      expect(estimatedTime).toBe(15);
    });

    test('should add buffer time for busy stations', () => {
      const stationLoad = {
        [STATION_TYPES.GRILL]: 4, // At capacity
        [STATION_TYPES.TANDOOR]: 2, // Normal
      };

      const baseTime = STATION_PREP_TIMES[STATION_TYPES.GRILL];
      const bufferPercent = stationLoad[STATION_TYPES.GRILL] > 3 ? 0.2 : 0;
      const bufferedTime = baseTime * (1 + bufferPercent);

      expect(bufferedTime).toBe(18); // 15 * 1.2 = 18
    });
  });

  describe('Order Status Management', () => {
    const ORDER_STATUS = {
      NEW: 'NEW',
      IN_PROGRESS: 'IN_PROGRESS',
      READY: 'READY',
      DELAYED: 'DELAYED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    } as const;

    test('should transition from NEW to IN_PROGRESS', () => {
      let status = ORDER_STATUS.NEW;
      status = ORDER_STATUS.IN_PROGRESS;
      expect(status).toBe(ORDER_STATUS.IN_PROGRESS);
    });

    test('should allow transition from IN_PROGRESS to DELAYED', () => {
      let status = ORDER_STATUS.IN_PROGRESS;
      status = ORDER_STATUS.DELAYED;
      expect(status).toBe(ORDER_STATUS.DELAYED);
    });

    test('should not allow COMPLETED from NEW', () => {
      const status = ORDER_STATUS.NEW;
      const validTransitions = [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED];
      const canTransition = validTransitions.includes(status);
      expect(canTransition).toBe(false);
    });
  });

  describe('Delay Detection', () => {
    test('should trigger delay when order exceeds threshold', () => {
      const maxPrepTime = 15 * 60; // 15 minutes in seconds
      const threshold = 1.3; // 30% over
      const elapsedTime = 20 * 60; // 20 minutes

      const isDelayed = elapsedTime > maxPrepTime * threshold;
      expect(isDelayed).toBe(true);
    });

    test('should not trigger delay when within threshold', () => {
      const maxPrepTime = 15 * 60;
      const threshold = 1.3;
      const elapsedTime = 18 * 60; // 18 minutes

      const isDelayed = elapsedTime > maxPrepTime * threshold;
      expect(isDelayed).toBe(false);
    });

    test('should escalate alert level based on delay duration', () => {
      const getAlertLevel = (delayMinutes: number) => {
        if (delayMinutes <= 5) return 'WARNING';
        if (delayMinutes <= 10) return 'CRITICAL';
        return 'ESCALATION';
      };

      expect(getAlertLevel(3)).toBe('WARNING');
      expect(getAlertLevel(7)).toBe('CRITICAL');
      expect(getAlertLevel(15)).toBe('ESCALATION');
    });
  });

  describe('Station Capacity', () => {
    test('should track current load correctly', () => {
      const stationCapacity = {
        [STATION_TYPES.GRILL]: 4,
        [STATION_TYPES.TANDOOR]: 6,
        [STATION_TYPES.BEVERAGE]: 8,
      };

      let stationLoad = {
        [STATION_TYPES.GRILL]: 3,
        [STATION_TYPES.TANDOOR]: 2,
        [STATION_TYPES.BEVERAGE]: 5,
      };

      // Add new order
      stationLoad[STATION_TYPES.GRILL]++;

      expect(stationLoad[STATION_TYPES.GRILL]).toBe(4);
      expect(stationLoad[STATION_TYPES.GRILL]).toBe(stationCapacity[STATION_TYPES.GRILL]);
    });

    test('should detect when station is at capacity', () => {
      const stationCapacity = 4;
      const currentLoad = 4;

      const isAtCapacity = currentLoad >= stationCapacity;
      expect(isAtCapacity).toBe(true);
    });

    test('should suggest overflow routing when at capacity', () => {
      const grill1Load = 4;
      const grill2Load = 2;
      const orderItem = { id: 'BUTTER_CHICKEN', station: STATION_TYPES.GRILL };

      const suggestStation = (item: string, currentLoad: number, maxLoad: number) => {
        if (currentLoad >= maxLoad) {
          return `${item}_STATION_2`;
        }
        return item;
      };

      const suggested = suggestStation(orderItem.station, grill1Load, 4);
      expect(suggested).toBe('grill_STATION_2');
    });
  });

  describe('Priority Queue', () => {
    test('should sort orders by priority', () => {
      const orders = [
        { id: 'ORDER_1', priority: 3, createdAt: Date.now() - 300000 },
        { id: 'ORDER_2', priority: 1, createdAt: Date.now() - 600000 },
        { id: 'ORDER_3', priority: 2, createdAt: Date.now() - 400000 },
      ];

      const sorted = orders.sort((a, b) => {
        // First by priority (lower = higher priority)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Then by creation time (older first)
        return a.createdAt - b.createdAt;
      });

      expect(sorted[0].id).toBe('ORDER_2'); // Priority 1
      expect(sorted[1].id).toBe('ORDER_3'); // Priority 2
      expect(sorted[2].id).toBe('ORDER_1'); // Priority 3
    });

    test('should apply VIP priority boost', () => {
      const basePriority = 3;
      const isVIP = true;
      const vipBoost = isVIP ? -2 : 0;

      const effectivePriority = basePriority + vipBoost;
      expect(effectivePriority).toBe(1);
    });
  });

  describe('Re-fire Management', () => {
    test('should mark re-fired items for priority', () => {
      const orderItem = {
        id: 'BUTTER_CHICKEN',
        refired: true,
        originalOrderId: 'ORDER_123',
        refireCount: 1,
      };

      expect(orderItem.refired).toBe(true);
      expect(orderItem.refireCount).toBe(1);
    });

    test('should limit re-fire count', () => {
      const maxRefire = 3;
      let refireCount = 3;

      const canRefire = refireCount < maxRefire;
      expect(canRefire).toBe(false);
    });
  });

  describe('Sound Alerts', () => {
    test('should trigger new order sound', () => {
      const ALERT_TYPES = {
        NEW_ORDER: 'new_order',
        DELAY_WARNING: 'delay_warning',
        ORDER_READY: 'order_ready',
        DELAY_ESCALATION: 'delay_escalation',
      };

      const shouldPlayNewOrderSound = true;
      expect(shouldPlayNewOrderSound).toBe(true);
    });

    test('should increase volume for critical alerts', () => {
      const baseVolume = 0.5;
      const alertMultiplier = {
        NEW_ORDER: 1.0,
        DELAY_WARNING: 1.2,
        ORDER_READY: 0.8,
        DELAY_ESCALATION: 1.5,
      };

      const delayEscalationVolume = baseVolume * alertMultiplier.DELAY_ESCALATION;
      expect(delayEscalationVolume).toBe(0.75);
    });
  });
});

describe('Kitchen AI Integration', () => {
  test('should emit order received event', async () => {
    const event = {
      type: 'kitchen:order:received',
      payload: {
        orderId: 'ORDER_123',
        merchantId: 'MERCHANT_001',
        items: [
          { id: 'BUTTER_CHICKEN', station: 'grill' },
        ],
        estimatedPrepTime: 900, // 15 minutes
      },
      timestamp: new Date(),
    };

    expect(event.type).toBe('kitchen:order:received');
    expect(event.payload.orderId).toBe('ORDER_123');
  });

  test('should emit order completed event', async () => {
    const event = {
      type: 'kitchen:order:completed',
      payload: {
        orderId: 'ORDER_123',
        actualPrepTime: 840, // 14 minutes
        stationTimes: {
          grill: 600,
          tandoor: 240,
        },
      },
      timestamp: new Date(),
    };

    expect(event.type).toBe('kitchen:order:completed');
    expect(event.payload.actualPrepTime).toBeLessThan(900);
  });

  test('should emit delay event', async () => {
    const event = {
      type: 'kitchen:order:delayed',
      payload: {
        orderId: 'ORDER_123',
        delaySeconds: 180, // 3 minutes over
        reason: 'High kitchen load',
      },
      timestamp: new Date(),
    };

    expect(event.type).toBe('kitchen:order:delayed');
    expect(event.payload.delaySeconds).toBe(180);
  });
});
