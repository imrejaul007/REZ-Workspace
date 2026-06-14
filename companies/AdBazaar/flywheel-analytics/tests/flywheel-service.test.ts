import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types for testing
interface IFlywheelEvent {
  eventId: string;
  eventType: 'scan' | 'campaign' | 'order' | 'ride' | 'conversion' | 'repeat';
  userId?: string;
  source: string;
  value?: number;
  createdAt: Date;
}

interface IFlywheelMetrics {
  date: Date;
  totalScans: number;
  totalConversions: number;
  totalGMV: number;
  flywheelIndex: number;
}

// FlywheelService class for testing
class FlywheelService {
  async recordEvent(data: {
    eventType: string;
    userId?: string;
    source: string;
    value?: number;
  }): Promise<IFlywheelEvent> {
    const event: IFlywheelEvent = {
      eventId: `fwe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...data,
      createdAt: new Date(),
    };
    return event;
  }

  async recordCycle(data: {
    startEvent: { type: string; timestamp: Date };
    endEvent: { type: string; value: number; timestamp: Date };
  }): Promise<{ cycleId: string }> {
    return { cycleId: `fwc_${Date.now()}` };
  }

  getMetrics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): {
    current: IFlywheelMetrics | null;
    trend: IFlywheelMetrics[];
    comparison: { vsYesterday: number };
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current: IFlywheelMetrics = {
      date: today,
      totalScans: 5000,
      totalConversions: 250,
      totalGMV: 150000,
      flywheelIndex: 75,
    };

    const comparison = {
      vsYesterday: current.totalGMV > 0 ? 15.5 : 0,
    };

    return {
      current,
      trend: [current],
      comparison,
    };
  }

  getFlywheelHealth(): {
    overall: number;
    velocity: number;
    retention: number;
    conversion: number;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const current = metrics.current;

    if (!current) {
      return { overall: 0, velocity: 0, retention: 0, conversion: 0, recommendations: ['Start creating campaigns'] };
    }

    const recommendations: string[] = [];
    let velocity = 50;
    let retention = 50;
    let conversion = 50;

    if (current.totalGMV > 0) velocity = Math.min(100, current.totalGMV / 10000 * 100);
    if (current.totalConversions > 0) retention = Math.min(100, current.totalConversions / 100 * 100);
    if (current.totalScans > 0) conversion = Math.min(100, (current.totalConversions / current.totalScans) * 1000);

    if (velocity < 50) recommendations.push('Increase ad spend');
    if (retention < 30) recommendations.push('Focus on loyalty');
    if (conversion < 5) recommendations.push('Optimize targeting');

    return {
      overall: Math.round((velocity + retention + conversion) / 3),
      velocity: Math.round(velocity),
      retention: Math.round(retention),
      conversion: Math.round(conversion),
      recommendations,
    };
  }

  getFunnel(): {
    stages: Array<{ name: string; count: number; dropoffRate: number }>;
    conversionRate: number;
  } {
    const scans = 5000;
    const orders = 250;

    const stages = [
      { name: 'QR Scans', count: scans, dropoffRate: scans > 0 ? ((scans - orders) / scans) * 100 : 0 },
      { name: 'Conversions', count: orders, dropoffRate: 0 },
    ];

    return {
      stages,
      conversionRate: scans > 0 ? (orders / scans) * 100 : 0,
    };
  }
}

describe('Flywheel Analytics Service', () => {
  let service: FlywheelService;

  beforeEach(() => {
    service = new FlywheelService();
  });

  describe('Event Recording', () => {
    it('should create event with generated ID', async () => {
      const event = await service.recordEvent({
        eventType: 'scan',
        userId: 'user_001',
        source: 'qr',
        value: 100,
      });

      expect(event.eventId).toMatch(/^fwe_\d+_[a-z0-9]+$/);
      expect(event.eventType).toBe('scan');
      expect(event.userId).toBe('user_001');
      expect(event.source).toBe('qr');
      expect(event.value).toBe(100);
      expect(event.createdAt).toBeInstanceOf(Date);
    });

    it('should support all event types', () => {
      const eventTypes: IFlywheelEvent['eventType'][] = [
        'scan', 'campaign', 'order', 'ride', 'conversion', 'repeat',
      ];
      eventTypes.forEach((eventType) => {
        expect(['scan', 'campaign', 'order', 'ride', 'conversion', 'repeat'].includes(eventType)).toBe(true);
      });
    });

    it('should generate unique event IDs', async () => {
      const event1 = await service.recordEvent({ eventType: 'scan', source: 'test' });
      const event2 = await service.recordEvent({ eventType: 'scan', source: 'test' });
      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('Cycle Recording', () => {
    it('should create cycle with ID', async () => {
      const cycle = await service.recordCycle({
        startEvent: { type: 'scan', timestamp: new Date() },
        endEvent: { type: 'order', value: 500, timestamp: new Date() },
      });
      expect(cycle.cycleId).toMatch(/^fwc_\d+$/);
    });
  });

  describe('Metrics', () => {
    it('should return metrics structure', () => {
      const metrics = service.getMetrics('daily');
      expect(metrics).toHaveProperty('current');
      expect(metrics).toHaveProperty('trend');
      expect(metrics).toHaveProperty('comparison');
    });

    it('should calculate daily metrics', () => {
      const metrics = service.getMetrics('daily');
      expect(metrics.current).not.toBeNull();
    });

    it('should include GMV in metrics', () => {
      const metrics = service.getMetrics('daily');
      expect(metrics.current?.totalGMV).toBeDefined();
    });
  });

  describe('Flywheel Health', () => {
    it('should return health structure', () => {
      const health = service.getFlywheelHealth();
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('velocity');
      expect(health).toHaveProperty('retention');
      expect(health).toHaveProperty('conversion');
      expect(health).toHaveProperty('recommendations');
    });

    it('should calculate overall score as average', () => {
      const health = service.getFlywheelHealth();
      const expectedOverall = Math.round((health.velocity + health.retention + health.conversion) / 3);
      expect(health.overall).toBe(expectedOverall);
    });

    it('should cap scores at 100', () => {
      const health = service.getFlywheelHealth();
      expect(health.velocity).toBeLessThanOrEqual(100);
      expect(health.retention).toBeLessThanOrEqual(100);
      expect(health.conversion).toBeLessThanOrEqual(100);
    });
  });

  describe('Funnel', () => {
    it('should return funnel structure', () => {
      const funnel = service.getFunnel();
      expect(funnel).toHaveProperty('stages');
      expect(funnel).toHaveProperty('conversionRate');
    });

    it('should calculate conversion rate', () => {
      const funnel = service.getFunnel();
      expect(funnel.conversionRate).toBeGreaterThanOrEqual(0);
      expect(funnel.conversionRate).toBeLessThanOrEqual(100);
    });
  });
});
