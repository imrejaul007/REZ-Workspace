import { AssetTwinService } from '../src/services/asset-twin.service.js';
import { AssetTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('AssetTwinService', () => {
  let service: AssetTwinService;

  beforeEach(() => {
    service = new AssetTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await AssetTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new asset twin', async () => {
      const data = {
        asset_id: 'AAPL',
        profile: {
          ticker: 'AAPL',
          name: 'Apple Inc.',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.asset_id).toBe('AAPL');
      expect(result.twin_id).toBe('twin.finance.asset.AAPL');
      expect(result.profile.ticker).toBe('AAPL');
      expect(result.profile.exchange).toBe('NASDAQ');
    });

    it('should throw error if asset already exists', async () => {
      const data = {
        asset_id: 'GOOGL',
        profile: {
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should create with fundamentals', async () => {
      const data = {
        asset_id: 'MSFT',
        profile: {
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
        fundamentals: {
          market_cap: 2800000000000,
          pe_ratio: 35.5,
          revenue: 200000000000,
          eps: 10.5,
        },
      };

      const result = await service.create(data);

      expect(result.fundamentals.market_cap).toBe(2800000000000);
      expect(result.fundamentals.pe_ratio).toBe(35.5);
    });

    it('should create with technical indicators', async () => {
      const data = {
        asset_id: 'TSLA',
        profile: {
          ticker: 'TSLA',
          name: 'Tesla Inc.',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
        technical: {
          sma_50: 250,
          sma_200: 220,
          rsi_14: 65,
          trend: 'bullish',
        },
      };

      const result = await service.create(data);

      expect(result.technical.sma_50).toBe(250);
      expect(result.technical.rsi_14).toBe(65);
      expect(result.technical.trend).toBe('bullish');
    });
  });

  describe('getById', () => {
    it('should get asset twin by asset_id', async () => {
      await service.create({
        asset_id: 'ASSET-GET-001',
        profile: {
          ticker: 'GET1',
          name: 'Test Asset 1',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
      });

      const result = await service.getById('ASSET-GET-001');

      expect(result).toBeDefined();
      expect(result?.asset_id).toBe('ASSET-GET-001');
    });

    it('should get asset twin by ticker', async () => {
      await service.create({
        asset_id: 'ASSET-TICKER-001',
        profile: {
          ticker: 'TCKR',
          name: 'Ticker Test',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
      });

      const result = await service.getByTicker('TCKR');

      expect(result).toBeDefined();
      expect(result?.profile.ticker).toBe('TCKR');
    });

    it('should return null for non-existent asset', async () => {
      const result = await service.getById('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('updatePricing', () => {
    it('should update pricing', async () => {
      await service.create({
        asset_id: 'PRICE-001',
        profile: {
          ticker: 'PRC1',
          name: 'Price Test',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
      });

      const result = await service.updatePricing('PRICE-001', {
        last_price: 150.25,
        bid: 150.20,
        ask: 150.30,
        volume: 50000000,
      });

      expect(result).toBeDefined();
      expect(result?.pricing.last_price).toBe(150.25);
      expect(result?.pricing.bid).toBe(150.20);
      expect(result?.pricing.volume).toBe(50000000);
    });

    it('should update technical indicators on price change', async () => {
      await service.create({
        asset_id: 'PRICE-002',
        profile: {
          ticker: 'PRC2',
          name: 'Price Tech Test',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
        pricing: {
          last_price: 100,
        },
        technical: {
          rsi_14: 50,
          trend: 'neutral',
        },
      });

      const result = await service.updatePricing('PRICE-002', {
        last_price: 110,
      });

      expect(result?.technical.rsi_14).toBeGreaterThan(50);
      expect(result?.technical.trend).toBe('bullish');
    });
  });

  describe('addNews', () => {
    it('should add news to asset', async () => {
      await service.create({
        asset_id: 'NEWS-001',
        profile: {
          ticker: 'NEWS1',
          name: 'News Test',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
      });

      const result = await service.addNews('NEWS-001', {
        headline: 'Company announces strong earnings',
        source: 'Reuters',
        sentiment: 'positive',
      });

      expect(result).toBeDefined();
      expect(result?.news).toHaveLength(1);
      expect(result?.news[0].headline).toBe('Company announces strong earnings');
      expect(result?.news[0].sentiment).toBe('positive');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.create({
        asset_id: 'SEARCH-AAPL',
        profile: {
          ticker: 'AAPL',
          name: 'Apple Inc.',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
      });

      await service.create({
        asset_id: 'SEARCH-AMZN',
        profile: {
          ticker: 'AMZN',
          name: 'Amazon.com Inc.',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
      });

      await service.create({
        asset_id: 'SEARCH-GOOGL',
        profile: {
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
      });
    });

    it('should search assets by ticker pattern', async () => {
      const results = await service.search('A', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.profile.ticker === 'AAPL')).toBe(true);
    });

    it('should limit results', async () => {
      const results = await service.search('', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getIslamicCompliant', () => {
    it('should return Islamic-compliant assets', async () => {
      await service.create({
        asset_id: 'ISLAM-001',
        profile: {
          ticker: 'ISL1',
          name: 'Islamic Asset',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
        islamic_compliance: {
          screened: true,
          compliance_status: 'compliant',
        },
      });

      await service.create({
        asset_id: 'ISLAM-002',
        profile: {
          ticker: 'ISL2',
          name: 'Non-Islamic Asset',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
        islamic_compliance: {
          screened: true,
          compliance_status: 'non_compliant',
        },
      });

      const results = await service.getIslamicCompliant();

      expect(results).toHaveLength(1);
      expect(results[0].asset_id).toBe('ISLAM-001');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await service.create({
        asset_id: 'STAT-EQ-001',
        profile: {
          ticker: 'EQ1',
          name: 'Equity 1',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
        fundamentals: {
          pe_ratio: 20,
        },
        technical: {
          rsi_14: 55,
        },
      });

      await service.create({
        asset_id: 'STAT-EQ-002',
        profile: {
          ticker: 'EQ2',
          name: 'Equity 2',
          asset_class: 'equity',
          exchange: 'NASDAQ',
        },
        fundamentals: {
          pe_ratio: 30,
        },
        technical: {
          rsi_14: 45,
        },
      });

      await service.create({
        asset_id: 'STAT-FI-001',
        profile: {
          ticker: 'FI1',
          name: 'Fixed Income 1',
          asset_class: 'fixed_income',
          exchange: 'NYSE',
        },
      });
    });

    it('should return asset statistics', async () => {
      const stats = await service.getStats();

      expect(stats.total_assets).toBe(3);
      expect(stats.by_class.equity).toBe(2);
      expect(stats.by_class.fixed_income).toBe(1);
      expect(stats.avg_pe_ratio).toBe(25);
      expect(stats.avg_rsi).toBe(50);
    });
  });

  describe('delete', () => {
    it('should delete asset twin', async () => {
      await service.create({
        asset_id: 'DEL-001',
        profile: {
          ticker: 'DEL1',
          name: 'Delete Test',
          asset_class: 'equity',
          exchange: 'NYSE',
        },
      });

      const deleted = await service.delete('DEL-001');

      expect(deleted).toBe(true);

      const result = await service.getById('DEL-001');
      expect(result).toBeNull();
    });

    it('should return false for non-existent asset', async () => {
      const deleted = await service.delete('NON-EXISTENT');

      expect(deleted).toBe(false);
    });
  });
});