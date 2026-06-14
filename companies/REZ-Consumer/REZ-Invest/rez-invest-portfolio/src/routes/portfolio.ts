import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const portfolioRouter = Router();

// Types
interface Holding {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  segment: 'equity' | 'mutual_fund' | 'ipo';
  isin?: string;
}

interface Position {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  productType: 'CNC' | 'INTRADAY' | 'MTF';
}

interface Transaction {
  id: string;
  date: Date;
  type: 'buy' | 'sell' | 'dividend' | 'sip' | 'split';
  symbol: string;
  quantity: number;
  price: number;
  amount: number;
  exchange: 'NSE' | 'BSE';
}

interface Allocation {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

// Mock holdings data
const holdings: Holding[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    quantity: 100,
    avgPrice: 2500,
    currentPrice: 2750,
    segment: 'equity',
    isin: 'INE002A01018',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    quantity: 50,
    avgPrice: 1650,
    currentPrice: 1720,
    segment: 'equity',
    isin: 'INE040A01034',
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    quantity: 25,
    avgPrice: 3600,
    currentPrice: 3850,
    segment: 'equity',
    isin: 'INE467B01029',
  },
  {
    symbol: 'ICICIPRULI',
    name: 'ICICI Prudential Bluechip Fund',
    exchange: 'NSE',
    quantity: 500,
    avgPrice: 120,
    currentPrice: 135,
    segment: 'mutual_fund',
  },
  {
    symbol: 'NIPPOINDIA',
    name: 'Nippon India Small Cap Fund',
    exchange: 'NSE',
    quantity: 1000,
    avgPrice: 85,
    currentPrice: 95,
    segment: 'mutual_fund',
  },
];

const positions: Position[] = [
  {
    symbol: 'RELIANCE',
    exchange: 'NSE',
    quantity: 100,
    avgPrice: 2500,
    currentPrice: 2750,
    pnl: 25000,
    pnlPercent: 10,
    productType: 'CNC',
  },
  {
    symbol: 'HDFCBANK',
    exchange: 'NSE',
    quantity: 50,
    avgPrice: 1650,
    currentPrice: 1720,
    pnl: 3500,
    pnlPercent: 4.24,
    productType: 'CNC',
  },
  {
    symbol: 'INFY',
    exchange: 'NSE',
    quantity: 30,
    avgPrice: 1450,
    currentPrice: 1480,
    pnl: 900,
    pnlPercent: 2.07,
    productType: 'INTRADAY',
  },
];

const transactions: Transaction[] = [
  {
    id: 'txn_001',
    date: new Date('2024-01-10'),
    type: 'buy',
    symbol: 'RELIANCE',
    quantity: 50,
    price: 2480,
    amount: 124000,
    exchange: 'NSE',
  },
  {
    id: 'txn_002',
    date: new Date('2024-01-12'),
    type: 'buy',
    symbol: 'RELIANCE',
    quantity: 50,
    price: 2520,
    amount: 126000,
    exchange: 'NSE',
  },
  {
    id: 'txn_003',
    date: new Date('2024-01-15'),
    type: 'sip',
    symbol: 'ICICIPRULI',
    quantity: 50,
    price: 120,
    amount: 6000,
    exchange: 'NSE',
  },
  {
    id: 'txn_004',
    date: new Date('2024-01-20'),
    type: 'dividend',
    symbol: 'HDFCBANK',
    quantity: 0,
    price: 0,
    amount: 500,
    exchange: 'NSE',
  },
];

// Calculate portfolio metrics
function calculatePortfolioMetrics() {
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalInvestment = holdings.reduce((sum, h) => sum + h.quantity * h.avgPrice, 0);
  const totalPnL = totalValue - totalInvestment;
  const totalPnLPercent = ((totalPnL / totalInvestment) * 100);

  return {
    totalValue,
    totalInvestment,
    totalPnL,
    totalPnLPercent,
    dayChange: 0,
    dayChangePercent: 0,
  };
}

