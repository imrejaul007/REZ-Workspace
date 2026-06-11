/**
 * Unified Lead Service - Express Server
 * Captures and manages leads from all 15 Industry AI products
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'unified-lead-service';

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
// Types and Interfaces
// ============================================================================

export type IndustryType = 'waitron' | 'shopflow' | 'staybot' | 'carecode' | 'glamai' | 'fitmind' | 'teammind' | 'ledgerai' | 'fleetiq' | 'propflow' | 'neighborai' | 'learniq' | 'tripmind' | 'franchiseiq' | 'prodflow';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: IndustryType;
  sourceProductId?: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  industry: IndustryType;
  crossIndustries: IndustryType[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  lastContactedAt?: Date;
  conversionProbability: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface LeadFilter {
  source?: IndustryType;
  status?: Lead['status'];
  minScore?: number;
  maxScore?: number;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface LeadAggregation {
  totalLeads: number;
  byIndustry: Record<IndustryType, number>;
  byStatus: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}

// ============================================================================
// Industry Data
// ============================================================================

const INDUSTRY_PRODUCTS: Record<IndustryType, string> = {
  waitron: 'Waitron',
  shopflow: 'ShopFlow',
  staybot: 'StayBot',
  carecode: 'CareCode',
  glamai: 'GlamAI',
  fitmind: 'FitMind',
  teammind: 'TeamMind',
  ledgerai: 'LedgerAI',
  fleetiq: 'FleetIQ',
  propflow: 'PropFlow',
  neighborai: 'NeighborAI',
  learniq: 'LearnIQ',
  tripmind: 'TripMind',
  franchiseiq: 'FranchiseIQ',
  prodflow: 'ProdFlow'
};

// ============================================================================
// Service Class
// ============================================================================

class UnifiedLeadService {
  private leads: Map<string, Lead> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const sampleLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        source: 'waitron',
        score: 85,
        status: 'qualified',
        industry: 'waitron',
        crossIndustries: ['staybot', 'glamai'],
        notes: 'Interested in restaurant and hotel automation',
        assignedTo: 'sales-001',
        conversionProbability: 0.8,
        tags: ['hot-lead', 'enterprise']
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-0102',
        source: 'shopflow',
        score: 72,
        status: 'contacted',
        industry: 'shopflow',
        crossIndustries: ['glamai'],
        notes: 'Looking for retail and beauty solutions',
        assignedTo: 'sales-002',
        conversionProbability: 0.6,
        tags: ['mid-market']
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1-555-0103',
        source: 'fitmind',
        score: 91,
        status: 'new',
        industry: 'fitmind',
        crossIndustries: ['carecode', 'glamai'],
        notes: 'High-value fitness center chain',
        conversionProbability: 0.9,
        tags: ['hot-lead', 'enterprise', 'fitness']
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        phone: '+1-555-0104',
        source: 'ledgerai',
        score: 65,
        status: 'converted',
        industry: 'ledgerai',
        crossIndustries: ['franchiseiq', 'fleetiq'],
        notes: 'Signed for accounting automation',
        assignedTo: 'sales-001',
        conversionProbability: 1.0,
        tags: ['converted', 'enterprise']
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie.w@example.com',
        phone: '+1-555-0105',
        source: 'tripmind',
        score: 78,
        status: 'qualified',
        industry: 'tripmind',
        crossIndustries: ['staybot', 'waitron'],
        notes: 'Travel agency looking for integrated solutions',
        assignedTo: 'sales-003',
        conversionProbability: 0.75,
        tags: ['mid-market', 'travel']
      }
    ];

    sampleLeads.forEach(data => {
      const now = new Date();
      const lead: Lead = {
        ...data,
        id: uuidv4(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: now
      };
      this.leads.set(lead.id, lead);
    });

    logger.info(`Initialized ${this.leads.size} sample leads`);
  }

  addLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const now = new Date();
    const lead: Lead = {
      ...leadData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    this.leads.set(lead.id, lead);
    logger.info(`Added lead ${lead.id} from ${lead.industry}`);
    return lead;
  }

  getLead(id: string): Lead | undefined {
    return this.leads.get(id);
  }

  getLeads(filter?: LeadFilter): Lead[] {
    let leads = Array.from(this.leads.values());

    if (filter) {
      if (filter.source) leads = leads.filter(l => l.source === filter.source);
      if (filter.status) leads = leads.filter(l => l.status === filter.status);
      if (filter.minScore !== undefined) leads = leads.filter(l => l.score >= filter.minScore);
      if (filter.maxScore !== undefined) leads = leads.filter(l => l.score <= filter.maxScore);
      if (filter.assignedTo) leads = leads.filter(l => l.assignedTo === filter.assignedTo);
      if (filter.dateFrom) leads = leads.filter(l => new Date(l.createdAt) >= filter.dateFrom!);
      if (filter.dateTo) leads = leads.filter(l => new Date(l.createdAt) <= filter.dateTo!);
    }

    return leads.sort((a, b) => b.score - a.score);
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | undefined {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updated: Lead = {
      ...lead,
      ...updates,
      id: lead.id,
      createdAt: lead.createdAt,
      updatedAt: new Date()
    };

    this.leads.set(id, updated);
    return updated;
  }

  deleteLead(id: string): boolean {
    return this.leads.delete(id);
  }

  assignLead(leadId: string, employeeId: string): Lead | undefined {
    return this.updateLead(leadId, { assignedTo: employeeId });
  }

  calculateScore(leadData: Partial<Lead>): number {
    let score = 50;

    if (leadData.email) score += 10;
    if (leadData.phone) score += 10;
    if (leadData.name && leadData.name.includes(' ')) score += 10;
    if (leadData.crossIndustries && leadData.crossIndustries.length > 0) {
      score += 15 * Math.min(leadData.crossIndustries.length, 3);
    }
    if (leadData.industry) score += 5;

    return Math.min(100, score);
  }

  getAggregation(filter?: LeadFilter): LeadAggregation {
    const leads = this.getLeads(filter);

    const byIndustry: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalScore = 0;
    let converted = 0;

    for (const lead of leads) {
      byIndustry[lead.industry] = (byIndustry[lead.industry] || 0) + 1;
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      totalScore += lead.score;
      if (lead.status === 'converted') converted++;
    }

    return {
      totalLeads: leads.length,
      byIndustry: byIndustry as Record<IndustryType, number>,
      byStatus,
      averageScore: leads.length > 0 ? totalScore / leads.length : 0,
      conversionRate: leads.length > 0 ? converted / leads.length : 0
    };
  }

  rescoreAllLeads(): number {
    let rescored = 0;

    for (const [id, lead] of this.leads) {
      const newScore = this.calculateScore(lead);
      this.updateLead(id, { score: newScore });
      rescored++;
    }

    logger.info(`Re-scored ${rescored} leads`);
    return rescored;
  }

  getTopLeads(limit: number = 10): Lead[] {
    return this.getLeads()
      .filter(l => l.status !== 'converted' && l.status !== 'lost')
      .slice(0, limit);
  }

  getLeadsByEmail(email: string): Lead[] {
    return Array.from(this.leads.values()).filter(l => l.email === email);
  }
}

const unifiedLeadService = new UnifiedLeadService();

// ============================================================================
// API Routes
// ============================================================================

/**
 * Add a new lead
 */
