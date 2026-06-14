/**
 * Lead Distribution Service
 * Auto-assign leads to brokers based on rules
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger';

const DistributionRuleSchema = new mongoose.Schema({
  name: String,
  priority: Number,
  conditions: {
    countries: [String],
    cities: [String],
    propertyTypes: [String],
    minBudget: Number,
    maxBudget: Number,
    segments: [String],
    sources: [String]
  },
  brokerPool: [{
    brokerId: String,
    weight: Number,
    maxLeads: Number,
    currentLeads: { type: Number, default: 0 }
  }],
  roundRobinIndex: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
});

const DistributionRule = mongoose.model('DistributionRule', DistributionRuleSchema);

export interface LeadInput {
  phone: string;
  country?: string;
  city?: string;
  propertyType?: string;
  budget?: { min: number; max: number };
  segment?: string;
  source?: string;
}

export class DistributionService {

  /**
   * Auto-assign lead to best broker
   */
  async assignLead(lead: LeadInput): Promise<string | null> {
    logger.info('Distributing lead', { phone: lead.phone });

    // Find matching rules
    const rules = await DistributionRule.find({ active: true }).sort({ priority: -1 });

    for (const rule of rules) {
      const matches = this.matchesRule(lead, rule);
      if (!matches) continue;

      // Find available broker in pool
      const broker = await this.selectBroker(rule);
      if (broker) {
        // Update broker's lead count
        await DistributionRule.updateOne(
          { _id: rule._id, 'brokerPool.brokerId': broker },
          { $inc: { 'brokerPool.$.currentLeads': 1 } }
        );

        logger.info('Lead assigned', { phone: lead.phone, brokerId: broker, rule: rule.name });
        return broker;
      }
    }

    // No matching rule - assign to default pool
    return this.assignToDefaultPool();
  }

  /**
   * Check if lead matches rule conditions
   */
  matchesRule(lead: LeadInput, rule: any): boolean {
    const c = rule.conditions;

    if (c.countries?.length && lead.country && !c.countries.includes(lead.country)) return false;
    if (c.cities?.length && lead.city && !c.cities.includes(lead.city)) return false;
    if (c.propertyTypes?.length && lead.propertyType && !c.propertyTypes.includes(lead.propertyType)) return false;
    if (c.segments?.length && lead.segment && !c.segments.includes(lead.segment)) return false;
    if (c.sources?.length && lead.source && !c.sources.includes(lead.source)) return false;

    if (c.minBudget && lead.budget?.min && lead.budget.min < c.minBudget) return false;
    if (c.maxBudget && lead.budget?.max && lead.budget.max > c.maxBudget) return false;

    return true;
  }

  /**
   * Select broker using weighted round-robin
   */
  async selectBroker(rule: any): Promise<string | null> {
    const pool = rule.brokerPool.filter(
      b => !b.maxLeads || b.currentLeads < b.maxLeads
    );

    if (pool.length === 0) return null;

    // Weighted random selection
    const totalWeight = pool.reduce((sum, b) => sum + (b.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const broker of pool) {
      random -= broker.weight || 1;
      if (random <= 0) return broker.brokerId;
    }

    return pool[0].brokerId;
  }

  /**
   * Assign to default pool (round-robin)
   */
  async assignToDefaultPool(): Promise<string | null> {
    const defaultPool = ['broker_001', 'broker_002', 'broker_003'];
    const index = Math.floor(Math.random() * defaultPool.length);
    return defaultPool[index];
  }

  /**
   * Create distribution rule
   */
  async createRule(data: {
    name: string;
    priority: number;
    conditions: any;
    brokerPool: Array<{ brokerId: string; weight: number; maxLeads: number }>;
  }): Promise<void> {
    const rule = new DistributionRule(data);
    await rule.save();
    logger.info('Distribution rule created', { name: data.name });
  }

  /**
   * Get all rules
   */
  async getRules(): Promise<any[]> {
    return DistributionRule.find({}).sort({ priority: -1 });
  }

  /**
   * Reset broker lead counts
   */
  async resetCounts(): Promise<void> {
    await DistributionRule.updateMany(
      {},
      { $set: { 'brokerPool.$[].currentLeads': 0 } }
    );
    logger.info('Broker lead counts reset');
  }

  /**
   * Get distribution stats
   */
  async getStats(): Promise<any> {
    const rules = await DistributionRule.find({});

    const brokerStats: Record<string, { total: number; rules: string[] }> = {};

    for (const rule of rules) {
      for (const broker of rule.brokerPool) {
        if (!brokerStats[broker.brokerId]) {
          brokerStats[broker.brokerId] = { total: 0, rules: [] };
        }
        brokerStats[broker.brokerId].total += broker.currentLeads || 0;
        brokerStats[broker.brokerId].rules.push(rule.name);
      }
    }

    return brokerStats;
  }
}

export const distributionService = new DistributionService();
