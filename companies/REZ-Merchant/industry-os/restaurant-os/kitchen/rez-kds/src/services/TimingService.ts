import { KitchenOrder, IKitchenOrder } from '../models/KitchenOrder';
import { OrderStatus, TimingThresholds, StationType } from '../config';

export interface TimingMetrics {
  orderId: string;
  orderNumber: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalElapsed: number;
  status: OrderStatus;
  itemTimings: Array<{
    itemId: string;
    itemName: string;
    station: StationType;
    elapsed: number;
    status: OrderStatus;
    timingStatus: 'ok' | 'warning' | 'critical' | 'overdue';
  }>;
  overallStatus: 'ok' | 'warning' | 'critical' | 'overdue';
  isOnTrack: boolean;
  estimatedCompletionTime?: number;
  remainingTime?: number;
}

export interface StationTimingSummary {
  stationType: StationType;
  activeOrders: number;
  avgElapsedTime: number;
  minElapsedTime: number;
  maxElapsedTime: number;
  overdueCount: number;
  warningCount: number;
  onTrackCount: number;
}

export interface KitchenTimingReport {
  timestamp: Date;
  totalActiveOrders: number;
  totalOverdue: number;
  totalWarning: number;
  avgWaitTime: number;
  stationSummaries: StationTimingSummary[];
  priorityBreakdown: {
    rush: number;
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
}

export class TimingService {
  private checkInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: Array<(alert: TimingAlert) => void> = [];

  constructor() {}

  startMonitoring(intervalMs: number = 10000) {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkAllOrders();
    }, intervalMs);

