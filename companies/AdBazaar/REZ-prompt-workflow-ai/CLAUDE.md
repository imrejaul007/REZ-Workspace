# REZ Prompt-to-Workflow AI

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 3000

## Overview
AI-powered service that generates marketing workflows from natural language prompts. Converts marketing objectives into structured workflow steps using AI, validates workflows, optimizes them, and provides template management.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Cache: Redis (optional)
- Security: Helmet, CORS, Rate Limiting

## Key Features
1. **Workflow Generation** - Generate workflows from natural language prompts
2. **Step Generation** - Generate individual workflow steps
3. **Workflow Validation** - Validate generated workflows
4. **Workflow Optimization** - Optimize existing workflows
5. **Template Management** - Manage workflow templates
6. **Template Generation** - Generate templates from prompts
7. **Journey Import** - Import workflows from other systems

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Service info |
| GET | /api/health | Health check |
| GET | /api/metrics | Service metrics |
| POST | /api/generate | Generate workflow from prompt |
| POST | /api/generate/step | Generate workflow step |
| POST | /api/validate | Validate workflow |
| POST | /api/optimize | Optimize workflow |
| GET | /api/templates | List workflow templates |
| GET | /api/templates/:id | Get template by ID |
| POST | /api/templates/from-prompt | Generate template from prompt |
| POST | /api/journeys/import | Import workflow/journey |

## Quick Start

```bash
cd REZ-prompt-workflow-ai
npm install
npm run dev
```

## Environment Variables
- PORT (default: 3000)
- MONGODB_URI
- REDIS_URL
- OPENAI_API_KEY
- NODE_ENV

## Related Services
- REZ-ai-campaign-builder - AI campaign creation
- REZ-marketing-service - Marketing automation
- HOJAI AI - AI model integration