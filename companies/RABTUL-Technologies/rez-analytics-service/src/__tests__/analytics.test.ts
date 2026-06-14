/**
 * Analytics Service Tests
 * Tests for event tracking, aggregation, and reporting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface AnalyticsEvent {
  id: string;
  userId?: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  sessionId?: string;
}

interface FunnelStep {
  name: string;
  event: string;
}

interface FunnelResult {
  step: string;
  count: number;
  conversionRate: number;
}

// Event validation
function validateEvent(event: Partial<AnalyticsEvent>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event.event || event.event.trim().length === 0) {
    errors.push('event name is required');
  }

  if (event.timestamp && !(event.timestamp instanceof Date)) {
    errors.push('timestamp must be a Date');
  }

  return { valid: errors.length === 0, errors };
}

// Funnel calculation
function calculateFunnel(events: AnalyticsEvent[], funnel: FunnelStep[]): FunnelResult[] {
  const results: FunnelResult[] = [];
  let previousCount = events.length;

  for (const step of funnel) {
    const count = events.filter(e => e.event === step.event).length;
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;

    results.push({
      step: step.name,
      count,
      conversionRate: Math.round(conversionRate * 100) / 100
    });

    previousCount = count;
  }

  return results;
}

// Session aggregation
function aggregateBySession(events: AnalyticsEvent[]): Map<string, AnalyticsEvent[]> {
  const sessions = new Map<string, AnalyticsEvent[]>();

  for (const event of events) {
    if (!event.sessionId) continue;

    if (!sessions.has(event.sessionId)) {
      sessions.set(event.sessionId, []);
    }
    sessions.get(event.sessionId)!.push(event);
  }

  return sessions;
}

// User aggregation
function aggregateByUser(events: AnalyticsEvent[]): Map<string, AnalyticsEvent[]> {
  const users = new Map<string, AnalyticsEvent[]>();

  for (const event of events) {
    if (!event.userId) continue;

    if (!users.has(event.userId)) {
      users.set(event.userId, []);
    }
    users.get(event.userId)!.push(event);
  }

  return users;
}

// Event count by day
function eventsByDay(events: AnalyticsEvent[]): Map<string, number> {
  const byDay = new Map<string, number>();

  for (const event of events) {
    const day = event.timestamp.toISOString().split('T')[0];
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }

  return byDay;
}

describe('Event Validation', () => {
  it('should validate complete event', () => {
    const event: Partial<AnalyticsEvent> = {
      event: 'page_view',
      timestamp: new Date(),
      properties: { page: '/home' }
    };

    const result = validateEvent(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing event name', () => {
    const event: Partial<AnalyticsEvent> = {
      event: '',
      timestamp: new Date()
    };

    const result = validateEvent(event);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('event name is required');
  });

  it('should accept event without userId', () => {
    const event: Partial<AnalyticsEvent> = {
      event: 'page_view',
      timestamp: new Date()
    };

    const result = validateEvent(event);
    expect(result.valid).toBe(true);
  });
});

describe('Funnel Calculation', () => {
  const events: AnalyticsEvent[] = [
    { id: '1', event: 'page_view', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '2', event: 'page_view', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '3', event: 'page_view', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '4', event: 'signup', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '5', event: 'signup', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '6', event: 'purchase', properties: {}, timestamp: new Date('2024-01-01') },
  ];

  const funnel: FunnelStep[] = [
    { name: 'Page Views', event: 'page_view' },
    { name: 'Signups', event: 'signup' },
    { name: 'Purchases', event: 'purchase' }
  ];

  it('should calculate funnel correctly', () => {
    const results = calculateFunnel(events, funnel);

    expect(results).toHaveLength(3);
    expect(results[0].count).toBe(3); // 3 page views
    expect(results[1].count).toBe(2); // 2 signups
    expect(results[2].count).toBe(1); // 1 purchase
  });

  it('should calculate conversion rates', () => {
    const results = calculateFunnel(events, funnel);

    expect(results[0].conversionRate).toBe(100); // First step always 100%
    expect(results[1].conversionRate).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
    expect(results[2].conversionRate).toBeCloseTo(50, 0); // 1/2 = 50%
  });
});

describe('Session Aggregation', () => {
  const events: AnalyticsEvent[] = [
    { id: '1', sessionId: 'sess_1', event: 'page_view', properties: {}, timestamp: new Date() },
    { id: '2', sessionId: 'sess_1', event: 'click', properties: {}, timestamp: new Date() },
    { id: '3', sessionId: 'sess_2', event: 'page_view', properties: {}, timestamp: new Date() },
  ];

  it('should group events by session', () => {
    const sessions = aggregateBySession(events);

    expect(sessions.size).toBe(2);
    expect(sessions.get('sess_1')).toHaveLength(2);
    expect(sessions.get('sess_2')).toHaveLength(1);
  });

  it('should handle events without session', () => {
    const eventsWithNoSession: AnalyticsEvent[] = [
      { id: '1', event: 'page_view', properties: {}, timestamp: new Date() },
    ];

    const sessions = aggregateBySession(eventsWithNoSession);
    expect(sessions.size).toBe(0);
  });
});

describe('User Aggregation', () => {
  const events: AnalyticsEvent[] = [
    { id: '1', userId: 'user_1', event: 'page_view', properties: {}, timestamp: new Date() },
    { id: '2', userId: 'user_1', event: 'purchase', properties: {}, timestamp: new Date() },
    { id: '3', userId: 'user_2', event: 'page_view', properties: {}, timestamp: new Date() },
  ];

  it('should group events by user', () => {
    const users = aggregateByUser(events);

    expect(users.size).toBe(2);
    expect(users.get('user_1')).toHaveLength(2);
    expect(users.get('user_2')).toHaveLength(1);
  });
});

describe('Events by Day', () => {
  const events: AnalyticsEvent[] = [
    { id: '1', event: 'page_view', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '2', event: 'page_view', properties: {}, timestamp: new Date('2024-01-01') },
    { id: '3', event: 'page_view', properties: {}, timestamp: new Date('2024-01-02') },
    { id: '4', event: 'signup', properties: {}, timestamp: new Date('2024-01-02') },
  ];

  it('should count events by day', () => {
    const byDay = eventsByDay(events);

    expect(byDay.get('2024-01-01')).toBe(2);
    expect(byDay.get('2024-01-02')).toBe(2);
  });
});

describe('Retention Calculation', () => {
  function calculateRetention(
    cohorts: Map<string, Set<string>>, // day -> userIds
    dayIndex: number
  ): number {
    const days = Array.from(cohorts.keys()).sort();
    if (dayIndex >= days.length) return 0;

    const baseDay = days[0];
    const targetDay = days[dayIndex];
    const baseUsers = cohorts.get(baseDay) || new Set();
    const targetUsers = cohorts.get(targetDay) || new Set();

    if (baseUsers.size === 0) return 0;

    let retained = 0;
    for (const user of baseUsers) {
      if (targetUsers.has(user)) retained++;
    }

    return (retained / baseUsers.size) * 100;
  }

  it('should calculate day 1 retention', () => {
    const cohorts = new Map<string, Set<string>>([
      ['2024-01-01', new Set(['u1', 'u2', 'u3', 'u4', 'u5'])],
      ['2024-01-02', new Set(['u1', 'u3', 'u5'])],
    ]);

    const retention = calculateRetention(cohorts, 1);
    expect(retention).toBe(60); // 3/5 = 60%
  });

  it('should return 0 for missing day', () => {
    const cohorts = new Map<string, Set<string>>([
      ['2024-01-01', new Set(['u1', 'u2'])],
    ]);

    const retention = calculateRetention(cohorts, 5);
    expect(retention).toBe(0);
  });
});
