/**
 * A/B Testing
 *
 * Test subject lines, email content, send times
 * Track performance and statistical significance
 */

const { v4: uuidv4 } = require('uuid');
const math = require('mathjs');

// In-memory storage
const experiments = new Map();
const variants = new Map();
const results = new Map();

/**
 * Create experiment
 */
function createExperiment(data) {
  const experiment = {
    id: uuidv4(),
    name: data.name,
    type: data.type || 'subject_line', // subject_line, email_content, send_time, cta
    status: 'draft', // draft, running, paused, completed
    hypothesis: data.hypothesis || '',
    metric: data.metric || 'open_rate', // open_rate, click_rate, reply_rate, conversion
    variants: [],
    settings: {
      trafficSplit: data.trafficSplit || [50, 50], // percentage for each variant
      minSampleSize: data.minSampleSize || 100,
      confidenceLevel: data.confidenceLevel || 0.95,
      maxDuration: data.maxDuration || 7 // days
    },
    stats: {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalConverted: 0
    },
    winner: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString()
  };

  // Create variants
  const variantData = data.variants || [
    { name: 'Control', content: data.control },
    { name: 'Variant A', content: data.variantA }
  ];

  variantData.forEach((v, index) => {
    const variant = {
      id: uuidv4(),
      experimentId: experiment.id,
      name: v.name || `Variant ${index + 1}`,
      content: v.content,
      trafficPercentage: data.trafficSplit?.[index] || (100 / variantData.length),
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        replied: 0
      },
      isControl: index === 0
    };

    experiment.variants.push(variant);
    variants.set(variant.id, variant);
  });

  experiments.set(experiment.id, experiment);
  return experiment;
}

/**
 * Start experiment
 */
function startExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;

  experiment.status = 'running';
  experiment.startedAt = new Date().toISOString();

  return experiment;
}

/**
 * Pause experiment
 */
function pauseExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;

  experiment.status = 'paused';
  return experiment;
}

/**
 * Get variant for sending
 */
function getVariant(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment || experiment.status !== 'running') return null;

  // Weighted random selection
  const rand = Math.random() * 100;
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += variant.trafficPercentage;
    if (rand <= cumulative) {
      variant.stats.sent++;
      experiment.stats.totalSent++;
      return variant;
    }
  }

  return experiment.variants[0];
}

/**
 * Record result for variant
 */
function recordResult(variantId, resultType) {
  const variant = variants.get(variantId);
  if (!variant) return null;

  switch (resultType) {
    case 'opened':
      variant.stats.opened++;
      break;
    case 'clicked':
      variant.stats.clicked++;
      break;
    case 'converted':
      variant.stats.converted++;
      break;
    case 'replied':
      variant.stats.replied++;
      break;
  }

  // Update experiment stats
  const experiment = experiments.get(variant.experimentId);
  if (experiment) {
    experiment.stats.totalOpened += resultType === 'opened' ? 1 : 0;
    experiment.stats.totalClicked += resultType === 'clicked' ? 1 : 0;
    experiment.stats.totalConverted += resultType === 'converted' ? 1 : 0;
  }

  return variant;
}

/**
 * Analyze experiment results
 */
function analyzeExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;

  const analysis = {
    experimentId,
    status: experiment.status,
    variants: [],
    winner: null,
    isSignificant: false,
    confidence: 0,
    pValue: null
  };

  let controlVariant = null;
  let bestVariant = null;
  let bestScore = -1;

  for (const variant of experiment.variants) {
    const stats = variant.stats;
    const sent = stats.sent || 1;

    // Calculate rates
    const rates = {
      openRate: (stats.opened / sent) * 100,
      clickRate: (stats.clicked / sent) * 100,
      replyRate: (stats.replied / sent) * 100,
      conversionRate: (stats.converted / sent) * 100
    };

    const variantAnalysis = {
      variantId: variant.id,
      name: variant.name,
      sent: stats.sent,
      opened: stats.opened,
      clicked: stats.clicked,
      converted: stats.converted,
      rates,
      lift: 0 // compared to control
    };

    // Calculate lift vs control
    if (variant.isControl) {
      controlVariant = variantAnalysis;
    } else if (controlVariant) {
      const metric = rates[experiment.metric.replace('_rate', 'Rate')] || rates.openRate;
      const controlMetric = controlVariant.rates[experiment.metric.replace('_rate', 'Rate')] || controlVariant.rates.openRate;
      variantAnalysis.lift = controlMetric ? ((metric - controlMetric) / controlMetric) * 100 : 0;
    }

    // Track best
    const score = rates[experiment.metric.replace('_rate', 'Rate')] || rates.openRate;
    if (score > bestScore) {
      bestScore = score;
      bestVariant = variantAnalysis;
    }

    analysis.variants.push(variantAnalysis);
  }

  // Calculate statistical significance
  if (controlVariant && bestVariant && !bestVariant.isControl) {
    const result = calculateStatisticalSignificance(
      controlVariant.sent,
      controlVariant.rates[experiment.metric.replace('_rate', 'Rate')] || controlVariant.rates.openRate,
      bestVariant.sent,
      bestVariant.rates[experiment.metric.replace('_rate', 'Rate')] || bestVariant.rates.openRate
    );

    analysis.isSignificant = result.isSignificant;
    analysis.confidence = result.confidence;
    analysis.pValue = result.pValue;

    if (result.isSignificant && bestVariant.lift > 0) {
      analysis.winner = {
        variantId: bestVariant.variantId,
        name: bestVariant.name,
        lift: bestVariant.lift,
        confidence: result.confidence
      };
      experiment.winner = bestVariant.variantId;
    }
  }

  // Check if experiment should end
  const totalSent = experiment.stats.totalSent;
  const minSample = experiment.settings.minSampleSize;
  const maxDuration = experiment.settings.maxDuration;

  if (totalSent >= minSample * experiment.variants.length) {
    const daysRunning = experiment.startedAt
      ? Math.floor((Date.now() - new Date(experiment.startedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysRunning >= maxDuration || analysis.winner) {
      experiment.status = 'completed';
      experiment.completedAt = new Date().toISOString();
    }
  }

  return analysis;
}

/**
 * Calculate statistical significance (z-test for proportions)
 */
function calculateStatisticalSignificance(n1, p1, n2, p2) {
  // Pooled proportion
  const pPooled = (n1 * p1 + n2 * p2) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  // Z-score
  const z = se > 0 ? Math.abs(p1 - p2) / se : 0;

  // P-value approximation (two-tailed)
  const pValue = 2 * (1 - normalCDF(z));

  // Confidence level
  const confidence = ((1 - pValue) * 100).toFixed(2) + '%';

  // Significant if p < 0.05 (95% confidence)
  const isSignificant = pValue < 0.05;

  return { z, pValue, confidence, isSignificant };
}

/**
 * Normal CDF approximation
 */
function normalCDF(z) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Get experiment details
 */
function getExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;

  return {
    ...experiment,
    analysis: analyzeExperiment(experimentId)
  };
}

/**
 * List experiments
 */
function listExperiments(filters = {}) {
  let results = Array.from(experiments.values());

  if (filters.status) {
    results = results.filter(e => e.status === filters.status);
  }
  if (filters.type) {
    results = results.filter(e => e.type === filters.type);
  }

  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Archive experiment
 */
function archiveExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;

  experiment.status = 'archived';
  return experiment;
}

/**
 * Generate subject line variants
 */
function generateSubjectVariants(baseSubject, count = 3) {
  const variations = [
    { prefix: '', suffix: '' },
    { prefix: 'Re: ', suffix: '' },
    { prefix: '', suffix: ' - Quick question' },
    { prefix: 'Quick question: ', suffix: '' },
    { prefix: '', suffix: ' ⏰' },
    { prefix: '🚀 ', suffix: '' },
    { prefix: '', suffix: ' (important)' }
  ];

  const variants = [];
  const selected = variations.slice(0, count);

  for (const v of selected) {
    variants.push({
      name: `Variant: ${v.prefix || ''}${v.suffix || ''}`,
      content: `${v.prefix}${baseSubject}${v.suffix}`
    });
  }

  return variants;
}

/**
 * Generate email content variants
 */
function generateEmailVariants(baseContent, count = 3) {
  const variations = [
    { type: 'short', description: 'Short & direct' },
    { type: 'story', description: 'Story-based' },
    { type: 'question', description: 'Question-based opener' }
  ];

  const variants = [];

  for (let i = 0; i < Math.min(count, variations.length); i++) {
    variants.push({
      name: `Variant: ${variations[i].description}`,
      content: baseContent,
      variationType: variations[i].type
    });
  }

  return variants;
}

/**
 * Get test recommendations
 */
function getRecommendations(experimentId) {
  const analysis = analyzeExperiment(experimentId);
  if (!analysis) return null;

  const recommendations = [];

  if (analysis.winner) {
    recommendations.push({
      type: 'winner',
      message: `Variant "${analysis.winner.name}" is the winner with ${analysis.winner.lift.toFixed(1)}% lift and ${analysis.winner.confidence} confidence.`
    });
  }

  if (!analysis.isSignificant && analysis.variants[0]?.sent > 100) {
    recommendations.push({
      type: 'continue',
      message: 'Results are not statistically significant yet. Continue running the experiment to reach significance.'
    });
  }

  for (const variant of analysis.variants) {
    if (variant.sent < 50) {
      recommendations.push({
        type: 'sample_size',
        message: `Variant "${variant.name}" needs more data (${variant.sent} sent, need ~${50 - variant.sent} more).`
      });
    }
  }

  return {
    experimentId,
    hasWinner: !!analysis.winner,
    recommendations
  };
}

module.exports = {
  // Experiment CRUD
  createExperiment,
  startExperiment,
  pauseExperiment,
  getExperiment,
  listExperiments,
  archiveExperiment,

  // Sending
  getVariant,
  recordResult,

  // Analysis
  analyzeExperiment,
  getRecommendations,

  // Generators
  generateSubjectVariants,
  generateEmailVariants,

  // Stats
  calculateStatisticalSignificance
};