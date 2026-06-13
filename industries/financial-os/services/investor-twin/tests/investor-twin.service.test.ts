import { InvestorTwinService } from '../src/services/investor-twin.service';
import { InvestorTwin } from '../src/models/investor-twin.model';
import { messageBroker } from '../src/utils/message-broker';
import { tradingClient } from '../src/utils/trading-client';
import { portfolioClient } from '../src/utils/portfolio-client';
import { marketDataClient } from '../src/utils/market-data-client';
import { InvestorType, RiskTolerance, InvestmentHorizon, AssetClass, Sector, TransactionType, OrderStatus } from '../src/schemas/investor-twin.schema';

// Mock the InvestorTwin model
jest.mock('../src/models/investor-twin.model');

describe('InvestorTwinService', () => {
  let service: InvestorTwinService;

  const mockInvestorTwin = {
    twinId: 'twin.investor.inv123',
    investorId: 'inv123',
    type: InvestorType.INDIVIDUAL,
    name: 'John Doe',
    firmName: 'Doe Investments',
    description: 'Individual investor focused on growth stocks',
    contact: {
      phone: '+1234567890',
      email: 'john@example.com',
      linkedIn: 'linkedin.com/in/johndoe'
    },
    taxId: '123-45-6789',
    riskProfile: {
      riskTolerance: RiskTolerance.AGGRESSIVE,
      investmentHorizon: InvestmentHorizon.LONG_TERM,
      maxDrawdownTolerance: 20,
      liquidityNeeds: 'low' as const,
      incomeRequirement: 5
    },
    portfolioAllocations: [
      { assetClass: AssetClass.EQUITIES, targetPercentage: 70, currentPercentage: 65, value: 65000, lastRebalanced: '2026-01-01' },
      { assetClass: AssetClass.FIXED_INCOME, targetPercentage: 20, currentPercentage: 25, value: 25000 },
      { assetClass: AssetClass.CASH, targetPercentage: 10, currentPercentage: 10, value: 10000 }
    ],
    sectorAllocations: [
      { sector: Sector.TECHNOLOGY, percentage: 40, value: 40000 },
      { sector: Sector.HEALTHCARE, percentage: 30, value: 30000 },
      { sector: Sector.FINANCIALS, percentage: 30, value: 30000 }
    ],
    currentMetrics: {
      totalReturn: 5000,
      annualizedReturn: 12,
      volatility: 18,
      sharpeRatio: 0.9,
      maxDrawdown: 8,
      beta: 1.1,
      alpha: 2,
      sortinoRatio: 1.2,
      var95: 5,
      cvar95: 7
    },
    holdings: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 100,
        averageCost: 140,
        currentPrice: 150,
        marketValue: 15000,
        unrealizedPL: 1000,
        unrealizedPLPercent: 7.14,
        dayChange: 2,
        dayChangePercent: 1.35,
        weight: 15,
        sector: Sector.TECHNOLOGY,
        assetClass: AssetClass.EQUITIES
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        quantity: 50,
        averageCost: 100,
        currentPrice: 140,
        marketValue: 7000,
        unrealizedPL: 2000,
        unrealizedPLPercent: 40,
        dayChange: 3,
        dayChangePercent: 2.19,
        weight: 7,
        sector: Sector.TECHNOLOGY,
        assetClass: AssetClass.EQUITIES
      }
    ],
    transactions: [],
    watchlist: [],
    investmentGoals: [],
    totalPortfolioValue: 100000,
    cashBalance: 10000,
    totalInvested: 95000,
    totalReturns: 5000,
    returnsPercent: 5.26,
    documents: [],
    preferences: {
      notifications: true,
      autoRebalance: false,
      rebalanceThreshold: 5,
      taxLossHarvesting: true,
      dividendReinvestment: false
    },
    status: 'active' as const,
    lastUpdated: '2026-06-12T00:00:00.000Z',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-12'),
    save: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({
      twinId: 'twin.investor.inv123',
      investorId: 'inv123',
      type: InvestorType.INDIVIDUAL,
      name: 'John Doe',
      totalPortfolioValue: 100000,
      status: 'active'
    })
  };

  beforeEach(() => {
    service = new InvestorTwinService();
    jest.clearAllMocks();
  });

  describe('createInvestorTwin', () => {
    const createRequest = {
      investorId: 'inv123',
      type: InvestorType.INDIVIDUAL,
      name: 'John Doe',
      firmName: 'Doe Investments',
      contact: {
        phone: '+1234567890',
        email: 'john@example.com'
      },
      riskProfile: {
        riskTolerance: RiskTolerance.AGGRESSIVE,
        investmentHorizon: InvestmentHorizon.LONG_TERM
      }
    };

    it('should create a new investor twin successfully', async () => {
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      (InvestorTwin as unknown as jest.Mock).mockImplementation(() => ({
        ...mockInvestorTwin,
        save: mockSave
      }));

      const result = await service.createInvestorTwin(createRequest);

      expect(result.twinId).toBe('twin.investor.inv123');
      expect(result.investorId).toBe('inv123');
      expect(result.twinOsEntityId).toBe('twin.investor.inv123');
      expect(mockSave).toHaveBeenCalled();
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'investor.twin.created',
        expect.any(Object)
      );
    });

    it('should throw error if investor twin already exists', async () => {
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockInvestorTwin);

      await expect(service.createInvestorTwin(createRequest)).rejects.toThrow(
        'Investor Twin already exists for investorId: inv123'
      );
    });
  });

  describe('getInvestorTwin', () => {
    it('should return investor twin if found', async () => {
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockInvestorTwin);

      const result = await service.getInvestorTwin('inv123');

      expect(result.investorId).toBe('inv123');
      expect(InvestorTwin.findByInvestorId).toHaveBeenCalledWith('inv123');
    });

    it('should throw error if investor twin not found', async () => {
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(null);

      await expect(service.getInvestorTwin('nonexistent')).rejects.toThrow(
        'Investor Twin not found for investorId: nonexistent'
      );
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return portfolio summary', async () => {
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockInvestorTwin);

      const result = await service.getPortfolioSummary('inv123');

      expect(result.investorId).toBe('inv123');
      expect(result.totalPortfolioValue).toBe(100000);
      expect(result.assetAllocation).toHaveLength(3);
      expect(result.topHoldings).toHaveLength(2);
    });
  });

  describe('updateRiskProfile', () => {
    it('should update risk profile successfully', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.updateRiskProfile('inv123', {
        riskProfile: {
          riskTolerance: RiskTolerance.CONSERVATIVE
        }
      });

      expect(result.riskProfile.riskTolerance).toBe(RiskTolerance.CONSERVATIVE);
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'investor.twin.risk.updated',
        expect.any(Object)
      );
    });

    it('should throw error if investor twin not found', async () => {
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateRiskProfile('nonexistent', {
          riskProfile: { riskTolerance: RiskTolerance.CONSERVATIVE }
        })
      ).rejects.toThrow('Investor Twin not found for investorId: nonexistent');
    });
  });

  describe('updateHoldings', () => {
    it('should update holdings successfully', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        cashBalance: 10000,
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      const newHoldings = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100,
          averageCost: 140,
          currentPrice: 150,
          marketValue: 15000,
          unrealizedPL: 1000,
          unrealizedPLPercent: 7.14,
          dayChange: 2,
          dayChangePercent: 1.35,
          weight: 15,
          sector: Sector.TECHNOLOGY,
          assetClass: AssetClass.EQUITIES
        }
      ];

      const result = await service.updateHoldings('inv123', { holdings: newHoldings });

      expect(result.holdings).toHaveLength(1);
      expect(result.totalPortfolioValue).toBe(25000); // 15000 + 10000 cash
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'investor.twin.holdings.updated',
        expect.any(Object)
      );
    });
  });

  describe('addTransaction', () => {
    it('should add transaction successfully', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        transactions: [],
        totalInvested: 95000,
        totalReturns: 5000,
        cashBalance: 10000,
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.addTransaction('inv123', {
        transaction: {
          type: TransactionType.BUY,
          symbol: 'MSFT',
          quantity: 50,
          price: 300,
          amount: 15000,
          fees: 10,
          timestamp: new Date().toISOString(),
          status: OrderStatus.EXECUTED
        }
      });

      expect(result.transaction.id).toBeDefined();
      expect(result.transaction.symbol).toBe('MSFT');
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'investor.twin.transaction.added',
        expect.any(Object)
      );
    });
  });

  describe('addToWatchlist', () => {
    it('should add to watchlist successfully', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        watchlist: [],
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.addToWatchlist('inv123', {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        targetPrice: 250,
        notes: 'Watching for entry point'
      });

      expect(result.watchlist).toHaveLength(1);
      expect(result.watchlist[0].symbol).toBe('TSLA');
    });

    it('should throw error if symbol already in watchlist', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        watchlist: [{ symbol: 'TSLA', name: 'Tesla Inc.', addedAt: new Date().toISOString() }],
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      await expect(
        service.addToWatchlist('inv123', {
          symbol: 'TSLA',
          name: 'Tesla Inc.'
        })
      ).rejects.toThrow('Symbol TSLA already in watchlist');
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove from watchlist successfully', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        watchlist: [
          { symbol: 'TSLA', name: 'Tesla Inc.', addedAt: new Date().toISOString() },
          { symbol: 'NVDA', name: 'NVIDIA Corp.', addedAt: new Date().toISOString() }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.removeFromWatchlist('inv123', { symbol: 'TSLA' });

      expect(result.watchlist).toHaveLength(1);
      expect(result.watchlist[0].symbol).toBe('NVDA');
    });

    it('should throw error if symbol not in watchlist', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        watchlist: [],
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      await expect(
        service.removeFromWatchlist('inv123', { symbol: 'TSLA' })
      ).rejects.toThrow('Symbol TSLA not found in watchlist');
    });
  });

  describe('listInvestors', () => {
    it('should list investors with pagination', async () => {
      const mockInvestors = [mockInvestorTwin];
      (InvestorTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockInvestors)
      });
      (InvestorTwin.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.listInvestors({
        type: InvestorType.INDIVIDUAL,
        limit: 10,
        offset: 0
      });

      expect(result.total).toBe(1);
      expect(result.investors).toHaveLength(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('deleteInvestorTwin', () => {
    it('should delete investor twin successfully', async () => {
      (InvestorTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await service.deleteInvestorTwin('inv123');

      expect(InvestorTwin.deleteOne).toHaveBeenCalledWith({ investorId: 'inv123' });
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'investor.twin.deleted',
        expect.any(Object)
      );
    });

    it('should throw error if investor twin not found', async () => {
      (InvestorTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteInvestorTwin('nonexistent')).rejects.toThrow(
        'Investor Twin not found for investorId: nonexistent'
      );
    });
  });

  describe('refreshMarketData', () => {
    it('should refresh market data for holdings', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        cashBalance: 10000,
        totalInvested: 95000,
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      (marketDataClient.getQuotes as jest.Mock).mockResolvedValue([
        { symbol: 'AAPL', price: 155, change: 2, changePercent: 1.35 },
        { symbol: 'GOOGL', price: 145, change: 3, changePercent: 2.19 }
      ]);

      const result = await service.refreshMarketData('inv123');

      expect(result.holdings).toBeDefined();
      expect(marketDataClient.getQuotes).toHaveBeenCalled();
    });

    it('should return early if no holdings', async () => {
      const mockTwin = {
        ...mockInvestorTwin,
        holdings: [],
        cashBalance: 10000,
        save: jest.fn().mockResolvedValue(true)
      };
      (InvestorTwin.findByInvestorId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.refreshMarketData('inv123');

      expect(result.holdings).toHaveLength(0);
      expect(marketDataClient.getQuotes).not.toHaveBeenCalled();
    });
  });
});
