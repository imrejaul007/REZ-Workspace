/**
 * Service Router - Routes requests to appropriate backend service
 * Based on coin type and context
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CoinType,
  CoinSource,
  EarnParams,
  EarnResult,
  RedeemParams,
  RedeemResult,
  COIN_TYPE_SERVICE_MAP,
} from '../types/index.js';
import { apiClient } from '../utils/apiClient.js';
import { logger } from '../utils/logger.js';
import { CoinSyncEngine } from './CoinSyncEngine.js';

export class ServiceRouter {
  private syncEngine: CoinSyncEngine;

  constructor(syncEngine: CoinSyncEngine) {
    this.syncEngine = syncEngine;
  }

  /**
   * Get the service name for a given coin type
   */
  private getServiceForCoinType(coinType: CoinType, context?: string): string {
    // Context-based overrides
    if (context === 'restaurant' && coinType === CoinType.REZ) {
      return 'restaurantLoyalty';
    }
    if (context === 'prive') {
      return 'prive';
    }
    if (context === 'referral') {
      return 'referralOS';
    }

    // Default mapping
    return COIN_TYPE_SERVICE_MAP[coinType];
  }

  /**
   * Earn coins - routes to correct service
   */
  async earn(params: EarnParams): Promise<EarnResult> {
    const { userId, amount, coinType, source, description, referenceId, metadata, context } = params;
    const serviceName = this.getServiceForCoinType(coinType, context);
    const txId = referenceId || uuidv4();

    logger.info(`[ServiceRouter] Routing EARN to ${serviceName}`, {
      userId,
      amount,
      coinType,
      serviceName,
    });

    try {
      let result: { transactionId: string; newBalance: number };

      switch (serviceName) {
        case 'wallet':
          result = await this.callWalletService('credit', {
            userId,
            amount,
            coinType: coinType.toLowerCase(),
            source: source.toString(),
            description,
            referenceId: txId,
            metadata,
          });
          break;

        case 'restaurantLoyalty':
          result = await this.callRestaurantLoyalty('earn', {
            userId,
            amount,
            description,
            referenceId: txId,
            metadata,
          });
          break;

        case 'prive':
          result = await this.callPriveService('calculate', {
            userId,
            amount,
            action: 'earn',
            metadata,
          });
          break;

        case 'referralOS':
          result = await this.callReferralOS('award', {
            userId,
            amount,
            source,
            description,
            referenceId: txId,
          });
          break;

        case 'cashbackService':
          result = await this.callCashbackService('credit', {
            userId,
            amount,
            description,
            referenceId: txId,
          });
          break;

        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      // Publish sync event
      await this.syncEngine.publishCoinEarned({
        userId,
        coinType,
        amount,
        transactionId: result.transactionId,
        referenceId: txId,
        sourceApp: serviceName,
 metadata,
      });

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance: result.newBalance,
        coinType,
        message: `Successfully earned ${amount} ${coinType} coins`,
      };
    } catch (error) {
      logger.error(`[ServiceRouter] EARN failed for ${serviceName}`, { error });
      return {
        success: false,
        transactionId: txId,
        newBalance: 0,
        coinType,
        message: `Failed to earn coins: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Redeem coins - routes to correct service
   */
  async redeem(params: RedeemParams): Promise<RedeemResult> {
    const { userId, amount, coinType, description, referenceId, metadata, context } = params;
    const serviceName = this.getServiceForCoinType(coinType, context);
    const txId = referenceId || uuidv4();

    logger.info(`[ServiceRouter] Routing REDEEM to ${serviceName}`, {
      userId,
      amount,
      coinType,
      serviceName,
    });

    try {
      let result: { transactionId: string; newBalance: number };

      switch (serviceName) {
        case 'wallet':
          result = await this.callWalletService('debit', {
            userId,
            amount,
            coinType: coinType.toLowerCase(),
            description,
            referenceId: txId,
            metadata,
          });
          break;

        case 'restaurantLoyalty':
          result = await this.callRestaurantLoyalty('redeem', {
            userId,
            amount,
            description,
            referenceId: txId,
            metadata,
          });
          break;

        case 'prive':
          result = await this.callPriveService('redeem', {
            userId,
            amount,
            referenceId: txId,
          });
          break;

        case 'referralOS':
          result = await this.callReferralOS('redeem', {
            userId,
            amount,
            description,
            referenceId: txId,
          });
          break;

        case 'cashbackService':
          result = await this.callCashbackService('redeem', {
            userId,
            amount,
            description,
            referenceId: txId,
          });
          break;

        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      // Publish sync event
      await this.syncEngine.publishCoinRedeemed({
        userId,
        coinType,
        amount,
        transactionId: result.transactionId,
        referenceId: txId,
        sourceApp: serviceName,
        metadata,
      });

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance: result.newBalance,
        coinType,
        message: `Successfully redeemed ${amount} ${coinType} coins`,
      };
    } catch (error) {
      logger.error(`[ServiceRouter] REDEEM failed for ${serviceName}`, { error });
      return {
        success: false,
        transactionId: txId,
        newBalance: 0,
        coinType,
        message: `Failed to redeem coins: ${(error as Error).message}`,
      };
    }
  }

  // ========== Service Callers ==========

  private async callWalletService(
    action: 'credit' | 'debit',
    data: Record<string, unknown>
  ): Promise<{ transactionId: string; newBalance: number }> {
    const response = await apiClient.post<{
      success: boolean;
      transactionId: string;
      balance: { available: number };
    }>('wallet', `/api/wallet/${action}`, data);

    if (!response) {
      throw new Error('Wallet service unavailable');
    }

    return {
      transactionId: response.transactionId,
      newBalance: response.balance?.available || 0,
    };
  }

  private async callRestaurantLoyalty(
    action: 'earn' | 'redeem',
    data: Record<string, unknown>
  ): Promise<{ transactionId: string; newBalance: number }> {
    const response = await apiClient.post<{
      success: boolean;
      transactionId: string;
      balance: number;
    }>('restaurantLoyalty', `/api/loyalty/${action}`, data);

    if (!response) {
      throw new Error('Restaurant loyalty service unavailable');
    }

    return {
      transactionId: response.transactionId,
      newBalance: response.balance || 0,
    };
  }

  private async callPriveService(
    action: 'calculate' | 'redeem',
    data: Record<string, unknown>
  ): Promise<{ transactionId: string; newBalance: number }> {
    const response = await apiClient.post<{
      success: boolean;
      transactionId?: string;
      balance?: number;
      bonus?: number;
    }>('prive', `/api/coins/${action}`, data);

    if (!response) {
      throw new Error('Prive service unavailable');
    }

    return {
      transactionId: response.transactionId || uuidv4(),
      newBalance: response.balance || response.bonus || 0,
    };
  }

  private async callReferralOS(
    action: 'award' | 'redeem',
    data: Record<string, unknown>
  ): Promise<{ transactionId: string; newBalance: number }> {
    const response = await apiClient.post<{
      success: boolean;
      transactionId: string;
      balance: number;
    }>('referralOS', `/api/referral/${action}`, data);

    if (!response) {
      throw new Error('Referral OS unavailable');
    }

    return {
      transactionId: response.transactionId,
      newBalance: response.balance || 0,
    };
  }

  private async callCashbackService(
    action: 'credit' | 'redeem',
    data: Record<string, unknown>
  ): Promise<{ transactionId: string; newBalance: number }> {
    const response = await apiClient.post<{
      success: boolean;
      transactionId: string;
      balance: number;
    }>('cashbackService', `/api/cashback/${action}`, data);

    if (!response) {
      throw new Error('Cashback service unavailable');
    }

    return {
      transactionId: response.transactionId,
      newBalance: response.balance || 0,
    };
  }
}
