# REZ Server SDK

Server-side attribution and tracking SDK for Node.js.

## Service Purpose

Node.js SDK for server-side conversion tracking and attribution. Enables secure first-party data collection, conversion measurement, and integration with REZ attribution infrastructure.

## Package

```bash
npm install @rez/server-sdk
```

## Usage

```typescript
import { REZServer } from '@rez/server-sdk';

const rez = new REZServer({
  apiKey: 'YOUR_API_KEY',
  environment: 'production'
});

// Track conversion
await rez.trackConversion({
  eventName: 'purchase',
  eventId: 'evt_' + Date.now(),
  value: 99.99,
  currency: 'USD',
  userData: {
    email: 'user@example.com',
    phone: '+1234567890',
    city: 'San Francisco',
    country: 'US'
  },
  customData: {
    itemCount: 3,
    transactionId: 'tx_123456'
  }
});

// Track lead
await rez.trackLead({
  eventName: 'lead',
  eventId: 'lead_' + Date.now(),
  userData: {
    email: 'lead@example.com'
  },
  customData: {
    leadSource: 'campaign_abc'
  }
});
```

## Configuration

```typescript
{
  apiKey: string;              // API authentication key
  environment?: 'sandbox' | 'production';
  timeout?: number;           // Request timeout (ms)
  retries?: number;           // Retry count on failure
  debug?: boolean;            // Enable debug logging
}
```

## Build Instructions

```bash
# Build SDK
npm run build

# Watch mode
npm run dev
```

## Events

Supported event types:

- `trackEvent` - Generic event tracking
- `trackConversion` - Purchase/conversion tracking
- `trackLead` - Lead generation tracking
- `trackPageView` - Page view tracking
- `identifyUser` - User identification

## Requirements

- Node.js >= 18.0.0
