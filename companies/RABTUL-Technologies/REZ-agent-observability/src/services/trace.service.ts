import { v4 as uuid } from 'uuid';
import { Trace, TraceEvent, Metrics, ExecutionSummary, AlertRule, Span } from '../models/trace';
import logger from '../utils/logger';

// In-memory storage
const traces: Map<string, Trace> = new Map();
const metricsCache: Map<string, Metrics> = new Map();
const alertRules: Map<string, AlertRule> = new Map();

// Default alert rules
const defaultAlerts: AlertRule[] = [
  {
    id: 'high-failure-rate',
    name: 'High Failure Rate',
    description: 'Alert when failure rate exceeds 10%',
    condition: { metric: 'failure_rate', operator: '>', threshold: 10 },
    severity: 'high',
    enabled: true,
    actions: [{ type: 'webhook', target: '/alerts/webhook' }],
  },
  {
    id: 'slow-execution',
    name: 'Slow Execution',
    description: 'Alert when p99 duration exceeds 30 seconds',
    condition: { metric: 'p99_duration', operator: '>', threshold: 30000 },
    severity: 'medium',
    enabled: true,
    actions: [{ type: 'slack', target: '#alerts' }],
  },
];

defaultAlerts.forEach(a => alertRules.set(a.id, a));

export const createTrace = (
  workflowId: string,
  agentId: string,
  nodeId: string,
  name: string,
  input: Record<string, any>,
  options?: {
    traceId?: string;
    parentSpanId?: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }
): Trace => {
  const id = `trace_${uuid()}`;
  const now = new Date().toISOString();
  const traceId = options?.traceId || `trace_${uuid()}`;

  const trace: Trace = {
    id,
    traceId,
    spanId: `span_${uuid()}`,
    parentSpanId: options?.parentSpanId,
    workflowId,
    agentId,
    nodeId,
    name,
    status: 'started',
    startTime: now,
    input,
    metadata: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.AWS_REGION || 'local',
      serviceName: 'REZ-Agent-Observability',
    },
    events: [],
    tags: [],
    userId: options?.userId,
    sessionId: options?.sessionId,
    attributes: options?.metadata || {},
  };

  traces.set(id, trace);
  logger.debug(`Trace created: ${id} for workflow ${workflowId}`);
  return trace;
};

export const updateTrace = (
  id: string,
  updates: Partial<Pick<Trace, 'status' | 'output' | 'error' | 'tags' | 'attributes'>>
): Trace | undefined => {
  const trace = traces.get(id);
  if (!trace) return undefined;

  if (updates.status) trace.status = updates.status;
  if (updates.output) trace.output = updates.output;
  if (updates.error) trace.error = updates.error;
  if (updates.tags) trace.tags = [...new Set([...trace.tags, ...updates.tags])];
  if (updates.attributes) trace.attributes = { ...trace.attributes, ...updates.attributes };

  if (['completed', 'failed', 'cancelled'].includes(trace.status)) {
    trace.endTime = new Date().toISOString();
    trace.duration = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime();
    updateMetrics(trace);
  }

  return trace;
};

export const addTraceEvent = (
  id: string,
  name: string,
  type: 'info' | 'warning' | 'error' | 'debug' = 'info',
  attributes?: Record<string, any>
): Trace | undefined => {
  const trace = traces.get(id);
  if (!trace) return undefined;

  const event: TraceEvent = {
    id: `event_${uuid()}`,
    timestamp: new Date().toISOString(),
    name,
    type,
    attributes,
  };

  trace.events.push(event);
  return trace;
};

export const completeTrace = (id: string, output: Record<string, any>): Trace | undefined => {
  return updateTrace(id, { status: 'completed', output });
};

export const failTrace = (id: string, error: { message: string; type: string; code?: string; stack?: string }): Trace | undefined => {
  return updateTrace(id, { status: 'failed', error });
};

export const getTrace = (id: string): Trace | undefined => {
  return traces.get(id);
};

export const getTraceByTraceId = (traceId: string): Trace[] => {
  return Array.from(traces.values()).filter(t => t.traceId === traceId);
};