// Get all holdings
portfolioRouter.get('/holdings', (_req: Request, res: Response) => {
  const userId = 'user_123';

  const holdingsWithPnL = holdings.map((h) => {
    const value = h.quantity * h.currentPrice;
    const investment = h.quantity * h.avgPrice;
    const pnl = value - investment;
    const pnlPercent = ((pnl / investment) * 100);

    return {
      ...h,
      currentValue: value,
      investment,
      pnl,
      pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    };
  });

  const metrics = calculatePortfolioMetrics();

  res.json({
    success: true,
    holdings: holdingsWithPnL,
    metrics,
    count: holdings.length,
  });
});

// Get specific holding
portfolioRouter.get('/holdings/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  const holding = holdings.find((h) => h.symbol === symbol);

  if (!holding) {
    return res.status(404).json({ error: 'Holding not found' });
  }

  const value = holding.quantity * holding.currentPrice;
  const investment = holding.quantity * holding.avgPrice;
  const pnl = value - investment;
  const pnlPercent = ((pnl / investment) * 100);

  // Get transaction history for this symbol
  const symbolTransactions = transactions.filter((t) => t.symbol === symbol);

  res.json({
    success: true,
    holding: {
      ...holding,
      currentValue: value,
      investment,
      pnl,
      pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    },
    transactions: symbolTransactions,
  });
});

// Get open positions
portfolioRouter.get('/positions', (_req: Request, res: Response) => {
  const totalM2M = positions.reduce((sum, p) => sum + p.pnl, 0);

  res.json({
    success: true,
    positions,
    summary: {
      totalPositions: positions.length,
      totalM2M: totalM2M,
    },
  });
});

// Get portfolio analytics
portfolioRouter.get('/analytics', (_req: Request, res: Response) => {
  const metrics = calculatePortfolioMetrics();

  // Mock historical data (last 7 days)
  const historicalData = [
    { date: '2024-01-18', value: metrics.totalValue - 5000 },
    { date: '2024-01-19', value: metrics.totalValue - 3000 },
    { date: '2024-01-20', value: metrics.totalValue - 1000 },
    { date: '2024-01-21', value: metrics.totalValue },
  ];

  // Top gainers and losers
  const holdingsWithPnL = holdings.map((h) => ({
    symbol: h.symbol,
    pnl: (h.currentPrice - h.avgPrice) * h.quantity,
    pnlPercent: ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100,
  }));

  const sorted = [...holdingsWithPnL].sort((a, b) => b.pnlPercent - a.pnlPercent);
  const topGainers = sorted.slice(0, 3);
  const topLosers = sorted.slice(-3).reverse();

  res.json({
    success: true,
    analytics: {
      metrics,
      historicalData,
      topGainers,
      topLosers,
    },
  });
});

// Get P&L summary
portfolioRouter.get('/pnl', (_req: Request, res: Response) => {
  const metrics = calculatePortfolioMetrics();

  // Calculate realized vs unrealized
  const realizedPnL = 5000; // Mock value
  const unrealizedPnL = metrics.totalPnL - realizedPnL;

  // Monthly P&L (mock data)
  const monthlyPnL = [
    { month: 'Oct 2024', pnl: 15000 },
    { month: 'Nov 2024', pnl: -5000 },
    { month: 'Dec 2024', pnl: 22000 },
    { month: 'Jan 2024', pnl: metrics.totalPnL },
  ];

  res.json({
    success: true,
    pnl: {
      total: metrics.totalPnL,
      totalPercent: metrics.totalPnLPercent,
      realized: realizedPnL,
      unrealized: unrealizedPnL,
      dayChange: metrics.dayChange,
      dayChangePercent: metrics.dayChangePercent,
    },
    monthlyPnL,
  });
});

