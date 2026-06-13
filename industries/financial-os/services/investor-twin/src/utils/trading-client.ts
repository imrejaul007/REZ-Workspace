import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class TradingClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.TRADING_SERVICE_URL || 'http://localhost:4031';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Place a trade order
   */
  async placeOrder(params: {
    investorId: string;
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit';
    side: 'buy' | 'sell';
    price?: number;
  }): Promise<{ orderId: string; status: string }> {
    try {
      const response = await this.client.post('/api/orders', params);
      logger.info('Trade order placed', { investorId: params.investorId, symbol: params.symbol });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to place trade order', {
        investorId: params.investorId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<{ status: string; filledQuantity: number }> {
    try {
      const response = await this.client.get(`/api/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get order status', { orderId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.client.delete(`/api/orders/${orderId}`);
      logger.info('Order cancelled', { orderId });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to cancel order', { orderId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get account positions
   */
  async getPositions(investorId: string): Promise<Array<{
    symbol: string;
    quantity: number;
    avgCost: number;
    marketValue: number;
  }>> {
    try {
      const response = await this.client.get(`/api/accounts/${investorId}/positions`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get positions', { investorId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(investorId: string): Promise<{ cash: number; buyingPower: number }> {
    try {
      const response = await this.client.get(`/api/accounts/${investorId}/balance`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get balance', { investorId, error: (error as Error).message });
      throw error;
    }
  }
}

export const tradingClient = new TradingClient();
