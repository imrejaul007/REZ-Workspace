// =============================================================================
// CorpPerks Workforce Intelligence - HIB Sync Module
// =============================================================================

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import {
  EmployeeTrustScore,
  HibSyncPayload,
  HibResponse,
  HibAlert,
  SyncStatus,
  InsiderRiskConfig,
  ExitMonitoring,
} from './types';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'hib-sync.log' }),
  ],
});

/**
 * HIB Workforce Intelligence Gateway sync client
 */
export class HibSyncService {
  private client: AxiosInstance;
  private config: InsiderRiskConfig;
  private syncQueue: HibSyncPayload[] = [];
  private isProcessing = false;

  constructor(config: InsiderRiskConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.hibGatewayUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'corpperks-workforce-intelligence',
        'X-Service-Version': '1.0.0',
      },
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('HIB API Response', { status: response.status, path: response.config.url });
        return response;
      },
      (error) => {
        logger.error('HIB API Error', { error: error.message, path: error.config?.url });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sync employee data to HIB Gateway
   */
  async syncEmployee(profile: EmployeeTrustScore): Promise<HibResponse> {
    const payload: HibSyncPayload = {
      operation: 'update',
      entityType: 'employee',
      employeeId: profile.employeeId,
      data: {
        employeeName: profile.employeeName,
        department: profile.department,
        trustLevel: profile.trustLevel,
        trustScore: profile.trustScore,
        riskFactors: profile.riskFactors.map(f => ({
          category: f.category,
          name: f.name,
          severity: f.severity,
          weight: f.weight,
        })),
        lastAssessment: profile.lastAssessment,
        monitoringStatus: profile.monitoringStatus,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      logger.info('Syncing employee to HIB', { employeeId: profile.employeeId });

      const response = await this.client.post<HibResponse>('/api/workforce/sync', payload);

      logger.info('Employee synced successfully', {
        employeeId: profile.employeeId,
        riskScore: response.data.riskScore,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to sync employee', { employeeId: profile.employeeId, error });

      // Add to retry queue
      this.queueForRetry(payload);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send exit trigger to HIB
   */
  async sendExitTrigger(monitoring: ExitMonitoring, profile: EmployeeTrustScore): Promise<HibResponse> {
    const payload: HibSyncPayload = {
      operation: 'create',
      entityType: 'exit',
      employeeId: monitoring.employeeId,
      data: {
        noticeDate: monitoring.noticeDate,
        lastWorkingDate: monitoring.lastWorkingDate,
        monitoringStartDate: monitoring.monitoringStartDate,
        monitoringEndDate: monitoring.monitoringEndDate,
        enhancedMonitoring: monitoring.enhancedMonitoring,
        trustScore: profile.trustScore,
        riskFactors: profile.riskFactors.map(f => ({
          category: f.category,
          name: f.name,
          severity: f.severity,
        })),
        clearanceChecklist: monitoring.clearanceChecklist?.map(c => ({
          category: c.category,
          name: c.name,
          completed: c.completed,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    try {
      logger.info('Sending exit trigger to HIB', { employeeId: monitoring.employeeId });

      const response = await this.client.post<HibResponse>('/api/workforce/exit', payload);

      logger.info('Exit trigger sent successfully', {
        employeeId: monitoring.employeeId,
        alerts: response.data.alerts?.length,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send exit trigger', {
        employeeId: monitoring.employeeId,
        error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Request risk score from HIB
   */
  async getRiskScore(employeeId: string): Promise<{ score?: number; level?: string }> {
    try {
      const response = await this.client.get<{ score: number; level: string }>(
        `/api/workforce/employee/${employeeId}/risk`
      );
      return { score: response.data.score, level: response.data.level };
    } catch (error) {
      logger.error('Failed to get risk score from HIB', { employeeId, error });
      return {};
    }
  }

  /**
   * Trigger investigation
   */
  async triggerInvestigation(
    employeeId: string,
    reason: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<{ investigationId?: string; success: boolean }> {
    try {
      const response = await this.client.post<{ investigationId: string }>(
        '/api/workforce/investigation',
        {
          employeeId,
          reason,
          priority,
          source: 'corpperks-workforce-intelligence',
        }
      );

      logger.info('Investigation triggered', {
        employeeId,
        investigationId: response.data.investigationId,
        priority,
      });

      return {
        investigationId: response.data.investigationId,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to trigger investigation', { employeeId, error });
      return { success: false };
    }
  }

  /**
   * Sync multiple employees
   */
  async syncMultiple(profiles: EmployeeTrustScore[]): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const results = { synced: 0, failed: 0, errors: [] as string[] };

    for (const profile of profiles) {
      const result = await this.syncEmployee(profile);
      if (result.success) {
        results.synced++;
      } else {
        results.failed++;
        results.errors.push(`${profile.employeeId}: ${result.error}`);
      }
    }

    return results;
  }

  /**
   * Process sync queue
   */
  async processQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;

    while (this.syncQueue.length > 0) {
      const payload = this.syncQueue.shift();
      if (!payload) break;

      try {
        await this.client.post('/api/workforce/sync', payload);
        processed++;
        logger.info('Queue item processed', { employeeId: payload.employeeId });
      } catch (error) {
        failed++;
        this.syncQueue.push(payload); // Re-queue for retry
        logger.error('Queue item failed', { employeeId: payload.employeeId, error });
      }
    }

    this.isProcessing = false;
    return { processed, failed };
  }

  /**
   * Queue item for retry
   */
  private queueForRetry(payload: HibSyncPayload): void {
    // Keep queue manageable
    if (this.syncQueue.length < 100) {
      this.syncQueue.push(payload);
    }
    logger.info('Item queued for retry', {
      employeeId: payload.employeeId,
      queueLength: this.syncQueue.length,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

/**
 * Create HIB sync service instance
 */
export function createHibSyncService(config: InsiderRiskConfig): HibSyncService {
  return new HibSyncService(config);
}

/**
 * Default configuration
 */
export const DEFAULT_HIB_CONFIG: InsiderRiskConfig = {
  enabled: true,
  autoMonitorOnNotice: true,
  monitoringDays: 30,
  alertThreshold: 50,
  syncIntervalMinutes: 60,
  hibGatewayUrl: process.env.HIB_GATEWAY_URL || 'http://localhost:3055',
  riskWeights: {
    behavioral: 25,
    technical: 20,
    organizational: 20,
    access: 20,
    compliance: 15,
  },
};

/**
 * Map HIB alerts to internal format
 */
export function mapHibAlerts(alerts: HibAlert[]): HibAlert[] {
  return alerts.map(alert => ({
    id: alert.id || uuidv4(),
    type: alert.type,
    message: alert.message,
    action: alert.action,
    timestamp: alert.timestamp || new Date().toISOString(),
  }));
}

/**
 * Export for testing
 */
export const __testExports = {
  HibSyncService,
  createHibSyncService,
  DEFAULT_HIB_CONFIG,
  mapHibAlerts,
};