// Get asset allocation
portfolioRouter.get('/allocation', (_req: Request, res: Response) => {
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  // Group by segment
  const bySegment: Record<string, number> = {};
  holdings.forEach((h) => {
    const value = h.quantity * h.currentPrice;
    bySegment[h.segment] = (bySegment[h.segment] || 0) + value;
  });

  const allocations: Allocation[] = [
    {
      category: 'Equity',
      value: bySegment['equity'] || 0,
      percentage: ((bySegment['equity'] || 0) / totalValue) * 100,
      color: '#4F46E5',
    },
    {
      category: 'Mutual Funds',
      value: bySegment['mutual_fund'] || 0,
      percentage: ((bySegment['mutual_fund'] || 0) / totalValue) * 100,
      color: '#10B981',
    },
    {
      category: 'IPO',
      value: bySegment['ipo'] || 0,
      percentage: ((bySegment['ipo'] || 0) / totalValue) * 100,
      color: '#F59E0B',
    },
  ];

  // Group by exchange
  const byExchange: Record<string, number> = {};
  holdings.forEach((h) => {
    const value = h.quantity * h.currentPrice;
    byExchange[h.exchange] = (byExchange[h.exchange] || 0) + value;
  });

  const exchangeAllocations: Allocation[] = [
    {
      category: 'NSE',
      value: byExchange['NSE'] || 0,
      percentage: ((byExchange['NSE'] || 0) / totalValue) * 100,
      color: '#3B82F6',
    },
    {
      category: 'BSE',
      value: byExchange['BSE'] || 0,
      percentage: ((byExchange['BSE'] || 0) / totalValue) * 100,
      color: '#EF4444',
    },
  ];

  res.json({
    success: true,
    totalValue,
    allocations,
    exchangeAllocations,
  });
});

// Get performance metrics
portfolioRouter.get('/performance', (_req: Request, res: Response) => {
  const metrics = calculatePortfolioMetrics();

  // Mock performance data
  const performance = {
    overall: {
      totalReturn: metrics.totalPnLPercent,
      annualizedReturn: 15.5,
      sharpeRatio: 1.2,
      beta: 0.95,
      alpha: 2.3,
    },
    comparisons: [
      { index: 'NIFTY 50', return: 12.5, relative: metrics.totalPnLPercent - 12.5 },
      { index: 'SENSEX', return: 11.8, relative: metrics.totalPnLPercent - 11.8 },
      { index: 'NIFTY 100', return: 13.2, relative: metrics.totalPnLPercent - 13.2 },
    ],
    riskMetrics: {
      volatility: 14.5,
      maxDrawdown: -8.2,
      standardDeviation: 12.3,
    },
  };

  res.json({
    success: true,
    performance,
  });
});

// Get transaction history
portfolioRouter.get('/transactions', (req: Request, res: Response) => {
  const type = req.query.type as 'buy' | 'sell' | 'dividend' | 'sip' | 'split' | undefined;

  let filteredTransactions = transactions;
  if (type) {
    filteredTransactions = transactions.filter((t) => t.type === type);
  }

  res.json({
    success: true,
    transactions: filteredTransactions,
    count: filteredTransactions.length,
  });
});

// Get holdings summary by segment
portfolioRouter.get('/holdings/by-segment', (_req: Request, res: Response) => {
  const bySegment: Record<string, { holdings: Holding[]; totalValue: number; totalInvestment: number; pnl: number }> = {};

  holdings.forEach((h) => {
    if (!bySegment[h.segment]) {
      bySegment[h.segment] = { holdings: [], totalValue: 0, totalInvestment: 0, pnl: 0 };
    }

    const value = h.quantity * h.currentPrice;
    const investment = h.quantity * h.avgPrice;

    bySegment[h.segment].holdings.push(h);
    bySegment[h.segment].totalValue += value;
    bySegment[h.segment].totalInvestment += investment;
    bySegment[h.segment].pnl += value - investment;
  });

  const segments = Object.entries(bySegment).map(([segment, data]) => ({
    segment,
    count: data.holdings.length,
    totalValue: data.totalValue,
    totalInvestment: data.totalInvestment,
    pnl: data.pnl,
    pnlPercent: ((data.pnl / data.totalInvestment) * 100).toFixed(2),
  }));

  res.json({
    success: true,
    segments,
  });
});
