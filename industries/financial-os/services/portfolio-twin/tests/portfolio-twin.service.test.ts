import { PortfolioTwinService } from '../src/services/portfolio-twin.service.js';
import { PortfolioTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('PortfolioTwinService', () => {
  let service: PortfolioTwinService;

  beforeEach(() => {
    service = new PortfolioTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await PortfolioTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new portfolio twin', async () => {
      const data = {
        portfolio_id: 'PORT-001',
        investor_id: 'INV-001',
        name: 'Growth Portfolio',
        type: 'equity' as const,
        strategy: 'growth',
        inception_date: new Date().toISOString(),
        status: 'active' as const,
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.portfolio_id).toBe('PORT-001');
      expect(result.twin_id).toBe('twin.finance.portfolio.PORT-001');
      expect(result.investor_id).toBe('INV-001');
      expect(result.name).toBe('Growth Portfolio');
      expect(result.type).toBe('equity');
      expect(result.status).toBe('active');
    });

    it('should throw error if portfolio already exists', async () => {
      const data = {
        portfolio_id: 'PORT-002',
        investor_id: 'INV-001',
        name: 'Test Portfolio',
        inception_date: new Date().toISOString(),
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should create with holdings', async () => {
      const data = {
        portfolio_id: 'PORT-003',
        investor_id: 'INV-001',
        name: 'Portfolio with Holdings',
        inception_date: new Date().toISOString(),
        holdings: [
          {
            asset_id: 'AAPL',
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            cost_basis: 15000,
            current_value: 17500,
            weight: 70,
            unrealized_gain_loss: 2500,
            unrealized_gain_loss_pct: 16.67,
          },
          {
            asset_id: 'GOOGL',
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            quantity: 50,
            cost_basis: 5000,
            current_value: 7500,
            weight: 30,
            unrealized_gain_loss: 2500,
            unrealized_gain_loss_pct: 50,
          },
        ],
      };

      const result = await service.create(data);

      expect(result.holdings).toHaveLength(2);
      expect(result.holdings[0].ticker).toBe('AAPL');
      expect(result.holdings[1].ticker).toBe('GOOGL');
    });

    it('should initialize default performance metrics', async () => {
      const data = {
        portfolio_id: 'PORT-004',
        investor_id: 'INV-001',
        name: 'Empty Portfolio',
        inception_date: new Date().toISOString(),
      };

      const result = await service.create(data);

      expect(result.performance).toBeDefined();
      expect(result.performance.total_value).toBe(0);
      expect(result.performance.total_cost).toBe(0);
      expect(result.performance.ytd_return).toBe(0);
    });

    it('should initialize default risk metrics', async () => {
      const data = {
        portfolio_id: 'PORT-005',
        investor_id: 'INV-001',
        name: 'Risk Portfolio',
        inception_date: new Date().toISOString(),
      };

      const result = await service.create(data);

      expect(result.risk_metrics).toBeDefined();
      expect(result.risk_metrics.volatility).toBe(0);
      expect(result.risk_metrics.sharpe_ratio).toBe(0);
      expect(result.risk_metrics.beta).toBe(1);
    });
  });

  describe('getById', () => {
    it('should get portfolio twin by portfolio_id', async () => {
      const data = {
        portfolio_id: 'PORT-GET-001',
        investor_id: 'INV-001',
        name: 'Get Test',
        inception_date: new Date().toISOString(),
      };

      await service.create(data);
      const result = await service.getById('PORT-GET-001');

      expect(result).toBeDefined();
      expect(result?.portfolio_id).toBe('PORT-GET-001');
    });

    it('should get portfolio twin by twin_id', async () => {
      const data = {
        portfolio_id: 'PORT-GET-002',
        investor_id: 'INV-001',
        name: 'Get Test Twin ID',
        inception_date: new Date().toISOString(),
      };

      await service.create(data);
      const result = await service.getById('twin.finance.portfolio.PORT-GET-002');

      expect(result).toBeDefined();
      expect(result?.twin_id).toBe('twin.finance.portfolio.PORT-GET-002');
    });

    it('should return null for non-existent portfolio', async () => {
      const result = await service.getById('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create test portfolios
      for (let i = 1; i <= 25; i++) {
        await service.create({
          portfolio_id: `PORT-LIST-${i.toString().padStart(3, '0')}`,
          investor_id: i <= 15 ? 'INV-001' : 'INV-002',
          name: `Portfolio ${i}`,
          type: i <= 10 ? 'equity' : i <= 20 ? 'mixed' : 'fixed_income',
          inception_date: new Date().toISOString(),
        });
      }
    });

    it('should list portfolios with pagination', async () => {
      const result = await service.list({ page: 1, limit: 10 });

      expect(result.twins).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by investor_id', async () => {
      const result = await service.list({ investor_id: 'INV-001' });

      expect(result.twins).toHaveLength(15);
      expect(result.total).toBe(15);
    });

    it('should filter by type', async () => {
      const result = await service.list({ type: 'equity' });

      expect(result.twins).toHaveLength(10);
      expect(result.total).toBe(10);
    });

    it('should handle page 2', async () => {
      const result = await service.list({ page: 2, limit: 10 });

      expect(result.twins).toHaveLength(10);
      expect(result.page).toBe(2);
    });
  });

  describe('update', () => {
    it('should update portfolio twin', async () => {
      await service.create({
        portfolio_id: 'PORT-UPD-001',
        investor_id: 'INV-001',
        name: 'Original Name',
        inception_date: new Date().toISOString(),
      });

      const result = await service.update('PORT-UPD-001', {
        name: 'Updated Name',
        strategy: 'conservative',
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.strategy).toBe('conservative');
    });

    it('should return null for non-existent portfolio', async () => {
      const result = await service.update('NON-EXISTENT', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('addHolding', () => {
    it('should add a holding to portfolio', async () => {
      await service.create({
        portfolio_id: 'PORT-HOLD-001',
        investor_id: 'INV-001',
        name: 'Holding Test',
        inception_date: new Date().toISOString(),
      });

      const result = await service.addHolding('PORT-HOLD-001', {
        asset_id: 'TSLA',
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        quantity: 50,
        cost_basis: 10000,
        current_value: 12000,
      });

      expect(result).toBeDefined();
      expect(result?.holdings).toHaveLength(1);
      expect(result?.holdings[0].ticker).toBe('TSLA');
      expect(result?.holdings[0].unrealized_gain_loss).toBe(2000);
    });

    it('should calculate weight correctly', async () => {
      await service.create({
        portfolio_id: 'PORT-HOLD-002',
        investor_id: 'INV-001',
        name: 'Weight Test',
        inception_date: new Date().toISOString(),
      });

      // Add first holding
      await service.addHolding('PORT-HOLD-002', {
        asset_id: 'AAPL',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        quantity: 100,
        cost_basis: 10000,
        current_value: 10000,
      });

      // Add second holding
      const result = await service.addHolding('PORT-HOLD-002', {
        asset_id: 'GOOGL',
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        quantity: 50,
        cost_basis: 5000,
        current_value: 5000,
      });

      expect(result?.holdings[0].weight).toBeCloseTo(66.67, 1);
      expect(result?.holdings[1].weight).toBeCloseTo(33.33, 1);
    });
  });

  describe('updatePerformance', () => {
    it('should update performance metrics', async () => {
      await service.create({
        portfolio_id: 'PORT-PERF-001',
        investor_id: 'INV-001',
        name: 'Performance Test',
        inception_date: new Date().toISOString(),
      });

      const result = await service.updatePerformance('PORT-PERF-001', {
        total_value: 100000,
        day_change: 500,
        day_change_pct: 0.5,
        ytd_return: 12.5,
      });

      expect(result).toBeDefined();
      expect(result?.performance.total_value).toBe(100000);
      expect(result?.performance.day_change).toBe(500);
      expect(result?.performance.ytd_return).toBe(12.5);
    });
  });

  describe('updateRiskMetrics', () => {
    it('should update risk metrics', async () => {
      await service.create({
        portfolio_id: 'PORT-RISK-001',
        investor_id: 'INV-001',
        name: 'Risk Test',
        inception_date: new Date().toISOString(),
      });

      const result = await service.updateRiskMetrics('PORT-RISK-001', {
        volatility: 15.5,
        sharpe_ratio: 1.25,
        sortino_ratio: 1.5,
        max_drawdown: -8.5,
        beta: 1.1,
      });

      expect(result).toBeDefined();
      expect(result?.risk_metrics.volatility).toBe(15.5);
      expect(result?.risk_metrics.sharpe_ratio).toBe(1.25);
      expect(result?.risk_metrics.beta).toBe(1.1);
    });
  });

  describe('rebalance', () => {
    it('should detect when rebalancing is needed', async () => {
      await service.create({
        portfolio_id: 'PORT-REB-001',
        investor_id: 'INV-001',
        name: 'Rebalance Test',
        inception_date: new Date().toISOString(),
      });

      const result = await service.rebalance('PORT-REB-001', {
        target_allocation: {
          equity: 60,
          fixed_income: 30,
          cash: 5,
          alternatives: 3,
          real_estate: 2,
        },
        threshold: 5,
      });

      expect(result).toBeDefined();
      // Current allocation is 100% cash, so rebalance is recommended
    });
  });

  describe('delete', () => {
    it('should delete portfolio twin', async () => {
      await service.create({
        portfolio_id: 'PORT-DEL-001',
        investor_id: 'INV-001',
        name: 'Delete Test',
        inception_date: new Date().toISOString(),
      });

      const deleted = await service.delete('PORT-DEL-001');

      expect(deleted).toBe(true);

      const result = await service.getById('PORT-DEL-001');
      expect(result).toBeNull();
    });

    it('should return false for non-existent portfolio', async () => {
      const deleted = await service.delete('NON-EXISTENT');

      expect(deleted).toBe(false);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Create portfolios with different types
      await service.create({
        portfolio_id: 'PORT-STAT-001',
        investor_id: 'INV-001',
        name: 'Equity Portfolio',
        type: 'equity',
        inception_date: new Date().toISOString(),
      });

      await service.create({
        portfolio_id: 'PORT-STAT-002',
        investor_id: 'INV-002',
        name: 'Mixed Portfolio',
        type: 'mixed',
        inception_date: new Date().toISOString(),
      });

      await service.create({
        portfolio_id: 'PORT-STAT-003',
        investor_id: 'INV-001',
        name: 'Fixed Income Portfolio',
        type: 'fixed_income',
        status: 'closed',
        inception_date: new Date().toISOString(),
      });
    });

    it('should return portfolio statistics', async () => {
      const stats = await service.getStats();

      expect(stats.total_portfolios).toBe(3);
      expect(stats.by_type.equity).toBe(1);
      expect(stats.by_type.mixed).toBe(1);
      expect(stats.by_type.fixed_income).toBe(1);
      expect(stats.by_status.active).toBe(2);
      expect(stats.by_status.closed).toBe(1);
    });

    it('should filter stats by investor_id', async () => {
      const stats = await service.getStats('INV-001');

      expect(stats.total_portfolios).toBe(2);
    });
  });
});