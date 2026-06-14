import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const marketRouter = Router();

// Types
interface Quote {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  lastPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  dayHigh: number;
  dayLow: number;
  weekHigh: number;
  weekLow: number;
  upperCircuit: number;
  lowerCircuit: number;
  lastUpdated: Date;
}

interface Instrument {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  segment: 'equity' | 'derivative' | 'currency' | 'commodity';
  instrumentType: string;
  lotSize: number;
  tickSize: number;
}

interface Holiday {
  date: string;
  exchange: 'NSE' | 'BSE' | 'Both';
  description: string;
}

interface IPO {
  id: string;
  name: string;
  symbol: string;
  status: 'upcoming' | 'open' | 'closed' | 'listed';
  minLot: number;
  issuePrice: number;
  issueSize: number;
  gmp: number;
  listingPrice: number;
  openDate: Date;
  closeDate: Date;
  listingDate: Date;
}

// Mock market data
const quotes: Map<string, Quote> = new Map([
  ['RELIANCE', {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    lastPrice: 2750,
    change: 45,
    changePercent: 1.66,
    open: 2710,
    high: 2765,
    low: 2705,
    close: 2705,
    volume: 8500000,
    turnover: 23250000000,
    dayHigh: 2765,
    dayLow: 2705,
    weekHigh: 2850,
    weekLow: 2650,
    upperCircuit: 2975,
    lowerCircuit: 2435,
    lastUpdated: new Date(),
  }],
  ['HDFCBANK', {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    lastPrice: 1720,
    change: -12,
    changePercent: -0.69,
    open: 1732,
    high: 1745,
    low: 1710,
    close: 1732,
    volume: 4200000,
    turnover: 7224000000,
    dayHigh: 1745,
    dayLow: 1710,
    weekHigh: 1780,
    weekLow: 1680,
    upperCircuit: 1905,
    lowerCircuit: 1559,
    lastUpdated: new Date(),
  }],
  ['TCS', {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    lastPrice: 3850,
    change: 25,
    changePercent: 0.65,
    open: 3825,
    high: 3875,
    low: 3810,
    close: 3825,
    volume: 2100000,
    turnover: 8075000000,
    dayHigh: 3875,
    dayLow: 3810,
    weekHigh: 3950,
    weekLow: 3750,
    upperCircuit: 4207,
    lowerCircuit: 3442,
    lastUpdated: new Date(),
  }],
]);

const instruments: Instrument[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', segment: 'equity', instrumentType: 'EQ', lotSize: 1, tickSize: 0.05 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', segment: 'equity', instrumentType: 'EQ', lotSize: 1, tickSize: 0.05 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', segment: 'equity', instrumentType: 'EQ', lotSize: 1, tickSize: 0.05 },
  { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', segment: 'equity', instrumentType: 'EQ', lotSize: 1, tickSize: 0.05 },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'BSE', segment: 'equity', instrumentType: 'EQ', lotSize: 1, tickSize: 0.05 },
];

const holidays: Holiday[] = [
  { date: '2024-01-26', exchange: 'Both', description: 'Republic Day' },
  { date: '2024-03-08', exchange: 'Both', description: 'Mahashivratri' },
  { date: '2024-03-25', exchange: 'Both', description: 'Holi' },
  { date: '2024-04-11', exchange: 'Both', description: 'Ram Navami' },
  { date: '2024-04-17', exchange: 'Both', description: 'Id-ul-Fitr' },
];

const ipos: IPO[] = [
  {
    id: 'ipo_001',
    name: 'XYZ Pharmaceuticals Ltd',
    symbol: 'XYZPHARMA',
    status: 'open',
    minLot: 15,
    issuePrice: 250,
    issueSize: 500000000,
    gmp: 45,
    listingPrice: 0,
    openDate: new Date('2024-01-22'),
    closeDate: new Date('2024-01-25'),
    listingDate: new Date('2024-01-30'),
  },
  {
    id: 'ipo_002',
    name: 'ABC Technologies Ltd',
    symbol: 'ABCTECH',
    status: 'upcoming',
    minLot: 20,
    issuePrice: 0,
    issueSize: 1000000000,
    gmp: 0,
    listingPrice: 0,
    openDate: new Date('2024-02-01'),
    closeDate: new Date('2024-02-05'),
    listingDate: new Date('2024-02-10'),
  },
];

interface Watchlist {
  userId: string;
  symbols: string[];
}

// Mock watchlists
const watchlists = new Map<string, string[]>([
  ['user_123', ['RELIANCE', 'HDFCBANK', 'TCS']],
]);

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE']).optional(),
  segment: z.enum(['equity', 'derivative', 'currency', 'commodity']).optional(),
});

const addToWatchlistSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE']).optional(),
});

// Get quote for a symbol
marketRouter.get('/quotes/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  const quote = quotes.get(symbol);

  if (!quote) {
    return res.status(404).json({ error: 'Symbol not found' });
  }

  res.json({
    success: true,
    quote,
  });
});

