# REZ Business Copilot - Developer Guide

**Version:** 1.0.0
**Updated:** June 2026

---

## Overview

REZ Business Copilot provides a natural language Q&A interface for merchants. Ask questions about your business performance in plain English and get instant insights, charts, and recommendations.

---

## Features

- Natural language query input with voice support
- Multi-type question handling (analysis, recommendations, comparisons, predictions)
- Interactive charts and KPI displays
- Action recommendations with one-click execution
- Conversational context with follow-ups
- Dashboard integration with drill-down capability

---

## Project Structure

```
rez-business-copilot/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main copilot interface
│   │   ├── insights/page.tsx     # Saved insights page
│   │   └── api/
│   │       ├── query/route.ts    # NLP query processing
│   │       └── recommend/route.ts # Recommendations API
│   ├── components/
│   │   ├── Chat/                 # Chat UI components
│   │   ├── Response/             # Response display components
│   │   └── Insights/             # Insight cards
│   ├── lib/
│   │   ├── queryParser.ts        # NL to structured query
│   │   ├── answerGenerator.ts    # Response generation
│   │   └── chartDataFormatter.ts # Chart data formatting
│   ├── types/
│   │   └── copilot.ts            # TypeScript definitions
│   └── store/
│       └── chatStore.ts          # Zustand state management
└── tests/
    └── copilot.test.ts           # Unit tests
```

---

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## API Endpoints

### POST /api/query
Process natural language queries.

### POST /api/recommend
Get business recommendations by category.

---

## NLP Query Parser

The query parser handles:

| Intent | Keywords | Example |
|--------|----------|---------|
| analysis | why, what happened, explain | "Why are sales down?" |
| recommendation | what should, recommend, suggest | "What offer should I run?" |
| comparison | compare, versus, vs | "Compare vs last month" |
| prediction | predict, forecast, will | "What will sales be?" |

Timeframe detection supports:
- today, yesterday, this/last week/month/quarter/year
- past 7/30/90 days

---

## Integration

### Service URLs (from REZ-Merchant CLAUDE.md)

```typescript
// REZ Business AI
REZ_BUSINESS_AI_URL=http://localhost:4000

// Merchant Intelligence
MERCHANT_INTELLIGENCE_URL=http://localhost:4010

// Recommendations
RECOMMENDATION_ENGINE_URL=http://localhost:4190

// Analytics
BI_REPORTING_URL=http://localhost:4020
```

---

## Component Architecture

### Chat Components
- `ChatInterface` - Main container with message list
- `QueryInput` - Text/voice input component
- `Message` - Message bubble (user/assistant)
- `SuggestedQuestions` - Quick question buttons

### Response Components
- `AnswerText` - Formatted text display
- `MetricCard` - KPI with trend indicator
- `Chart` - Recharts integration (line/bar/pie/donut)
- `ActionButtons` - Action button group

### Insight Components
- `InsightCard` - Insight display with type badges
- `InsightList` - Grouped insight list
- `InsightSummary` - Quick stats overview

---

## State Management

Uses Zustand for global state:

```typescript
// Chat store
useChatStore(state => ({
  messages: state.messages,
  isLoading: state.isLoading,
  addMessage: state.addMessage,
  setLoading: state.setLoading,
  // ...
}))
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# CI mode (single run)
npm run test:ci
```

---

## Development Guidelines

1. **TypeScript** - Strict mode enabled
2. **Components** - Use 'use client' for interactive components
3. **API Routes** - Return proper NextResponse with error handling
4. **State** - Use Zustand selectors for optimized re-renders
5. **Styling** - Tailwind CSS with custom theme

---

## Environment Setup

```bash
cp .env.example .env.local
```

Required variables:
- `REZ_BUSINESS_AI_URL`
- `MERCHANT_INTELLIGENCE_URL`
- `RECOMMENDATION_ENGINE_URL`
- `INTERNAL_API_KEY`