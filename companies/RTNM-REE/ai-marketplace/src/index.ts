/**
 * REE AI Marketplace
 *
 * AI Agent marketplace for ecosystem services
 * Port: 3007
 *
 * Features:
 * - AI agent listing and discovery
 * - Capability matching
 * - Usage tracking and billing
 * - Agent ratings and reviews
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3007', 10);

// Types
type AgentStatus = 'active' | 'inactive' | 'beta' | 'deprecated';
type PricingModel = 'per_call' | 'per_minute' | 'per_result' | 'subscription' | 'free';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  capabilities: string[];
  pricing: {
    model: PricingModel;
    price: number;
    currency: string;
  };
  status: AgentStatus;
  rating: number;
  total_calls: number;
  success_rate: number;
  avg_latency_ms: number;
  version: string;
  documentation_url?: string;
  api_endpoint?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface AgentUsage {
  id: string;
  agent_id: string;
  user_id: string;
  tenant_id?: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  success: boolean;
  error?: string;
  cost: number;
  timestamp: string;
}

interface AgentReview {
  id: string;
  agent_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// In-memory storage
const agents = new Map<string, AIAgent>();
const usage = new Map<string, AgentUsage[]>();
const reviews = new Map<string, AgentReview[]>();

// Initialize with sample agents
const sampleAgents: AIAgent[] = [
  {
    id: 'agent_nlp_classifier',
    name: 'NLP Text Classifier',
    description: 'Classify text into categories using advanced NLP',
    provider: 'hojai-ai',
    category: 'nlp',
    capabilities: ['text_classification', 'sentiment_analysis', 'entity_extraction'],
    pricing: { model: 'per_call', price: 0.001, currency: 'USD' },
    status: 'active',
    rating: 4.5,
    total_calls: 150000,
    success_rate: 0.98,
    avg_latency_ms: 120,
    version: '2.1.0',
    documentation_url: 'https://docs.hojai.ai/nlp-classifier',
    api_endpoint: '/api/v1/classify',
    tags: ['nlp', 'classification', 'sentiment'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'agent_image_recognition',
    name: 'Image Recognition',
    description: 'Detect and classify objects in images',
    provider: 'hojai-ai',
    category: 'vision',
    capabilities: ['object_detection', 'ocr', 'face_detection'],
    pricing: { model: 'per_call', price: 0.005, currency: 'USD' },
    status: 'active',
    rating: 4.7,
    total_calls: 89000,
    success_rate: 0.96,
    avg_latency_ms: 250,
    version: '1.8.0',
    tags: ['vision', 'ocr', 'detection'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'agent_recommendation',
    name: 'Product Recommender',
    description: 'Personalized product recommendations based on user behavior',
    provider: 'hojai-commerce',
    category: 'recommendation',
    capabilities: ['collaborative_filtering', 'content_based', 'hybrid'],
    pricing: { model: 'per_result', price: 0.01, currency: 'USD' },
    status: 'active',
    rating: 4.3,
    total_calls: 230000,
    success_rate: 0.95,
    avg_latency_ms: 80,
    version: '3.0.0',
    tags: ['recommendation', 'personalization', 'e-commerce'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'agent_fraud_detector',
    name: 'Fraud Detector',
    description: 'Real-time fraud detection for transactions',
    provider: 'ree-trust',
    category: 'security',
    capabilities: ['transaction_scoring', 'anomaly_detection', 'pattern_matching'],
    pricing: { model: 'per_call', price: 0.002, currency: 'USD' },
    status: 'active',
    rating: 4.8,
    total_calls: 500000,
    success_rate: 0.99,
    avg_latency_ms: 50,
    version: '2.5.0',
    tags: ['fraud', 'security', 'risk'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'agent_voice_synth',
    name: 'Voice Synthesizer',
    description: 'Convert text to natural speech in multiple languages',
    provider: 'ree-voice',
    category: 'audio',
    capabilities: ['text_to_speech', 'voice_cloning', 'multilingual'],
    pricing: { model: 'per_minute', price: 0.02, currency: 'USD' },
    status: 'beta',
    rating: 4.1,
    total_calls: 15000,
    success_rate: 0.92,
    avg_latency_ms: 500,
    version: '1.0.0',
    tags: ['audio', 'tts', 'voice'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

sampleAgents.forEach(a => {
  agents.set(a.id, a);
  usage.set(a.id, []);
  reviews.set(a.id, []);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  const agentList = Array.from(agents.values());
  res.json({
    status: 'healthy',
    service: 'ai-marketplace',
    version: '1.0.0',
    agents_count: agentList.length,
    active_agents: agentList.filter(a => a.status === 'active').length,
    total_calls: agentList.reduce((sum, a) => sum + a.total_calls, 0),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// AGENT MANAGEMENT
// ============================================

app.get('/api/agents', (req: Request, res: Response) => {
  const { category, status, provider, tags, min_rating, limit = 50 } = req.query;

  let result = Array.from(agents.values());

  if (category) result = result.filter(a => a.category === category);
  if (status) result = result.filter(a => a.status === status);
  if (provider) result = result.filter(a => a.provider === provider);
  if (min_rating) result = result.filter(a => a.rating >= parseFloat(min_rating as string));
  if (tags) {
    const tagList = (tags as string).split(',');
    result = result.filter(a => tagList.some(t => a.tags.includes(t)));
  }

  result = result.sort((a, b) => b.rating - a.rating).slice(0, parseInt(limit as string));

  res.json({ agents: result, count: result.length });
});

app.get('/api/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json({ agent });
});

app.post('/api/agents', (req: Request, res: Response) => {
  try {
    const { name, description, provider, category, capabilities, pricing, tags } = req.body;

    if (!name || !provider || !category) {
      res.status(400).json({ error: 'Missing required fields: name, provider, category' });
      return;
    }

    const agent: AIAgent = {
      id: `agent_${uuidv4()}`,
      name,
      description: description || '',
      provider,
      category,
      capabilities: capabilities || [],
      pricing: pricing || { model: 'free', price: 0, currency: 'USD' },
      status: 'inactive',
      rating: 0,
      total_calls: 0,
      success_rate: 0,
      avg_latency_ms: 0,
      version: '1.0.0',
      tags: tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    agents.set(agent.id, agent);
    usage.set(agent.id, []);
    reviews.set(agent.id, []);

    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  const { name, description, capabilities, pricing, status, tags } = req.body;

  if (name) agent.name = name;
  if (description) agent.description = description;
  if (capabilities) agent.capabilities = capabilities;
  if (pricing) agent.pricing = pricing;
  if (status) agent.status = status;
  if (tags) agent.tags = tags;

  agent.updated_at = new Date().toISOString();
  agents.set(agent.id, agent);

  res.json({ success: true, agent });
});

// ============================================
// AGENT DISCOVERY
// ============================================

app.post('/api/agents/discover', (req: Request, res: Response) => {
  const { capabilities, min_rating, max_price, category } = req.body;

  let result = Array.from(agents.values()).filter(a => a.status === 'active');

  if (capabilities && Array.isArray(capabilities)) {
    result = result.filter(agent =>
      capabilities.every(cap => agent.capabilities.includes(cap))
    );
  }

  if (min_rating) result = result.filter(a => a.rating >= min_rating);
  if (max_price) result = result.filter(a => a.pricing.price <= max_price);
  if (category) result = result.filter(a => a.category === category);

  result.sort((a, b) => {
    const scoreA = a.rating * 0.6 + (a.success_rate * 100) * 0.4;
    const scoreB = b.rating * 0.6 + (b.success_rate * 100) * 0.4;
    return scoreB - scoreA;
  });

  res.json({
    agents: result,
    count: result.length,
    recommended: result[0] || null
  });
});

app.post('/api/agents/match', (req: Request, res: Response) => {
  const { task_description, required_capabilities } = req.body;

  const candidates = Array.from(agents.values()).filter(a => a.status === 'active');

  // Score each agent
  const scored = candidates.map(agent => {
    let matchScore = 0;
    const matchedCapabilities = [];
    const missingCapabilities = [];

    if (required_capabilities && Array.isArray(required_capabilities)) {
      for (const cap of required_capabilities) {
        if (agent.capabilities.includes(cap)) {
          matchedCapabilities.push(cap);
          matchScore += 20;
        } else {
          missingCapabilities.push(cap);
        }
      }
    }

    // Add quality score
    matchScore += agent.rating * 10;
    matchScore += agent.success_rate * 50;
    matchScore -= agent.pricing.price * 5;

    return {
      agent,
      match_score: Math.max(0, matchScore),
      matched_capabilities: matchedCapabilities,
      missing_capabilities: missingCapabilities
    };
  });

  scored.sort((a, b) => b.match_score - a.match_score);

  res.json({
    best_match: scored[0] || null,
    alternatives: scored.slice(1, 5),
    total_candidates: candidates.length
  });
});

// ============================================
// USAGE TRACKING
// ============================================

app.post('/api/agents/:id/invoke', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  const { user_id, tenant_id, input_tokens, output_tokens, success, error } = req.body;

  const cost = calculateCost(agent.pricing, input_tokens || 0, output_tokens || 0);

  const usageRecord: AgentUsage = {
    id: uuidv4(),
    agent_id: agent.id,
    user_id: user_id || 'anonymous',
    tenant_id,
    input_tokens: input_tokens || 0,
    output_tokens: output_tokens || 0,
    duration_ms: 0,
    success: success !== false,
    error,
    cost,
    timestamp: new Date().toISOString()
  };

  const agentUsage = usage.get(agent.id) || [];
  agentUsage.push(usageRecord);
  usage.set(agent.id, agentUsage);

  // Update agent stats
  agent.total_calls++;
  agent.success_rate = (agent.success_rate * (agent.total_calls - 1) + (success !== false ? 1 : 0)) / agent.total_calls;
  agents.set(agent.id, agent);

  res.json({
    success: true,
    usage_id: usageRecord.id,
    cost: usageRecord.cost,
    agent_stats: {
      total_calls: agent.total_calls,
      success_rate: agent.success_rate
    }
  });
});

function calculateCost(pricing: AIAgent['pricing'], inputTokens: number, outputTokens: number): number {
  switch (pricing.model) {
    case 'per_call':
      return pricing.price;
    case 'per_minute':
      return pricing.price * (inputTokens + outputTokens) / 1000;
    case 'per_result':
      return pricing.price;
    case 'subscription':
      return 0; // Included in subscription
    case 'free':
      return 0;
    default:
      return 0;
  }
}

app.get('/api/agents/:id/usage', (req: Request, res: Response) => {
  const agentUsage = usage.get(req.params.id) || [];
  const { since, until, limit = 100 } = req.query;

  let result = agentUsage;

  if (since) result = result.filter(u => new Date(u.timestamp) >= new Date(since as string));
  if (until) result = result.filter(u => new Date(u.timestamp) <= new Date(until as string));

  result = result.slice(-(parseInt(limit as string)));

  const totalCost = result.reduce((sum, u) => sum + u.cost, 0);
  const successRate = result.length > 0
    ? result.filter(u => u.success).length / result.length
    : 0;

  res.json({
    usage: result,
    count: result.length,
    total_cost: totalCost,
    success_rate: successRate
  });
});

// ============================================
// REVIEWS
// ============================================

app.post('/api/agents/:id/reviews', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  const { user_id, rating, comment } = req.body;

  if (!user_id || !rating) {
    res.status(400).json({ error: 'Missing required fields: user_id, rating' });
    return;
  }

  const review: AgentReview = {
    id: uuidv4(),
    agent_id: agent.id,
    user_id,
    rating,
    comment: comment || '',
    created_at: new Date().toISOString()
  };

  const agentReviews = reviews.get(agent.id) || [];
  agentReviews.push(review);
  reviews.set(agent.id, agentReviews);

  // Update agent rating
  const avgRating = agentReviews.reduce((sum, r) => sum + r.rating, 0) / agentReviews.length;
  agent.rating = Math.round(avgRating * 10) / 10;
  agents.set(agent.id, agent);

  res.json({ success: true, review });
});

app.get('/api/agents/:id/reviews', (req: Request, res: Response) => {
  const agentReviews = reviews.get(req.params.id) || [];
  res.json({ reviews: agentReviews, count: agentReviews.length });
});

// ============================================
// ANALYTICS
// ============================================

app.get('/api/analytics/dashboard', (req: Request, res: Response) => {
  const agentList = Array.from(agents.values());
  const allUsage = Array.from(usage.values()).flat();

  const topAgents = [...agentList].sort((a, b) => b.total_calls - a.total_calls).slice(0, 5);
  const recentUsage = allUsage.slice(-50);
  const totalRevenue = allUsage.reduce((sum, u) => sum + u.cost, 0);

  const byCategory = agentList.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    summary: {
      total_agents: agentList.length,
      active_agents: agentList.filter(a => a.status === 'active').length,
      total_calls: agentList.reduce((sum, a) => sum + a.total_calls, 0),
      total_revenue: totalRevenue,
      avg_rating: agentList.reduce((sum, a) => sum + a.rating, 0) / agentList.length
    },
    top_agents: topAgents,
    by_category: byCategory,
    recent_usage: recentUsage
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[AI Marketplace Error]', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`REE AI Marketplace - Port ${PORT}`);
  console.log(`  → Agents: GET /api/agents`);
  console.log(`  → Discover: POST /api/agents/discover`);
  console.log(`  → Match: POST /api/agents/match`);
  console.log(`  → Invoke: POST /api/agents/:id/invoke`);
  console.log(`  → Analytics: GET /api/analytics/dashboard`);
});

export default app;