// Get multiple quotes
marketRouter.post('/quotes/batch', (req: Request, res: Response) => {
  const { symbols } = req.body as { symbols: string[] };

  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({ error: 'Symbols array required' });
  }

  const results = symbols.map((s) => quotes.get(s.toUpperCase())).filter(Boolean);

  res.json({
    success: true,
    quotes: results,
    count: results.length,
  });
});

// Search instruments
marketRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string || '').toLowerCase();
    const exchange = req.query.exchange as 'NSE' | 'BSE' | undefined;
    const segment = req.query.segment as 'equity' | 'derivative' | 'currency' | 'commodity' | undefined;

    let results = instruments;

    if (query) {
      results = results.filter(
        (i) =>
          i.symbol.toLowerCase().includes(query) ||
          i.name.toLowerCase().includes(query)
      );
    }

    if (exchange) {
      results = results.filter((i) => i.exchange === exchange);
    }

    if (segment) {
      results = results.filter((i) => i.segment === segment);
    }

    res.json({
      success: true,
      instruments: results,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trading holidays
marketRouter.get('/holidays', (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const yearHolidays = holidays.filter((h) => h.date.startsWith(year.toString()));

  res.json({
    success: true,
    holidays: yearHolidays,
    count: yearHolidays.length,
  });
});

// Get IPOs
marketRouter.get('/ipos', (req: Request, res: Response) => {
  const status = req.query.status as 'upcoming' | 'open' | 'closed' | 'listed' | undefined;

  let results = ipos;
  if (status) {
    results = ipos.filter((i) => i.status === status);
  }

  res.json({
    success: true,
    ipos: results,
    count: results.length,
  });
});

// Get IPO details
marketRouter.get('/ipos/:id', (req: Request, res: Response) => {
  const ipoId = req.params.id;
  const ipo = ipos.find((i) => i.id === ipoId);

  if (!ipo) {
    return res.status(404).json({ error: 'IPO not found' });
  }

  res.json({
    success: true,
    ipo,
  });
});

// Get market indices
marketRouter.get('/indices', (_req: Request, res: Response) => {
  const indices = [
    {
      symbol: 'NIFTY 50',
      name: 'Nifty 50',
      lastPrice: 22150,
      change: 125,
      changePercent: 0.57,
    },
    {
      symbol: 'SENSEX',
      name: 'BSE Sensex',
      lastPrice: 73150,
      change: 450,
      changePercent: 0.62,
    },
    {
      symbol: 'NIFTY BANK',
      name: 'Nifty Bank',
      lastPrice: 47500,
      change: -100,
      changePercent: -0.21,
    },
    {
      symbol: 'NIFTY IT',
      name: 'Nifty IT',
      lastPrice: 38500,
      change: 300,
      changePercent: 0.79,
    },
  ];

  res.json({
    success: true,
    indices,
  });
});

// Get user watchlist
marketRouter.get('/watchlist', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const symbols = watchlists.get(userId) || [];

  const watchlistQuotes = symbols.map((s) => quotes.get(s)).filter(Boolean);

  res.json({
    success: true,
    watchlist: watchlistQuotes,
    symbols,
    count: symbols.length,
  });
});

// Add to watchlist
marketRouter.post('/watchlist', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = addToWatchlistSchema.parse(req.body);

    const symbols = watchlists.get(userId) || [];
    if (!symbols.includes(data.symbol)) {
      symbols.push(data.symbol.toUpperCase());
      watchlists.set(userId, symbols);
    }

    res.json({
      success: true,
      message: 'Added to watchlist',
      symbols,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from watchlist
marketRouter.delete('/watchlist/:symbol', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const symbol = req.params.symbol.toUpperCase();

  const symbols = watchlists.get(userId) || [];
  const index = symbols.indexOf(symbol);

  if (index > -1) {
    symbols.splice(index, 1);
    watchlists.set(userId, symbols);
  }

  res.json({
    success: true,
    message: 'Removed from watchlist',
    symbols,
  });
});

// Get market depth (order book)
marketRouter.get('/depth/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();

  if (!quotes.has(symbol)) {
    return res.status(404).json({ error: 'Symbol not found' });
  }

  // Mock depth data
  const depth = {
    symbol,
    bids: [
      { price: 2749.95, quantity: 100, orders: 5 },
      { price: 2749.90, quantity: 250, orders: 8 },
      { price: 2749.85, quantity: 150, orders: 4 },
      { price: 2749.80, quantity: 300, orders: 10 },
      { price: 2749.75, quantity: 200, orders: 6 },
    ],
    asks: [
      { price: 2750.00, quantity: 150, orders: 6 },
      { price: 2750.05, quantity: 200, orders: 7 },
      { price: 2750.10, quantity: 300, orders: 9 },
      { price: 2750.15, quantity: 250, orders: 8 },
      { price: 2750.20, quantity: 100, orders: 4 },
    ],
  };

  res.json({
    success: true,
    depth,
  });
});
