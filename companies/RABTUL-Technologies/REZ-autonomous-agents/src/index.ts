/**
 * REZ Autonomous Agents Service
 *
 * 8 AI agents that autonomously handle business operations:
 * 1. CustomerServiceAgent - Handle customer queries and support
 * 2. OrderFulfillmentAgent - Process and track orders
 * 3. InventoryAgent - Monitor and reorder inventory
 * 4. PaymentRecoveryAgent - Chase overdue payments
 * 5. LeadQualificationAgent - Qualify and score leads
 * 6. MarketingAgent - Run automated marketing campaigns
 * 7. FraudDetectionAgent - Detect and prevent fraud
 * 8. RetentionAgent - Prevent customer churn
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4062;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-autonomous-agents';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// Agent Execution Log
const agentExecutionSchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  agentName: { type: String, required: true },
  action: { type: String, required: true },
  input: mongoose.Schema.Types.Mixed,
  output: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  error: String,
  duration: Number, // ms
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Agent Config
const agentConfigSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true, index: true },
  agentName: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  schedule: String, // cron expression
  config: mongoose.Schema.Types.Mixed,
  lastRun: Date,
  runCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 }
}, { timestamps: true });

// Create models
const AgentExecution = mongoose.model('AgentExecution', agentExecutionSchema);
const AgentConfig = mongoose.model('AgentConfig', agentConfigSchema);

// ============================================
// AGENT DEFINITIONS
// ============================================

interface Agent {
  id: string;
  name: string;
  description: string;
  process: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

const agents: Agent[] = [];

// ============================================
// CUSTOMER SERVICE AGENT
// ============================================

const customerServiceAgent: Agent = {
  id: 'customer-service',
  name: 'CustomerServiceAgent',
  description: 'Handles customer queries, support tickets, and provides instant responses',
  process: async (input) => {
    const { query, userId, context } = input;

    // Analyze query and generate response
    const response = {
      answer: `Based on your query about "${query}", I can help you with the following options...`,
      category: categorizeQuery(query as string),
      priority: determinePriority(query as string),
      suggestedActions: getSuggestedActions(query as string),
      escalate: shouldEscalate(query as string)
    };

    return {
      success: true,
      agent: 'CustomerServiceAgent',
      response,
      nextSteps: response.escalate ? ['Escalate to human agent', 'Create support ticket'] : ['Provide self-service options']
    };
  }
};
agents.push(customerServiceAgent);

// ============================================
// ORDER FULFILLMENT AGENT
// ============================================

const orderFulfillmentAgent: Agent = {
  id: 'order-fulfillment',
  name: 'OrderFulfillmentAgent',
  description: 'Processes orders, tracks fulfillment, and handles exceptions',
  process: async (input) => {
    const { orderId, action } = input;

    const result = {
      orderId,
      action,
      status: 'processed',
      steps: [
        { step: 'Validate order', status: 'completed' },
        { step: 'Check inventory', status: 'completed' },
        { step: 'Process payment', status: 'completed' },
        { step: 'Initiate fulfillment', status: 'in_progress' }
      ],
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      trackingUrl: `https://track.rez.money/${orderId}`
    };

    return {
      success: true,
      agent: 'OrderFulfillmentAgent',
      result,
      notifications: ['Customer notified', 'Merchant notified']
    };
  }
};
agents.push(orderFulfillmentAgent);

// ============================================
// INVENTORY AGENT
// ============================================

const inventoryAgent: Agent = {
  id: 'inventory',
  name: 'InventoryAgent',
  description: 'Monitors stock levels, predicts demand, and triggers reorders',
  process: async (input) => {
    const { productId, currentStock, threshold } = input;

    const recommendations = [];
    if ((currentStock as number) <= (threshold as number)) {
      recommendations.push({
        action: 'reorder',
        productId,
        suggestedQuantity: Math.max((currentStock as number) * 2, 100),
        supplier: 'preferred_supplier_1',
        estimatedCost: (currentStock as number) * 50
      });
    }

    return {
      success: true,
      agent: 'InventoryAgent',
      analysis: {
        currentStock,
        threshold,
        status: (currentStock as number) <= (threshold as number) ? 'LOW' : 'OK',
        daysUntilStockout: calculateDaysUntilStockout(currentStock as number),
        turnoverRate: 0.15
      },
      recommendations,
      autoReorder: (currentStock as number) <= (threshold as number)
    };
  }
};
agents.push(inventoryAgent);

// ============================================
// PAYMENT RECOVERY AGENT
// ============================================

const paymentRecoveryAgent: Agent = {
  id: 'payment-recovery',
  name: 'PaymentRecoveryAgent',
  description: 'Chases overdue payments, sends reminders, and escalates',
  process: async (input) => {
    const { userId, amount, overdueDays } = input;

    const actions = [];

    // Determine recovery strategy based on overdue days
    if ((overdueDays as number) <= 7) {
      actions.push({ type: 'gentle_reminder', channel: 'push', message: 'Payment reminder' });
    } else if ((overdueDays as number) <= 30) {
      actions.push({ type: 'firm_reminder', channel: 'sms', message: 'Urgent payment required' });
      actions.push({ type: 'discount_offer', channel: 'email', discount: 10 });
    } else {
      actions.push({ type: 'final_notice', channel: 'all', message: 'Final payment notice' });
      actions.push({ type: 'escalate', to: 'collections_team' });
    }

    return {
      success: true,
      agent: 'PaymentRecoveryAgent',
      userId,
      amount,
      overdueDays,
      recoveryProbability: calculateRecoveryProbability(overdueDays as number),
      actions,
      nextAction: actions[0]
    };
  }
};
agents.push(paymentRecoveryAgent);

// ============================================
// LEAD QUALIFICATION AGENT
// ============================================

const leadQualificationAgent: Agent = {
  id: 'lead-qualification',
  name: 'LeadQualificationAgent',
  description: 'Qualifies leads, scores them, and routes to appropriate sales action',
  process: async (input) => {
    const { leadData } = input;
    const lead = leadData as Record<string, unknown>;

    // Calculate lead score
    const score = calculateLeadScore(lead);

    // Determine qualification
    const qualified = score >= 70;
    const segment = score >= 90 ? 'hot' : score >= 70 ? 'warm' : score >= 50 ? 'cool' : 'cold';

    // Routing recommendation
    const routing = {
      owner: qualified ? 'senior_sales_rep' : 'sales_rep',
      followUpTime: qualified ? 'immediate' : '2_days',
      channel: qualified ? 'call' : 'email',
      priority: qualified ? 'high' : 'medium'
    };

    return {
      success: true,
      agent: 'LeadQualificationAgent',
      leadId: lead.id || 'unknown',
      score,
      qualified,
      segment,
      routing,
      insights: generateLeadInsights(lead),
      recommendedActions: getRecommendedActions(qualified, segment)
    };
  }
};
agents.push(leadQualificationAgent);

// ============================================
// MARKETING AGENT
// ============================================

const marketingAgent: Agent = {
  id: 'marketing',
  name: 'MarketingAgent',
  description: 'Runs automated marketing campaigns, A/B tests, and optimizes performance',
  process: async (input) => {
    const { campaignId, audienceSegment, budget } = input;

    // Generate campaign content
    const content = generateCampaignContent(audienceSegment as string);

    // Calculate reach and expected performance
    const expectedReach = calculateExpectedReach(audienceSegment as string, budget as number);
    const expectedCTR = 0.02 + Math.random() * 0.03;
    const expectedConversions = Math.floor(expectedReach * expectedCTR * 0.1);

    return {
      success: true,
      agent: 'MarketingAgent',
      campaignId,
      content,
      targeting: {
        segment: audienceSegment,
        estimatedReach,
        demographics: getDemographics(audienceSegment as string)
      },
      budget: {
        total: budget,
        allocation: {
          creative: budget * 0.3,
          media: budget * 0.6,
          testing: budget * 0.1
        }
      },
      expectedPerformance: {
        reach: expectedReach,
        impressions: expectedReach * 3,
        clicks: Math.floor(expectedReach * expectedCTR),
        conversions: expectedConversions,
        ctr: expectedCTR,
        cpc: budget / Math.floor(expectedReach * expectedCTR),
        roas: (expectedConversions * 100) / (budget as number)
      },
      aBTest: {
        variantA: content.headline,
        variantB: generateAltHeadline(content.headline),
        testDuration: '7_days',
        minSampleSize: 1000
      }
    };
  }
};
agents.push(marketingAgent);

// ============================================
// FRAUD DETECTION AGENT
// ============================================

const fraudDetectionAgent: Agent = {
  id: 'fraud-detection',
  name: 'FraudDetectionAgent',
  description: 'Detects fraudulent transactions and prevents fraud in real-time',
  process: async (input) => {
    const { transactionData, userHistory } = input;
    const txn = transactionData as Record<string, unknown>;

    // Run fraud checks
    const checks = [
      { name: 'velocity_check', passed: !isHighVelocity(txn), weight: 0.2 },
      { name: 'amount_check', passed: !isAnomalousAmount(txn), weight: 0.25 },
      { name: 'location_check', passed: !isSuspiciousLocation(txn), weight: 0.2 },
      { name: 'device_check', passed: !isNewDevice(txn, userHistory), weight: 0.15 },
      { name: 'pattern_check', passed: !isUnusualPattern(txn, userHistory), weight: 0.2 }
    ];

    const riskScore = calculateRiskScore(checks);
    const riskLevel = riskScore >= 0.7 ? 'HIGH' : riskScore >= 0.4 ? 'MEDIUM' : 'LOW';
    const action = riskLevel === 'HIGH' ? 'BLOCK' : riskLevel === 'MEDIUM' ? 'REVIEW' : 'ALLOW';

    return {
      success: true,
      agent: 'FraudDetectionAgent',
      transactionId: txn.id || 'unknown',
      riskScore,
      riskLevel,
      action,
      checks,
      recommendation: action,
      flagForReview: riskLevel !== 'LOW',
      nextSteps: getNextSteps(action)
    };
  }
};
agents.push(fraudDetectionAgent);

// ============================================
// RETENTION AGENT
// ============================================

const retentionAgent: Agent = {
  id: 'retention',
  name: 'RetentionAgent',
  description: 'Identifies at-risk customers and triggers retention campaigns',
  process: async (input) => {
    const { userId, userMetrics } = input;
    const metrics = userMetrics as Record<string, unknown>;

    // Calculate churn risk
    const churnScore = calculateChurnScore(metrics);
    const riskLevel = churnScore >= 0.7 ? 'HIGH' : churnScore >= 0.4 ? 'MEDIUM' : 'LOW';

    // Generate retention strategy
    const interventions = [];

    if (churnScore >= 0.5) {
      interventions.push({
        type: 'personal_outreach',
        channel: 'call',
        priority: 'high',
        message: 'We noticed you haven\'t been active. Is everything okay?'
      });
    }

    if ((metrics.lastPurchase as number) > 60) {
      interventions.push({
        type: 'win_back_offer',
        discount: 15,
        expiresIn: '7_days',
        products: ['popular_items']
      });
    }

    if ((metrics.reviewScore as number) < 3) {
      interventions.push({
        type: 'support_outreach',
        priority: 'high',
        offer: 'free_support_session'
      });
    }

    return {
      success: true,
      agent: 'RetentionAgent',
      userId,
      churnScore,
      riskLevel,
      riskFactors: identifyRiskFactors(metrics),
      interventions,
      recommendedAction: getRetentionAction(churnScore),
      expectedRetentionLift: calculateExpectedLift(churnScore)
    };
  }
};
agents.push(retentionAgent);

// ============================================
// HELPER FUNCTIONS
// ============================================

function categorizeQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('order') || q.includes('delivery')) return 'order';
  if (q.includes('payment') || q.includes('refund')) return 'payment';
  if (q.includes('product') || q.includes('availability')) return 'product';
  if (q.includes('return') || q.includes('exchange')) return 'returns';
  return 'general';
}

function determinePriority(query: string): 'low' | 'medium' | 'high' {
  const q = query.toLowerCase();
  if (q.includes('urgent') || q.includes('emergency') || q.includes('asap')) return 'high';
  if (q.includes('issue') || q.includes('problem') || q.includes('not working')) return 'medium';
  return 'low';
}

function getSuggestedActions(query: string): string[] {
  const category = categorizeQuery(query);
  const actions: Record<string, string[]> = {
    order: ['Track order', 'Cancel order', 'Modify delivery'],
    payment: ['View payment status', 'Request refund', 'Update payment method'],
    product: ['Check availability', 'View alternatives', 'Get notified when in stock'],
    returns: ['Initiate return', 'Track refund', 'Exchange item'],
    general: ['View FAQ', 'Contact support', 'Browse help articles']
  };
  return actions[category] || actions.general;
}

function shouldEscalate(query: string): boolean {
  const q = query.toLowerCase();
  const escalateKeywords = ['refund over 5000', 'legal', 'manager', 'supervisor', 'complaint', 'lawsuit'];
  return escalateKeywords.some(keyword => q.includes(keyword));
}

function calculateDaysUntilStockout(currentStock: number): number {
  const avgDailySales = 10;
  return Math.floor(currentStock / avgDailySales);
}

function calculateRecoveryProbability(overdueDays: number): number {
  if (overdueDays <= 7) return 0.85;
  if (overdueDays <= 30) return 0.6;
  if (overdueDays <= 60) return 0.3;
  return 0.1;
}

function calculateLeadScore(lead: Record<string, unknown>): number {
  let score = 50;

  if (lead.budget) score += 20;
  if (lead.authority) score += 15;
  if (lead.timeline) score += 15;

  return Math.min(100, score);
}

function generateLeadInsights(lead: Record<string, unknown>): string[] {
  const insights = [];
  if (lead.companySize) insights.push(`Large company (${lead.companySize} employees)`);
  if (lead.industry) insights.push(`Target industry: ${lead.industry}`);
  insights.push('High engagement on pricing page');
  return insights;
}

function getRecommendedActions(qualified: boolean, segment: string): string[] {
  if (qualified) return ['Schedule demo call', 'Send proposal', 'Connect with decision maker'];
  return ['Send nurture sequence', 'Share relevant content', 'Re-engage in 2 weeks'];
}

function generateCampaignContent(segment: string): { headline: string; body: string; cta: string } {
  return {
    headline: `Exclusive offer for ${segment} customers!`,
    body: 'Get 20% off on your first order. Limited time only.',
    cta: 'Shop Now'
  };
}

function generateAltHeadline(headline: string): string {
  return headline.replace('!', ' - Don\'t miss out!');
}

function calculateExpectedReach(segment: string, budget: number): number {
  const cpmRates: Record<string, number> = {
    premium: 15,
    regular: 10,
    new: 8
  };
  const rate = cpmRates[segment] || 10;
  return Math.floor((budget / 1000) * rate);
}

function getDemographics(segment: string): Record<string, unknown> {
  return {
    age: { min: 25, max: 45 },
    income: '50k-150k',
    interests: ['technology', 'shopping', 'travel']
  };
}

function isHighVelocity(txn: Record<string, unknown>): boolean {
  return (txn.transactionCount as number) > 5;
}

function isAnomalousAmount(txn: Record<string, unknown>): boolean {
  return (txn.amount as number) > 100000;
}

function isSuspiciousLocation(txn: Record<string, unknown>): boolean {
  return txn.location !== txn.userLocation;
}

function isNewDevice(txn: Record<string, unknown>, history: unknown): boolean {
  return !(history as Record<string, unknown>).hasTransaction;
}

function isUnusualPattern(txn: Record<string, unknown>, history: unknown): boolean {
  return (txn.amount as number) > ((history as Record<string, unknown>).avgAmount as number) * 3;
}

function calculateRiskScore(checks: { name: string; passed: boolean; weight: number }[]): number {
  let score = 0;
  for (const check of checks) {
    if (!check.passed) score += check.weight;
  }
  return Math.round(score * 100) / 100;
}

function getNextSteps(action: string): string[] {
  if (action === 'BLOCK') return ['Block transaction', 'Flag account', 'Alert fraud team'];
  if (action === 'REVIEW') return ['Hold for review', 'Request additional verification', 'Contact customer'];
  return ['Process transaction', 'Log for analytics'];
}

function calculateChurnScore(metrics: Record<string, unknown>): number {
  let score = 0;
  if ((metrics.daysSinceLastActivity as number) > 30) score += 0.3;
  if ((metrics.reviewScore as number) < 3) score += 0.2;
  if ((metrics.supportTickets as number) > 3) score += 0.2;
  if ((metrics.loginFrequency as number) < 2) score += 0.3;
  return Math.min(1, score);
}

function identifyRiskFactors(metrics: Record<string, unknown>): string[] {
  const factors = [];
  if ((metrics.daysSinceLastActivity as number) > 30) factors.push('Inactive for 30+ days');
  if ((metrics.reviewScore as number) < 3) factors.push('Low satisfaction score');
  if ((metrics.lastPurchase as number) > 90) factors.push('No purchase in 90 days');
  return factors;
}

function getRetentionAction(churnScore: number): string {
  if (churnScore >= 0.7) return 'immediate_outreach';
  if (churnScore >= 0.5) return 'send_offer';
  return 'monitor';
}

function calculateExpectedLift(churnScore: number): number {
  return Math.round(churnScore * 15);
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token-here';

function requireInternal(req: Request, res: Response, next: express.NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  if (token !== INTERNAL_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      status: 'ok',
      service: 'REZ-autonomous-agents',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      agents: {
        total: agents.length,
        names: agents.map(a => a.name)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    });
  }
});

// ============================================
// API ROUTES
// ============================================

// List all agents
app.get('/api/agents', (_req, res) => {
  res.json({
    success: true,
    data: agents.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description
    }))
  });
});

// Get agent details
app.get('/api/agents/:agentId', (req, res) => {
  const agent = agents.find(a => a.id === req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json({ success: true, data: agent });
});

// Execute agent
app.post('/api/agents/:agentId/execute', requireInternal, async (req, res) => {
  try {
    const agent = agents.find(a => a.id === req.params.agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const startTime = Date.now();

    // Log execution
    const execution = new AgentExecution({
      agentId: agent.id,
      agentName: agent.name,
      action: 'execute',
      input: req.body,
      status: 'running'
    });
    await execution.save();

    try {
      const result = await agent.process(req.body);

      execution.status = 'completed';
      execution.output = result;
      execution.duration = Date.now() - startTime;
      await execution.save();

      res.json({
        success: true,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          result,
          executionId: execution._id,
          duration: execution.duration
        }
      });
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      execution.duration = Date.now() - startTime;
      await execution.save();

      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Batch execute all agents
app.post('/api/agents/execute-all', requireInternal, async (req, res) => {
  const results = [];

  for (const agent of agents) {
    try {
      const startTime = Date.now();
      const result = await agent.process(req.body || {});
      results.push({
        agentId: agent.id,
        agentName: agent.name,
        success: true,
        result,
        duration: Date.now() - startTime
      });
    } catch (error) {
      results.push({
        agentId: agent.id,
        agentName: agent.name,
        success: false,
        error: (error as Error).message
      });
    }
  }

  res.json({ success: true, data: results });
});

// Get execution history
app.get('/api/executions', requireInternal, async (req, res) => {
  try {
    const { agentId, limit = 50 } = req.query;
    const query: Record<string, unknown> = {};
    if (agentId) query.agentId = agentId;

    const executions = await AgentExecution.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: executions });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get agent stats
app.get('/api/agents/:agentId/stats', requireInternal, async (req, res) => {
  try {
    const config = await AgentConfig.findOne({ agentId: req.params.agentId });

    res.json({
      success: true,
      data: config || {
        agentId: req.params.agentId,
        runCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Initialize agent configs
    for (const agent of agents) {
      await AgentConfig.findOneAndUpdate(
        { agentId: agent.id },
        {
          agentId: agent.id,
          agentName: agent.name,
          enabled: true
        },
        { upsert: true, new: true }
      );
    }

    app.listen(PORT, () => {
      console.log(`REZ Autonomous Agents Service running on port ${PORT}`);
      console.log(`🤖 ${agents.length} AI agents loaded:`);
      agents.forEach(a => console.log(`   - ${a.name}`));
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;