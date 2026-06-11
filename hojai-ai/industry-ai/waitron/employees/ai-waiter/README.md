# AI Waiter - Restaurant AI Employee

**Product:** WAITRON
**Type:** AI Agent
**Purpose:** Take orders, answer questions, provide recommendations

## Overview

AI Waiter is a conversational AI agent that interacts with customers to:
- Take food orders
- Answer menu questions
- Provide recommendations
- Handle special requests

## Features

- Natural language order taking
- Menu recommendations based on preferences
- Dietary restriction handling
- Special request management
- Real-time order updates

## API Endpoints

```typescript
POST /api/ai/waiter/order     // Place an order
GET  /api/ai/waiter/recommend // Get recommendations
POST /api/ai/waiter/question  // Answer questions
```

## Usage

```typescript
import { AIWaiter } from './src';

const waiter = new AIWaiter();

// Take order
const order = await waiter.takeOrder({
  tableNumber: 5,
  items: [{ menuItemId: '1', quantity: 2 }],
  specialRequests: 'No onions'
});
```

## Status

✅ Implemented
