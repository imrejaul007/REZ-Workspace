# REZ Attribution SDK

Browser and server-side event tracking SDK for conversion attribution.

## Service Purpose

JavaScript SDK for tracking user interactions, conversion events, and attribution across the advertising funnel. Integrates with Meta Conversions API (CAPI) and other attribution platforms.

## Package

```bash
npm install @rez/attribution-sdk
```

## Usage

### Browser (ES Module)

```typescript
import { AttributionPixel } from '@rez/attribution-sdk';

const pixel = new AttributionPixel({
  pixelId: 'YOUR_PIXEL_ID',
  accessToken: 'YOUR_ACCESS_TOKEN'
});

// Track page view
pixel.trackPageView();

// Track custom event
pixel.track('Purchase', {
  value: 99.99,
  currency: 'USD'
});
```

### Server-side

```typescript
import { ServerAttribution } from '@rez/attribution-sdk';

const server = new ServerAttribution({
  accessToken: 'YOUR_ACCESS_TOKEN'
});

await server.trackConversion({
  eventName: 'Purchase',
  eventId: 'unique-event-id',
  userData: {
    email: 'user@example.com',
    phone: '+1234567890'
  },
  customData: {
    value: 99.99,
    currency: 'USD'
  }
});
```

## Configuration

```typescript
{
  pixelId: string;        // Meta Pixel ID
  accessToken: string;     // Meta API access token
  debug?: boolean;         // Enable debug mode
  testMode?: boolean;      // Enable test mode
}
```

## Build Instructions

```bash
# Build for distribution
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## Tech Stack

- TypeScript
- No runtime dependencies
