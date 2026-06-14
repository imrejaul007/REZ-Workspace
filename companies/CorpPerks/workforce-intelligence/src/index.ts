// =============================================================================
// CorpPerks Workforce Intelligence - Main Entry Point
// =============================================================================

import express, { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import {
  EmployeeTrustScore,
  InsiderRiskConfig,
  PerformanceMetrics,
  RiskSignal,
  ExitMonitoring,
  ManagerFeedback,
  Incident,
  CalculateTrustScoreRequest,
  CalculateTrustScoreResponse,
  GetRiskProfileResponse,
  EnhanceMonitoringRequest,
  HighRiskEmployeesResponse,
  SyncHibResponse,
  RiskFactor,
} from './types';
import {
  generateTrustProfile,
  requiresAttention,
  getRiskCategorySummary,
  calculateTrustLevel,
} from './employee-trust';
import {
  detectRiskSignals,
  detectFeedbackSignals,
  detectIncidentSignals,
  detectAccessAnomalies,
  detectExitIndicators,
} from './risk-signals';
import { HibSyncService, createHibSyncService, DEFAULT_HIB_CONFIG } from './hib-sync';
import { ExitMonitoringService, createExitMonitoringService } from './exit-monitoring';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'workforce-intelligence.log' }),
  ],
});

// Create Express app
const app = express();
app.use(express.json());

// ============================================================================
// In-Memory Storage (Replace with MongoDB/PostgreSQL in production)
// ============================================================================

interface Storage {
  profiles: Map<string, EmployeeTrustScore>;
  signals: Map<string, RiskSignal[]>;
  monitoring: Map<string, ExitMonitoring>;
  config: InsiderRiskConfig;
}

const storage: Storage = {
  profiles: new Map(),
  signals: new Map(),
  monitoring: new Map(),
  config: DEFAULT_HIB_CONFIG,
};

// Initialize services
let hibSync: HibSyncService;
let exitMonitoringService: ExitMonitoringService;

// ============================================================================
// API Routes
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'workforce-intelligence',
    version: '1.0.0',
    port: process.env.PORT || 4710,
  });
});

/**
 * Calculate trust score for employee
 * POST /api/workforce/employees/:id/trust-score
 */
app.post('/api/workforce/employees/:id/trust-score', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { performanceMetrics, employeeName, department } = req.body;

    // Get existing profile
    const existingProfile = storage.profiles.get(id);

    // Generate or update trust profile
    const profile = generateTrustProfile(
      id,
      employeeName || existingProfile?.employeeName || 'Unknown',
      department || existingProfile?.department || 'Unknown',
      performanceMetrics || createMockMetrics(id),
      existingProfile?.riskFactors || [],
      existingProfile
    );

    // Store profile
    storage.profiles.set(id, profile);

    // Sync to HIB
    await hibSync.syncEmployee(profile);

    const response: CalculateTrustScoreResponse = {
      success: true,
      trustScore: profile,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error calculating trust score', { error });
    res.status(500).json({ success: false, error: 'Failed to calculate trust score' });
  }
});

/**
 * Get risk profile for employee
 * GET /api/workforce/employees/:id/risk-profile
 */
app.get('/api/workforce/employees/:id/risk-profile', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profile = storage.profiles.get(id);

    if (!profile) {
      // Create initial profile with mock data
      const newProfile = generateTrustProfile(
        id,
        'New Employee',
        'Unknown',
        createMockMetrics(id),
        [],
        undefined
      );
      storage.profiles.set(id, newProfile);
    }

    const currentProfile = storage.profiles.get(id)!;
    const signals = storage.signals.get(id) || [];
    const monitoring = storage.monitoring.get(id);

    const response: GetRiskProfileResponse = {
      success: true,
      profile: currentProfile,
      signals,
      metrics: undefined,
    };

    if (monitoring) {
      response.profile.monitoringStatus = monitoring.status;
    }

    res.json(response);
  } catch (error) {
    logger.error('Error getting risk profile', { error });
    res.status(500).json({ success: false, error: 'Failed to get risk profile' });
  }
});

/**
 * Enhance monitoring for employee
 * POST /api/workforce/employees/:id/enhance-monitoring
 */
