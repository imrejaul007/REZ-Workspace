# Claude Code Configuration - REZ Business AI

## Service Overview

REZ Business AI is an autonomous AI operating system for merchants that:
- Monitors business health continuously
- Predicts demand patterns
- Creates and executes marketing campaigns
- Adjusts pricing dynamically
- Manages customer retention

## Quick Commands

```bash
cd rez-business-ai
npm install
npm run dev    # Development
npm run build  # Production
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main service entry |
| `src/agents/` | AI agents (pricing, marketing, retention) |
| `src/types/index.ts` | Type definitions |
| `src/models/` | Mongoose models |

## API Base

```
http://localhost:4059/api/business-ai
```

## Related Services

- REZ-Mind (4021) - AI brain
- REZ-AdAI (4021) - Advertising
- REZ-Engagement (4017) - Loyalty
