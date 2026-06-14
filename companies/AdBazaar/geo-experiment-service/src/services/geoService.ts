import { v4 as uuidv4 } from 'uuid';
import {
  GeoHoldout,
  GeoExperiment,
  GeoRegion,
  GeoConversion,
  GeoBoundary,
  GeoPoint,
  CreateExperimentRequest,
  CreateHoldoutRequest,
  RecordConversionRequest,
  UpdateExperimentRequest,
  GeoAnalysis,
  RegionMetrics,
  MetricTrend,
  Anomaly
} from '../types';

// In-memory storage (replace with MongoDB/PostgreSQL in production)
const holdouts: Map<string, GeoHoldout> = new Map();
const experiments: Map<string, GeoExperiment> = new Map();
const conversions: Map<string, GeoConversion> = new Map();
const regions: Map<string, GeoRegion> = new Map();

// Geo utility functions
export function isPointInBoundary(point: GeoPoint, boundary: GeoBoundary): boolean {
  switch (boundary.type) {
    case 'circle':
      if (!boundary.center || !boundary.radius) return false;
      return getDistanceKm(point, boundary.center) <= boundary.radius / 1000;
    case 'rectangle':
      if (!boundary.bounds) return false;
      return (
        point.latitude >= boundary.bounds.southWest.latitude &&
        point.latitude <= boundary.bounds.northEast.latitude &&
        point.longitude >= boundary.bounds.southWest.longitude &&
        point.longitude <= boundary.bounds.northEast.longitude
      );
    case 'polygon':
      if (!boundary.points || boundary.points.length < 3) return false;
      return isPointInPolygon(point, boundary.points);
    default:
      return false;
  }
}