app.post('/api/leads', (req: Request, res: Response) => {
  const { name, email, phone, source, industry, crossIndustries, notes, tags, metadata } = req.body;

  if (!name || !email || !industry) {
    res.status(400).json({ error: 'Name, email, and industry are required' });
    return;
  }

  const lead = unifiedLeadService.addLead({
    name,
    email,
    phone: phone || '',
    source: source || industry,
    score: unifiedLeadService.calculateScore({ name, email, phone, industry, crossIndustries }),
    status: 'new',
    industry,
    crossIndustries: crossIndustries || [],
    notes: notes || '',
    conversionProbability: 0.5,
    tags: tags || [],
    metadata
  });

  res.status(201).json(lead);
});

/**
 * Get all leads
 */
app.get('/api/leads', (req: Request, res: Response) => {
  const { source, status, minScore, maxScore, assignedTo, dateFrom, dateTo } = req.query;

  const leads = unifiedLeadService.getLeads({
    source: source as any,
    status: status as any,
    minScore: minScore ? parseInt(minScore as string) : undefined,
    maxScore: maxScore ? parseInt(maxScore as string) : undefined,
    assignedTo: assignedTo as string,
    dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo: dateTo ? new Date(dateTo as string) : undefined
  });

  res.json(leads);
});

/**
 * Get lead by ID
 */
