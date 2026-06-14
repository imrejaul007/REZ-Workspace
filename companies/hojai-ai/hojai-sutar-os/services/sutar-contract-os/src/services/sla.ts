// ============================================================================
// SUTAR Contract OS - SLA Tracking Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import { SLA, SLAMetric, SLAMeasurement, SLAPenalty, SLABonus, Contract } from '../types/index';

// In-memory stores
const slaStore = new Map<string, SLA>();
const measurementStore = new Map<string, SLAMeasurement[]>();

// SLA templates
const slaTemplates = new Map<string, Partial<SLA>>();

// Initialize default SLA templates
const initializeSlaTemplates = (): void => {
  // Standard SLA
  slaTemplates.set('standard', {
    name: 'Standard Service Level Agreement',
    description: 'Standard SLA with basic service metrics',
    metrics: [
      { id: 'uptime', name: 'System Uptime', type: 'uptime', target: 99.5, unit: 'percentage', threshold: 99, weight: 30, description: 'Percentage of time service is available' },
      { id: 'response', name: 'Response Time', type: 'response_time', target: 4, unit: 'hours', threshold: 8, weight: 25, description: 'Average response time to requests' },
      { id: 'delivery', name: 'Delivery Rate', type: 'delivery', target: 98, unit: 'percentage', threshold: 95, weight: 25, description: 'On-time delivery percentage' },
      { id: 'quality', name: 'Quality Score', type: 'quality', target: 95, unit: 'percentage', threshold: 90, weight: 20, description: 'Customer satisfaction score' },
    ],
    reportingPeriod: 'monthly',
    breachNotifications: true,
  });

  // Premium SLA
  slaTemplates.set('premium', {
    name: 'Premium Service Level Agreement',
    description: 'Enhanced SLA with premium support metrics',
    metrics: [
      { id: 'uptime', name: 'System Uptime', type: 'uptime', target: 99.9, unit: 'percentage', threshold: 99.5, weight: 25, description: 'Percentage of time service is available' },
      { id: 'response_critical', name: 'Critical Response Time', type: 'response_time', target: 1, unit: 'hours', threshold: 2, weight: 20, description: 'Response time for critical issues' },
      { id: 'response_high', name: 'High Priority Response', type: 'response_time', target: 2, unit: 'hours', threshold: 4, weight: 15, description: 'Response time for high priority issues' },
      { id: 'delivery', name: 'Delivery Rate', type: 'delivery', target: 99, unit: 'percentage', threshold: 97, weight: 20, description: 'On-time delivery percentage' },
      { id: 'quality', name: 'Quality Score', type: 'quality', target: 98, unit: 'percentage', threshold: 95, weight: 20, description: 'Customer satisfaction score' },
    ],
    reportingPeriod: 'weekly',
    breachNotifications: true,
  });

  // Basic SLA
  slaTemplates.set('basic', {
    name: 'Basic Service Level Agreement',
    description: 'Entry-level SLA for essential services',
    metrics: [
      { id: 'uptime', name: 'System Uptime', type: 'uptime', target: 99, unit: 'percentage', threshold: 98, weight: 40, description: 'Percentage of time service is available' },
      { id: 'response', name: 'Response Time', type: 'response_time', target: 8, unit: 'hours', threshold: 12, weight: 30, description: 'Average response time to requests' },
      { id: 'support', name: 'Support Availability', type: 'support', target: 95, unit: 'percentage', threshold: 90, weight: 30, description: 'Percentage of time support is available' },
    ],
    reportingPeriod: 'monthly',
    breachNotifications: true,
  });
};

initializeSlaTemplates();

