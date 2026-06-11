import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4914;

app.use(express.json());

// Types
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'land' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;
  features: string[];
  lastSalePrice?: number;
  lastSaleDate?: string;
  createdAt: string;
}

interface Valuation {
  id: string;
  propertyId: string;
  property: Property;
  estimatedValue: number;
  valueRange: { low: number; high: number };
  pricePerSqFt: number;
  confidence: 'high' | 'medium' | 'low';
  factors: ValuationFactor[];
  comparableSales: ComparableProperty[];
  marketConditions: MarketConditions;
  investmentMetrics?: InvestmentMetrics;
  createdAt: string;
  expiresAt: string;
}

interface ValuationFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

interface ComparableProperty {
  id: string;
  address: string;
  salePrice: number;
  pricePerSqFt: number;
  distance: number; // miles from subject
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  saleDate: string;
  similarity: number; // percentage
}

interface MarketConditions {
  trend: 'appreciation' | 'stable' | 'depreciation';
  trendPercentage: number;
  daysOnMarket: number;
  inventoryLevel: 'low' | 'medium' | 'high';
  buyerDemand: 'high' | 'medium' | 'low';
  monthsOfSupply: number;
}

interface InvestmentMetrics {
  capRate: number;
  cashOnCashReturn: number;
  grossRentMultiplier: number;
  netOperatingIncome: number;
  annualAppreciation: number;
  totalReturn: number;
}

interface PriceTrend {
  month: string;
  averagePrice: number;
  medianPrice: number;
  salesVolume: number;
  newListings: number;
}

interface MarketAnalysis {
  city: string;
  state: string;
  currentMedianPrice: number;
  yearOverYearChange: number;
  monthOverMonthChange: number;
  priceTrends: PriceTrend[];
  marketConditions: MarketConditions;
  topNeighborhoods: Neighborhood[];
  forecast: MarketForecast;
}

interface Neighborhood {
  name: string;
  medianPrice: number;
  yearOverYearChange: number;
  avgDaysOnMarket: number;
  trend: 'hot' | 'stable' | 'cooling';
}

interface MarketForecast {
  nextMonth: { direction: 'up' | 'down' | 'stable'; percentage: number };
  nextQuarter: { direction: 'up' | 'down' | 'stable'; percentage: number };
  nextYear: { direction: 'up' | 'down' | 'stable'; percentage: number };
}

// In-memory storage
const properties: Map<string, Property> = new Map();
const valuations: Map<string, Valuation> = new Map();

// ============================================
// SAMPLE DATA
// ============================================

const sampleMarketConditions: MarketConditions = {
  trend: 'appreciation',
  trendPercentage: 8.5,
  daysOnMarket: 28,
  inventoryLevel: 'low',
  buyerDemand: 'high',
  monthsOfSupply: 2.1
};

const generateSamplePriceTrends = (): PriceTrend[] => {
  const trends: PriceTrend[] = [];
  const basePrice = 450000;

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    trends.push({
      month: date.toISOString().slice(0, 7),
      averagePrice: basePrice + (11 - i) * 5000 + Math.random() * 10000,
      medianPrice: basePrice + (11 - i) * 4800 + Math.random() * 8000,
      salesVolume: 150 + Math.floor(Math.random() * 50),
      newListings: 180 + Math.floor(Math.random() * 40)
    });
  }

  return trends;
};

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'PROPFLOW Valuation AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// PROPERTY ENDPOINTS
// ============================================

