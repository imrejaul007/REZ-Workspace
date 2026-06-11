/**
 * Cross-Sell Service - Express Server
 * Identifies and manages cross-sell opportunities across all industries
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'cross-sell-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces (from original service)
// ============================================================================

export type IndustryType = 'waitron' | 'shopflow' | 'staybot' | 'carecode' | 'glamai' | 'fitmind' | 'teammind' | 'ledgerai' | 'fleetiq' | 'propflow' | 'neighborai' | 'learniq' | 'tripmind' | 'franchiseiq' | 'prodflow';

export interface CrossSellOpportunity {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  fromIndustry: IndustryType;
  toIndustry: IndustryType;
  opportunityScore: number;
  status: 'identified' | 'contacted' | 'converted' | 'declined' | 'ignored';
  reason: string;
  suggestedOffer?: string;
  potentialValue: number;
  createdAt: Date;
  updatedAt: Date;
  contactAttempts: number;
  lastContactedAt?: Date;
  notes: string;
}

export interface CrossSellRule {
  id: string;
  fromIndustry: IndustryType;
  toIndustry: IndustryType;
  triggerConditions: TriggerCondition[];
  suggestedOffer: string;
  minimumScore: number;
  active: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface CrossSellAnalysis {
  totalOpportunities: number;
  byIndustryPair: Record<string, number>;
  totalPotentialValue: number;
  averageScore: number;
  conversionRate: number;
  topOpportunities: CrossSellOpportunity[];
}

// Industry relationship map
const INDUSTRY_RELATIONSHIPS: Record<IndustryType, IndustryType[]> = {
  waitron: ['staybot', 'tripmind', 'glamai'],
  shopflow: ['glamai', 'fitmind', 'neighborai'],
  staybot: ['waitron', 'tripmind', 'glamai', 'fitmind'],
  carecode: ['fitmind', 'teammind', 'neighborai'],
  glamai: ['shopflow', 'fitmind', 'staybot'],
  fitmind: ['glamai', 'carecode', 'staybot'],
  teammind: ['carecode', 'neighborai', 'prodflow'],
  ledgerai: ['franchiseiq', 'prodflow', 'fleetiq'],
  fleetiq: ['ledgerai', 'prodflow', 'franchiseiq'],
  propflow: ['staybot', 'neighborai', 'franchiseiq'],
  neighborai: ['propflow', 'teammind', 'learniq'],
  learniq: ['teammind', 'fitmind', 'neighborai'],
  tripmind: ['staybot', 'waitron', 'glamai'],
  franchiseiq: ['ledgerai', 'propflow', 'fleetiq'],
  prodflow: ['ledgerai', 'fleetiq', 'franchiseiq']
};

// ============================================================================
// Service Class
// ============================================================================

class CrossSellService {
  private opportunities: Map<string, CrossSellOpportunity> = new Map();
  private rules: Map<string, CrossSellRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeSampleData();
  }

  private initializeDefaultRules(): void {
    for (const [fromIndustry, toIndustries] of Object.entries(INDUSTRY_RELATIONSHIPS)) {
      for (const toIndustry of toIndustries) {
        const ruleId = `${fromIndustry}-to-${toIndustry}`;
        this.rules.set(ruleId, {
          id: ruleId,
          fromIndustry: fromIndustry as IndustryType,
          toIndustry: toIndustry as IndustryType,
          triggerConditions: [
            { field: 'transactionCount', operator: 'greater_than', value: 2 },
            { field: 'totalSpent', operator: 'greater_than', value: 100 }
          ],
          suggestedOffer: this.generateOffer(fromIndustry as IndustryType, toIndustry as IndustryType),
          minimumScore: 50,
          active: true
        });
      }
    }
  }

  private initializeSampleData(): void {
    const sampleOpportunities: CrossSellOpportunity[] = [
      {
        id: uuidv4(),
        customerId: 'cust-001',
        customerEmail: 'john@example.com',
        customerName: 'John Smith',
        fromIndustry: 'waitron',
        toIndustry: 'staybot',
        opportunityScore: 85,
        status: 'identified',
        reason: 'Restaurant customer interested in hotel services',
        suggestedOffer: 'Book a table and get 20% off hotel stay',
        potentialValue: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
        contactAttempts: 0,
        notes: 'High-value prospect'
      },
      {
        id: uuidv4(),
        customerId: 'cust-002',
        customerEmail: 'jane@example.com',
        customerName: 'Jane Doe',
        fromIndustry: 'shopflow',
        toIndustry: 'glamai',
        opportunityScore: 78,
        status: 'contacted',
        reason: 'Retail customer who may enjoy beauty services',
        suggestedOffer: 'Purchase beauty products and get a styling session free',
        potentialValue: 350,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        contactAttempts: 1,
        lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Follow-up needed'
      }
    ];

    sampleOpportunities.forEach(opp => this.opportunities.set(opp.id, opp));
  }

  private generateOffer(from: IndustryType, to: IndustryType): string {
    const offers: Record<string, string> = {
      'waitron-staybot': 'Book a table at our restaurant and get 20% off your hotel stay',
      'waitron-tripmind': 'Explore our travel packages and enjoy a complimentary dining experience',
      'waitron-glamai': 'Get pampered at our salon with a free appetizer at our restaurant',
      'shopflow-glamai': 'Purchase beauty products and get a styling session free',
      'shopflow-fitmind': 'Buy fitness gear and get a complimentary gym session',
      'staybot-waitron': 'Enjoy fine dining with a complimentary room upgrade',
      'staybot-glamai': 'Relax at our spa with a complimentary hotel night',
      'glamai-shopflow': 'Get a new look and shop our exclusive beauty collection',
      'glamai-fitmind': 'Complete your wellness routine with fitness and beauty packages',
      'fitmind-glamai': 'Look your best while getting fit with our combined packages',
      'tripmind-staybot': 'Book your dream vacation and get exclusive hotel deals',
      'ledgerai-franchiseiq': 'Grow your franchise with integrated accounting solutions',
      'fleetiq-ledgerai': 'Optimize your fleet costs with smart accounting'
    };

    const key = `${from}-${to}`;
    return offers[key] || `Special offer: Try our ${to} services today!`;
  }

  identifyOpportunitiesForCustomer(customerId: string, customerData: any): CrossSellOpportunity[] {
    const opportunities: CrossSellOpportunity[] = [];
    const industries = customerData.industries || ['waitron'];

    for (const currentIndustry of industries) {
      const relatedIndustries = INDUSTRY_RELATIONSHIPS[currentIndustry as IndustryType] || [];

      for (const targetIndustry of relatedIndustries) {
        if (industries.includes(targetIndustry)) continue;

        const score = this.calculateOpportunityScore(customerData, currentIndustry, targetIndustry as IndustryType);

        if (score >= 50) {
          const opportunity: CrossSellOpportunity = {
            id: uuidv4(),
            customerId,
            customerEmail: customerData.email || '',
            customerName: customerData.name || 'Unknown',
            fromIndustry: currentIndustry as IndustryType,
            toIndustry: targetIndustry as IndustryType,
            opportunityScore: score,
            status: 'identified',
            reason: `Customer uses ${currentIndustry} and may benefit from ${targetIndustry}`,
            suggestedOffer: this.rules.get(`${currentIndustry}-${targetIndustry}`)?.suggestedOffer,
            potentialValue: (customerData.totalSpent || 100) * 1.5,
            createdAt: new Date(),
            updatedAt: new Date(),
            contactAttempts: 0,
            notes: ''
          };

          this.opportunities.set(opportunity.id, opportunity);
          opportunities.push(opportunity);
        }
      }
    }

    return opportunities;
  }

  private calculateOpportunityScore(customer: any, fromIndustry: IndustryType, toIndustry: IndustryType): number {
    let score = 30;

    if (customer.email) score += 10;
    if (customer.phone) score += 10;
    if (customer.totalLifetimeValue > 500) score += 15;
    if (customer.transactionCount > 5) score += 15;
    if (customer.averageOrderValue > 100) score += 10;
    if (customer.industries?.length > 1) score += 10;

    const relationships = INDUSTRY_RELATIONSHIPS[fromIndustry];
    const position = relationships?.indexOf(toIndustry);
    if (position !== undefined && position >= 0) {
      score += (relationships.length - position) * 3;
    }

    return Math.min(100, score);
  }

  getOpportunity(id: string): CrossSellOpportunity | undefined {
    return this.opportunities.get(id);
  }

  getOpportunities(filter?: {
    status?: CrossSellOpportunity['status'];
    fromIndustry?: IndustryType;
    toIndustry?: IndustryType;
    minScore?: number;
    customerId?: string;
  }): CrossSellOpportunity[] {
    let opportunities = Array.from(this.opportunities.values());

    if (filter) {
      if (filter.status) opportunities = opportunities.filter(o => o.status === filter.status);
      if (filter.fromIndustry) opportunities = opportunities.filter(o => o.fromIndustry === filter.fromIndustry);
      if (filter.toIndustry) opportunities = opportunities.filter(o => o.toIndustry === filter.toIndustry);
      if (filter.minScore) opportunities = opportunities.filter(o => o.opportunityScore >= filter.minScore!);
      if (filter.customerId) opportunities = opportunities.filter(o => o.customerId === filter.customerId);
    }

    return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  updateOpportunity(id: string, updates: Partial<CrossSellOpportunity>): CrossSellOpportunity | undefined {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;

    const updated: CrossSellOpportunity = {
      ...opportunity,
      ...updates,
      id: opportunity.id,
      customerId: opportunity.customerId,
      createdAt: opportunity.createdAt,
      updatedAt: new Date()
    };

    this.opportunities.set(id, updated);
    return updated;
  }

  markContacted(id: string): CrossSellOpportunity | undefined {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;

    return this.updateOpportunity(id, {
      status: 'contacted',
      contactAttempts: opportunity.contactAttempts + 1,
      lastContactedAt: new Date()
    });
  }

  markConverted(id: string): CrossSellOpportunity | undefined {
    return this.updateOpportunity(id, { status: 'converted' });
  }

  markDeclined(id: string, reason?: string): CrossSellOpportunity | undefined {
    return this.updateOpportunity(id, { status: 'declined', notes: reason || '' });
  }

  markIgnored(id: string): CrossSellOpportunity | undefined {
    return this.updateOpportunity(id, { status: 'ignored' });
  }

  getAnalysis(): CrossSellAnalysis {
    const opportunities = this.getOpportunities();

    const byIndustryPair: Record<string, number> = {};
    let totalPotentialValue = 0;
    let totalScore = 0;
    let converted = 0;

    for (const opp of opportunities) {
      const pair = `${opp.fromIndustry}-${opp.toIndustry}`;
      byIndustryPair[pair] = (byIndustryPair[pair] || 0) + 1;
      totalPotentialValue += opp.potentialValue;
      totalScore += opp.opportunityScore;
      if (opp.status === 'converted') converted++;
    }

    return {
      totalOpportunities: opportunities.length,
      byIndustryPair,
      totalPotentialValue,
      averageScore: opportunities.length > 0 ? totalScore / opportunities.length : 0,
      conversionRate: opportunities.length > 0 ? converted / opportunities.length : 0,
      topOpportunities: opportunities.slice(0, 10)
    };
  }

  getCampaignRecommendations(): Array<{
    fromIndustry: IndustryType;
    toIndustry: IndustryType;
    opportunityCount: number;
    totalPotential: number;
    recommendedAction: string;
  }> {
    const analysis = this.getAnalysis();
    const recommendations: Array<{
      fromIndustry: IndustryType;
      toIndustry: IndustryType;
      opportunityCount: number;
      totalPotential: number;
      recommendedAction: string;
    }> = [];

    for (const [pair, count] of Object.entries(analysis.byIndustryPair)) {
      const [from, to] = pair.split('-');
      const pairOpps = this.getOpportunities({
        fromIndustry: from as IndustryType,
        toIndustry: to as IndustryType,
        minScore: 70
      });

      const totalPotential = pairOpps.reduce((sum, o) => sum + o.potentialValue, 0);

      if (pairOpps.length > 0) {
        recommendations.push({
          fromIndustry: from as IndustryType,
          toIndustry: to as IndustryType,
          opportunityCount: pairOpps.length,
          totalPotential,
          recommendedAction: `Launch targeted campaign for ${pairOpps.length} high-value customers`
        });
      }
    }

    return recommendations.sort((a, b) => b.totalPotential - a.totalPotential);
  }

  getRules(): CrossSellRule[] {
    return Array.from(this.rules.values());
  }

  updateRule(id: string, updates: Partial<CrossSellRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, ...updates });
    }
  }

  deleteOpportunity(id: string): boolean {
    return this.opportunities.delete(id);
  }
}

const crossSellService = new CrossSellService();

// ============================================================================
// API Routes
// ============================================================================

/**
 * Create opportunity for customer
 */
