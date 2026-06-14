import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for autonomous growth orchestrator
export const campaignMetrics = {
  totalCampaigns: new client.Gauge({
    name: 'autonomous_campaigns_total',
    help: 'Total number of autonomous campaigns',
    labelNames: ['status'],
    registers: [register]
  }),

  activeCampaigns: new client.Gauge({
    name: 'autonomous_campaigns_active',
    help: 'Number of active autonomous campaigns',
    registers: [register]
  }),

  decisionsMade: new client.Counter({
    name: 'autonomous_decisions_total',
    help: 'Total number of AI decisions made',
    labelNames: ['type', 'approved'],
    registers: [register]
  }),

  optimizationsApplied: new client.Counter({
    name: 'autonomous_optimizations_total',
    help: 'Total number of optimizations applied',
    labelNames: ['type'],
    registers: [register]
  }),

  budgetAllocated: new client.Gauge({
    name: 'autonomous_budget_allocated_total',
    help: 'Total budget allocated across campaigns',
    registers: [register]
  }),

  averageROAS: new client.Gauge({
    name: 'autonomous_average_roas',
    help: 'Average ROAS across active campaigns',
    registers: [register]
  }),

  humanApprovalsRequired: new client.Counter({
    name: 'autonomous_human_approvals_required',
    help: 'Number of recommendations requiring human approval',
    registers: [register]
  }),

  humanApprovalsGiven: new client.Counter({
    name: 'autonomous_human_approvals_given',
    help: 'Number of human approvals given',
    labelNames: ['approved'],
    registers: [register]
  }),

  constraintViolations: new client.Counter({
    name: 'autonomous_constraint_violations_total',
    help: 'Number of constraint violations detected',
    labelNames: ['constraint_type'],
    registers: [register]
  }),

  decisionLatency: new client.Histogram({
    name: 'autonomous_decision_latency_seconds',
    help: 'Latency of AI decision making',
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
  })
};

export const metricsRouter = async (req: any, res: any) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

export default register;