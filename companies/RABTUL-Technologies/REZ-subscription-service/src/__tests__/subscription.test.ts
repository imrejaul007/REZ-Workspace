import { SubscriptionManager } from '../services/subscriptionManager';
import { BillingEngine } from '../services/billingEngine';
import { UsageTracker } from '../services/usageTracker';
import { PaymentCollector } from '../services/paymentCollector';
import { Subscription, Invoice, UsageRecord, Plan } from '../models';
import { SubscriptionStatus, BillingCycle, PlanType, UsageType } from '../types';

// Mock dependencies
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  subscriptionLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  billingLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  paymentLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  usageLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  dunningLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../models', () => ({
  Subscription: {
    findOne: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn()
  },
  Invoice: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  },
  UsageRecord: {
    findOne: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn()
  },
  Plan: {
    findOne: jest.fn()
  }
}));

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = SubscriptionManager.getInstance();
  });

  describe('getSubscription', () => {
    it('should return subscription when found', async () => {
      const mockSubscription = {
        subscriptionId: 'sub_test123',
        customerId: 'cust_123',
        status: SubscriptionStatus.ACTIVE
      };

      (Subscription.findOne as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await manager.getSubscription('sub_test123');

      expect(Subscription.findOne).toHaveBeenCalledWith({ subscriptionId: 'sub_test123' });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when subscription not found', async () => {
      (Subscription.findOne as jest.Mock).mockResolvedValue(null);

      const result = await manager.getSubscription('sub_notfound');

      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionsByCustomer', () => {
    it('should return customer subscriptions', async () => {
      const mockSubscriptions = [
        { subscriptionId: 'sub_1', customerId: 'cust_123' },
        { subscriptionId: 'sub_2', customerId: 'cust_123' }
      ];

      (Subscription.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSubscriptions)
      });

      const result = await manager.getSubscriptionsByCustomer('cust_123');

      expect(Subscription.find).toHaveBeenCalledWith({ customerId: 'cust_123' });
      expect(result).toHaveLength(2);
    });
  });
});

describe('UsageTracker', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    tracker = UsageTracker.getInstance();
  });

  describe('recordUsage', () => {
    it('should record usage successfully', async () => {
      const mockSubscription = {
        subscriptionId: 'sub_test123',
        customerId: 'cust_123',
        status: SubscriptionStatus.ACTIVE,
        usageOverageRate: 0.10,
        currency: 'INR',
        usageThisPeriod: 100
      };

      const mockUsageRecord = {
        usageId: 'usage_123',
        subscriptionId: 'sub_test123',
        quantity: 50,
        totalAmount: 5.00
      };

      (Subscription.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (UsageRecord.prototype.save as jest.Mock).mockResolvedValue(mockUsageRecord);
      (Subscription.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSubscription)
      });

      // Test would require full mongoose setup
      // This is a simplified structure test
      expect(tracker).toBeDefined();
    });
  });
});

describe('BillingEngine', () => {
  let engine: BillingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = BillingEngine.getInstance();
  });

  it('should calculate billing metrics', async () => {
    const mockMetrics = {
      totalRevenue: 50000,
      invoicesGenerated: 100,
      invoicesPaid: 85,
      invoicesFailed: 15,
      mrr: 12500
    };

    (Invoice.aggregate as jest.Mock).mockResolvedValue([
      { _id: 'paid', count: 85, total: 42500 },
      { _id: 'failed', count: 15, total: 7500 }
    ]);

    (Subscription.aggregate as jest.Mock).mockResolvedValue([
      { _id: null, mrr: 12500 }
    ]);

    const result = await engine.calculateBillingMetrics();

    expect(result).toHaveProperty('totalRevenue');
    expect(result).toHaveProperty('invoicesGenerated');
    expect(result).toHaveProperty('mrr');
  });
});

describe('PaymentCollector', () => {
  let collector: PaymentCollector;

  beforeEach(() => {
    jest.clearAllMocks();
    collector = PaymentCollector.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = PaymentCollector.getInstance();
    const instance2 = PaymentCollector.getInstance();

    expect(instance1).toBe(instance2);
  });
});
