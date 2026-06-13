// Jest setup file
jest.setTimeout(10000);

// Mock environment variables
process.env.SERVICE_NAME = 'investor-twin-service';
process.env.SERVICE_PORT = '4030';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/investor_twin_test';
process.env.RABBITMQ_URI = 'amqp://localhost:5672';
process.env.LOG_LEVEL = 'error';

// Mock message broker to avoid actual connections in tests
jest.mock('../src/utils/message-broker', () => ({
  messageBroker: {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true)
  }
}));

// Mock external service clients
jest.mock('../src/utils/trading-client', () => ({
  tradingClient: {
    placeOrder: jest.fn().mockResolvedValue({ orderId: 'test-order', status: 'pending' }),
    getOrderStatus: jest.fn().mockResolvedValue({ status: 'executed', filledQuantity: 100 }),
    cancelOrder: jest.fn().mockResolvedValue({ success: true }),
    getPositions: jest.fn().mockResolvedValue([]),
    getBalance: jest.fn().mockResolvedValue({ cash: 10000, buyingPower: 10000 })
  }
}));

jest.mock('../src/utils/portfolio-client', () => ({
  portfolioClient: {
    syncPortfolio: jest.fn().mockResolvedValue({ success: true }),
    getPerformance: jest.fn().mockResolvedValue({
      totalReturn: 5,
      annualizedReturn: 10,
      volatility: 15,
      sharpeRatio: 0.8
    }),
    getAllocation: jest.fn().mockResolvedValue({
      assetAllocation: [],
      sectorAllocation: []
    }),
    rebalance: jest.fn().mockResolvedValue({ trades: [] })
  }
}));

jest.mock('../src/utils/risk-analytics-client', () => ({
  riskAnalyticsClient: {
    calculateRiskMetrics: jest.fn().mockResolvedValue({
      beta: 1,
      alpha: 0,
      sharpeRatio: 0.8,
      sortinoRatio: 1,
      maxDrawdown: 10,
      var95: 5,
      cvar95: 7,
      volatility: 15
    }),
    getVaRAnalysis: jest.fn().mockResolvedValue({
      var: 5,
      cvar: 7,
      scenario: 'historical'
    }),
    checkCompliance: jest.fn().mockResolvedValue({
      isCompliant: true,
      violations: []
    }),
    getStressTest: jest.fn().mockResolvedValue({
      scenario: 'market_crash',
      expectedLoss: 10000,
      lossPercentage: 20,
      recoveryTime: '6 months'
    })
  }
}));

jest.mock('../src/utils/market-data-client', () => ({
  marketDataClient: {
    getQuote: jest.fn().mockResolvedValue({
      symbol: 'AAPL',
      price: 150,
      change: 2,
      changePercent: 1.35,
      volume: 1000000,
      timestamp: new Date().toISOString()
    }),
    getQuotes: jest.fn().mockResolvedValue([
      { symbol: 'AAPL', price: 150, change: 2, changePercent: 1.35 }
    ]),
    getHistoricalPrices: jest.fn().mockResolvedValue([]),
    getMarketMovers: jest.fn().mockResolvedValue([]),
    searchSecurities: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../src/utils/rez-dashboard-client', () => ({
  rezDashboardClient: {
    notifyInvestorUpdate: jest.fn().mockResolvedValue(undefined),
    syncInvestorData: jest.fn().mockResolvedValue(undefined),
    pushMetricsUpdate: jest.fn().mockResolvedValue(undefined)
  }
}));

// Global test cleanup
afterAll(async () => {
  // Clean up any open handles
  await new Promise(resolve => setTimeout(resolve, 100));
});