app.post('/api/opportunities', (req: Request, res: Response) => {
  const { customerId, customerData } = req.body;

  if (!customerId || !customerData) {
    res.status(400).json({ error: 'Customer ID and customer data are required' });
    return;
  }

  const opportunities = crossSellService.identifyOpportunitiesForCustomer(customerId, customerData);
  logger.info(`Identified ${opportunities.length} opportunities for customer ${customerId}`);
  res.status(201).json(opportunities);
});

/**
 * Get all opportunities
 */
app.get('/api/opportunities', (req: Request, res: Response) => {
  const { status, fromIndustry, toIndustry, minScore, customerId } = req.query;

  const opportunities = crossSellService.getOpportunities({
    status: status as any,
    fromIndustry: fromIndustry as any,
    toIndustry: toIndustry as any,
    minScore: minScore ? parseInt(minScore as string) : undefined,
    customerId: customerId as string
  });

  res.json(opportunities);
});

/**
 * Get opportunity by ID
 */
app.get('/api/opportunities/:id', (req: Request, res: Response) => {
  const opportunity = crossSellService.getOpportunity(req.params.id);
  if (!opportunity) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.json(opportunity);
});

/**
 * Update opportunity
 */
app.put('/api/opportunities/:id', (req: Request, res: Response) => {
  const opportunity = crossSellService.updateOpportunity(req.params.id, req.body);
  if (!opportunity) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.json(opportunity);
});

