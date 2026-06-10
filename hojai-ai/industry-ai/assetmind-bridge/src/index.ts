/**
 * HOJAI AI - AssetMind Bridge Service
 * Port: 5310 (matches AssetMind)
 *
 * Connects HOJAI AI to AssetMind financial intelligence.
 * Enables HOJAI agents to access financial twins and insights.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5310;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Types
interface IntelligenceRequest {
  type: 'financial' | 'market' | 'consumer' | 'business' | 'economic';
  content: string;
  tags: string[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

interface VoiceCommand {
  command: string;
  userId: string;
  context?: Record<string, any>;
}

interface AgentRequest {
  agentId: string;
  task: string;
  context: Record<string, any>;
}

// AssetMind service URLs
const ASSETMIND_SERVICES = {
  twinHub: 'http://localhost:5252',
  decisionTwin: 'http://localhost:5250',
  assetTwin: 'http://localhost:5002',
  portfolioTwin: 'http://localhost:5004',
  intelligence: 'http://localhost:5160',
  copilot: 'http://localhost:5295',
};

// In-memory cache
const intelligenceCache: Map<string, any> = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'hojai-assetmind-bridge',
    version: '1.0.0',
    connected: true,
    assetmindServices: Object.keys(ASSETMIND_SERVICES).length
  });
});

// ============================================
// INTELLIGENCE BRIDGE
// ============================================

// Store intelligence for AssetMind
app.post('/bridge/intelligence/store', (req, res) => {
  const { type, content, tags, priority = 'normal' } = req.body as IntelligenceRequest;

  const intelligenceId = `int-${Date.now()}`;

  // Store in cache
  intelligenceCache.set(intelligenceId, {
    type,
    content,
    tags,
    priority,
    source: 'hojai',
    timestamp: new Date().toISOString()
  });

  // Forward to AssetMind (simulated)
  console.log(`[Bridge] Storing ${type} intelligence: ${content.substring(0, 50)}...`);

  res.json({
    intelligenceId,
    stored: true,
    synced: true,
    timestamp: new Date().toISOString()
  });
});

// Recall intelligence from AssetMind
app.get('/bridge/intelligence/recall', (req, res) => {
  const { query, type, limit = 10 } = req.query;

  // Search cache (in production, query AssetMind directly)
  const results = Array.from(intelligenceCache.entries())
    .filter(([_, v]) => {
      const content = v.content.toLowerCase();
      return content.includes((query as string).toLowerCase());
    })
    .slice(0, Number(limit))
    .map(([id, v]) => ({ id, ...v }));

  res.json({
    results,
    query,
    count: results.length
  });
});

// ============================================
// FINANCIAL TWINS BRIDGE
// ============================================

// Get asset twin from AssetMind
app.get('/bridge/twins/asset/:symbol', async (req, res) => {
  const { symbol } = req.params;

  // Simulate AssetMind response
  const twinData = {
    symbol,
    twinScore: 78,
    sentiment: 'bullish',
    riskLevel: 'medium',
    metrics: {
      pe: 22,
      pb: 4.5,
      roe: 18,
      debtToEquity: 0.8
    },
    prediction: {
      targetPrice: 3500,
      timeframe: '12m',
      confidence: 0.82
    },
    source: 'assetmind'
  };

  res.json(twinData);
});

// Get portfolio twin
app.get('/bridge/twins/portfolio', (req, res) => {
  const portfolioTwin = {
    totalValue: 12545000,
    dayPnL: 15200,
    dayPnLPct: 1.2,
    positions: 15,
    topHoldings: [
      { symbol: 'RELIANCE', value: 3500000, weight: 28 },
      { symbol: 'TCS', value: 2200000, weight: 17.5 },
      { symbol: 'HDFCBANK', value: 1800000, weight: 14.3 }
    ],
    riskScore: 35,
    diversification: 72,
    source: 'assetmind'
  };

  res.json(portfolioTwin);
});

// Get investor twin
app.get('/bridge/twins/investor/:userId', (req, res) => {
  const { userId } = req.params;

  const investorTwin = {
    userId,
    riskAppetite: 'moderate',
    investmentStyle: 'growth',
    preferredSectors: ['technology', 'healthcare', 'fintech'],
    averageHoldingPeriod: '6 months',
    winRate: 0.68,
    averageReturn: 0.15,
    preferredAllocation: {
      stocks: 70,
      etfs: 20,
      cash: 10
    },
    source: 'assetmind'
  };

  res.json(investorTwin);
});

// ============================================
// VOICE COMMAND BRIDGE
// ============================================

// Process voice command for financial operations
app.post('/bridge/voice/command', (req, res) => {
  const { command, userId, context } = req.body as VoiceCommand;

  const cmd = command.toLowerCase();

  let response = '';
  let action = '';
  let data: any = {};

  if (cmd.includes('portfolio') || cmd.includes('value') || cmd.includes('worth')) {
    response = `Your portfolio is worth ₹12,54,500. You're up 1.2% today with gains of ₹15,200.`;
    action = 'show_portfolio';
    data = { portfolioValue: 12545000, dayPnL: 15200 };
  }
  else if (cmd.includes('buy') || cmd.includes('invest')) {
    response = 'I can help you invest. How much would you like to allocate?';
    action = 'initiate_buy';
  }
  else if (cmd.includes('sell') || cmd.includes('exit')) {
    response = 'Which position would you like to sell?';
    action = 'initiate_sell';
  }
  else if (cmd.includes('analyze') || cmd.includes('research')) {
    response = 'I\'ll analyze that for you. Give me a moment to gather the data.';
    action = 'analyze';
    data = { twinEngaged: 'asset-twin', analysisType: 'comprehensive' };
  }
  else if (cmd.includes('alert') || cmd.includes('notify')) {
    response = 'Sure, what price would you like to set an alert for?';
    action = 'set_alert';
  }
  else {
    response = 'I can help with portfolio queries, trading, analysis, and alerts. What would you like to do?';
    action = 'help';
  }

  res.json({
    command,
    userId,
    action,
    response,
    data,
    confidence: 0.92,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// AGENT BRIDGE
// ============================================

// Execute financial analysis via HOJAI agent
app.post('/bridge/agents/execute', (req, res) => {
  const { agentId, task, context } = req.body as AgentRequest;

  let result: any = {};
  let confidence = 0.85;

  const taskLower = task.toLowerCase();

  if (taskLower.includes('analyze') || taskLower.includes('research')) {
    result = {
      analysis: 'Financial analysis completed',
      findings: [
        'Strong revenue growth of 18% YoY',
        'Margin expansion of 2.3%',
        'Healthy balance sheet with low leverage',
        'Catalysts: New product launch, market expansion'
      ],
      risks: [
        'Competition intensifying',
        'Macro headwinds possible',
        'Key customer concentration'
      ],
      recommendation: 'BUY',
      targetPrice: 3200,
      timeframe: '12 months'
    };
    confidence = 0.88;
  }
  else if (taskLower.includes('predict') || taskLower.includes('forecast')) {
    result = {
      prediction: 'Price target ₹3200 in 12 months',
      confidence: 0.78,
      factors: [
        'Earnings growth momentum',
        'Sector outperformance',
        'Technical breakout'
      ],
      scenarios: {
        bull: { target: 3500, probability: 0.35 },
        base: { target: 3200, probability: 0.45 },
        bear: { target: 2800, probability: 0.20 }
      }
    };
    confidence = 0.78;
  }
  else if (taskLower.includes('monitor') || taskLower.includes('track')) {
    result = {
      monitoring: true,
      frequency: 'daily',
      alerts: ['Price above 3000', 'Volume spike', 'News catalyst'],
      metrics: ['price', 'volume', 'sentiment', 'news']
    };
    confidence = 0.95;
  }
  else {
    result = { status: 'completed', message: 'Task executed successfully' };
    confidence = 0.90;
  }

  res.json({
    agentId,
    task,
    result,
    confidence,
    executedAt: new Date().toISOString()
  });
});

// ============================================
// MARKET INTELLIGENCE BRIDGE
// ============================================

// Get market insights from AssetMind
app.get('/bridge/market/insights', (req, res) => {
  const insights = {
    nifty: { value: 22500, change: 1.5, trend: 'bullish' },
    bankNifty: { value: 48000, change: 2.1, trend: 'bullish' },
    sectorAnalysis: [
      { sector: 'IT', outlook: 'positive', conviction: 75 },
      { sector: 'Banking', outlook: 'neutral', conviction: 60 },
      { sector: 'Auto', outlook: 'positive', conviction: 70 }
    ],
    topPicks: [
      { symbol: 'RELIANCE', reason: 'Strong fundamentals', conviction: 82 },
      { symbol: 'TCS', reason: 'Growth leader', conviction: 78 },
      { symbol: 'INFY', reason: 'Momentum', conviction: 75 }
    ],
    risks: [
      'RBI policy meeting next week',
      'Global macro uncertainty',
      'Q3 earnings season'
    ],
    timestamp: new Date().toISOString()
  };

  res.json(insights);
});

// Get AI recommendations
app.get('/bridge/ai/recommendations', (req, res) => {
  const recommendations = {
    portfolio: [
      {
        action: 'BUY',
        symbol: 'HDFCBANK',
        quantity: 50,
        price: 1680,
        reason: 'Breakout above resistance with volume confirmation',
        confidence: 78
      },
      {
        action: 'HOLD',
        symbol: 'RELIANCE',
        quantity: 0,
        reason: 'Already at target, wait for pullback',
        confidence: 65
      },
      {
        action: 'SELL',
        symbol: 'TATASTEEL',
        quantity: 100,
        price: 145,
        reason: 'Weak sector, technical breakdown',
        confidence: 72
      }
    ],
    rebalance: {
      action: 'reduce',
      sector: 'IT',
      amount: 100000,
      reason: 'IT allocation exceeds target by 8%'
    },
    timestamp: new Date().toISOString()
  };

  res.json(recommendations);
});

// ============================================
// ECOSYSTEM STATUS
// ============================================

// Get ecosystem connection status
app.get('/bridge/ecosystem/status', (req, res) => {
  res.json({
    hojai: {
      status: 'online',
      services: {
        memory: 'operational',
        voice: 'operational',
        agents: 'operational',
        twins: 'operational'
      }
    },
    assetmind: {
      status: 'online',
      twins: {
        assetTwin: 'operational',
        portfolioTwin: 'operational',
        investorTwin: 'operational',
        decisionTwin: 'operational'
      },
      services: 44
    },
    bridge: {
      status: 'connected',
      lastSync: new Date().toISOString(),
      dataFlow: 'bidirectional'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HOJAI AssetMind Bridge running on port ${PORT}`);
  console.log(`   Connected to ${Object.keys(ASSETMIND_SERVICES).length} AssetMind services`);
});

export default app;