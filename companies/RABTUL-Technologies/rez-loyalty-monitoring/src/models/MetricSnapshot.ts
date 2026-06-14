import mongoose, { Schema, Document } from 'mongoose';

// Service Health Status
export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Alert Severity Levels
export type AlertSeverity = 'critical' | 'warning' | 'info';

// Alert Status
export type AlertStatus = 'active' | 'resolved' | 'acknowledged';

// ReZ Score Tier
export type ScoreTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Decision Latency Percentiles
export interface LatencyMetrics {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

// ReZ Score Distribution
export interface ScoreDistribution {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

// Service Health Record
export interface IServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTime: number;
  lastChecked: Date;
  errorMessage?: string;
  uptime: number;
}

// Error Rate by Service
export interface IServiceErrorRate {
  name: string;
  rate: number;
  errorCount: number;
  totalRequests: number;
}

// Alert Interface
export interface IAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  service?: string;
  message: string;
  details: Record<string, unknown>;
  threshold?: number;
  currentValue?: number;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

// Metric Snapshot Document Interface
export interface IMetricSnapshot extends Document {
  timestamp: Date;
  services: IServiceHealth[];
  metrics: {
    eventsProcessedPerSecond: number;
    decisionLatency: LatencyMetrics;
    errorRates: IServiceErrorRate[];
    overallErrorRate: number;
    profileCacheHitRate: number;
    tierUpgradeRate: number;
    streakMaintenanceRate: number;
    badgeUnlockRate: number;
    scoreDistribution: ScoreDistribution;
  };
  alerts: IAlert[];
  summary: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    activeAlerts: number;
  };
}

// Service Health Schema
const ServiceHealthSchema = new Schema<IServiceHealth>({
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'unhealthy', 'unknown'],
    required: true
  },
  responseTime: { type: Number, required: true },
  lastChecked: { type: Date, required: true },
  errorMessage: { type: String },
  uptime: { type: Number, required: true }
}, { _id: false });

// Latency Metrics Schema
const LatencyMetricsSchema = new Schema<LatencyMetrics>({
  avg: { type: Number, required: true },
  p50: { type: Number, required: true },
  p95: { type: Number, required: true },
  p99: { type: Number, required: true }
}, { _id: false });

// Score Distribution Schema
const ScoreDistributionSchema = new Schema<ScoreDistribution>({
  bronze: { type: Number, required: true },
  silver: { type: Number, required: true },
  gold: { type: Number, required: true },
  platinum: { type: Number, required: true },
  diamond: { type: Number, required: true }
}, { _id: false });

// Error Rate Schema
const ErrorRateSchema = new Schema<IServiceErrorRate>({
  name: { type: String, required: true },
  rate: { type: Number, required: true },
  errorCount: { type: Number, required: true },
  totalRequests: { type: Number, required: true }
}, { _id: false });

// Alert Schema
const AlertSchema = new Schema<IAlert>({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'acknowledged'],
    required: true
  },
  service: { type: String },
  message: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  threshold: { type: Number },
  currentValue: { type: Number },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date }
}, { _id: false });

// Summary Schema
const SummarySchema = new Schema<{
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  activeAlerts: number;
}>({
  totalServices: { type: Number, required: true },
  healthyServices: { type: Number, required: true },
  degradedServices: { type: Number, required: true },
  unhealthyServices: { type: Number, required: true },
  activeAlerts: { type: Number, required: true }
}, { _id: false });

// Metric Snapshot Schema
const MetricSnapshotSchema = new Schema<IMetricSnapshot>({
  timestamp: { type: Date, required: true, index: true },
  services: { type: [ServiceHealthSchema], required: true },
  metrics: {
    eventsProcessedPerSecond: { type: Number, required: true },
    decisionLatency: { type: LatencyMetricsSchema, required: true },
    errorRates: { type: [ErrorRateSchema], required: true },
    overallErrorRate: { type: Number, required: true },
    profileCacheHitRate: { type: Number, required: true },
    tierUpgradeRate: { type: Number, required: true },
    streakMaintenanceRate: { type: Number, required: true },
    badgeUnlockRate: { type: Number, required: true },
    scoreDistribution: { type: ScoreDistributionSchema, required: true }
  },
  alerts: { type: [AlertSchema], default: [] },
  summary: { type: SummarySchema, required: true }
}, {
  timestamps: true,
  collection: 'metric_snapshots'
});

// Indexes for efficient querying
MetricSnapshotSchema.index({ timestamp: -1 });
MetricSnapshotSchema.index({ 'services.name': 1, timestamp: -1 });
MetricSnapshotSchema.index({ 'summary.healthyServices': 1 });

export const MetricSnapshot = mongoose.model<IMetricSnapshot>('MetricSnapshot', MetricSnapshotSchema);

// Alert Model (separate collection for active alerts)
const ActiveAlertSchema = new Schema<IAlert>({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'acknowledged'],
    required: true
  },
  service: { type: String },
  message: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  threshold: { type: Number },
  currentValue: { type: Number },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date }
}, {
  timestamps: true,
  collection: 'alerts'
});

ActiveAlertSchema.index({ status: 1, severity: -1 });
ActiveAlertSchema.index({ service: 1, status: 1 });
ActiveAlertSchema.index({ createdAt: -1 });

export const Alert = mongoose.model<IAlert>('Alert', ActiveAlertSchema);
