# REZ Partner SDK

Software Development Kit for affiliate and referral programs.

## Service Purpose

SDK for partners to integrate affiliate tracking, referral program management, and commission tracking into their applications. Enables partners to create and manage referral campaigns programmatically.

## Package

```bash
npm install @rez/partner-sdk
```

## Usage

```typescript
import { PartnerSDK } from '@rez/partner-sdk';

const partner = new PartnerSDK({
  apiKey: 'YOUR_API_KEY',
  partnerId: 'YOUR_PARTNER_ID'
});

// Create referral link
const referral = await partner.createReferral({
  campaignId: 'campaign-123',
  userId: 'user-456',
  metadata: { source: 'mobile-app' }
});

// Track referral event
await partner.trackEvent({
  referralId: referral.id,
  eventType: 'conversion',
  value: 99.99
});

// Get commission balance
const balance = await partner.getCommissionBalance();

// Request payout
await partner.requestPayout({
  amount: balance.available,
  method: 'bank_transfer'
});
```

## Configuration

```typescript
{
  apiKey: string;           // Partner API key
  partnerId: string;        // Partner identifier
  baseUrl?: string;         // API base URL (optional)
  timeout?: number;         // Request timeout in ms
  environment?: 'sandbox' | 'production';
}
```

## Build Instructions

```bash
# Build SDK
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## Requirements

- Node.js >= 18.0.0
