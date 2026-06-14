import crypto from 'crypto';
import { Event, Report, DashboardWidget, AnalyticsMetrics, FunnelStep, CohortData } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AnalyticsService {
  private events: Event[] = [];
  private reports: Map<string, Report> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private sessions: Map<string, { start: Date; events: number }> = new Map();

  trackEvent(eventData: Omit<Event, 'id' | 'timestamp'>): Event {
    const event: Event = {
      ...eventData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.events.push(event);

    if (eventData.sessionId) {
      if (!this.sessions.has(eventData.sessionId)) {
        this.sessions.set(eventData.sessionId, { start: new Date(), events: 0 });
      }
      this.sessions.get(eventData.sessionId)!.events++;
    }

    logger.debug(`Event tracked: ${event.eventType}`, { eventId: event.id });
    return event;
  }

  getEvents(filters?: {
    shopId?: string;
    customerId?: string;
    eventType?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Event[] {
    let filtered = [...this.events];

    if (filters?.shopId) filtered = filtered.filter(e => e.shopifyShopId === filters.shopId);
    if (filters?.customerId) filtered = filtered.filter(e => e.shopifyCustomerId === filters.customerId);
    if (filters?.eventType) filtered = filtered.filter(e => e.eventType === filters.eventType);
    if (filters?.productId) filtered = filtered.filter(e => e.productId === filters.productId);
    if (filters?.startDate) filtered = filtered.filter(e => new Date(e.timestamp!) >= new Date(filters.startDate!));
    if (filters?.endDate) filtered = filtered.filter(e => new Date(e.timestamp!) <= new Date(filters.endDate!));

    const limit = filters?.limit || 100;
    return filtered.slice(-limit);
  }

  getMetrics(shopId: string, startDate: string, endDate: string): AnalyticsMetrics {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const shopEvents = this.events.filter(e => e.shopifyShopId === shopId && new Date(e.timestamp!) >= start && new Date(e.timestamp!) <= end);

    const sessions = new Set(shopEvents.filter(e => e.sessionId).map(e => e.sessionId));
    const purchases = shopEvents.filter(e => e.eventType === 'purchase');
    const revenues = purchases.reduce((sum, p) => sum + (p.revenue || 0), 0);

    return {
      period: { start: startDate, end: endDate },
      sessions: sessions.size,
      pageviews: shopEvents.filter(e => e.eventType === 'page_view').length,
      uniqueVisitors: new Set(shopEvents.filter(e => e.shopifyCustomerId).map(e => e.shopifyCustomerId)).size,
      // STATISTICAL: mock analytics metrics for display
      bounceRate: Math.round(Math.random() * 30 + 30),
      avgSessionDuration: Math.round(Math.random() * 300 + 60),
      conversions: purchases.length,
      conversionRate: sessions.size > 0 ? Math.round((purchases.length / sessions.size) * 10000) / 100 : 0,
      revenue: Math.round(revenues * 100) / 100,
      avgOrderValue: purchases.length > 0 ? Math.round((revenues / purchases.length) * 100) / 100 : 0
    };
  }

  getProductPerformance(shopId: string, startDate: string, endDate: string): Array<{ productId: string; views: number; carts: number; purchases: number; revenue: number }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const shopEvents = this.events.filter(e => e.shopifyShopId === shopId && e.productId && new Date(e.timestamp!) >= start && new Date(e.timestamp!) <= end);

    const productMap = new Map<string, { views: number; carts: number; purchases: number; revenue: number }>();

    for (const event of shopEvents) {
      if (!event.productId) continue;
      if (!productMap.has(event.productId)) {
        productMap.set(event.productId, { views: 0, carts: 0, purchases: 0, revenue: 0 });
      }
      const stats = productMap.get(event.productId)!;
      switch (event.eventType) {
        case 'product_view': stats.views++; break;
        case 'add_to_cart': stats.carts++; break;
        case 'purchase': stats.purchases++; stats.revenue += event.revenue || 0; break;
      }
    }

    return Array.from(productMap.entries()).map(([productId, stats]) => ({ productId, ...stats }));
  }

  getTrafficSources(shopId: string, startDate: string, endDate: string): Array<{ source: string; sessions: number; conversions: number; revenue: number }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const shopEvents = this.events.filter(e => e.shopifyShopId === shopId && new Date(e.timestamp!) >= start && new Date(e.timestamp!) <= end);

    const sourceMap = new Map<string, { sessions: number; conversions: number; revenue: number }>();

    for (const event of shopEvents) {
      const source = this.extractSource(event.referrer);
      if (!sourceMap.has(source)) sourceMap.set(source, { sessions: 0, conversions: 0, revenue: 0 });
      const stats = sourceMap.get(source)!;
      if (event.sessionId) stats.sessions++;
      if (event.eventType === 'purchase') {
        stats.conversions++;
        stats.revenue += event.revenue || 0;
      }
    }

    return Array.from(sourceMap.entries()).map(([source, stats]) => ({ source, ...stats }));
  }

  private extractSource(referrer?: string): string {
    if (!referrer) return 'direct';
    if (referrer.includes('google')) return 'google';
    if (referrer.includes('facebook')) return 'facebook';
    if (referrer.includes('instagram')) return 'instagram';
    if (referrer.includes('twitter')) return 'twitter';
    return 'other';
  }

  createReport(reportData: Omit<Report, 'id' | 'createdAt'>): Report {
    const id = crypto.randomUUID();
    const report: Report = { ...reportData, id, createdAt: new Date().toISOString() };
    this.reports.set(id, report);
    logger.info(`Report created: ${id}`);
    return report;
  }

  getReport(id: string): Report | undefined {
    return this.reports.get(id);
  }

  getReports(shopId?: string): Report[] {
    return Array.from(this.reports.values());
  }

  generateReport(reportId: string): { data: Record<string, unknown>[]; summary: Record<string, number> } {
    const report = this.reports.get(reportId);
    if (!report) return { data: [], summary: {} };

    const metrics = this.getMetrics('', report.dateRange.start, report.dateRange.end);
    return {
      data: [{ ...metrics }],
      summary: { totalRevenue: metrics.revenue, totalConversions: metrics.conversions }
    };
  }

  createWidget(widgetData: Omit<DashboardWidget, 'id'>): DashboardWidget {
    const id = crypto.randomUUID();
    const widget: DashboardWidget = { ...widgetData, id };
    this.widgets.set(id, widget);
    return widget;
  }

  getWidgets(dashboardId: string): DashboardWidget[] {
    return Array.from(this.widgets.values()).filter(w => w.dashboardId === dashboardId);
  }

  analyzeFunnel(shopId: string, steps: FunnelStep[]): FunnelStep[] {
    const shopEvents = this.events.filter(e => e.shopifyShopId === shopId);
    const sessionEvents = new Map<string, string[]>();

    for (const event of shopEvents) {
      if (!event.sessionId) continue;
      if (!sessionEvents.has(event.sessionId)) sessionEvents.set(event.sessionId, []);
      sessionEvents.get(event.sessionId)!.push(event.eventType);
    }

    return steps.map(step => {
      const matchingSessions = new Set<string>();
      const completedSessions = new Set<string>();

      for (const [sessionId, events] of sessionEvents) {
        const hasRequired = step.events.every(e => events.includes(e));
        if (hasRequired) matchingSessions.add(sessionId);
        if (matchingSessions.has(sessionId) && events.includes(step.events[step.events.length - 1])) {
          completedSessions.add(sessionId);
        }
      }

      return {
        ...step,
        conversions: completedSessions.size,
        dropOffs: matchingSessions.size - completedSessions.size
      };
    });
  }

  getCohortAnalysis(shopId: string, cohortType: 'weekly' | 'monthly' = 'monthly'): CohortData[] {
    const shopEvents = this.events.filter(e => e.shopifyShopId === shopId && e.eventType === 'purchase');
    const customerFirstPurchase = new Map<string, string>();

    for (const event of shopEvents) {
      if (!event.shopifyCustomerId) continue;
      if (!customerFirstPurchase.has(event.shopifyCustomerId)) {
        customerFirstPurchase.set(event.shopifyCustomerId, event.timestamp!);
      }
    }

    const cohorts: CohortData[] = [];
    const cohortMap = new Map<string, Map<number, { count: number; revenue: number }>>();

    for (const [customerId, firstDate] of customerFirstPurchase) {
      const cohort = new Date(firstDate);
      const cohortKey = cohortType === 'monthly'
        ? `${cohort.getFullYear()}-${String(cohort.getMonth() + 1).padStart(2, '0')}`
        : `${cohort.getFullYear()}-W${Math.ceil(cohort.getDate() / 7)}`;

      if (!cohortMap.has(cohortKey)) cohortMap.set(cohortKey, new Map());
      const cohortData = cohortMap.get(cohortKey)!;
      const period = 0;

      if (!cohortData.has(period)) cohortData.set(period, { count: 0, revenue: 0 });
      cohortData.get(period)!.count++;

      const customerPurchases = shopEvents.filter(e => e.shopifyCustomerId === customerId);
      const revenue = customerPurchases.reduce((sum, p) => sum + (p.revenue || 0), 0);
      cohortData.get(period)!.revenue += revenue;
    }

    for (const [cohort, periods] of cohortMap) {
      for (const [period, data] of periods) {
        cohorts.push({
          cohort,
          period,
          retention: Math.round((data.count / (this.events.filter(e => e.shopifyShopId === shopId && e.eventType === 'purchase').length || 1)) * 10000) / 100,
          revenue: Math.round(data.revenue * 100) / 100
        });
      }
    }

    return cohorts;
  }
}

export const analyticsService = new AnalyticsService();
