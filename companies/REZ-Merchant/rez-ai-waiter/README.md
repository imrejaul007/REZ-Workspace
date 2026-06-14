# REZ AI Waiter Service

WhatsApp ordering and AI-powered restaurant service.

**Port: 3024**

## Features

- **Menu Management**: View and search restaurant menu
- **WhatsApp Integration**: Order via WhatsApp messages
- **Order Processing**: Place, track, and manage orders
- **AI Suggestions**: Personalized recommendations based on history
- **Real-time Updates**: Order status notifications

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/restaurants/:id/menu` | Get restaurant menu |
| GET | `/api/menu/search` | Search menu items |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/status` | Update order status |
| POST | `/api/webhook/whatsapp` | WhatsApp webhook |
| GET | `/api/recommendations/:phone` | Get recommendations |

## Quick Start

```bash
cd REZ-Merchant/rez-ai-waiter
npm install
npm start
```

## WhatsApp Flow

```
Customer → "Hi" → Bot: Shows welcome + options
Customer → "Menu" → Bot: Shows menu
Customer → "1, 2" → Bot: Adds items to cart
Customer → "confirm" → Order placed
```

## Example

```bash
# Place order
curl -X POST http://localhost:3024/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+919876543210",
    "items": [{"itemId": "1", "quantity": 2}],
    "notes": "Extra cheese"
  }'
```
