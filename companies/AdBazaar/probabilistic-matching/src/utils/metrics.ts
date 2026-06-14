import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics
collectDefaultMetrics({ register, prefix: 'probabilistic_matching_' });

// Match counters
export const matchRequestsTotal = new Counter({
  name: 'probabilistic_match_requests_total',
  help: 'Total number of probabilistic match requests',
  labelNames: ['type', 'status'],
  registers: [register]
});

export const batchMatchRequestsTotal = new Counter({
  name: 'batch_match_requests_total',
  help: 'Total number of batch match requests',
  labelNames: ['batch_size', 'status'],
  registers: [register]
});

export const fingerprintOperationsTotal = new Counter({
  name: 'fingerprint_operations_total',
  help: 'Total number of fingerprint operations',
  labelNames: ['operation', 'status'],
  registers: [register]
});

export const graphOperationsTotal = new Counter({
  name: 'graph_operations_total',
  help: 'Total number of graph operations',
  labelNames: ['operation', 'status'],
  registers: [register]
});

export const mergeOperationsTotal = new Counter({
  name: 'merge_operations_total',
  help: 'Total number of merge operations',
  labelNames: ['status'],
  registers: [register]
});

// Match duration histogram
export const matchDuration = new Histogram({
  name: 'match_duration_seconds',
  help: 'Duration of match operations in seconds',
  labelNames: ['type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// Confidence score histogram
export const confidenceScore = new Histogram({
  name: 'confidence_score_distribution',
  help: 'Distribution of confidence scores',
  labelNames: ['bucket'],
  buckets: [0, 20, 40, 60, 80, 100],
  registers: [register]
});

// Probability histogram
export const probabilityDistribution = new Histogram({
  name: 'match_probability_distribution',
  help: 'Distribution of match probabilities',
  labelNames: ['bucket'],
  buckets: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
  registers: [register]
});

// Active gauges
export const activeMatchesGauge = new Gauge({
  name: 'active_matches_current',
  help: 'Current number of active matches',
  registers: [register]
});

export const pendingMatchesGauge = new Gauge({
  name: 'pending_matches_current',
  help: 'Current number of pending matches',
  registers: [register]
});

export const confirmedMatchesGauge = new Gauge({
  name: 'confirmed_matches_current',
  help: 'Current number of confirmed matches',
  registers: [register]
});

export const graphNodesGauge = new Gauge({
  name: 'graph_nodes_total',
  help: 'Total number of nodes in all graphs',
  registers: [register]
});

export const graphEdgesGauge = new Gauge({
  name: 'graph_edges_total',
  help: 'Total number of edges in all graphs',
  registers: [register]
});

export const fingerprintCacheGauge = new Gauge({
  name: 'fingerprint_cache_size',
  help: 'Current size of fingerprint cache',
  registers: [register]
});

// Accuracy metrics
export const matchAccuracyGauge = new Gauge({
  name: 'match_accuracy_score',
  help: 'Current match accuracy score (F1)',
  registers: [register]
});

export const matchPrecisionGauge = new Gauge({
  name: 'match_precision_score',
  help: 'Current match precision score',
  registers: [register]
});

export const matchRecallGauge = new Gauge({
  name: 'match_recall_score',
  help: 'Current match recall score',
  registers: [register]
});

// Processing time
export const processingTimeGauge = new Gauge({
  name: 'avg_processing_time_ms',
  help: 'Average processing time in milliseconds',
  registers: [register]
});

// Initialize metrics with current values
async function initializeMetrics(): Promise<void> {
  try {
    // Import models lazily to avoid circular dependencies
    const { ProbMatch, MatchGraph, MatchStats } = await import('../models');

    // Set active matches count
    const totalMatches = await ProbMatch.countDocuments({ status: { $ne: 'merged' } });
    activeMatchesGauge.set(totalMatches);

    const pendingMatches = await ProbMatch.countDocuments({ status: 'pending' });
    pendingMatchesGauge.set(pendingMatches);

    const confirmedMatches = await ProbMatch.countDocuments({ status: 'confirmed' });
    confirmedMatchesGauge.set(confirmedMatches);

    // Set graph metrics
    const graphStats = await MatchGraph.aggregate([
      {
        $group: {
          _id: null,
          totalNodes: { $sum: { $size: '$nodes' } },
          totalEdges: { $sum: { $size: '$edges' } }
        }
      }
    ]);

    if (graphStats.length > 0) {
      graphNodesGauge.set(graphStats[0].totalNodes);
      graphEdgesGauge.set(graphStats[0].totalEdges);
    }

    // Set accuracy metrics
    const latestStats = await MatchStats.getLatestStats();
    if (latestStats) {
      matchAccuracyGauge.set(latestStats.accuracy.f1Score * 100);
      matchPrecisionGauge.set(latestStats.accuracy.precision * 100);
      matchRecallGauge.set(latestStats.accuracy.recall * 100);
      processingTimeGauge.set(latestStats.processingTimeMs.avg);
    }
  } catch (error) {
    logger.error('Failed to initialize metrics:', error);
  }
}

// Export registry for use in /metrics endpoint
export { register };

export { initializeMetrics };
