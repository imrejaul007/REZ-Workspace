import { Router, Request, Response, NextFunction } from 'express';
import chronicCareService from '../services/chronicCareService';
import protocolService from '../services/protocolService';
import alertService from '../services/alertService';
import reportingService from '../services/reportingService';
import {
  CreateConditionSchema,
  UpdateConditionSchema,
  CreateReadingSchema,
  CreateProtocolSchema,
  AcknowledgeAlertSchema
} from '../types';
import { validate, ValidationError, NotFoundError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();

// Helper function for async route handlers
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// CONDITION ROUTES
// ============================================

/**
 * POST /conditions
 * Create a new chronic condition
 */
router.post(
  '/conditions',
  validate(CreateConditionSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const condition = await chronicCareService.createCondition(req.body);

    res.status(201).json({
      success: true,
      data: condition
    });
  })
);

/**
 * GET /conditions/:patientId
 * Get all conditions for a patient
 */
router.get(
  '/conditions/:patientId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const conditions = await chronicCareService.getConditions(patientId);

    res.json({
      success: true,
      count: conditions.length,
      data: conditions
    });
  })
);

/**
 * GET /conditions/details/:conditionId
 * Get condition details by ID
 */
router.get(
  '/conditions/details/:conditionId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const condition = await chronicCareService.getConditionDetails(conditionId);

    if (!condition) {
      throw new NotFoundError('Condition not found');
    }

    res.json({
      success: true,
      data: condition
    });
  })
);

/**
 * PUT /conditions/:conditionId
 * Update a condition
 */
router.put(
  '/conditions/:conditionId',
  validate(UpdateConditionSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const condition = await chronicCareService.updateCondition(conditionId, req.body);

    if (!condition) {
      throw new NotFoundError('Condition not found');
    }

    res.json({
      success: true,
      data: condition
    });
  })
);

/**
 * DELETE /conditions/:conditionId
 * Delete a condition
 */
router.delete(
  '/conditions/:conditionId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const deleted = await chronicCareService.deleteCondition(conditionId);

    if (!deleted) {
      throw new NotFoundError('Condition not found');
    }

    res.json({
      success: true,
      message: 'Condition deleted successfully'
    });
  })
);

// ============================================
// READING ROUTES
// ============================================

/**
 * POST /conditions/:conditionId/readings
 * Add a reading for a condition
 */
router.post(
  '/conditions/:conditionId/readings',
  validate(CreateReadingSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;

    // Verify condition exists
    const condition = await chronicCareService.getConditionDetails(conditionId);
    if (!condition) {
      throw new NotFoundError('Condition not found');
    }

    const reading = await chronicCareService.addReading(conditionId, req.body);

    res.status(201).json({
      success: true,
      data: reading
    });
  })
);

/**
 * GET /conditions/:conditionId/readings
 * Get readings for a condition
 */
router.get(
  '/conditions/:conditionId/readings',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const { readingType, startDate, endDate, limit, skip } = req.query;

    const readings = await chronicCareService.getReadings(conditionId, {
      readingType: readingType as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    res.json({
      success: true,
      count: readings.length,
      data: readings
    });
  })
);

/**
 * GET /conditions/:conditionId/trends
 * Get trends for a condition
 */
router.get(
  '/conditions/:conditionId/trends',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const { readingType, period } = req.query;

    if (!readingType) {
      throw new ValidationError('readingType query parameter is required');
    }

    const trends = await chronicCareService.getTrends(
      conditionId,
      readingType as any,
      (period as any) || 'month'
    );

    res.json({
      success: true,
      data: trends
    });
  })
);

// ============================================
// PROTOCOL ROUTES
// ============================================

/**
 * POST /conditions/:conditionId/protocol
 * Create a protocol for a condition
 */
router.post(
  '/conditions/:conditionId/protocol',
  validate(CreateProtocolSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;

    // Verify condition exists
    const condition = await chronicCareService.getConditionDetails(conditionId);
    if (!condition) {
      throw new NotFoundError('Condition not found');
    }

    const protocol = await protocolService.createProtocol(conditionId, req.body);

    res.status(201).json({
      success: true,
      data: protocol
    });
  })
);

/**
 * GET /conditions/:conditionId/protocol
 * Get protocol for a condition
 */
router.get(
  '/conditions/:conditionId/protocol',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const protocol = await protocolService.getProtocol(conditionId);

    res.json({
      success: true,
      data: protocol
    });
  })
);

/**
 * PUT /conditions/:conditionId/protocol/:protocolId
 * Update a protocol
 */
router.put(
  '/conditions/:conditionId/protocol/:protocolId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { protocolId } = req.params;
    const protocol = await protocolService.updateProtocol(protocolId, req.body);

    if (!protocol) {
      throw new NotFoundError('Protocol not found');
    }

    res.json({
      success: true,
      data: protocol
    });
  })
);

/**
 * GET /conditions/:conditionId/recommendations
 * Get recommendations for a condition
 */
router.get(
  '/conditions/:conditionId/recommendations',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const recommendations = await protocolService.getRecommendations(conditionId);

    res.json({
      success: true,
      data: recommendations
    });
  })
);

// ============================================
// ALERT ROUTES
// ============================================

/**
 * GET /alerts/:patientId
 * Get alerts for a patient
 */
router.get(
  '/alerts/:patientId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { acknowledged, severity, type, conditionId, limit, skip } = req.query;

    const alerts = await alertService.getAlerts(patientId, {
      acknowledged: acknowledged !== undefined ? acknowledged === 'true' : undefined,
      severity: severity as any,
      type: type as any,
      conditionId: conditionId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  })
);

/**
 * GET /alerts/:patientId/stats
 * Get alert statistics for a patient
 */
router.get(
  '/alerts/:patientId/stats',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const stats = await alertService.getAlertStats(patientId);

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * PUT /alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.put(
  '/alerts/:alertId/acknowledge',
  validate(AcknowledgeAlertSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { alertId } = req.params;
    const alert = await alertService.acknowledgeAlert(alertId, req.body);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    res.json({
      success: true,
      data: alert
    });
  })
);

// ============================================
// REPORT ROUTES
// ============================================

/**
 * GET /reports/:patientId/:conditionId
 * Get report for a condition
 */
router.get(
  '/reports/:patientId/:conditionId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId, conditionId } = req.params;
    const { year, month } = req.query;

    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();
    const reportMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    const report = await reportingService.getMonthlyReport(
      patientId,
      conditionId,
      reportYear,
      reportMonth
    );

    res.json({
      success: true,
      data: report
    });
  })
);

/**
 * GET /reports/:patientId/overview
 * Get overview report for a patient
 */
router.get(
  '/reports/:patientId/overview',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const overview = await reportingService.getPatientOverview(patientId);

    res.json({
      success: true,
      data: overview
    });
  })
);

/**
 * GET /control-score/:patientId
 * Get control score for a patient
 */
router.get(
  '/control-score/:patientId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const controlScore = await reportingService.getControlScore(patientId);

    res.json({
      success: true,
      data: controlScore
    });
  })
);

/**
 * GET /conditions/:conditionId/summary
 * Get condition summary
 */
router.get(
  '/conditions/:conditionId/summary',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { conditionId } = req.params;
    const summary = await chronicCareService.getConditionSummary(conditionId);

    if (!summary) {
      throw new NotFoundError('Condition not found');
    }

    res.json({
      success: true,
      data: summary
    });
  })
);

export default router;
