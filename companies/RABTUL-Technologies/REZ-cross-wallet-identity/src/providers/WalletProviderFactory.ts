/**
 * Wallet Provider Factory
 * Creates and manages wallet provider instances
 */

import { WalletProvider, WalletConfig, IWalletModule } from '../types';
import { PointsWallet } from '../modules/PointsWallet';
import { CashWallet } from '../modules/CashWallet';
import { CryptoWallet } from '../modules/CryptoWallet';
import { GiftCardWallet } from '../modules/GiftCardWallet';
import { CrossWalletError, ProviderError } from '../errors';

// Provider registry
const providerRegistry: Map<string, new (config: WalletConfig) => IWalletModule> = new Map();

// Register default providers
providerRegistry.set(WalletProvider.REZ, PointsWallet);
providerRegistry.set(WalletProvider.RAZORPAY, CashWallet);
providerRegistry.set(WalletProvider.STRIPE, CashWallet);
providerRegistry.set(WalletProvider.ETHEREUM, CryptoWallet);
providerRegistry.set(WalletProvider.BITCOIN, CryptoWallet);
providerRegistry.set(WalletProvider.GIFTCARD, GiftCardWallet);

/**
 * Register a custom wallet provider
 */
export function registerProvider(
  name: string,
  providerClass: new (config: WalletConfig) => IWalletModule
): void {
  providerRegistry.set(name, providerClass);
}

/**
 * Get available provider names
 */
export function getAvailableProviders(): string[] {
  return Array.from(providerRegistry.keys());
}

/**
 * Create a wallet provider instance
 */
export function createWalletProvider(
  provider: string,
  config: WalletConfig
): IWalletModule {
  const ProviderClass = providerRegistry.get(provider.toLowerCase());

  if (!ProviderClass) {
    const available = getAvailableProviders();
    throw new ProviderError(
      `Unknown wallet provider: ${provider}`,
      provider,
      undefined,
      { available_providers: available }
    );
  }

  try {
    const instance = new ProviderClass(config);
    return instance;
  } catch (error) {
    if (error instanceof CrossWalletError) {
      throw error;
    }
    throw new ProviderError(
      `Failed to create provider instance: ${(error as Error).message}`,
      provider,
      undefined,
      { original_error: (error as Error).message }
    );
  }
}

/**
 * Wallet Provider interface for external integrations
 */
export interface WalletProvider {
  name: string;
  type: 'points' | 'cash' | 'crypto' | 'giftcard';
  isAvailable(): Promise<boolean>;
  connect(config: WalletConfig): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): 'connected' | 'disconnected' | 'error';
}

/**
 * REZ Provider implementation
 */
class RezWalletProvider implements WalletProvider {
  public readonly name = WalletProvider.REZ;
  public readonly type = 'points' as const;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  private config?: WalletConfig;

  async isAvailable(): Promise<boolean> {
    try {
      // Check if REZ API is reachable
      const response = await fetch(`${this.config?.rpcUrl || 'https://api.rez.com'}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WalletProviderFactory] REZ wallet availability check failed: ${errorMessage}`);
      return false;
    }
  }

  async connect(config: WalletConfig): Promise<void> {
    this.config = config;
    this.status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.config = undefined;
    this.status = 'disconnected';
  }

  getStatus(): 'connected' | 'disconnected' | 'error' {
    return this.status;
  }
}

/**
 * Razorpay Provider implementation
 */
class RazorpayProvider implements WalletProvider {
  public readonly name = WalletProvider.RAZORPAY;
  public readonly type = 'cash' as const;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';

  async isAvailable(): Promise<boolean> {
    try {
      return true; // In production, check Razorpay API health
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WalletProviderFactory] Razorpay availability check failed: ${errorMessage}`);
      return false;
    }
  }

  async connect(_config: WalletConfig): Promise<void> {
    this.status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): 'connected' | 'disconnected' | 'error' {
    return this.status;
  }
}

/**
 * Stripe Provider implementation
 */
class StripeProvider implements WalletProvider {
  public readonly name = WalletProvider.STRIPE;
  public readonly type = 'cash' as const;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';

  async isAvailable(): Promise<boolean> {
    try {
      return true; // In production, check Stripe API health
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WalletProviderFactory] Stripe availability check failed: ${errorMessage}`);
      return false;
    }
  }

  async connect(_config: WalletConfig): Promise<void> {
    this.status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): 'connected' | 'disconnected' | 'error' {
    return this.status;
  }
}

/**
 * Ethereum Provider implementation
 */
class EthereumProvider implements WalletProvider {
  public readonly name = WalletProvider.ETHEREUM;
  public readonly type = 'crypto' as const;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';

  async isAvailable(): Promise<boolean> {
    try {
      return true; // In production, check Ethereum node connectivity
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WalletProviderFactory] Ethereum availability check failed: ${errorMessage}`);
      return false;
    }
  }

  async connect(_config: WalletConfig): Promise<void> {
    this.status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): 'connected' | 'disconnected' | 'error' {
    return this.status;
  }
}
