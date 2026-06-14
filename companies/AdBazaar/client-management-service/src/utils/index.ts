export { logger, logStream } from './logger';
export {
  register,
  metricsMiddleware,
  httpRequestDuration,
  httpRequestTotal,
  clientOperationsTotal,
  contactOperationsTotal,
  campaignOperationsTotal,
  dbOperationDuration,
  cacheHitTotal,
  cacheMissTotal,
  activeClientsGauge,
  totalBudgetGauge,
  totalSpendGauge,
  avgROASGauge,
  errorTotal,
} from './metrics';
export {
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
} from './redis';