# Developer Quick Start - Use RABTUL Services

## Copy Clients

```bash
cp REZ-ab-testing-client.ts src/lib/
cp REZ-workflow-client.ts src/lib/
cp REZ-observability-client.ts src/lib/
```

## Environment Variables

```bash
REZ_AB_TESTING_URL=https://rez-ab-testing.onrender.com
WORKFLOW_BUILDER_URL=https://rez-workflow-builder.onrender.com
OBSERVABILITY_URL=https://rez-observability.onrender.com
INTERNAL_SERVICE_TOKEN=your-token
SERVICE_NAME=your-service
```

## Code Examples

### Feature Flags

```typescript
import { isFeatureEnabled } from './lib/REZ-ab-testing-client';
const enabled = await isFeatureEnabled('new_checkout', userId);
```

### Workflow Trigger

```typescript
import { triggerWorkflow } from './lib/REZ-workflow-client';
await triggerWorkflow('welcome_flow', userId, { source: 'signup' });
```

### Metrics

```typescript
import { incrementCounter } from './lib/REZ-observability-client';
incrementCounter('checkout.success');
```
