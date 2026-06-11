# CLAUDE.md - Developer Guide

**HOJAI Industry CRM** - Cross-Industry Customer Relationship Management

## Purpose

This document provides developer guidance for working with the HOJAI Industry CRM system. It's designed to help you understand the architecture, make changes, and extend functionality.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOJAI CRM                                │
│                        (Port 4980)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │ AI Agents   │  │  Services   │  │  Connectors │            │
│   ├─────────────┤  ├─────────────┤  ├─────────────┤            │
│   │ Analyst     │  │ Lead Service│  │ HOJAI Core  │            │
│   │ Lead Manager │  │ Customer360 │  │ Merchant OS │            │
│   │ Revenue Bot  │  │ Revenue     │  │             │            │
│   │ Intelligence │  │ Insights    │  │             │            │
│   │             │  │ Cross-Sell  │  │             │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│   ┌─────────────────────────────────────────────┐               │
│   │              Voice Agents                    │               │
│   │   ┌──────────────────┐ ┌──────────────────┐  │               │
│   │   │ Phone Receptionist│ │   WhatsApp AI   │  │               │
│   │   │    (Port 4981)   │ │   (Port 4982)   │  │               │
│   │   └──────────────────┘ └──────────────────┘  │               │
│   └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOJAI Core (Port 4100)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Waitron │ │ShopFlow│ │StayBot │ │CareCode│ │ GlamAI │  ...   │
│  │   .    │ │   .    │ │   .    │ │   .    │ │   .    │        │
│  │   .    │ │   .    │ │   .    │ │   .    │ │   .    │        │
│  │   .    │ │   .    │ │   .    │ │   .    │ │   .    │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│                     (15 Industry Products)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Single Source of Truth
- Customer data is unified through Customer360Service
- Leads are managed through UnifiedLeadService
- Revenue is consolidated through RevenueConsolidationService

### 2. Industry-Agnostic Design
- Services work with IndustryType enum (15 industries)
- Connectors abstract industry-specific details
- Cross-sell logic uses industry relationship maps

### 3. AI-First Approach
- AI agents handle intelligent routing and analysis
- Machine learning for lead scoring and churn prediction
- Automated insights and recommendations

## Adding a New Industry

To add support for a new Industry AI product:

### 1. Update hojai-core.ts

```typescript
// Add to INDUSTRY_PRODUCTS in connectors/hojai-core.ts
export const INDUSTRY_PRODUCTS: Record<IndustryType, IndustryProduct> = {
  // ... existing products ...
  newindustry: {
    id: 'newindustry',
    name: 'NewIndustry',
    industry: 'newindustry',
    basePort: 4116,  // Next available port
    apiEndpoint: '/api/newindustry',
    description: 'New Industry Product'
  }
};

// Add to IndustryType
export type IndustryType =
  | 'waitron'
  // ... existing ...
  | 'newindustry';
```

### 2. Update INDUSTRY_RELATIONSHIPS

In `services/cross-sell-service/index.ts`:

```typescript
const INDUSTRY_RELATIONSHIPS: Record<IndustryType, IndustryType[]> = {
  // ... existing relationships ...
  newindustry: ['waitron', 'shopflow', 'staybot'], // Natural cross-sell paths
  // Add to other industries too
  waitron: [...waitron, 'newindustry'],
  shopflow: [...shopflow, 'newindustry'],
};
```

### 3. Update Product Info

In `voice-agents/whatsapp-ai/index.ts`, add product details:

```typescript
private productInfo: Record<IndustryType, {...}> = {
  // ... existing products ...
  newindustry: {
    name: 'NewIndustry',
    description: 'New Industry Product Description',
    features: ['Feature 1', 'Feature 2']
  }
};
```

## Creating a New Service

1. Create directory: `services/new-service/`
2. Create `index.ts` with service class
3. Implement service interface
4. Export singleton instance
5. Import in `src/index.ts`

Example:
```typescript
// services/new-service/index.ts
export class NewService {
  private static instance: NewService;

  static getInstance(): NewService {
    if (!NewService.instance) {
      NewService.instance = new NewService();
    }
    return NewService.instance;
  }

  // ... your methods ...
}

export const newService = NewService.getInstance();
```

## Creating a New AI Agent

1. Create directory: `employees/new-agent/`
2. Create `index.ts` with agent class
3. Implement agent logic
4. Export singleton instance
5. Register routes in `src/index.ts`

Example:
```typescript
// employees/new-agent/index.ts
export class NewAgent {
  private agentName = 'New Agent';
  private agentId = 'new-agent-001';

  async performAction(): Promise<any> {
    // Agent logic here
  }

  getStatus(): any {
    return { agentId: this.agentId, name: this.agentName, ready: true };
  }
}

export const newAgent = new NewAgent();
```

## Voice Agent Development

### Phone Receptionist (IVR)

The IVR uses a menu-based system with DTMF (touch-tone) input.

**Adding a new menu:**

```typescript
// voice-agents/phone-receptionist/index.ts

// Add to constructor menus Map:
private menus: Map<string, IVRMenu> = new Map([
  ['main', this.mainMenu],
  // ... existing ...
  ['newmenu', {
    id: 'newmenu',
    name: 'New Menu',
    prompt: 'Welcome to new menu...',
    options: [
      { key: '1', label: 'Option 1', action: 'menu', destination: 'destination' },
      { key: '2', label: 'Option 2', action: 'transfer', destination: 'queue' },
    ]
  }]
]);
```

### WhatsApp AI

WhatsApp uses session-based conversations with state management.

**Adding a new state:**

```typescript
// voice-agents/whatsapp-ai/index.ts

// Add to processMessage switch:
case 'new-state':
  return await this.handleNewState(session, content);

// Add new handler:
private async handleNewState(session: WhatsAppSession, content: string): Promise<string> {
  // Handle the new state
}
```

## API Development

### Adding a new route

```typescript
// src/index.ts

// GET route
app.get('/api/new-endpoint', async (req: Request, res: Response) => {
  try {
    const data = await someService.getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST route
app.post('/api/new-endpoint', async (req: Request, res: Response) => {
  try {
    const result = await someService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});
```

## Testing

### Running tests
```bash
npm test
```

### Writing tests
```typescript
// tests/example.test.ts
import { describe, it, expect } from 'jest';

describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

## Debugging

### Enable debug logging
```bash
DEBUG=hojai:* npm run dev
```

### Common issues

1. **Port already in use**: Check if another service is using the port
2. **Connection refused**: Verify HOJAI Core is running on port 4100
3. **Module not found**: Run `npm install` to install dependencies
4. **TypeScript errors**: Run `npm run build` to see detailed errors

## Deployment

### Local development
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm start
```

### Docker deployment
```bash
docker build -t hojai-crm .
docker run -p 4980:4980 hojai-crm
```

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Document public methods with JSDoc
- Use async/await for asynchronous operations
- Handle errors gracefully with try/catch

## Performance Tips

1. **Batch operations**: Use bulk imports instead of individual calls
2. **Caching**: Implement caching for frequently accessed data
3. **Pagination**: Use pagination for large result sets
4. **Indexes**: Use Map-based indexes for fast lookups

## Security

- Never expose API keys in code (use environment variables)
- Validate all user input
- Use parameterized queries (for database integrations)
- Implement rate limiting for public endpoints
- CORS configuration for allowed origins

## Useful Commands

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format

# Build
npm run build

# Start
npm start

# Development with hot reload
npm run dev
```

## Help

- Check `/health` endpoint for service status
- Check console logs for detailed errors
- Review SOT.md for current technology state
- Review README.md for API documentation