# RABTUL Services Integration Guide

## Using Existing Services

### 1. Feature Flags (`REZ-ab-testing`)

```typescript
import { isFeatureEnabled } from './REZ-ab-testing-client';

// Check if feature is enabled
const enabled = await isFeatureEnabled('new_checkout', userId);
if (enabled) {
  // show new feature
}

// Track conversion
import { trackConversion } from './REZ-ab-testing-client';
await trackConversion('checkout_experiment', userId, 'purchase');
```

### 2. Workflow/Journey (`REZ-workflow-builder`)

```typescript
import { triggerWorkflow, triggerWorkflowByName } from './REZ-workflow-client';

// Trigger welcome flow
await triggerWorkflow('welcome_flow', userId, { source: 'signup' });

// Trigger by workflow name
await triggerWorkflowByName('abandoned_cart', userId, { cart: cartId });

// Track run status
const status = await getRunStatus(runId);
```

### 3. Observability (`REZ-observability`)

```typescript
import { incrementCounter, recordHistogram, log } from './REZ-observability-client';

// Metrics
incrementCounter('checkout.success');
recordHistogram('checkout.duration_ms', durationMs, { service: 'checkout' });

// Logging
log('info', 'Checkout completed', { orderId, userId });
log('error', 'Payment failed', { error: err.message });
```

### 4. Fraud Detection (`REZ-cod-intelligence`)

```typescript
// Use existing ML fraud service
const FRAUD_URL = process.env.FRAUD_SERVICE_URL;
await fetch(`${FRAUD_URL}/api/v1/assess`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_TOKEN },
  body: JSON.stringify({ orderId, amount, userId }),
});
```

### 5. Circuit Breaker (`REZ-circuit-breaker`)

```typescript
import { runWithCircuitBreaker } from '@rez/circuit-breaker';

await runWithCircuitBreaker('payment', async () => {
  return await processPayment(order);
}, { timeout: 5000 });
```

---

## Environment Variables

```bash
# Feature Flags
REZ_AB_TESTING_URL=https://rez-ab-testing.onrender.com

# Workflow Builder
WORKFLOW_BUILDER_URL=https://rez-workflow-builder.onrender.com

# Observability
OBSERVABILITY_URL=https://rez-observability.onrender.com

# Internal
INTERNAL_SERVICE_TOKEN=<token>
SERVICE_NAME=<service-name>
```

---

## Quick Start

```bash
# 1. Copy clients to your service
cp RABTUL-Technologies/REZ-ab-testing-client.ts src/clients/
cp RABTUL-Technologies/REZ-workflow-client.ts src/clients/

# 2. Install dependencies
npm install node-fetch

# 3. Use in your code
import { isFeatureEnabled } from './clients/REZ-ab-testing-client';
import { triggerWorkflow } from './clients/REZ-workflow-client';
```
