# REZ QR Integrations

**RABTUL Technologies - QR Intelligence Module**

## Overview

AI-powered intelligence module for all REZ QR services. Provides fraud detection, damage detection, personalization, and predictive analytics.

## Features

- **AI Damage Detection** - Vision API for product condition verification
- **Fraud Detection** - ML-powered fraud pattern analysis
- **Intent Prediction** - User intent prediction for next best action
- **Recommendations** - Personalized warranty and service recommendations
- **Predictive Analytics** - Churn prediction, LTV prediction, demand forecasting
- **Personalization** - User profile-based content personalization
- **Customer 360** - Complete customer view across all interactions

## Usage

Import individual modules or use the unified export:

```typescript
// Import specific service
import { intelligence } from './intelligenceIntegration';
import { rabtul } from './rabtulConnections';

// Use AI damage detection
const damage = await intelligence.vision.detectDamage(images, productType);

// Use fraud detection
const fraudCheck = await intelligence.fraud.checkPatterns(serialNumber, userId);

// Use RABTUL services
const balance = await rabtul.wallet.getBalance(userId);
```

## Environment Variables

```env
MIND_API=http://localhost:4018
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004
```

## Integration Points

This module is used by:
- `rez-qr-cloud-service` - QR commerce platform
- `REZ-qr-unified` - Cross-company QR hub
- `verify-qr-service` - Product verification
- `REZ-qr-dashboard` - Analytics dashboard

## Scripts

```bash
npm run dev     # Start development server
npm run build   # Build TypeScript
npm start       # Run production
```