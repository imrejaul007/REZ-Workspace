// Anomaly Detection Service
// Real-time detection of unusual patterns in workforce data

import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Anomaly, AnomalyType } from '../types/index.js';
import config from '../config/index.js';

interface MetricDataPoint {
  timestamp: Date;
  value: number;
}

interface MetricStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  statistics: Record<string, MetricStats>;
  analyzedAt: Date;
}

class AnomalyDetectionService {
  private anomalies: Map<string, Anomaly> = new Map();
  private metricHistory: Map<string, MetricDataPoint[]> = new Map();

  async detectAnomalies(tenantId: string): Promise<AnomalyDetectionResult> {
    const anomalies: Anomaly[] = [];

    // Analyze different metrics
    const metrics = [
      'attendance_rate',
      'leave_requests',
      'overtime_hours',
      'late_arrivals',
      'attrition_count',
      'engagement_score',
      'productivity_index',
    ];

    const statistics: Record<string, MetricStats> = {};

    for (const metric of metrics) {
      const data = this.getHistoricalData(metric);
      const stats = this.calculateStats(data);
      statistics[metric] = stats;

      const anomaly = this.checkForAnomaly(metric, data, stats, tenantId);
      if (anomaly) {
        anomalies.push(anomaly);
        this.anomalies.set(anomaly.id, anomaly);
      }
    }

    return {
      anomalies: anomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      statistics,
      analyzedAt: new Date(),
    };
  }

  private getHistoricalData(metric: string): MetricDataPoint[] {
    // Check cache first
    const cached = this.metricHistory.get(metric);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Generate simulated historical data
    const data: MetricDataPoint[] = [];
    const now = Date.now();

    // Base values and variance per metric
    const metricConfig: Record<string, { base: number; variance: number }> = {
      attendance_rate: { base: 0.92, variance: 0.03 },
      leave_requests: { base: 15, variance: 5 },
      overtime_hours: { base: 320, variance: 80 },
      late_arrivals: { base: 25, variance: 8 },
      attrition_count: { base: 2, variance: 1 },
      engagement_score: { base: 0.75, variance: 0.05 },
      productivity_index: { base: 0.78, variance: 0.06 },
    };

    const config = metricConfig[metric] || { base: 100, variance: 10 };

    // Generate 30 days of data
    for (let i = 30; i >= 0; i--) {
      const timestamp = new Date(now - i * 24 * 60 * 60 * 1000);
      // Statistical simulation: uniform distribution for variance
      const randomFactor = (randomInt(0, 1000) / 1000 - 0.5) * 2;
      const value = config.base + randomFactor * config.variance;
      data.push({ timestamp, value });
    }

    // Occasionally add an anomaly (40% probability)
    if (randomInt(0, 100) < 40) {
      const anomalyDay = randomInt(3, 28);
      data[anomalyDay].value = config.base + config.variance * 2.5;
    }

    this.metricHistory.set(metric, data);
    return data;
  }

