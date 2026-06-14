/**
 * Flywheel Analytics Service - Real implementation
 */

import mongoose, { Schema, model, Document } from 'mongoose';

// ============================================================================
// MODELS
// ============================================================================

export interface IFlywheelEvent extends Document {
  eventId: string;
  eventType: 'scan' | 'campaign' | 'order' | 'ride' | 'conversion' | 'repeat';
  userId?: string;
  source: string;
  value?: number;
  createdAt: Date;
}

const flywheelEventSchema = new Schema<IFlywheelEvent>({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, enum: ['scan', 'campaign', 'order', 'ride', 'conversion', 'repeat'], required: true },
  userId: String,
  source: String,
  value: Number,
  createdAt: { type: Date, default: Date.now, index: true },
});

export const FlywheelEvent = model<IFlywheelEvent>('FlywheelEvent', flywheelEventSchema);

export interface IFlywheelMetrics extends Document {
  date: Date;
  totalScans: number;
  totalConversions: number;
  totalGMV: number;
  flywheelIndex: number;
}

const flywheelMetricsSchema = new Schema<IFlywheelMetrics>({
  date: { type: Date, required: true, unique: true },
  totalScans: { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },
  totalGMV: { type: Number, default: 0 },
  flywheelIndex: { type: Number, default: 0 },
});

export const FlywheelMetrics = model<IFlywheelMetrics>('FlywheelMetrics', flywheelMetricsSchema);

// ============================================================================
// SERVICE
// ============================================================================

export class FlywheelService {
  /**
   * Record event
   */
  async recordEvent(data: {
    eventType: string;
    userId?: string;
    source: string;
    value?: number;
  }): Promise<IFlywheelEvent> {
    const event = new FlywheelEvent({
      eventId: `fwe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...data,
    });
    await event.save();
    return event;
  }

  /**
   * Record cycle
   */
  async recordCycle(data: {
    startEvent: { type: string; timestamp: Date };
    endEvent: { type: string; value: number; timestamp: Date };
  }): Promise<{ cycleId: string }> {
    // Simplified - just return ID
    return { cycleId: `fwc_${Date.now()}` };
  }

  /**
   * Get metrics
   */
  async getMetrics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    current: IFlywheelMetrics | null;
    trend: IFlywheelMetrics[];
    comparison: { vsYesterday: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = await FlywheelMetrics.findOne({ date: today });

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    const trend = await FlywheelMetrics.find({
      date: { $gte: startDate, $lte: today },
    }).sort({ date: 1 });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayMetrics = await FlywheelMetrics.findOne({ date: yesterday });

    return {
      current,
      trend,
      comparison: {
        vsYesterday: current && yesterdayMetrics
          ? ((current.totalGMV - yesterdayMetrics.totalGMV) / (yesterdayMetrics.totalGMV || 1)) * 100
          : 0,
      },
    };
  }

  /**
   * Get flywheel health
   */
  async getFlywheelHealth(): Promise<{
    overall: number;
    velocity: number;
    retention: number;
    conversion: number;
    recommendations: string[];
  }> {
    const metrics = await this.getMetrics('daily');
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

  /**
   * Get funnel
   */
  async getFunnel(): Promise<{
    stages: Array<{ name: string; count: number; dropoffRate: number }>;
    conversionRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [scans, orders] = await Promise.all([
      FlywheelEvent.countDocuments({
        eventType: 'scan',
        createdAt: { $gte: yesterday },
      }),
      FlywheelEvent.countDocuments({
        eventType: 'order',
        createdAt: { $gte: yesterday },
      }),
    ]);

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
