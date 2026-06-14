export interface Trace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  workflowId: string;
  agentId: string;
  nodeId: string;
  name: string;
  status: 'started' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: TraceError;
  metadata: TraceMetadata;
  events: TraceEvent[];
  tags: string[];
  userId?: string;
  sessionId?: string;
  attributes: Record<string, any>;
}

export interface TraceError {
  message: string;
  code?: string;
  stack?: string;
  type: string;
}

export interface TraceMetadata {
  version: string;
  environment: string;
  region?: string;
  serviceName: string;
  agentType?: string;
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  name: string;
  type: 'info' | 'warning' | 'error' | 'debug';
  attributes?: Record<string, any>;
}

export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  serviceName: string;
  operationName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'ok' | 'error' | 'unset';
  tags: Record<string, string>;
  logs: SpanLog[];
  spans: Span[];
}

export interface SpanLog {
  timestamp: string;
  fields: Record<string, any>;
}

export interface Metrics {
  workflowId: string;
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  totalTokens?: number;
  totalCost?: number;
  lastExecution?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: number;
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'pagerduty';
  target: string;
  template?: string;
}

export interface ExecutionSummary {
  totalTraces: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  topErrors: { error: string; count: number }[];
  topSlowNodes: { nodeId: string; avgDuration: number }[];
}
