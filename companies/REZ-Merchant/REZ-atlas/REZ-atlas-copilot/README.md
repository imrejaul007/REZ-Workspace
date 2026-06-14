# REZ Atlas Copilot
**Port:** 5172 | **Type:** AI Sales Assistant

---

## Overview

AI-powered sales assistant for:
- Merchant summarization
- Personalized pitch generation
- Competitor analysis

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

### AI Features
- `POST /api/summarize` - Generate merchant summary
- `POST /api/pitch` - Generate personalized pitch
- `POST /api/compare` - Compare with competitors

---

## Pitch Channels

| Channel | Output |
|---------|--------|
| email | Subject + body |
| whatsapp | Single message |
| call | Call script |

---

## Environment Variables

```env
PORT=5172
```