/**
 * Mark opportunity as contacted
 */
app.post('/api/opportunities/:id/contact', (req: Request, res: Response) => {
  const opportunity = crossSellService.markContacted(req.params.id);
  if (!opportunity) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.json(opportunity);
});

/**
 * Mark opportunity as converted
 */
app.post('/api/opportunities/:id/convert', (req: Request, res: Response) => {
  const opportunity = crossSellService.markConverted(req.params.id);
  if (!opportunity) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.json(opportunity);
});

/**
 * Mark opportunity as declined
 */
app.post('/api/opportunities/:id/decline', (req: Request, res: Response) => {
  const { reason } = req.body;
  const opportunity = crossSellService.markDeclined(req.params.id, reason);
  if (!opportunity) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.json(opportunity);
});

/**
 * Mark opportunity as ignored
 */
app.post('/api/opportunities/:id/ignore', (req: Request, res: Response) => {
  const opportunity = crossSellService.markIgnored(req.params.id);
  if (!opportunity) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.json(opportunity);
});

/**
 * Delete opportunity
 */
app.delete('/api/opportunities/:id', (req: Request, res: Response) => {
  const deleted = crossSellService.deleteOpportunity(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Opportunity not found' });
    return;
  }
  res.status(204).send();
});

/**
 * Get cross-sell analysis
 */
app.get('/api/analysis', (req: Request, res: Response) => {
  res.json(crossSellService.getAnalysis());
});

/**
 * Get campaign recommendations
 */
app.get('/api/recommendations', (req: Request, res: Response) => {
  res.json(crossSellService.getCampaignRecommendations());
});

/**
 * Get all rules
 */
app.get('/api/rules', (req: Request, res: Response) => {
  res.json(crossSellService.getRules());
});

/**
 * Update rule
 */
app.put('/api/rules/:id', (req: Request, res: Response) => {
  crossSellService.updateRule(req.params.id, req.body);
  res.json({ success: true });
});

/**
 * Get industry relationships
 */
app.get('/api/relationships', (req: Request, res: Response) => {
  res.json(INDUSTRY_RELATIONSHIPS);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  const opportunities = Array.from((crossSellService as any).opportunities.values());
  const analysis = crossSellService.getAnalysis();

  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      totalOpportunities: opportunities.length,
      identified: opportunities.filter(o => o.status === 'identified').length,
      contacted: opportunities.filter(o => o.status === 'contacted').length,
      converted: opportunities.filter(o => o.status === 'converted').length,
      totalPotentialValue: analysis.totalPotentialValue,
      conversionRate: analysis.conversionRate
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;