export const getTracesByWorkflow = (workflowId: string, options?: { limit?: number; status?: string }): Trace[] => {
  let results = Array.from(traces.values())
    .filter(t => t.workflowId === workflowId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (options?.status) {
    results = results.filter(t => t.status === options.status);
  }

  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
};

export const getTracesByAgent = (agentId: string, options?: { limit?: number }): Trace[] => {
  let results = Array.from(traces.values())
    .filter(t => t.agentId === agentId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
};

export const searchTraces = (query: {
  workflowId?: string;
  agentId?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}): { traces: Trace[]; total: number } => {
  let results = Array.from(traces.values());

  if (query.workflowId) results = results.filter(t => t.workflowId === query.workflowId);
  if (query.agentId) results = results.filter(t => t.agentId === query.agentId);
  if (query.status) results = results.filter(t => t.status === query.status);
  if (query.tags) results = results.filter(t => query.tags!.some(tag => t.tags.includes(tag)));
  if (query.startTime) results = results.filter(t => t.startTime >= query.startTime!);
  if (query.endTime) results = results.filter(t => t.startTime <= query.endTime!);

  results.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const total = results.length;

  if (query.offset) results = results.slice(query.offset);
  if (query.limit) results = results.slice(0, query.limit);

  return { traces: results, total };
};

const updateMetrics = (trace: Trace): void => {
  const key = `${trace.workflowId}:${trace.agentId}`;
  const existing = metricsCache.get(key) || {
    workflowId: trace.workflowId,
    agentId: trace.agentId,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgDuration: 0,
    p50Duration: 0,
    p95Duration: 0,
    p99Duration: 0,
    lastExecution: trace.startTime,
  };

  existing.totalExecutions++;
  if (trace.status === 'completed') existing.successfulExecutions++;
  if (trace.status === 'failed') existing.failedExecutions++;
  existing.lastExecution = trace.startTime;

  // Calculate durations for percentile
  const agentTraces = Array.from(traces.values())
    .filter(t => t.workflowId === trace.workflowId && t.agentId === trace.agentId && t.duration)
    .map(t => t.duration!);

  if (agentTraces.length > 0) {
    agentTraces.sort((a, b) => a - b);
    existing.avgDuration = agentTraces.reduce((a, b) => a + b, 0) / agentTraces.length;
    existing.p50Duration = agentTraces[Math.floor(agentTraces.length * 0.5)] || 0;
    existing.p95Duration = agentTraces[Math.floor(agentTraces.length * 0.95)] || 0;
    existing.p99Duration = agentTraces[Math.floor(agentTraces.length * 0.99)] || 0;
  }

  metricsCache.set(key, existing);
};

export const getMetrics = (workflowId?: string, agentId?: string): Metrics | Metrics[] | undefined => {
  if (workflowId && agentId) {
    return metricsCache.get(`${workflowId}:${agentId}`);
  }
  if (workflowId) {
    return Array.from(metricsCache.values()).filter(m => m.workflowId === workflowId);
  }
  if (agentId) {
    return Array.from(metricsCache.values()).filter(m => m.agentId === agentId);
  }
  return Array.from(metricsCache.values());
};

export const getExecutionSummary = (): ExecutionSummary => {
  const allTraces = Array.from(traces.values());
  const completedTraces = allTraces.filter(t => t.status === 'completed');
  const failedTraces = allTraces.filter(t => t.status === 'failed');
  const workflows = new Set(allTraces.map(t => t.workflowId));

  // Top errors
  const errorCounts: Record<string, number> = {};
  failedTraces.forEach(t => {
    const errorMsg = t.error?.message || 'Unknown error';
    errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1;
  });
  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));

  // Top slow nodes
  const nodeDurations: Record<string, number[]> = {};
  allTraces.forEach(t => {
    if (t.duration) {
      if (!nodeDurations[t.nodeId]) nodeDurations[t.nodeId] = [];
      nodeDurations[t.nodeId].push(t.duration);
    }
  });
  const topSlowNodes = Object.entries(nodeDurations)
    .map(([nodeId, durations]) => ({
      nodeId,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 5);

  const totalDuration = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0);

  return {
    totalTraces: allTraces.length,
    activeWorkflows: workflows.size,
    totalExecutions: completedTraces.length + failedTraces.length,
    successRate: allTraces.length > 0 ? (completedTraces.length / allTraces.length) * 100 : 0,
    avgDuration: completedTraces.length > 0 ? totalDuration / completedTraces.length : 0,
    topErrors,
    topSlowNodes,
  };
};

export const getAlertRules = (): AlertRule[] => {
  return Array.from(alertRules.values());
};

export const createSpan = (name: string, serviceName: string, operationName: string, parentId?: string): Span => {
  return {
    id: `span_${uuid()}`,
    traceId: `trace_${uuid()}`,
    parentId,
    name,
    serviceName,
    operationName,
    startTime: new Date().toISOString(),
    status: 'unset',
    tags: {},
    logs: [],
    spans: [],
  };
};