// Create/register a property
app.post('/api/properties', (req: Request, res: Response) => {
  const {
    address,
    city,
    state,
    zipCode,
    propertyType,
    bedrooms,
    bathrooms,
    squareFeet,
    lotSize,
    yearBuilt,
    features,
    lastSalePrice,
    lastSaleDate
  } = req.body;

  if (!address || !city || !state || !propertyType) {
    return res.status(400).json({ error: 'Address, city, state, and property type are required' });
  }

  const property: Property = {
    id: uuidv4(),
    address,
    city,
    state,
    zipCode: zipCode || '',
    propertyType,
    bedrooms: bedrooms || 0,
    bathrooms: bathrooms || 0,
    squareFeet: squareFeet || 0,
    lotSize: lotSize || 0,
    yearBuilt: yearBuilt || 0,
    features: features || [],
    lastSalePrice,
    lastSaleDate,
    createdAt: new Date().toISOString()
  };

  properties.set(property.id, property);

  res.status(201).json({
    message: 'Property registered successfully',
    propertyId: property.id,
    property
  });
});

// Get property by ID
app.get('/api/properties/:id', (req: Request, res: Response) => {
  const property = properties.get(req.params.id);

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  res.json(property);
});

// Get all properties
app.get('/api/properties', (req: Request, res: Response) => {
  const { city, state, propertyType, minBedrooms, maxPrice } = req.query;

  let filteredProperties = Array.from(properties.values());

  if (city) {
    filteredProperties = filteredProperties.filter(p =>
      p.city.toLowerCase() === (city as string).toLowerCase()
    );
  }
  if (state) {
    filteredProperties = filteredProperties.filter(p =>
      p.state.toLowerCase() === (state as string).toLowerCase()
    );
  }
  if (propertyType) {
    filteredProperties = filteredProperties.filter(p => p.propertyType === propertyType);
  }
  if (minBedrooms) {
    filteredProperties = filteredProperties.filter(p => p.bedrooms >= Number(minBedrooms));
  }

  res.json({
    count: filteredProperties.length,
    properties: filteredProperties
  });
});

// ============================================
// VALUATION ENDPOINTS
// ============================================

// Calculate property valuation
app.post('/api/valuations', (req: Request, res: Response) => {
  const { propertyId, property } = req.body;

  if (!propertyId && !property) {
    return res.status(400).json({ error: 'Either propertyId or property details are required' });
  }

  let prop: Property;

  if (propertyId) {
    prop = properties.get(propertyId) as Property;
    if (!prop) {
      return res.status(404).json({ error: 'Property not found' });
    }
  } else {
    prop = property as Property;
    prop.id = propertyId || uuidv4();
    prop.createdAt = new Date().toISOString();
  }

  // Calculate valuation
  const valuation = calculateValuation(prop);

  valuations.set(valuation.id, valuation);

  res.status(201).json({
    message: 'Valuation completed',
    valuationId: valuation.id,
    valuation
  });
});

// Get valuation by ID
app.get('/api/valuations/:id', (req: Request, res: Response) => {
  const valuation = valuations.get(req.params.id);

  if (!valuation) {
    return res.status(404).json({ error: 'Valuation not found' });
  }

  res.json(valuation);
});

// Get valuations for a property
app.get('/api/properties/:propertyId/valuations', (req: Request, res: Response) => {
  const propertyValuations = Array.from(valuations.values())
    .filter(v => v.propertyId === req.params.propertyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    count: propertyValuations.length,
    valuations: propertyValuations
  });
});