    console.log(`Timing monitoring started with ${intervalMs}ms interval`);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Timing monitoring stopped');
    }
  }

  onAlert(callback: (alert: TimingAlert) => void) {
    this.alertCallbacks.push(callback);
  }

  private emitAlert(alert: TimingAlert) {
    for (const callback of this.alertCallbacks) {
      callback(alert);
    }
  }

  private calculateTimingStatus(elapsedSeconds: number): 'ok' | 'warning' | 'critical' | 'overdue' {
    if (elapsedSeconds > TimingThresholds.OVERDUE) return 'overdue';
    if (elapsedSeconds > TimingThresholds.CRITICAL) return 'critical';
    if (elapsedSeconds > TimingThresholds.WARNING) return 'warning';
    return 'ok';
  }

  async getOrderTiming(orderId: string): Promise<TimingMetrics | null> {
    const order = await KitchenOrder.findOne({ orderId });
    if (!order) return null;

    return this.calculateOrderTiming(order);
  }

  calculateOrderTiming(order: IKitchenOrder): TimingMetrics {
    const startTime = order.startedAt || order.createdAt;
    const totalElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);

    const itemTimings = order.items.map(item => {
      const itemStart = item.startedAt || startTime;
      const elapsed = item.status === OrderStatus.PENDING
        ? Math.floor((Date.now() - itemStart.getTime()) / 1000)
        : Math.floor((item.completedAt!.getTime() - itemStart.getTime()) / 1000);

      return {
        itemId: item.itemId,
        itemName: item.name,
        station: item.station,
        elapsed,
        status: item.status,
        timingStatus: this.calculateTimingStatus(elapsed)
      };
    });

    const maxItemTime = Math.max(...itemTimings.map(t => t.elapsed));
    const overallStatus = this.calculateTimingStatus(maxItemTime);

    // Estimate remaining time based on average item completion rate
    const completedItems = itemTimings.filter(t => t.status === OrderStatus.COMPLETED).length;
    const totalItems = itemTimings.length;
    const progress = totalItems > 0 ? completedItems / totalItems : 0;

    let estimatedCompletionTime: number | undefined;
    let remainingTime: number | undefined;
    let isOnTrack = true;

    if (progress < 1 && order.estimatedCompletionTime) {
      const remaining = Math.floor(
        (order.estimatedCompletionTime.getTime() - Date.now()) / 1000
      );
      remainingTime = Math.max(0, remaining);
      estimatedCompletionTime = remaining;
      isOnTrack = remainingTime > 0;
    }

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      startedAt: order.startedAt,
      completedAt: order.completedAt,
      totalElapsed,
      status: order.status,
      itemTimings,
      overallStatus,
      isOnTrack,
      estimatedCompletionTime,
      remainingTime
    };
  }

  async getStationTimingSummary(stationType: StationType): Promise<StationTimingSummary> {
    const orders = await KitchenOrder.find({
      assignedStations: stationType,
      status: { $in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] }
    });

    if (orders.length === 0) {
      return {
        stationType,
        activeOrders: 0,
        avgElapsedTime: 0,
        minElapsedTime: 0,
        maxElapsedTime: 0,
        overdueCount: 0,
        warningCount: 0,
        onTrackCount: 0
      };
    }

    const timings = orders.map(order => {
      const timing = this.calculateOrderTiming(order);
      const maxItemElapsed = Math.max(...timing.itemTimings.map(t => t.elapsed));
      return { elapsed: maxItemElapsed, status: timing.overallStatus };
    });

    const elapsedTimes = timings.map(t => t.elapsed);

    return {
      stationType,
      activeOrders: orders.length,
      avgElapsedTime: Math.round(elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length),
      minElapsedTime: Math.min(...elapsedTimes),
      maxElapsedTime: Math.max(...elapsedTimes),
      overdueCount: timings.filter(t => t.status === 'overdue').length,
      warningCount: timings.filter(t => t.status === 'warning' || t.status === 'critical').length,
      onTrackCount: timings.filter(t => t.status === 'ok').length
    };
  }

  async getKitchenTimingReport(): Promise<KitchenTimingReport> {
    const activeOrders = await KitchenOrder.find({
      status: { $in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] }
    });

    const stationSummaries: StationTimingSummary[] = [];
    let totalOverdue = 0;
    let totalWarning = 0;
    let totalWaitTime = 0;

    const priorityBreakdown = { rush: 0, urgent: 0, high: 0, normal: 0, low: 0 };

    for (const order of activeOrders) {
      const timing = this.calculateOrderTiming(order);

      totalWaitTime += timing.totalElapsed;

      if (timing.overallStatus === 'overdue') totalOverdue++;
      else if (timing.overallStatus === 'warning' || timing.overallStatus === 'critical') totalWarning++;

      // Count priorities
      switch (order.priority) {
        case 5: priorityBreakdown.rush++; break;
        case 4: priorityBreakdown.urgent++; break;
        case 3: priorityBreakdown.high++; break;
        case 2: priorityBreakdown.normal++; break;
        case 1: priorityBreakdown.low++; break;
      }

      // Collect station summaries
      for (const itemTiming of timing.itemTimings) {
        let summary = stationSummaries.find(s => s.stationType === itemTiming.station);
        if (!summary) {
          summary = {
            stationType: itemTiming.station,
            activeOrders: 0,
            avgElapsedTime: 0,
            minElapsedTime: 0,
            maxElapsedTime: 0,
            overdueCount: 0,
            warningCount: 0,
            onTrackCount: 0
          };
          stationSummaries.push(summary);
        }

        summary.activeOrders++;
        if (itemTiming.timingStatus === 'overdue') summary.overdueCount++;
        else if (itemTiming.timingStatus === 'ok') summary.onTrackCount++;
        else summary.warningCount++;

        summary.minElapsedTime = summary.minElapsedTime === 0
          ? itemTiming.elapsed
          : Math.min(summary.minElapsedTime, itemTiming.elapsed);
        summary.maxElapsedTime = Math.max(summary.maxElapsedTime, itemTiming.elapsed);
      }
    }

    // Calculate averages for station summaries
    for (const summary of stationSummaries) {
      summary.avgElapsedTime = Math.round(
        (summary.minElapsedTime + summary.maxElapsedTime) / 2
      );
    }

    return {
      timestamp: new Date(),
      totalActiveOrders: activeOrders.length,
      totalOverdue,
      totalWarning,
      avgWaitTime: activeOrders.length > 0 ? Math.round(totalWaitTime / activeOrders.length) : 0,
      stationSummaries,
      priorityBreakdown
    };
  }

  private async checkAllOrders() {
    const overdueOrders = await KitchenOrder.find({
      status: { $in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] }
    });

    for (const order of overdueOrders) {
      const timing = this.calculateOrderTiming(order);

      if (timing.overallStatus === 'overdue' || timing.overallStatus === 'critical') {
        this.emitAlert({
          type: timing.overallStatus === 'overdue' ? 'overdue' : 'critical',
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          elapsedSeconds: timing.totalElapsed,
          threshold: timing.overallStatus === 'overdue'
            ? TimingThresholds.OVERDUE
            : TimingThresholds.CRITICAL,
          stations: order.assignedStations,
          priority: order.priority
        });
      }
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getTimingThresholdProgress(elapsedSeconds: number): number {
    return Math.min(100, Math.round((elapsedSeconds / TimingThresholds.OVERDUE) * 100));
  }
}

export interface TimingAlert {
  type: 'warning' | 'critical' | 'overdue';
  orderId: string;
  orderNumber: string;
  elapsedSeconds: number;
  threshold: number;
  stations: StationType[];
  priority: number;
}

export const timingService = new TimingService();