app.post('/api/workforce/employees/:id/enhance-monitoring', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, duration, level } = req.body as EnhanceMonitoringRequest;

    let monitoring = storage.monitoring.get(id);
    const profile = storage.profiles.get(id);

    if (!monitoring) {
      // Initialize monitoring if not exists
      monitoring = exitMonitoringService.initiateMonitoring(
        id,
        new Date().toISOString(),
        new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
        profile || generateTrustProfile(id, 'Employee', 'Unknown', createMockMetrics(id))
      );
    }

    // Update monitoring level
    if (level === 'enhanced' || level === 'critical') {
      monitoring.enhancedMonitoring = true;
      monitoring.status = 'enhanced_monitoring';
    }

    // Add evidence for enhancement
    monitoring = exitMonitoringService.addEvidence(monitoring, {
      type: 'system_event',
      description: `Monitoring enhanced: ${reason}`,
      timestamp: new Date().toISOString(),
      source: 'workforce-intelligence',
      data: { level, duration },
    });

    storage.monitoring.set(id, monitoring);

    // Update profile
    if (profile) {
      profile.monitoringStatus = monitoring.status;
      storage.profiles.set(id, profile);
    }

    logger.info('Monitoring enhanced', { employeeId: id, level, reason });

    res.json({
      success: true,
      monitoring,
      message: `Enhanced monitoring activated at level: ${level}`,
    });
  } catch (error) {
    logger.error('Error enhancing monitoring', { error });
    res.status(500).json({ success: false, error: 'Failed to enhance monitoring' });
  }
});

/**
 * Get high risk employees
 * GET /api/workforce/high-risk
 */
app.get('/api/workforce/high-risk', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 50;

    const highRiskEmployees: EmployeeTrustScore[] = [];

    for (const [, profile] of storage.profiles) {
      if (profile.trustScore < threshold || requiresAttention(profile)) {
        highRiskEmployees.push(profile);
      }
    }

    // Sort by trust score (lowest first)
    highRiskEmployees.sort((a, b) => a.trustScore - b.trustScore);

    const response: HighRiskEmployeesResponse = {
      success: true,
      employees: highRiskEmployees,
      total: highRiskEmployees.length,
      lastUpdated: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting high risk employees', { error });
    res.status(500).json({ success: false, error: 'Failed to get high risk employees' });
  }
});

/**
 * Sync with HIB
 * POST /api/workforce/sync/hib
 */
app.post('/api/workforce/sync/hib', async (req: Request, res: Response) => {
  try {
    const { employeeIds, forceResync } = req.body;

    let profiles: EmployeeTrustScore[];

    if (employeeIds && employeeIds.length > 0) {
      profiles = employeeIds
        .map((id: string) => storage.profiles.get(id))
        .filter((p): p is EmployeeTrustScore => p !== undefined);
    } else {
      profiles = Array.from(storage.profiles.values());
    }

    const results = await hibSync.syncMultiple(profiles);

    const response: SyncHibResponse = {
      success: results.failed === 0,
      synced: results.synced,
      failed: results.failed,
      errors: results.errors,
    };

    // Update sync status
    for (const profile of profiles) {
      if (results.errors.some(e => e.startsWith(profile.employeeId))) {
        profile.hibSyncStatus = 'failed';
      } else {
        profile.hibSyncStatus = 'synced';
        profile.lastHibSync = new Date().toISOString();
      }
      storage.profiles.set(profile.employeeId, profile);
    }

    res.json(response);
  } catch (error) {
    logger.error('Error syncing with HIB', { error });
    res.status(500).json({ success: false, error: 'Failed to sync with HIB' });
  }
});

/**
 * Get signals for employee
 * GET /api/workforce/employees/:id/signals
 */
app.get('/api/workforce/employees/:id/signals', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const signals = storage.signals.get(id) || [];

    res.json({
      success: true,
      signals,
      total: signals.length,
    });
  } catch (error) {
    logger.error('Error getting signals', { error });
    res.status(500).json({ success: false, error: 'Failed to get signals' });
  }
});

/**
 * Get exit monitoring status
 * GET /api/workforce/employees/:id/exit-monitoring
 */
app.get('/api/workforce/employees/:id/exit-monitoring', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const monitoring = storage.monitoring.get(id);

    if (!monitoring) {
      res.status(404).json({
        success: false,
        error: 'No exit monitoring found for this employee',
      });
      return;
    }

    const status = exitMonitoringService.getCompletionStatus(monitoring);

    res.json({
      success: true,
      monitoring,
      completion: status,
    });
  } catch (error) {
    logger.error('Error getting exit monitoring', { error });
    res.status(500).json({ success: false, error: 'Failed to get exit monitoring' });
  }
});

