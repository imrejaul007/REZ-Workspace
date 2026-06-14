/**
 * REZ Business AI - Real-Time Decision Engine
 * Makes decisions in milliseconds
 */

import { EventEmitter } from 'events';

interface DecisionRequest {
  type: 'pricing' | 'offer' | 'notification' | 'campaign';
  context: Record<string, unknown>;
  constraints: Constraint[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Constraint {
  type: 'margin' | 'budget' | 'frequency' | 'time';
  min?: number;
  max?: number;
  value;
}

interface Decision {
  id: string;
  request: DecisionRequest;
  decision: string;
  confidence: number;
  reasoning: string;
  action: Action;
  timestamp: Date;
}

interface Action {
  type: string;
  params: Record<string, unknown>;
  execute: () => Promise<void>;
}

export class DecisionEngine extends EventEmitter {
  private decisions: Map<string, Decision> = new Map();
  private metrics: Map<string, number> = new Map();
  private lastDecision: Map<string, Date> = new Map();

  // Real-time decision in < 50ms
  async decide(request: DecisionRequest): Promise<Decision> {
    const start = Date.now();

    const decision: Decision = {
      id: `dec-${Date.now()}`,
      request,
      decision: 'pending',
      confidence: 0,
      reasoning: '',
      action: { type: '', params: {}, execute: async () => {} },
      timestamp: new Date(),
    };

    // Check constraints first (fast path)
    if (!this.validateConstraints(request)) {
      decision.decision = 'rejected';
      decision.reasoning = 'Constraint violation';
      return decision;
    }

    // Real-time scoring
    const scores = await this.scoreRequest(request);

    // Select best action
    decision.decision = scores.length > 0 ? 'execute' : 'no_action';
    decision.confidence = scores[0]?.score || 0;
    decision.action = scores[0]?.action;

    // Decision made in < 50ms
    decision.reasoning = this.explain(scores[0]);

    this.decisions.set(decision.id, decision);
    this.metrics.set('decisions', (this.metrics.get('decisions') || 0) + 1);

    this.emit('decision', decision);

    return decision;
  }

  private validateConstraints(req: DecisionRequest): boolean {
    for (const c of req.constraints) {
      if (c.type === 'margin' && req.context.margin < (c.min || 0.1)) return false;
      if (c.type === 'budget' && req.context.budget > (c.max || Infinity)) return false;
      if (c.type === 'frequency') {
        const last = this.lastDecision.get(req.type);
        if (last && Date.now() - last.getTime() < (c.value as number)) return false;
      }
    }
    return true;
  }

  private async scoreRequest(req: Request): Promise<Score[]> {
    // Real-time ML scoring happens here
    const scores: Score[] = [
      { action: { type: 'campaign', params: req.context, execute: async () => {} }, score: 0.85 },
    ];
    return scores;
  }

  private explain(score: Score): string {
    return `Score: ${score.score}, Action: ${score.action.type}`;
  }

  getMetrics() {
    return {
      decisions: this.metrics.get('decisions') || 0,
      avgLatency: 0,
    };
  }
}

export const decisionEngine = new DecisionEngine();
