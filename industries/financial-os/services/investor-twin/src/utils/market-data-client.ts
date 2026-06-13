import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class MarketDataClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.MARKET_DATA_SERVICE_URL || 'http://localhost:4034';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get current quote for a symbol
   */
  async getQuote(symbol: string): Promise<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
  }> {
    try {
      const response = await this.client.get(`/api/market/quote/${symbol}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get quote', { symbol, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols: string[]): Promise<Array<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
  }>> {
    try {
      const response = await this.client.post('/api/market/quotes', { symbols });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get quotes', { symbols, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalPrices(params: {
    symbol: string;
    period: '1d' | '1w' | '1m' | '3m' | '1y' | 'all';
    interval?: '1m' | '5m' | '1h' | '1d';
  }): Promise<Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>> {
    try {
      const response = await this.client.get(`/api/market/history/${params.symbol}`, {
        params: {
          period: params.period,
          interval: params.interval || '1d'
        }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get historical prices', {
        symbol: params.symbol,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get market movers
   */
  async getMarketMovers(type: 'gainers' | 'losers' | 'active'): Promise<Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    volume: number;
  }>> {
    try {
      const response = await this.client.get(`/api/market/movers/${type}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get market movers', { type, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Search for securities
   */
  async searchSecurities(query: string): Promise<Array<{
    symbol: string;
    name: string;
    type: string;
    exchange: string;
  }>> {
    try {
      const response = await this.client.get('/api/market/search', {
        params: { q: query }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to search securities', { query, error: (error as Error).message });
      throw error;
    }
  }
}

export const marketDataClient = new MarketDataClient();