/**
 * Update clearance item
 * PATCH /api/workforce/employees/:id/exit-monitoring/clearance
 */
app.patch('/api/workforce/employees/:id/exit-monitoring/clearance', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, completed, completedBy, notes } = req.body;

    let monitoring = storage.monitoring.get(id);
    if (!monitoring) {
      res.status(404).json({
        success: false,
        error: 'No exit monitoring found for this employee',
      });
      return;
    }

    monitoring.clearanceChecklist = exitMonitoringService.updateClearanceItem(
      monitoring.clearanceChecklist || [],
      itemId,
      completed,
      completedBy,
      notes
    );

    storage.monitoring.set(id, monitoring);

    res.json({
      success: true,
      monitoring,
    });
  } catch (error) {
    logger.error('Error updating clearance item', { error });
    res.status(500).json({ success: false, error: 'Failed to update clearance item' });
  }
});

/**
 * Submit notice (triggers exit monitoring)
 * POST /api/workforce/employees/:id/notice
 */
app.post('/api/workforce/employees/:id/notice', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lastWorkingDate } = req.body;

    const profile = storage.profiles.get(id) || generateTrustProfile(
      id,
      'Employee',
      'Unknown',
      createMockMetrics(id)
    );

    const monitoring = exitMonitoringService.initiateMonitoring(
      id,
      new Date().toISOString(),
      lastWorkingDate,
      profile
    );

    storage.monitoring.set(id, monitoring);
    profile.monitoringStatus = monitoring.status;
    storage.profiles.set(id, profile);

    // Trigger HIB sync
    hibSync.sendExitTrigger(monitoring, profile);

    logger.info('Exit notice submitted', { employeeId: id, lastWorkingDate });

    res.json({
      success: true,
      monitoring,
      message: 'Exit monitoring initiated',
    });
  } catch (error) {
    logger.error('Error submitting notice', { error });
    res.status(500).json({ success: false, error: 'Failed to submit notice' });
  }
});

/**
 * Update configuration
 * PUT /api/workforce/config
 */
app.put('/api/workforce/config', (req: Request, res: Response) => {
  try {
    const newConfig = req.body as Partial<InsiderRiskConfig>;
    storage.config = { ...storage.config, ...newConfig };

    res.json({
      success: true,
      config: storage.config,
    });
  } catch (error) {
    logger.error('Error updating config', { error });
    res.status(500).json({ success: false, error: 'Failed to update config' });
  }
});

/**
 * Get configuration
 * GET /api/workforce/config
 */
app.get('/api/workforce/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: storage.config,
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createMockMetrics(employeeId: string): PerformanceMetrics {
  return {
    employeeId,
    period: new Date().toISOString(),
    performanceScore: 75,
    attendanceRate: 92,
    policyComplianceScore: 95,
    projectOutcomes: [],
    managerFeedback: [],
    incidents: [],
  };
}

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================================================
// Startup
// ============================================================================

const PORT = process.env.PORT || 4710;

async function start() {
  logger.info('Starting CorpPerks Workforce Intelligence...');

  // Initialize services
  hibSync = createHibSyncService(DEFAULT_HIB_CONFIG);
  exitMonitoringService = createExitMonitoringService(DEFAULT_HIB_CONFIG.monitoringDays);

  // Check HIB connectivity
  const hibHealthy = await hibSync.healthCheck();
  logger.info('HIB Gateway connectivity', { healthy: hibHealthy });

  app.listen(PORT, () => {
    logger.info(`Workforce Intelligence service started`, {
      port: PORT,
      endpoints: [
        'POST /api/workforce/employees/:id/trust-score',
        'GET /api/workforce/employees/:id/risk-profile',
        'POST /api/workforce/employees/:id/enhance-monitoring',
        'GET /api/workforce/high-risk',
        'POST /api/workforce/sync/hib',
        'GET /api/workforce/employees/:id/signals',
        'GET /api/workforce/employees/:id/exit-monitoring',
        'PATCH /api/workforce/employees/:id/exit-monitoring/clearance',
        'POST /api/workforce/employees/:id/notice',
      ],
    });
  });
}

start().catch((error) => {
  logger.error('Failed to start service', { error });
  process.exit(1);
});

// Export for testing
export { app, storage };