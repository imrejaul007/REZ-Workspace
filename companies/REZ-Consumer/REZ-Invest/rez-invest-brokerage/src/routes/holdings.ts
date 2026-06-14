import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const holdingsRouter = Router();

// Types
interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  segment: 'equity' | 'mutual_fund' | 'ipo';
  exchange: 'NSE' | 'BSE';
}

interface DematHolding {
  isin: string;
  symbol: string;
  name: string;
  quantity: number;
  holdingType: 'Demat' | 'Physical';
  lastUpdated: Date;
}

// Mock holdings data
const holdings: Holding[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    quantity: 100,
    avgPrice: 2500,
    currentPrice: 2750,
    segment: 'equity',
    exchange: 'NSE',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    quantity: 50,
    avgPrice: 1650,
    currentPrice: 1720,
    segment: 'equity',
    exchange: 'NSE',
  },
  {
    symbol: 'ICICIPRULI',
    name: 'ICICI Prudential Mutual Fund',
    quantity: 500,
    avgPrice: 120,
    currentPrice: 135,
    segment: 'mutual_fund',
    exchange: 'NSE',
  },
];

const dematHoldings = new Map<string, DematHolding[]>();

// Validation schemas
const addHoldingSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
  segment: z.enum(['equity', 'mutual_fund', 'ipo']),
  exchange: z.enum(['NSE', 'BSE']),
});

// Get all holdings
holdingsRouter.get('/', (_req: Request, res: Response) => {
  const totalValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.currentPrice,
    0
  );
  const totalInvestment = holdings.reduce(
    (sum, h) => sum + h.quantity * h.avgPrice,
    0
  );
  const totalPnL = totalValue - totalInvestment;
  const totalPnLPercent = ((totalPnL / totalInvestment) * 100).toFixed(2);

  res.json({
    success: true,
    holdings,
    summary: {
      totalHoldings: holdings.length,
      totalValue,
      totalInvestment,
      totalPnL,
      totalPnLPercent: parseFloat(totalPnLPercent),
    },
  });
});

// Get holdings by segment
holdingsRouter.get('/segment/:segment', (req: Request, res: Response) => {
  const segment = req.params.segment as 'equity' | 'mutual_fund' | 'ipo';
  const filtered = holdings.filter((h) => h.segment === segment);

  res.json({
    success: true,
    segment,
    holdings: filtered,
    count: filtered.length,
  });
});

// Get specific holding
holdingsRouter.get('/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  const holding = holdings.find((h) => h.symbol === symbol);

  if (!holding) {
    return res.status(404).json({ error: 'Holding not found' });
  }

  const value = holding.quantity * holding.currentPrice;
  const investment = holding.quantity * holding.avgPrice;
  const pnl = value - investment;
  const pnlPercent = ((pnl / investment) * 100).toFixed(2);

  res.json({
    success: true,
    holding,
    analytics: {
      currentValue: value,
      totalInvestment: investment,
      pnl,
      pnlPercent: parseFloat(pnlPercent),
      dayChange: 0,
    },
  });
});

// Add new holding
holdingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = addHoldingSchema.parse(req.body);

    const newHolding: Holding = {
      ...data,
      currentPrice: data.avgPrice,
    };

    holdings.push(newHolding);

    res.status(201).json({
      success: true,
      message: 'Holding added successfully',
      holding: newHolding,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get demat holdings
holdingsRouter.get('/demat/all', (_req: Request, res: Response) => {
  const userId = 'user_123'; // In production, get from auth
  const userDematHoldings = dematHoldings.get(userId) || [];

  res.json({
    success: true,
    holdings: userDematHoldings,
    count: userDematHoldings.length,
  });
});

// Get available segments for trading
holdingsRouter.get('/segments/available', (_req: Request, res: Response) => {
  const availableSegments = [
    {
      id: 'equity',
      name: 'Equity Delivery',
      description: 'Buy and hold stocks for delivery',
      enabled: true,
    },
    {
      id: 'intraday',
      name: 'Intraday Trading',
      description: 'Buy and sell within same day',
      enabled: true,
    },
    {
      id: 'mutual_fund',
      name: 'Mutual Funds',
      description: 'SIP and lump sum investments',
      enabled: true,
    },
    {
      id: 'ipo',
      name: 'IPO',
      description: 'Initial Public Offerings',
      enabled: true,
    },
    {
      id: 'commodity',
      name: 'Commodity',
      description: 'Trade in commodities',
      enabled: false,
    },
    {
      id: 'currency',
      name: 'Currency',
      description: 'Forex trading',
      enabled: false,
    },
  ];

  res.json({
    success: true,
    segments: availableSegments,
  });
});
