/**
 * Middleware Index
 * Export all middleware
 */

export * from './auth';
export * from './metrics';
export * from './validation';

export { authenticate, optionalAuth, requireRole, requirePermission, adminOnly, advertiserAccess } from './auth';
export { metricsMiddleware, metricsHandler, updateGauges, recordFeedCreated, recordCampaignCreated, recordAdRendered, recordImpression, recordClick, recordConversion } from './metrics';
export { validateBody, validateQuery, validateParams, createValidator, validateContentType, validateProductArray } from './validation';

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  adminOnly,
  advertiserAccess,
  metricsMiddleware,
  metricsHandler,
  validateBody,
  validateQuery,
  validateParams,
  createValidator,
  validateContentType,
  validateProductArray,
};