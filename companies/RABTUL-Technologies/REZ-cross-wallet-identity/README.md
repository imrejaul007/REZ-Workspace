# REZ Cross-Wallet Identity

Unified wallet management across multiple providers for REZ Commerce OS.

## Overview

CROSS-WALLET IDENTITY enables users to link and manage multiple wallets (points, cash, crypto, gift cards) from different providers under a single identity. The system provides:

- **Unified Balance Aggregation** - View total balance across all wallets
- **Cross-Platform Linking** - Connect wallets from REZ, Razorpay, Stripe, Ethereum, Bitcoin
- **Smart Transaction Routing** - Route transactions to optimal wallets
- **Real-time Sync** - Keep balances synchronized across providers
- **Multi-Currency Support** - Handle points, fiat, and crypto in one system

## Architecture

```
REZ-cross-wallet-identity/
├── src/
│   ├── index.ts              # Main exports
│   ├── CrossWalletIdentity.ts # Main orchestrator class
│   ├── WalletLinker.ts       # Wallet linking & verification
│   ├── BalanceAggregator.ts   # Balance aggregation & conversion
│   ├── TransactionRouter.ts   # Transaction routing logic
│   ├── types.ts              # TypeScript interfaces & schemas
│   ├── errors.ts             # Custom error classes
│   ├── providers/            # Provider factory
│   ├── modules/              # Wallet implementations
│   │   ├── PointsWallet.ts   # Loyalty points
│   │   ├── CashWallet.ts    # Fiat currency
│   │   ├── CryptoWallet.ts  # Cryptocurrency
│   │   └── GiftCardWallet.ts # Gift cards
│   └── sync/                 # Synchronization
│       └── WalletSync.ts    # Balance sync worker
```

## Installation

```bash
npm install @rez-commerce/cross-wallet-identity
```

## Quick Start

```typescript
import { CrossWalletIdentity, WalletType } from '@rez-commerce/cross-wallet-identity';

// Create identity for a user
const identity = new CrossWalletIdentity('user-123');

// Link wallets
await identity.linkWallet(
  WalletType.POINTS,
  'rez',
  'user-points-address'
);

await identity.linkWallet(
  WalletType.CASH,
  'razorpay',
  'user-razorpay-id'
);

// Get aggregated balance
const totalBalance = identity.getTotalBalance();
console.log(totalBalance);
// {
//   points: 5000,
//   cash_equivalent: 1250.50,
//   crypto_usd: 2500.00,
//   giftcards: 100.00
// }

// Route a transaction
const result = await identity.routeTransaction(
  100,
  'USD',
  'debit',
  { walletType: WalletType.CASH }
);
```

## Core Features

### 1. Cross-Wallet Identity

```typescript
interface CrossWalletIdentity {
  user_id: string;
  wallets: Wallet[];
  total_balance: TotalBalance;
  transactions: TransactionSummary;
  redemptions: RedemptionSummary;
  linked_accounts: LinkedAccount[];
}
```

### 2. Wallet Types

| Type | Providers | Description |
|------|-----------|-------------|
| `points` | REZ | Loyalty points with tier bonuses |
| `cash` | Razorpay, Stripe | Fiat currency wallets |
| `crypto` | Ethereum, Bitcoin | Blockchain wallets |
| `giftcard` | Multiple | Gift card management |

### 3. Wallet Linking

```typescript
// Initiate link with verification
const { sessionId, verificationRequired } = await identity.walletLinker.initiateLink(
  'user-id',
  WalletType.CRYPTO,
  'ethereum',
  '0x1234...',
  { verificationMethod: 'wallet_signature' }
);

// Verify and complete
if (verificationRequired) {
  const wallet = await identity.walletLinker.verifyLink(sessionId, 'signature');
}
```

### 4. Balance Aggregation

```typescript
// Get total balance in USD equivalent
const total = balanceAggregator.aggregateTotal(wallets);

// Get breakdown by type
const breakdown = balanceAggregator.aggregateByType(wallets);

// Convert between currencies
const usdValue = balanceAggregator.convert(100, 'ETH', 'USD');
```

### 5. Transaction Routing

```typescript
// Route to optimal wallet
const result = await transactionRouter.routeTransaction(
  userId,
  amount,
  'USD',
  'debit',
  { walletType: WalletType.CASH }
);

// Split transaction across wallets
const split = await transactionRouter.routeSplitTransaction(
  userId,
  1000,
  'PTS',
  WalletType.POINTS
);

// Transfer between wallets
await transactionRouter.transfer(
  fromWalletId,
  toWalletId,
  amount
);
```

### 6. Real-time Sync

```typescript
// Start auto-sync
identity.startAutoSync();

// Manual sync
await identity.syncAll();

// Sync specific wallet
await identity.syncWallet(walletId);
```

## API Reference

### CrossWalletIdentity

| Method | Description |
|--------|-------------|
| `getIdentity()` | Get full cross-wallet identity |
| `linkWallet(type, provider, address)` | Link a new wallet |
| `unlinkWallet(walletId)` | Remove a wallet |
| `getTotalBalance()` | Get aggregated balance |
| `routeTransaction(amount, currency, type, options)` | Route a transaction |
| `addLinkedAccount(account)` | Add platform account |
| `startAutoSync()` | Enable automatic sync |

### Events

```typescript
identity.on('wallet_linked', (event) => {
  console.log('Wallet linked:', event.wallet_id);
});

identity.on('balance_updated', (event) => {
  console.log('Balance changed:', event.data);
});

identity.on('transaction_completed', (event) => {
  console.log('Transaction:', event.data);
});

identity.on('sync_completed', (event) => {
  console.log('Sync complete:', event.data);
});
```

## Configuration

### Environment Variables

```env
# REZ Platform
REZ_API_KEY=your_rez_api_key
REZ_API_SECRET=your_rez_api_secret
REZ_WALLET_PROVIDER_URL=https://api.rez.com/v1

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Stripe
STRIPE_SECRET_KEY=your_secret_key

# Crypto
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/project_id
ETHEREUM_CHAIN_ID=1

# Sync
SYNC_INTERVAL_MS=30000
SYNC_RETRY_ATTEMPTS=3

# Storage
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/rez_wallets
```

## Error Handling

```typescript
import {
  ValidationError,
  WalletNotFoundError,
  InsufficientBalanceError,
  WalletLinkingError,
  SyncError
} from '@rez-commerce/cross-wallet-identity';

try {
  await identity.linkWallet(/* ... */);
} catch (error) {
  if (error instanceof WalletLinkingError) {
    console.log('Provider:', error.provider);
    console.log('Details:', error.details);
  }
}
```

## Testing

```bash
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Render

```bash
# Deploy with render.yaml
render deploy
```

## License

MIT
