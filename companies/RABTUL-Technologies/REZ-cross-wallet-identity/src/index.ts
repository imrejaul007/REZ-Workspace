/**
 * REZ Cross-Wallet Identity
 * Unified wallet management across multiple providers for REZ Commerce OS
 *
 * @module @rez-commerce/cross-wallet-identity
 */

// Types and Interfaces
export * from './types';

// Core Classes
export { CrossWalletIdentity } from './CrossWalletIdentity';
export { WalletLinker } from './WalletLinker';
export { BalanceAggregator } from './BalanceAggregator';
export { TransactionRouter } from './TransactionRouter';

// Wallet Modules
export { PointsWallet } from './modules/PointsWallet';
export { CashWallet } from './modules/CashWallet';
export { CryptoWallet } from './modules/CryptoWallet';
export { GiftCardWallet } from './modules/GiftCardWallet';

// Sync Module
export { WalletSync } from './sync/WalletSync';

// Utilities
export { WalletProvider, createWalletProvider } from './providers/WalletProviderFactory';
export { CrossWalletError, ValidationError, SyncError, TransactionError } from './errors';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-cross-wallet-identity',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