// SLA Service Functions
export const slaService: any = {
  // List SLA templates
  listSlaTemplates: (): Array<{ id: string; name: string; description: string; metricCount: number }> => {
    return Array.from(slaTemplates.entries()).map(([id, template]) => ({
      id,
      name: template.name || 'Unknown',
      description: template.description || '',
      metricCount: template.metrics?.length || 0,
    }));
  },

  // Create SLA for contract
  createSla: (
    contractId: string,
    options: {
      name: string;
      description: string;
      metrics?: SLAMetric[];
      reportingPeriod?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
      breachNotifications?: boolean;
      penalties?: SLAPenalty[];
      bonuses?: SLABonus[];
    }
  ): SLA => {
    const sla: SLA = {
      id: `sla-${uuidv4()}`,
      contractId,
      name: options.name,
      description: options.description,
      metrics: options.metrics || [],
      reportingPeriod: options.reportingPeriod || 'monthly',
      breachNotifications: options.breachNotifications ?? true,
      penalties: options.penalties || [],
      bonuses: options.bonuses || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    slaStore.set(sla.id, sla);
    measurementStore.set(sla.id, []);

    console.log(`[SLA] Created: ${sla.id} for contract ${contractId}`);
    return sla;
  },

  // Create SLA from template
  createSlaFromTemplate: (
    contractId: string,
    templateId: string,
    options?: {
      customMetrics?: Partial<SLAMetric>[];
      customPenalties?: Partial<SLAPenalty>[];
      customBonuses?: Partial<SLABonus>[];
    }
  ): SLA | undefined => {
    const template = slaTemplates.get(templateId);
    if (!template) return undefined;

    const metrics = (options?.customMetrics || template.metrics || []).map(m => ({
      ...m,
      id: m.id || `metric-${uuidv4()}`,
    })) as SLAMetric[];

    const penalties = (options?.customPenalties || []).map(p => ({
      ...p,
      id: p.id || `penalty-${uuidv4()}`,
    })) as SLAPenalty[];

    const bonuses = (options?.customBonuses || []).map(b => ({
      ...b,
      id: b.id || `bonus-${uuidv4()}`,
    })) as SLABonus[];

    return slaService: any.createSla(contractId, {
      name: template.name || 'SLA',
      description: template.description || '',
      metrics,
      reportingPeriod: template.reportingPeriod,
      breachNotifications: template.breachNotifications,
      penalties,
      bonuses,
    });
  },

  // Get SLA by ID
  getSla: (slaId: string): SLA | undefined => {
    return slaStore.get(slaId);
  },

  // Get SLA for contract
  getSlaForContract: (contractId: string): SLA | undefined => {
    return Array.from(slaStore.values()).find(s => s.contractId === contractId);
  },

  // Update SLA
  updateSla: (slaId: string, updates: Partial<SLA>): SLA | undefined => {
    const sla = slaStore.get(slaId);
    if (!sla) return undefined;

    const updatedSla: SLA = {
      ...sla,
      ...updates,
      id: sla.id,
      updatedAt: new Date().toISOString(),
    };

    slaStore.set(slaId, updatedSla);
    console.log(`[SLA] Updated: ${slaId}`);
    return updatedSla;
  },

  // Add metric to SLA
  addMetric: (slaId: string, metric: Omit<SLAMetric, 'id'>): SLAMetric | undefined => {
    const sla = slaStore.get(slaId);
    if (!sla) return undefined;

    const newMetric: SLAMetric = {
      ...metric,
      id: `metric-${uuidv4()}`,
    };

    sla.metrics.push(newMetric);
    sla.updatedAt = new Date().toISOString();
    slaStore.set(slaId, sla);

    return newMetric;
  },

  // Remove metric from SLA
  removeMetric: (slaId: string, metricId: string): boolean => {
    const sla = slaStore.get(slaId);
    if (!sla) return false;

    const index = sla.metrics.findIndex(m => m.id === metricId);
    if (index === -1) return false;

    sla.metrics.splice(index, 1);
    sla.updatedAt = new Date().toISOString();
    slaStore.set(slaId, sla);

    return true;
  },

  // Record metric measurement
  recordMeasurement: (
    slaId: string,
    metricId: string,
    value: number,
    options?: {
      periodStart?: string;
      periodEnd?: string;
      notes?: string;
    }
  ): SLAMeasurement | undefined => {
    const sla = slaStore.get(slaId);
    if (!sla) return undefined;

    const metric = sla.metrics.find(m => m.id === metricId);
    if (!metric) return undefined;

    const measurement: SLAMeasurement = {
      id: `measurement-${uuidv4()}`,
      slaId,
      metricId,
      value,
      recordedAt: new Date().toISOString(),
      periodStart: options?.periodStart || new Date().toISOString(),
      periodEnd: options?.periodEnd || new Date().toISOString(),
      isCompliant: value >= metric.threshold,
      notes: options?.notes,
    };

    if (!measurementStore.has(slaId)) {
      measurementStore.set(slaId, []);
    }
    measurementStore.get(slaId)!.push(measurement);

    console.log(`[SLA] Recorded measurement: ${measurement.id} - ${metric.name} = ${value}${metric.unit}`);
    return measurement;
  },

  // Get measurements for SLA
  getMeasurements: (
    slaId: string,
    options?: {
      metricId?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }
  ): SLAMeasurement[] => {
    let measurements = measurementStore.get(slaId) || [];

    if (options?.metricId) {
      measurements = measurements.filter(m => m.metricId === options.metricId);
    }
    if (options?.fromDate) {
      const from = new Date(options.fromDate);
      measurements = measurements.filter(m => new Date(m.recordedAt) >= from);
    }
    if (options?.toDate) {
      const to = new Date(options.toDate);
      measurements = measurements.filter(m => new Date(m.recordedAt) <= to);
    }

    measurements.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    if (options?.limit) {
      measurements = measurements.slice(0, options.limit);
    }

    return measurements;
  },

  // Calculate SLA compliance
  calculateCompliance: (slaId: string): {
    overall: number;
    byMetric: Array<{
      metric: SLAMetric;
      compliance: number;
      average: number;
      breaches: number;
    }>;
    periodCompliance: Array<{
      period: string;
      compliance: number;
    }>;
  } | undefined => {
    const sla = slaStore.get(slaId);
    if (!sla) return undefined;

    const measurements = measurementStore.get(slaId) || [];
    const byMetric: Array<{
      metric: SLAMetric;
      compliance: number;
      average: number;
      breaches: number;
    }> = [];

    sla.metrics.forEach(metric => {
      const metricMeasurements = measurements.filter(m => m.metricId === metric.id);
      if (metricMeasurements.length === 0) {
        byMetric.push({
          metric,
          compliance: 100,
          average: metric.target,
          breaches: 0,
        });
        return;
      }

      const compliant = metricMeasurements.filter(m => m.isCompliant).length;
      const total = metricMeasurements.length;
      const compliance = (compliant / total) * 100;
      const average = metricMeasurements.reduce((sum, m) => sum + m.value, 0) / total;
      const breaches = total - compliant;

      byMetric.push({
        metric,
        compliance: Math.round(compliance * 100) / 100,
        average: Math.round(average * 100) / 100,
        breaches,
      });
    });

    // Calculate overall compliance (weighted)
    const overall = byMetric.reduce((sum, m) => {
      return sum + (m.compliance * m.metric.weight / 100);
    }, 0);

    // Period compliance (group by month)
    const periodMap = new Map<string, { compliant: number; total: number }>();
    measurements.forEach(m => {
      const period = m.periodStart.substring(0, 7); // YYYY-MM
      const existing = periodMap.get(period) || { compliant: 0, total: 0 };
      existing.total++;
      if (m.isCompliant) existing.compliant++;
      periodMap.set(period, existing);
    });

    const periodCompliance = Array.from(periodMap.entries())
      .map(([period, stats]) => ({
        period,
        compliance: Math.round((stats.compliant / stats.total) * 100 * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      overall: Math.round(overall * 100) / 100,
      byMetric,
      periodCompliance,
    };
  },

  // Calculate penalties
  calculatePenalties: (slaId: string): Array<{
    penalty: SLAPenalty;
    metricId: string;
    amount: number;
    currency: string;
    reason: string;
  }> => {
    const sla = slaStore.get(slaId);
    if (!sla) return [];

    const compliance = slaService: any.calculateCompliance(slaId);
    if (!compliance) return [];

    const penalties: Array<{
      penalty: SLAPenalty;
      metricId: string;
      amount: number;
      currency: string;
      reason: string;
    }> = [];

    sla.penalties.forEach(penalty => {
      const metricCompliance = compliance.byMetric.find(m => m.metric.id === penalty.metricId);
      if (!metricCompliance) return;

      let applies = false;
      if (penalty.condition === 'below_threshold' && metricCompliance.compliance < penalty.threshold) {
        applies = true;
      } else if (penalty.condition === 'breach_count' && metricCompliance.breaches >= penalty.threshold) {
        applies = true;
      }

      if (applies) {
        const amount = penalty.type === 'percentage'
          ? (penalty.amount / 100) * (penalty.amount || 0) // Would need contract value
          : penalty.amount;

        penalties.push({
          penalty,
          metricId: penalty.metricId,
          amount,
          currency: penalty.currency,
          reason: `${metricCompliance.metric.name} compliance at ${metricCompliance.compliance}%`,
        });
      }
    });

    return penalties;
  },

  // Calculate bonuses
  calculateBonuses: (slaId: string): Array<{
    bonus: SLABonus;
    metricId: string;
    amount: number;
    currency: string;
    reason: string;
  }> => {
    const sla = slaStore.get(slaId);
    if (!sla) return [];

    const compliance = slaService: any.calculateCompliance(slaId);
    if (!compliance) return [];

    const bonuses: Array<{
      bonus: SLABonus;
      metricId: string;
      amount: number;
      currency: string;
      reason: string;
    }> = [];

    sla.bonuses.forEach(bonus => {
      const metricCompliance = compliance.byMetric.find(m => m.metric.id === bonus.metricId);
      if (!metricCompliance) return;

      let applies = false;
      if (bonus.condition === 'above_target' && metricCompliance.average > bonus.amount) {
        applies = true;
      } else if (bonus.condition === 'perfect_score' && metricCompliance.compliance === 100) {
        applies = true;
      }

      if (applies) {
        bonuses.push({
          bonus,
          metricId: bonus.metricId,
          amount: bonus.amount,
          currency: bonus.currency,
          reason: `${metricCompliance.metric.name} exceeded target at ${metricCompliance.average}${metricCompliance.metric.unit}`,
        });
      }
    });

    return bonuses;
  },

  // Check for SLA breaches
  checkBreaches: (slaId: string): Array<{
    metric: SLAMetric;
    currentValue: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }> => {
    const compliance = slaService: any.calculateCompliance(slaId);
    if (!compliance) return [];

    const recentMeasurements = measurementStore.get(slaId) || [];

    return compliance.byMetric
      .filter(m => {
        const latestMeasurement = recentMeasurements.find(rm => rm.metricId === m.metric.id);
        return latestMeasurement && !latestMeasurement.isCompliant;
      })
      .map(m => {
        const latestMeasurement = recentMeasurements.find(rm => rm.metricId === m.metric.id)!;
        const severity = m.compliance < m.metric.threshold - 5 ? 'critical' : 'warning';
        return {
          metric: m.metric,
          currentValue: latestMeasurement.value,
          threshold: m.metric.threshold,
          severity,
        };
      });
  },

  // Get SLA report
  getSlaReport: (slaId: string): {
    sla: SLA;
    compliance: ReturnType<typeof slaService: any.calculateCompliance>;
    penalties: ReturnType<typeof slaService: any.calculatePenalties>;
    bonuses: ReturnType<typeof slaService: any.calculateBonuses>;
    breaches: ReturnType<typeof slaService: any.checkBreaches>;
    reportDate: string;
  } | undefined => {
    const sla = slaStore.get(slaId);
    if (!sla) return undefined;

    return {
      sla,
      compliance: slaService: any.calculateCompliance(slaId),
      penalties: slaService: any.calculatePenalties(slaId),
      bonuses: slaService: any.calculateBonuses(slaId),
      breaches: slaService: any.checkBreaches(slaId),
      reportDate: new Date().toISOString(),
    };
  },

  // Get SLA statistics
  getSlaStats: (): {
    totalSlas: number;
    activeSlas: number;
    breachCount: number;
    averageCompliance: number;
    topBreachedMetrics: Array<{
      metricName: string;
      breachCount: number;
    }>;
  } => {
    const slas = Array.from(slaStore.values());
    let totalCompliance = 0;
    let complianceCount = 0;
    const metricBreaches = new Map<string, number>();

    slas.forEach(sla => {
      const compliance = slaService: any.calculateCompliance(sla.id);
      if (compliance) {
        totalCompliance += compliance.overall;
        complianceCount++;

        compliance.byMetric.forEach(m => {
          const existing = metricBreaches.get(m.metric.name) || 0;
          metricBreaches.set(m.metric.name, existing + m.breaches);
        });
      }
    });

    const topBreachedMetrics = Array.from(metricBreaches.entries())
      .map(([metricName, breachCount]) => ({ metricName, breachCount }))
      .sort((a, b) => b.breachCount - a.breachCount)
      .slice(0, 5);

    return {
      totalSlas: slas.length,
      activeSlas: slas.length,
      breachCount: Array.from(metricBreaches.values()).reduce((a, b) => a + b, 0),
      averageCompliance: complianceCount > 0 ? Math.round(totalCompliance / complianceCount * 100) / 100 : 0,
      topBreachedMetrics,
    };
  },

  // Delete SLA
  deleteSla: (slaId: string): boolean => {
    const deleted = slaStore.delete(slaId);
    if (deleted) {
      measurementStore.delete(slaId);
      console.log(`[SLA] Deleted: ${slaId}`);
    }
    return deleted;
  },

  // Bulk import measurements
  bulkImportMeasurements: (
    slaId: string,
    measurements: Array<{
      metricId: string;
      value: number;
      recordedAt: string;
      periodStart: string;
      periodEnd: string;
    }>
  ): { imported: number; failed: number } => {
    const sla = slaStore.get(slaId);
    if (!sla) return { imported: 0, failed: 0 };

    let imported = 0;
    let failed = 0;

    measurements.forEach(m => {
      const result = slaService: any.recordMeasurement(slaId, m.metricId, m.value, {
        periodStart: m.periodStart,
        periodEnd: m.periodEnd,
      });
      if (result) {
        imported++;
      } else {
        failed++;
      }
    });

    console.log(`[SLA] Bulk import: ${imported} imported, ${failed} failed for SLA ${slaId}`);
    return { imported, failed };
  },
};

export default slaService: any;