  private calculateStats(data: MetricDataPoint[]): MetricStats {
    if (data.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
    }

    const values = data.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  private checkForAnomaly(
    metric: string,
    data: MetricDataPoint[],
    stats: MetricStats,
    tenantId: string
  ): Anomaly | null {
    if (data.length < config.anomaly.minDataPoints) {
      return null;
    }

    const latestValue = data[data.length - 1].value;
    const zScore = Math.abs((latestValue - stats.mean) / stats.stdDev);

    if (zScore < config.anomaly.zScoreThreshold) {
      return null;
    }

    const deviation = ((latestValue - stats.mean) / stats.mean) * 100;
    const isAnomaly = Math.abs(deviation) > 20;

    if (!isAnomaly) {
      return null;
    }

    const anomalyType = this.getAnomalyType(metric);
    const severity = this.calculateSeverity(zScore, Math.abs(deviation));

    return {
      id: uuidv4(),
      type: anomalyType,
      title: this.getAnomalyTitle(anomalyType, deviation),
      description: this.getAnomalyDescription(anomalyType, latestValue, stats.mean, deviation),
      severity,
      detectedAt: new Date(),
      metric,
      currentValue: Math.round(latestValue * 100) / 100,
      expectedValue: Math.round(stats.mean * 100) / 100,
      deviation: Math.round(deviation * 10) / 10,
      department: this.getAffectedDepartment(metric),
      actions: this.getAnomalyActions(anomalyType),
      acknowledged: false,
      tenantId,
    };
  }

  private getAnomalyType(metric: string): AnomalyType {
    const mapping: Record<string, AnomalyType> = {
      attendance_rate: 'attendance_spike',
      leave_requests: 'leave_spike',
      overtime_hours: 'overtime_surge',
      late_arrivals: 'late_arrivals',
      attrition_count: 'attrition_spike',
      engagement_score: 'engagement_drop',
      productivity_index: 'productivity_drop',
    };
    return mapping[metric] || 'attendance_anomaly';
  }

  private calculateSeverity(zScore: number, deviation: number): Anomaly['severity'] {
    if (zScore > 3 || deviation > 40) return 'critical';
    if (zScore > 2.5 || deviation > 30) return 'high';
    if (zScore > 2 || deviation > 20) return 'medium';
    return 'low';
  }

  private getAnomalyTitle(type: AnomalyType, deviation: number): string {
    const increase = deviation > 0;
    const titles: Record<string, string> = {
      attendance_spike: `Attendance ${increase ? 'anomaly detected' : 'drop detected'}`,
      leave_spike: `Leave requests ${increase ? 'increased' : 'decreased'} significantly`,
      overtime_surge: `Overtime hours ${increase ? 'surged' : 'dropped'} beyond normal`,
      late_arrivals: `Late arrivals ${increase ? 'increased' : 'decreased'} sharply`,
      attrition_spike: `Attrition ${increase ? 'spiked' : 'improved'}`,
      engagement_drop: 'Engagement score dropped significantly',
      productivity_drop: 'Productivity index declined below threshold',
    };
    return titles[type] || 'Anomaly detected in workforce data';
  }

  private getAnomalyDescription(
    type: AnomalyType,
    current: number,
    expected: number,
    deviation: number
  ): string {
    const formattedCurrent = this.formatMetricValue(type, current);
    const formattedExpected = this.formatMetricValue(type, expected);

    return `${Math.abs(Math.round(deviation))}% ${deviation > 0 ? 'above' : 'below'} expected value. Current: ${formattedCurrent}, Expected: ${formattedExpected}. This deviation exceeds the normal variation threshold and warrants attention.`;
  }

  private formatMetricValue(type: AnomalyType, value: number): string {
    if (type === 'attendance_spike' || type === 'engagement_drop' || type === 'productivity_drop') {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(0);
  }

  private getAffectedDepartment(metric: string): string | undefined {
    // Simulate department-specific anomalies (50% probability)
    const departments = ['Engineering', 'Sales', 'Support', 'Marketing', 'Operations'];
    if (randomInt(0, 100) >= 50) {
      return departments[randomInt(0, departments.length)];
    }
    return undefined;
  }

  private getAnomalyActions(type: AnomalyType): Anomaly['actions'] {
    const baseActions = [
      {
        label: 'View Details',
        action: 'navigate' as const,
        params: { page: `/analytics/${type.replace('_', '-')}` },
      },
      {
        label: 'Dismiss',
        action: 'dismiss' as const,
      },
    ];

    const typeActions: Record<string, Partial<Anomaly['actions'][0]>[]> = {
      attendance_spike: [
        { label: 'Send Reminder', action: 'api_call' as const, apiEndpoint: '/api/v1/attendance/reminder' },
      ],
      leave_spike: [
        { label: 'Review Policy', action: 'navigate' as const, params: { page: '/leave/policy' } },
      ],
      overtime_surge: [
        { label: 'Review Workload', action: 'navigate' as const, params: { page: '/shifts/analysis' } },
      ],
      attrition_spike: [
        { label: 'Start Retention', action: 'api_call' as const, apiEndpoint: '/api/v1/employees/retention' },
      ],
    };

    const additionalActions = typeActions[type] || [];

    return [...(additionalActions as Anomaly['actions']), ...baseActions] as Anomaly['actions'];
  }

  async getActiveAnomalies(tenantId: string): Promise<Anomaly[]> {
    const allAnomalies = Array.from(this.anomalies.values());
    return allAnomalies.filter(a => a.tenantId === tenantId && !a.acknowledged);
  }

  async acknowledgeAnomaly(anomalyId: string, tenantId: string): Promise<boolean> {
    const anomaly = this.anomalies.get(anomalyId);
    if (anomaly && anomaly.tenantId === tenantId) {
      anomaly.acknowledged = true;
      return true;
    }
    return false;
  }

  async getAnomalyHistory(
    tenantId: string,
    days: number = 30
  ): Promise<Anomaly[]> {
    const allAnomalies = Array.from(this.anomalies.values());
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return allAnomalies
      .filter(a => a.tenantId === tenantId && a.detectedAt >= cutoff)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
export default anomalyDetectionService;
