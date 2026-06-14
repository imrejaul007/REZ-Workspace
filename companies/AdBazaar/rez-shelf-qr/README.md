# REZ Shelf QR

Shelf QR code advertising and analytics.

## Service Purpose

Generates and manages QR codes for shelf advertising, tracks scan analytics, and enables contactless product information and purchasing through QR code interactions.

## Port

```
3031
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/codes` | List QR codes |
| POST | `/api/codes` | Generate QR code |
| GET | `/api/codes/:id` | Get QR code details |
| PUT | `/api/codes/:id` | Update QR code |
| DELETE | `/api/codes/:id` | Delete QR code |
| GET | `/api/codes/:id/image` | Get QR code image |
| GET | `/api/scans` | Scan analytics |
| GET | `/api/scans/:codeId` | Specific code scans |
| GET | `/api/products` | Linked products |
| POST | `/api/products` | Link product |
| POST | `/api/redemption` | Track redemption |

## Configuration

Environment variables:

```env
PORT=3031
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-shelf-qr
QR_BASE_URL=https://qr.rez.example.com
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

## QR Code Usage

```typescript
// Generate QR for product
const qr = await api.post('/api/codes', {
  productId: 'prod_123',
  campaignId: 'camp_456',
  content: 'https://qr.rez.example.com/scan/abc123',
  size: 300,
  format: 'png'
});

// Track scan
await api.get(`/api/scans/${qr.id}`);
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- qrcode (QR generation)
- Axios (HTTP client)
- Dotenv (environment config)
