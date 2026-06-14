# REZ DOOH SDK

Software Development Kit for Digital Out-of-Home advertising.

## Service Purpose

SDK for screen owners and advertisers to integrate DOOH (Digital Out-of-Home) capabilities. Enables inventory management, ad playback control, and audience measurement for digital billboard networks.

## Package

```bash
npm install @rez/dooh-sdk
```

## Usage

```typescript
import { DOOHClient } from '@rez/dooh-sdk';

const client = new DOOHClient({
  apiKey: 'YOUR_API_KEY',
  networkId: 'YOUR_NETWORK_ID'
});

// Get available inventory
const inventory = await client.getInventory({
  location: { lat: 40.7128, lng: -74.0060 },
  radius: 5000,
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// Create campaign
const campaign = await client.createCampaign({
  name: 'Summer Sale',
  inventoryIds: inventory.map(i => i.id),
  creative: { url: 'https://example.com/creative.jpg' },
  targeting: { demographics: { ageRange: [25, 45] } }
});

// Report playback
await client.reportPlayback({
  screenId: 'screen-123',
  creativeId: 'creative-456',
  timestamp: new Date(),
  impressions: 1500
});
```

## Configuration

```typescript
{
  apiKey: string;           // API authentication key
  networkId: string;         // DOOH network identifier
  baseUrl?: string;          // API base URL (optional)
  timeout?: number;          // Request timeout in ms
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
npm run test:run
```

## Requirements

- Node.js >= 18.0.0