app.get('/api/leads/:id', (req: Request, res: Response) => {
  const lead = unifiedLeadService.getLead(req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json(lead);
});

/**
 * Get lead by email
 */
app.get('/api/leads/email/:email', (req: Request, res: Response) => {
  const leads = unifiedLeadService.getLeadsByEmail(req.params.email);
  if (leads.length === 0) {
    res.status(404).json({ error: 'No leads found with this email' });
    return;
  }
  res.json(leads);
});

/**
 * Update lead
 */
app.put('/api/leads/:id', (req: Request, res: Response) => {
  const lead = unifiedLeadService.updateLead(req.params.id, req.body);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json(lead);
});

/**
 * Delete lead
 */
app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const deleted = unifiedLeadService.deleteLead(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.status(204).send();
});

/**
 * Assign lead to employee
 */
app.post('/api/leads/:id/assign', (req: Request, res: Response) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    res.status(400).json({ error: 'Employee ID is required' });
    return;
  }

  const lead = unifiedLeadService.assignLead(req.params.id, employeeId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json(lead);
});

/**
 * Update lead status
 */
app.post('/api/leads/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  const validStatuses: Lead['status'][] = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const lead = unifiedLeadService.updateLead(req.params.id, {
    status,
    lastContactedAt: status === 'contacted' ? new Date() : undefined,
    conversionProbability: status === 'converted' ? 1.0 : undefined
  });

  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json(lead);
});

/**
 * Get top leads
 */
app.get('/api/leads/top/:limit', (req: Request, res: Response) => {
  const limit = parseInt(req.params.limit) || 10;
  const leads = unifiedLeadService.getTopLeads(limit);
  res.json(leads);
});

/**
 * Get lead aggregation statistics
 */
app.get('/api/stats/aggregation', (req: Request, res: Response) => {
  const { source, status } = req.query;

  const aggregation = unifiedLeadService.getAggregation({
    source: source as any,
    status: status as any
  });

  res.json(aggregation);
});

/**
 * Rescore all leads
 */
app.post('/api/leads/rescore', (req: Request, res: Response) => {
  const count = unifiedLeadService.rescoreAllLeads();
  res.json({ message: `Re-scored ${count} leads`, count });
});

/**
 * Get leads by industry
 */
app.get('/api/leads/industry/:industry', (req: Request, res: Response) => {
  const leads = unifiedLeadService.getLeads({ source: req.params.industry as IndustryType });
  res.json(leads);
});

/**
 * Get unassigned leads
 */
app.get('/api/leads/unassigned', (req: Request, res: Response) => {
  const allLeads = unifiedLeadService.getLeads();
  const unassigned = allLeads.filter(l => !l.assignedTo && l.status !== 'converted' && l.status !== 'lost');
  res.json(unassigned);
});

/**
 * Get industries
 */
app.get('/api/industries', (req: Request, res: Response) => {
  const industries = Object.entries(INDUSTRY_PRODUCTS).map(([id, name]) => ({ id, name }));
  res.json(industries);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  const allLeads = unifiedLeadService.getLeads();
  const aggregation = unifiedLeadService.getAggregation();

  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      totalLeads: aggregation.totalLeads,
      newLeads: aggregation.byStatus['new'] || 0,
      qualifiedLeads: (aggregation.byStatus['qualified'] || 0) + (aggregation.byStatus['contacted'] || 0),
      convertedLeads: aggregation.byStatus['converted'] || 0,
      averageScore: aggregation.averageScore,
      conversionRate: aggregation.conversionRate
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