function getDistanceKm(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(p2.latitude - p1.latitude);
  const dLon = toRad(p2.longitude - p1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.latitude)) * Math.cos(toRad(p2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude;
    const xj = polygon[j].longitude, yj = polygon[j].latitude;
    if (((yi > point.latitude) !== (yj > point.latitude)) &&
        (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Holdout Service
export const holdoutService = {
  create(data: CreateHoldoutRequest): GeoHoldout {
    const holdout: GeoHoldout = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      boundary: data.boundary,
      holdoutPercentage: data.holdoutPercentage,
      isActive: true,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    holdouts.set(holdout.id, holdout);
    return holdout;
  },

  getById(id: string): GeoHoldout | undefined {
    return holdouts.get(id);
  },

  getAll(): GeoHoldout[] {
    return Array.from(holdouts.values());
  },

  getActive(): GeoHoldout[] {
    return Array.from(holdouts.values()).filter(h => h.isActive);
  },

  update(id: string, data: Partial<CreateHoldoutRequest>): GeoHoldout | undefined {
    const holdout = holdouts.get(id);
    if (!holdout) return undefined;

    const updated: GeoHoldout = {
      ...holdout,
      ...data,
      boundary: data.boundary || holdout.boundary,
      updatedAt: new Date()
    };
    holdouts.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return holdouts.delete(id);
  },

  checkHoldout(point: GeoPoint): { isHoldout: boolean; holdout?: GeoHoldout } {
    for (const holdout of holdouts.values()) {
      if (!holdout.isActive) continue;
      if (holdout.startDate && new Date() < holdout.startDate) continue;
      if (holdout.endDate && new Date() > holdout.endDate) continue;
      if (isPointInBoundary(point, holdout.boundary)) {
        return { isHoldout: true, holdout };
      }
    }
    return { isHoldout: false };
  }
};

// Experiment Service
export const experimentService = {
  create(data: CreateExperimentRequest): GeoExperiment {
    const targetRegions: GeoRegion[] = data.targetRegions.map(r => ({
      ...r,
      id: uuidv4()
    }));
    const controlRegions: GeoRegion[] = data.controlRegions.map(r => ({
      ...r,
      id: uuidv4()
    }));

    // Store regions
    [...targetRegions, ...controlRegions].forEach(r => regions.set(r.id, r));

    const experiment: GeoExperiment = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'draft',
      targetRegions,
      controlRegions,
      holdoutPercentage: data.holdoutPercentage,
      trafficAllocation: {},
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      metrics: {
        treatment: createEmptyMetrics(),
        control: createEmptyMetrics(),
        lift: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    experiments.set(experiment.id, experiment);
    return experiment;
  },

  getById(id: string): GeoExperiment | undefined {
    return experiments.get(id);
  },

  getAll(): GeoExperiment[] {
    return Array.from(experiments.values());
  },

  getByStatus(status: GeoExperiment['status']): GeoExperiment[] {
    return Array.from(experiments.values()).filter(e => e.status === status);
  },

  update(id: string, data: UpdateExperimentRequest): GeoExperiment | undefined {
    const experiment = experiments.get(id);
    if (!experiment) return undefined;

    const updated: GeoExperiment = {
      ...experiment,
      ...data,
      updatedAt: new Date()
    };
    experiments.set(id, updated);
    return updated;
  },

  start(id: string): GeoExperiment | undefined {
    const experiment = experiments.get(id);
    if (!experiment || experiment.status !== 'draft') return undefined;

    const updated: GeoExperiment = {
      ...experiment,
      status: 'running',
      startDate: new Date(),
      updatedAt: new Date()
    };
    experiments.set(id, updated);
    return updated;
  },

  pause(id: string): GeoExperiment | undefined {
    const experiment = experiments.get(id);
    if (!experiment || experiment.status !== 'running') return undefined;

    const updated: GeoExperiment = {
      ...experiment,
      status: 'paused',
      updatedAt: new Date()
    };
    experiments.set(id, updated);
    return updated;
  },

  complete(id: string): GeoExperiment | undefined {
    const experiment = experiments.get(id);
    if (!experiment || experiment.status !== 'running') return undefined;

    const updated: GeoExperiment = {
      ...experiment,
      status: 'completed',
      endDate: new Date(),
      updatedAt: new Date()
    };
    experiments.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return experiments.delete(id);
  },

  getRegionById(regionId: string): GeoRegion | undefined {
    return regions.get(regionId);
  },

  findExperimentForLocation(point: GeoPoint): GeoExperiment | undefined {
    for (const experiment of experiments.values()) {
      if (experiment.status !== 'running') continue;

      for (const region of [...experiment.targetRegions, ...experiment.controlRegions]) {
        if (isPointInBoundary(point, region.boundary)) {
          return experiment;
        }
      }
    }
    return undefined;
  }
};

// Conversion Service
export const conversionService = {
  record(data: RecordConversionRequest): GeoConversion {
    const conversion: GeoConversion = {
      id: uuidv4(),
      experimentId: data.experimentId,
      regionId: data.regionId,
      conversionType: data.conversionType,
      conversionValue: data.conversionValue,
      timestamp: new Date(),
      attributes: data.attributes
    };
    conversions.set(conversion.id, conversion);

    // Update experiment metrics
    const experiment = experiments.get(data.experimentId);
    if (experiment) {
      const isTreatment = experiment.targetRegions.some(r => r.id === data.regionId);
      const metrics = isTreatment ? experiment.metrics.treatment : experiment.metrics.control;

      switch (data.conversionType) {
        case 'impression':
          metrics.impressions += 1;
          break;
        case 'click':
          metrics.clicks += 1;
          break;
        case 'visit':
        case 'purchase':
        case 'signup':
          metrics.conversions += 1;
          metrics.revenue += data.conversionValue;
          break;
      }

      // Recalculate derived metrics
      metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      metrics.cvr = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
      metrics.cpa = metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0;
      metrics.roas = metrics.cost > 0 ? metrics.revenue / metrics.cost : 0;

      // Calculate lift
      if (experiment.metrics.control.conversions > 0) {
        experiment.metrics.lift.conversions =
          ((experiment.metrics.treatment.conversions - experiment.metrics.control.conversions) /
           experiment.metrics.control.conversions) * 100;
      }

      experiments.set(experiment.id, experiment);
    }

    return conversion;
  },

  getByExperiment(experimentId: string): GeoConversion[] {
    return Array.from(conversions.values()).filter(c => c.experimentId === experimentId);
  },

  getByRegion(regionId: string): GeoConversion[] {
    return Array.from(conversions.values()).filter(c => c.regionId === regionId);
  }
};

// Analytics Service
export const analyticsService = {
  analyze(experimentId: string, regionId: string, startDate: Date, endDate: Date): GeoAnalysis {
    const experiment = experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const regionConversions = Array.from(conversions.values()).filter(
      c => c.experimentId === experimentId &&
           c.regionId === regionId &&
           c.timestamp >= startDate &&
           c.timestamp <= endDate
    );

    const metrics: RegionMetrics = createEmptyMetrics();
    regionConversions.forEach(c => {
      switch (c.conversionType) {
        case 'impression':
          metrics.impressions += 1;
          break;
        case 'click':
          metrics.clicks += 1;
          break;
        case 'visit':
        case 'purchase':
        case 'signup':
          metrics.conversions += 1;
          metrics.revenue += c.conversionValue;
          break;
      }
    });

    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    metrics.cvr = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    metrics.cpa = metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0;
    metrics.roas = metrics.cost > 0 ? metrics.revenue / metrics.cost : 0;

    return {
      experimentId,
      regionId,
      period: { start: startDate, end: endDate },
      metrics,
      trends: generateTrends(regionConversions, startDate, endDate),
      anomalies: detectAnomalies(metrics, regionConversions)
    };
  },

  getMatchback(experimentId: string): {
    treatment: { matched: number; total: number; rate: number };
    control: { matched: number; total: number; rate: number };
  } {
    const experiment = experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const treatmentConversions = Array.from(conversions.values())
      .filter(c => c.experimentId === experimentId &&
                   experiment.targetRegions.some(r => r.id === c.regionId));
    const controlConversions = Array.from(conversions.values())
      .filter(c => c.experimentId === experimentId &&
                   experiment.controlRegions.some(r => r.id === c.regionId));

    return {
      treatment: {
        matched: treatmentConversions.filter(c => c.attributes?.matched).length,
        total: treatmentConversions.length,
        rate: treatmentConversions.length > 0
          ? (treatmentConversions.filter(c => c.attributes?.matched).length / treatmentConversions.length) * 100
          : 0
      },
      control: {
        matched: controlConversions.filter(c => c.attributes?.matched).length,
        total: controlConversions.length,
        rate: controlConversions.length > 0
          ? (controlConversions.filter(c => c.attributes?.matched).length / controlConversions.length) * 100
          : 0
      }
    };
  }
};

function createEmptyMetrics(): RegionMetrics {
  return {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    cost: 0,
    ctr: 0,
    cvr: 0,
    cpc: 0,
    cpa: 0,
    roas: 0
  };
}

function generateTrends(conversions: GeoConversion[], startDate: Date, endDate: Date): MetricTrend[] {
  const trends: MetricTrend[] = [];
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayConversions = conversions.filter(
      c => c.timestamp >= date && c.timestamp < nextDate
    );

    const value = dayConversions.reduce((sum, c) => sum + c.conversionValue, 0);
    trends.push({
      date,
      value,
      change: i > 0 ? value - (trends[i - 1]?.value || 0) : 0,
      changePercentage: i > 0 && trends[i - 1]?.value
        ? ((value - trends[i - 1].value) / trends[i - 1].value) * 100
        : 0
    });
  }

  return trends;
}

function detectAnomalies(metrics: RegionMetrics, conversions: GeoConversion[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Simple anomaly detection based on standard deviation
  const values = conversions.map(c => c.conversionValue);
  if (values.length < 2) return anomalies;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  conversions.forEach(c => {
    const deviation = Math.abs(c.conversionValue - mean);
    if (deviation > 2 * stdDev) {
      anomalies.push({
        date: c.timestamp,
        metric: c.conversionType,
        expectedValue: mean,
        actualValue: c.conversionValue,
        deviation,
        severity: deviation > 3 * stdDev ? 'critical' : deviation > 2.5 * stdDev ? 'high' : 'medium'
      });
    }
  });

  return anomalies;
}