// Get latest valuation for a property
app.get('/api/properties/:propertyId/valuations/latest', (req: Request, res: Response) => {
  const propertyValuations = Array.from(valuations.values())
    .filter(v => v.propertyId === req.params.propertyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (propertyValuations.length === 0) {
    return res.status(404).json({ error: 'No valuations found for this property' });
  }

  res.json(propertyValuations[0]);
});

// ============================================
// VALUATION CALCULATION LOGIC
// ============================================

function calculateValuation(prop: Property): Valuation {
  // Base value calculation per square foot based on property type
  const basePricePerSqFt: Record<string, number> = {
    single_family: 250,
    multi_family: 200,
    condo: 300,
    townhouse: 275,
    land: 50,
    commercial: 350
  };

  const basePricePerSqFtValue = basePricePerSqFt[prop.propertyType] || 250;

  // Calculate base estimated value
  let estimatedValue = prop.squareFeet * basePricePerSqFtValue;

  // Adjustments
  let adjustments = 0;

  // Age adjustment
  const age = new Date().getFullYear() - prop.yearBuilt;
  if (age > 30) {
    adjustments -= estimatedValue * 0.1; // 10% deduction for old properties
  } else if (age < 10) {
    adjustments += estimatedValue * 0.05; // 5% premium for new properties
  }

  // Bedroom/bathroom adjustment
  if (prop.bedrooms > 4) {
    adjustments += 15000;
  }
  if (prop.bathrooms >= 3) {
    adjustments += 10000;
  }

  // Lot size premium
  if (prop.lotSize > 10000) {
    adjustments += (prop.lotSize - 10000) * 0.5;
  }

  // Apply adjustments
  estimatedValue += adjustments;

  // Generate factors
  const factors: ValuationFactor[] = [
    {
      name: 'Location',
      impact: 'positive',
      description: `${prop.city}, ${prop.state} is in a high-demand area`,
      weight: 0.25
    },
    {
      name: 'Property Age',
      impact: age < 10 ? 'positive' : age > 30 ? 'negative' : 'neutral',
      description: age < 10 ? 'Recently built property' : age > 30 ? 'Older property may need updates' : 'Average age property',
      weight: 0.15
    },
    {
      name: 'Size & Layout',
      impact: prop.squareFeet > 2000 ? 'positive' : 'neutral',
      description: `${prop.squareFeet} sq ft with ${prop.bedrooms} beds and ${prop.bathrooms} baths`,
      weight: 0.20
    },
    {
      name: 'Market Conditions',
      impact: 'positive',
      description: 'Current market shows appreciation trend',
      weight: 0.25
    },
    {
      name: 'Property Type',
      impact: 'neutral',
      description: `${prop.propertyType.replace('_', ' ')} in normal demand`,
      weight: 0.15
    }
  ];

  // Generate comparable properties
  const comparableSales: ComparableProperty[] = generateComparables(prop, estimatedValue);

  // Calculate confidence based on comparables
  const avgSimilarity = comparableSales.reduce((sum, c) => sum + c.similarity, 0) / comparableSales.length;
  const confidence: 'high' | 'medium' | 'low' =
    avgSimilarity > 85 ? 'high' : avgSimilarity > 70 ? 'medium' : 'low';

  // Calculate value range
  const valueRange = {
    low: Math.round(estimatedValue * 0.95),
    high: Math.round(estimatedValue * 1.05)
  };

  // Set expiration (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    id: uuidv4(),
    propertyId: prop.id,
    property: prop,
    estimatedValue: Math.round(estimatedValue),
    valueRange,
    pricePerSqFt: Math.round(estimatedValue / prop.squareFeet),
    confidence,
    factors,
    comparableSales,
    marketConditions: sampleMarketConditions,
    investmentMetrics: calculateInvestmentMetrics(estimatedValue, prop),
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

function generateComparables(prop: Property, estimatedValue: number): ComparableProperty[] {
  const comparables: ComparableProperty[] = [];
  const basePrice = estimatedValue * 0.95;

  for (let i = 0; i < 5; i++) {
    const variance = (Math.random() - 0.5) * 0.1; // +/- 5%
    const salePrice = Math.round(basePrice * (1 + variance));

    comparables.push({
      id: uuidv4(),
      address: `${100 + i * 50} ${['Oak', 'Maple', 'Pine', 'Cedar', 'Elm'][i]} Street`,
      salePrice,
      pricePerSqFt: Math.round(salePrice / prop.squareFeet),
      distance: 0.1 + i * 0.2,
      squareFeet: prop.squareFeet + Math.floor((Math.random() - 0.5) * 400),
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      saleDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      similarity: 95 - i * 3
    });
  }

  return comparables;
}

function calculateInvestmentMetrics(estimatedValue: number, prop: Property): InvestmentMetrics {
  const estimatedRent = estimatedValue * 0.005; // Rough rent estimate (0.5% of value monthly)
  const annualRent = estimatedRent * 12;
  const operatingExpenses = annualRent * 0.4; // 40% operating expenses

  const grossRentMultiplier = estimatedValue / annualRent;
  const netOperatingIncome = annualRent - operatingExpenses;
  const capRate = (netOperatingIncome / estimatedValue) * 100;
  const cashOnCashReturn = capRate * 0.6; // Assuming 40% down payment

  return {
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
    netOperatingIncome: Math.round(netOperatingIncome),
    annualAppreciation: 3.0 + Math.random() * 2,
    totalReturn: Math.round((cashOnCashReturn + 3) * 100) / 100
  };
}

// ============================================
// MARKET ANALYSIS ENDPOINTS
// ============================================

// Get market analysis for a location
app.get('/api/market-analysis', (req: Request, res: Response) => {
  const { city, state } = req.query;

  if (!city || !state) {
    return res.status(400).json({ error: 'City and state are required' });
  }

  const analysis: MarketAnalysis = {
    city: city as string,
    state: state as string,
    currentMedianPrice: 450000 + Math.random() * 100000,
    yearOverYearChange: 8.5,
    monthOverMonthChange: 1.2,
    priceTrends: generateSamplePriceTrends(),
    marketConditions: sampleMarketConditions,
    topNeighborhoods: [
      {
        name: 'Downtown',
        medianPrice: 550000,
        yearOverYearChange: 12.5,
        avgDaysOnMarket: 18,
        trend: 'hot'
      },
      {
        name: 'Suburbs North',
        medianPrice: 475000,
        yearOverYearChange: 8.2,
        avgDaysOnMarket: 25,
        trend: 'hot'
      },
      {
        name: 'Suburbs South',
        medianPrice: 420000,
        yearOverYearChange: 6.5,
        avgDaysOnMarket: 30,
        trend: 'stable'
      },
      {
        name: 'West Side',
        medianPrice: 385000,
        yearOverYearChange: 4.2,
        avgDaysOnMarket: 45,
        trend: 'cooling'
      }
    ],
    forecast: {
      nextMonth: { direction: 'up', percentage: 0.8 },
      nextQuarter: { direction: 'up', percentage: 2.5 },
      nextYear: { direction: 'up', percentage: 7.5 }
    }
  };

  res.json(analysis);
});

// Get price trends
app.get('/api/price-trends', (req: Request, res: Response) => {
  const { city, state, months } = req.query;

  if (!city || !state) {
    return res.status(400).json({ error: 'City and state are required' });
  }

  const trendMonths = months ? parseInt(months as string) : 12;
  const trends: PriceTrend[] = [];
  const basePrice = 450000;

  for (let i = trendMonths - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    trends.push({
      month: date.toISOString().slice(0, 7),
      averagePrice: basePrice + (trendMonths - i) * 4000 + Math.random() * 8000,
      medianPrice: basePrice + (trendMonths - i) * 3800 + Math.random() * 6000,
      salesVolume: 150 + Math.floor(Math.random() * 50),
      newListings: 180 + Math.floor(Math.random() * 40)
    });
  }

  res.json({
    city,
    state,
    trends
  });
});

// ============================================
// INVESTMENT ANALYSIS ENDPOINTS
// ============================================

// Get investment analysis for a property
app.post('/api/investment-analysis', (req: Request, res: Response) => {
  const { propertyValue, rentalIncome, downPayment, interestRate, loanTerm } = req.body;

  if (!propertyValue || !rentalIncome) {
    return res.status(400).json({ error: 'Property value and rental income are required' });
  }

  const annualRent = rentalIncome * 12;
  const operatingExpenses = annualRent * 0.4;
  const netOperatingIncome = annualRent - operatingExpenses;
  const capRate = (netOperatingIncome / propertyValue) * 100;

  const loanAmount = propertyValue - (downPayment || propertyValue * 0.2);
  const monthlyRate = (interestRate || 7) / 100 / 12;
  const numPayments = (loanTerm || 30) * 12;
  const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  const annualDebtService = monthlyMortgage * 12;

  const cashFlow = netOperatingIncome - annualDebtService;
  const cashOnCashReturn = (cashFlow / (downPayment || propertyValue * 0.2)) * 100;

  const investmentMetrics: InvestmentMetrics = {
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    grossRentMultiplier: Math.round((propertyValue / annualRent) * 100) / 100,
    netOperatingIncome: Math.round(netOperatingIncome),
    annualAppreciation: 3.0 + Math.random() * 2,
    totalReturn: Math.round((cashOnCashReturn + 3.5) * 100) / 100
  };

  res.json({
    propertyValue,
    annualRent,
    operatingExpenses: Math.round(operatingExpenses),
    netOperatingIncome: Math.round(netOperatingIncome),
    annualDebtService: Math.round(annualDebtService),
    annualCashFlow: Math.round(cashFlow),
    monthlyCashFlow: Math.round(cashFlow / 12),
    investmentMetrics
  });
});

// ============================================
// COMPARABLE ANALYSIS ENDPOINTS
// ============================================

// Get comparables for a property
app.post('/api/comparables', (req: Request, res: Response) => {
  const { address, city, state, propertyType, squareFeet, bedrooms, bathrooms } = req.body;

  if (!city || !state) {
    return res.status(400).json({ error: 'City and state are required' });
  }

  const estimatedValue = (squareFeet || 2000) * 250;
  const comparables: ComparableProperty[] = [];

  for (let i = 0; i < 6; i++) {
    const variance = (Math.random() - 0.5) * 0.15;
    const salePrice = Math.round(estimatedValue * (1 + variance));

    comparables.push({
      id: uuidv4(),
      address: `${100 + i * 50} ${['Oak', 'Maple', 'Pine', 'Cedar', 'Elm', 'Birch'][i]} ${
        ['Street', 'Avenue', 'Drive', 'Lane', 'Court', 'Way'][i]
      }`,
      salePrice,
      pricePerSqFt: Math.round(salePrice / (squareFeet || 2000)),
      distance: 0.2 + i * 0.15,
      squareFeet: (squareFeet || 2000) + Math.floor((Math.random() - 0.5) * 400),
      bedrooms: bedrooms || 3,
      bathrooms: bathrooms || 2,
      saleDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      similarity: 92 - i * 4
    });
  }

  // Sort by similarity
  comparables.sort((a, b) => b.similarity - a.similarity);

  const avgPrice = comparables.reduce((sum, c) => sum + c.salePrice, 0) / comparables.length;
  const avgPricePerSqFt = comparables.reduce((sum, c) => sum + c.pricePerSqFt, 0) / comparables.length;

  res.json({
    subjectProperty: { address, city, state, propertyType },
    comparables,
    summary: {
      count: comparables.length,
      averagePrice: Math.round(avgPrice),
      averagePricePerSqFt: Math.round(avgPricePerSqFt),
      medianPrice: comparables[Math.floor(comparables.length / 2)].salePrice,
      priceRange: {
        low: Math.min(...comparables.map(c => c.salePrice)),
        high: Math.max(...comparables.map(c => c.salePrice))
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PROPFLOW Valuation AI Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Valuation: http://localhost:${PORT}/api/valuations`);
  console.log(`Market Analysis: http://localhost:${PORT}/api/market-analysis`);
  console.log(`Investment Analysis: http://localhost:${PORT}/api/investment-analysis`);
  console.log(`Comparables: http://localhost:${PORT}/api/comparables`);
});
