import client, { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Create a custom registry
export const metricsRegistry = new Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register: metricsRegistry });

// ============ HTTP Metrics ============

export const httpRequestDuration = new Histogram({
  name: 'business_outcome_engine_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: 'business_outcome_engine_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

// ============ Prediction Metrics ============

export const predictionTotal = new Counter({
  name: 'business_outcome_engine_predictions_total',
  help: 'Total number of predictions made',
  labelNames: ['outcome_type', 'model', 'status'],
  registers: [metricsRegistry],
});

export const predictionConfidence = new Histogram({
  name: 'business_outcome_engine_prediction_confidence',
  help: 'Distribution of prediction confidence scores',
  labelNames: ['outcome_type'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [metricsRegistry],
});

export const predictionDuration = new Histogram({
  name: 'business_outcome_engine_prediction_duration_seconds',
  help: 'Duration of prediction calculations in seconds',
  labelNames: ['outcome_type', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

export const predictionError = new Counter({
  name: 'business_outcome_engine_prediction_errors_total',
  help: 'Total number of prediction errors',
  labelNames: ['outcome_type', 'error_type'],
  registers: [metricsRegistry],
});

// ============ Intervention Metrics ============

export const interventionTotal = new Counter({
  name: 'business_outcome_engine_interventions_total',
  help: 'Total number of interventions',
  labelNames: ['type', 'status'],
  registers: [metricsRegistry],
});

export const interventionExpectedImpact = new Histogram({
  name: 'business_outcome_engine_intervention_expected_impact',
  help: 'Distribution of expected intervention impacts',
  labelNames: ['type'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const interventionActualImpact = new Histogram({
  name: 'business_outcome_engine_intervention_actual_impact',
  help: 'Distribution of actual intervention impacts',
  labelNames: ['type', 'achieved'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const interventionROI = new Histogram({
  name: 'business_outcome_engine_intervention_roi',
  help: 'Distribution of intervention ROI',
  labelNames: ['type'],
  buckets: [-1, -0.5, 0, 0.5, 1, 2, 5, 10, 25],
  registers: [metricsRegistry],
});

// ============ Outcome Tracking Metrics ============

export const outcomeEventTotal = new Counter({
  name: 'business_outcome_engine_outcome_events_total',
  help: 'Total number of outcome tracking events',
  labelNames: ['outcome_type', 'source'],
  registers: [metricsRegistry],
});

export const outcomeValue = new Gauge({
  name: 'business_outcome_engine_outcome_value',
  help: 'Current outcome values',
  labelNames: ['business_id', 'outcome_type'],
  registers: [metricsRegistry],
});

export const outcomeProgress = new Gauge({
  name: 'business_outcome_engine_outcome_progress_percent',
  help: 'Progress towards outcome goals (0-100)',
  labelNames: ['business_id', 'goal_id', 'outcome_type'],
  registers: [metricsRegistry],
});

// ============ Learning Loop Metrics ============

export const learningOutcomeTotal = new Counter({
  name: 'business_outcome_engine_learning_outcomes_total',
  help: 'Total number of learning outcomes recorded',
  labelNames: ['outcome_type', 'model', 'quality'],
  registers: [metricsRegistry],
});

export const predictionErrorPercent = new Histogram({
  name: 'business_outcome_engine_prediction_error_percent',
  help: 'Distribution of prediction error percentages',
  labelNames: ['outcome_type', 'model'],
  buckets: [1, 5, 10, 15, 20, 25, 30, 50, 75, 100],
  registers: [metricsRegistry],
});

export const modelAccuracy = new Gauge({
  name: 'business_outcome_engine_model_accuracy',
  help: 'Model accuracy scores by outcome type',
  labelNames: ['outcome_type', 'model'],
  registers: [metricsRegistry],
});

export const learningUpdateTotal = new Counter({
  name: 'business_outcome_engine_learning_updates_total',
  help: 'Total number of model learning updates',
  labelNames: ['outcome_type', 'status'],
  registers: [metricsRegistry],
});

// ============ Business Goal Metrics ============

export const activeGoalsTotal = new Gauge({
  name: 'business_outcome_engine_active_goals_total',
  help: 'Number of active business goals',
  labelNames: ['outcome_type', 'status'],
  registers: [metricsRegistry],
});

export const goalAchievementRate = new Gauge({
  name: 'business_outcome_engine_goal_achievement_rate',
  help: 'Rate of goal achievement',
  labelNames: ['outcome_type'],
  registers: [metricsRegistry],
});

// ============ Ecosystem Connection Metrics ============

export const ecosystemCallDuration = new Histogram({
  name: 'business_outcome_engine_ecosystem_call_duration_seconds',
  help: 'Duration of calls to ecosystem services',
  labelNames: ['service', 'endpoint', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const ecosystemCallTotal = new Counter({
  name: 'business_outcome_engine_ecosystem_calls_total',
  help: 'Total calls to ecosystem services',
  labelNames: ['service', 'endpoint', 'status'],
  registers: [metricsRegistry],
});

export const ecosystemConnectionStatus = new Gauge({
  name: 'business_outcome_engine_ecosystem_connection_status',
  help: 'Connection status to ecosystem services (1=connected, 0=disconnected)',
  labelNames: ['service'],
  registers: [metricsRegistry],
});

// ============ Database Metrics ============

export const dbOperationDuration = new Histogram({
  name: 'business_outcome_engine_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [metricsRegistry],
});

export const dbConnectionStatus = new Gauge({
  name: 'business_outcome_engine_db_connection_status',
  help: 'MongoDB connection status (1=connected, 0=disconnected)',
  registers: [metricsRegistry],
});

// ============ Helper Functions ============

export const startTimer = (): () => number => {
  const start = process.hrtime.bigint();
  return () => Number(process.hrtime.bigint() - start) / 1e9;
};

export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void => {
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  httpRequestTotal.inc({ method, route, status_code: statusCode });
};

export const recordPrediction = (
  outcomeType: string,
  model: string,
  status: string,
  confidence: number,
  duration: number
): void => {
  predictionTotal.inc({ outcome_type: outcomeType, model, status });
  predictionConfidence.observe({ outcome_type: outcomeType }, confidence);
  predictionDuration.observe({ outcome_type: outcomeType, model }, duration);
};

export const recordIntervention = (
  type: string,
  status: string,
  expectedImpact: number,
  actualImpact?: number,
  achieved?: boolean
): void => {
  interventionTotal.inc({ type, status });
  interventionExpectedImpact.observe({ type }, expectedImpact);
  if (actualImpact !== undefined) {
    interventionActualImpact.observe({ type, achieved: String(achieved) }, actualImpact);
  }
};

export const recordLearningOutcome = (
  outcomeType: string,
  model: string,
  errorPercent: number,
  quality?: string
): void => {
  learningOutcomeTotal.inc({ outcome_type: outcomeType, model, quality: quality || 'unknown' });
  predictionErrorPercent.observe({ outcome_type: outcomeType, model }, errorPercent);
};

export default {
  metricsRegistry,
  httpRequestDuration,
  httpRequestTotal,
  predictionTotal,
  predictionConfidence,
  predictionDuration,
  predictionError,
  interventionTotal,
  interventionExpectedImpact,
  interventionActualImpact,
  interventionROI,
  outcomeEventTotal,
  outcomeValue,
  outcomeProgress,
  learningOutcomeTotal,
  predictionErrorPercent,
  modelAccuracy,
  learningUpdateTotal,
  activeGoalsTotal,
  goalAchievementRate,
  ecosystemCallDuration,
  ecosystemCallTotal,
  ecosystemConnectionStatus,
  dbOperationDuration,
  dbConnectionStatus,
  startTimer,
  recordHttpRequest,
  recordPrediction,
  recordIntervention,
  recordLearningOutcome,
};