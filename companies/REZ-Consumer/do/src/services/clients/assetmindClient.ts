/**
 * AssetMind Client for DO App
 *
 * Connect DO App to AssetMind (Portfolio, Trading, AI Insights)
 */

import axios, { AxiosInstance } from 'axios';

const ASSETMIND_URL = process.env.ASSETMIND_URL || 'http://localhost:5001';

export class AssetMindClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: ASSETMIND_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // PORTFOLIO
  // =========================================================================

  async getPortfolio(userId: string) {
    try {
      const { data } = await this.client.get(`/api/portfolio/${userId}`);
      return data;
    } catch (error) {
      console.error('AssetMind getPortfolio error:', error);
      return this.mockPortfolio();
    }
  }

  async getHoldings(userId: string) {
    try {
      const { data } = await this.client.get(`/api/portfolio/${userId}/holdings`);
      return data;
    } catch (error) {
      console.error('AssetMind getHoldings error:', error);
      return { holdings: [] };
    }
  }

  async getPerformance(userId: string, period: '1D' | '1W' | '1M' | '1Y' = '1M') {
    try {
      const { data } = await this.client.get(`/api/portfolio/${userId}/performance`, {
        params: { period },
      });
      return data;
    } catch (error) {
      console.error('AssetMind getPerformance error:', error);
      return null;
    }
  }

  // =========================================================================
  // TRADING
  // =========================================================================

  async placeOrder(params: {
    userId: string;
    symbol: string;
    type: 'buy' | 'sell';
    quantity: number;
    price?: number;
  }) {
    try {
      const { data } = await this.client.post('/api/orders/place', params);
      return data;
    } catch (error) {
      console.error('AssetMind placeOrder error:', error);
      return null;
    }
  }

  async getOrders(userId: string) {
    try {
      const { data } = await this.client.get(`/api/orders/${userId}`);
      return data;
    } catch (error) {
      console.error('AssetMind getOrders error:', error);
      return { orders: [] };
    }
  }

  async cancelOrder(orderId: string) {
    try {
      const { data } = await this.client.post(`/api/orders/${orderId}/cancel`);
      return data;
    } catch (error) {
      console.error('AssetMind cancelOrder error:', error);
      return null;
    }
  }

  // =========================================================================
  // MARKET DATA
  // =========================================================================

  async getStock(symbol: string) {
    try {
      const { data } = await this.client.get(`/api/stocks/${symbol}`);
      return data;
    } catch (error) {
      console.error('AssetMind getStock error:', error);
      return this.mockStock(symbol);
    }
  }

  async searchStocks(query: string) {
    try {
      const { data } = await this.client.get('/api/stocks/search', {
        params: { q: query },
      });
      return data;
    } catch (error) {
      console.error('AssetMind searchStocks error:', error);
      return { results: [] };
    }
  }

  async getMarketOverview() {
    try {
      const { data } = await this.client.get('/api/market/overview');
      return data;
    } catch (error) {
      console.error('AssetMind getMarketOverview error:', error);
      return this.mockMarketOverview();
    }
  }

  // =========================================================================
  // AI INSIGHTS
  // =========================================================================

  async getInsights(userId: string) {
    try {
      const { data } = await this.client.get(`/api/insights/${userId}`);
      return data;
    } catch (error) {
      console.error('AssetMind getInsights error:', error);
      return { insights: [] };
    }
  }

  async getRecommendations(userId: string) {
    try {
      const { data } = await this.client.get(`/api/recommendations/${userId}`);
      return data;
    } catch (error) {
      console.error('AssetMind getRecommendations error:', error);
      return { recommendations: [] };
    }
  }

  async analyzeStock(symbol: string) {
    try {
      const { data } = await this.client.get(`/api/stocks/${symbol}/analysis`);
      return data;
    } catch (error) {
      console.error('AssetMind analyzeStock error:', error);
      return null;
    }
  }

  // =========================================================================
  // WATCHLIST
  // =========================================================================

  async getWatchlist(userId: string) {
    try {
      const { data } = await this.client.get(`/api/watchlist/${userId}`);
      return data;
    } catch (error) {
      console.error('AssetMind getWatchlist error:', error);
      return { symbols: ['HDFCBANK', 'TCS', 'INFY', 'RELIANCE'] };
    }
  }

  async addToWatchlist(userId: string, symbol: string) {
    try {
      const { data } = await this.client.post(`/api/watchlist/${userId}/add`, { symbol });
      return data;
    } catch (error) {
      console.error('AssetMind addToWatchlist error:', error);
      return null;
    }
  }

  // =========================================================================
  // DO APP SPECIFIC
  // =========================================================================

  async getDOAppDashboard(userId: string) {
    const [portfolio, watchlist, insights, market] = await Promise.all([
      this.getPortfolio(userId),
      this.getWatchlist(userId),
      this.getInsights(userId),
      this.getMarketOverview(),
    ]);

    return {
      portfolio,
      watchlist,
      insights,
      market,
      quickActions: {
        trade: true,
        watchlist: true,
        insights: true,
      },
    };
  }

  async voiceCommand(userId: string, command: string) {
    // Process voice command for trading
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('buy') || lowerCommand.includes('purchase')) {
      // Extract symbol and quantity
      return { action: 'buy', command };
    }

    if (lowerCommand.includes('sell')) {
      return { action: 'sell', command };
    }

    if (lowerCommand.includes('portfolio') || lowerCommand.includes('holdings')) {
      const portfolio = await this.getPortfolio(userId);
      return { action: 'show_portfolio', data: portfolio };
    }

    if (lowerCommand.includes('watchlist')) {
      const watchlist = await this.getWatchlist(userId);
      return { action: 'show_watchlist', data: watchlist };
    }

    return { action: 'unknown', command };
  }

  // =========================================================================
  // MOCK DATA
  // =========================================================================

  private mockPortfolio() {
    return {
      totalValue: 1250000,
      dayChange: 8500,
      dayChangePercent: 0.68,
      invested: 1100000,
      profit: 150000,
    };
  }

  private mockStock(symbol: string) {
    const stocks: Record<string, any> = {
      'HDFCBANK': { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1680, change: 2.3 },
      'TCS': { symbol: 'TCS', name: 'Tata Consultancy', price: 3850, change: 1.2 },
      'INFY': { symbol: 'INFY', name: 'Infosys', price: 1520, change: -0.5 },
      'RELIANCE': { symbol: 'RELIANCE', name: 'Reliance', price: 2850, change: 0.8 },
    };
    return stocks[symbol] || { symbol, name: symbol, price: 100, change: 0 };
  }

  private mockMarketOverview() {
    return {
      nifty: { value: 22850, change: 0.8 },
      sensex: { value: 76500, change: 0.7 },
      bankNifty: { value: 48500, change: 1.2 },
    };
  }
}

// Export singleton
export const assetmindClient = new AssetMindClient();

export default AssetMindClient;