/**
 * REZ Business AI - Reinforcement Learning
 * Self-improving commerce AI
 */

import { randomInt } from 'crypto';

interface Experience {
  state: State;
  action: string;
  reward: number;
  nextState: State;
}

interface State {
  weather?: string;
  dayOfWeek?: string;
  timeOfDay?: string;
  demand?: number;
  inventory?: number;
  competitors?: number;
}

interface CampaignResult {
  campaignId: string;
  revenue: number;
  customers: number;
  roi: number;
  timestamp: number;
}

class ReinforcementLearner {
  private qTable: Map<string, Map<string, number>> = new Map();
  private epsilon = 0.1;
  private learningRate = 0.1;
  private discountFactor = 0.9;

  // Learn from campaign result
  async learn(campaignId: string, result: CampaignResult): Promise<void> {
    const state = this.extractState(result);
    const action = campaignId;
    const reward = result.roi;

    const currentQ = this.getQ(state, action);
    const nextBestQ = this.getMaxQ(state);
    const newQ = currentQ + this.learningRate * (reward + this.discountFactor * nextBestQ - currentQ);
    this.setQ(state, action, newQ);
  }

  // Predict best action
  predictBestAction(state: State): string {
    const actions = this.qTable.get(this.stateKey(state));
    if (!actions) return 'weekend_rush';

    let bestAction = 'weekend_rush';
    let bestQ = -Infinity;

    for (const [action, q] of actions) {
      if (q > bestQ) {
        bestQ = q;
        bestAction = action;
      }
    }

    return bestAction;
  }

  // Explore new action
  explore(): string {
    const campaigns = ['weekend_rush', 'happy_hour', 'win_back', 'festival_boost', 'rainy_day'];
    return campaigns[randomInt(0, campaigns.length)];
  }

  private stateKey(state: State): string {
    return `${state.weather || 'unknown'}-${state.dayOfWeek || 'unknown'}`;
  }

  private getQ(state: State, action: string): number {
    const stateActions = this.qTable.get(this.stateKey(state));
    return stateActions?.get(action) || 0;
  }

  private setQ(state: State, action: string, value: number): void {
    const key = this.stateKey(state);
    if (!this.qTable.has(key)) {
      this.qTable.set(key, new Map());
    }
    this.qTable.get(key)!.set(action, value);
  }

  private getMaxQ(state: State): number {
    const actions = this.qTable.get(this.stateKey(state));
    if (!actions) return 0;
    return Math.max(...actions.values());
  }

  private extractState(result: CampaignResult): State {
    return {
      timeOfDay: new Date(result.timestamp).getHours().toString(),
      demand: result.revenue > 10000 ? 'high' : 'normal',
    };
  }

  // Get learnings
  getLearnings(): { action: string; reason: string }[] {
    const learnings: { action: string; reason: string }[] = [];
    for (const [state, actions] of this.qTable) {
      let bestAction = '';
      let bestQ = -Infinity;
      for (const [action, q] of actions) {
        if (q > bestQ) {
          bestQ = q;
          bestAction = action;
        }
      }
      if (bestAction) {
        learnings.push({ action: bestAction, reason: `Q=${bestQ.toFixed(2)} for ${state}` });
      }
    }
    return learnings;
  }
}

export const rlLearner = new ReinforcementLearner();

// Self-optimizing campaigns
export class CampaignOptimizer {
  private results: Map<string, CampaignResult[]> = new Map();

  async recordResult(campaignId: string, result: CampaignResult): Promise<void> {
    const existing = this.results.get(campaignId) || [];
    existing.push(result);
    this.results.set(campaignId, existing);

    // Learn
    await rlLearner.learn(campaignId, result);
  }

  async getBestCampaign(state: State): Promise<string> {
    // Use RL to predict
    return rlLearner.predictBestAction(state);
  }

  async getCampaignStats(campaignId: string): Promise<{ avg: number; trend: 'up' | 'down' | 'stable' }> {
    const results = this.results.get(campaignId) || [];
    if (results.length === 0) return { avg: 0, trend: 'stable' };

    const avg = results.reduce((sum, r) => sum + r.roi, 0) / results.length;
    const trend = results.length > 1 && results[0].roi > results[results.length - 1].roi ? 'up' : 'down';
    return { avg, trend };
  }
}

export const campaignOptimizer = new CampaignOptimizer();
