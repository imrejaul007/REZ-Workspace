# REZ QR Cloud Service

**Complete QR commerce platform for restaurants, hotels, and merchants.**

## Version 2.1 - Stabilized

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   FEATURES                                                  │
│   ├── MongoDB Database (persistent)                        │
│   ├── API Key Authentication (secure)                       │
│   ├── WebSocket (real-time orders)                        │
│   ├── Payment Integration (Razorpay/UPI)                   │
│   ├── Wallet Integration (coins/cashback)                  │
│   ├── Event Bus (real-time events)                        │
│   ├── Rate Limiting (abuse prevention)                    │
│   └── Offers/Coupons system                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4300 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/qr-cloud | MongoDB connection |
| `RAZORPAY_KEY_ID` | - | Razorpay key |
| `RAZORPAY_KEY_SECRET` | - | Razorpay secret |
| `INTERNAL_SERVICE_TOKEN` | - | Service auth |

## API Endpoints

### Public (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resolve/:code` | Resolve QR code |
| GET | `/api/public/menu/:id` | Get menu |
| GET | `/api/public/offers/:id` | Get offers |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id/upi-qr` | Get UPI QR |

### Authenticated (X-API-Key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants` | Create merchant |
| GET | `/api/merchants/profile` | Get profile |
| PATCH | `/api/merchants/profile` | Update profile |
| POST | `/api/qr` | Create QR |
| GET | `/api/qr` | List QR codes |
| GET | `/api/qr/:id` | Get QR |
| GET | `/api/qr/:id/download` | Download PNG |
| GET | `/api/qr/:id/print` | Print QR |
| PATCH | `/api/qr/:id/toggle` | Toggle QR |
| DELETE | `/api/qr/:id` | Delete QR |
| GET | `/api/menu` | Get menu |
| POST | `/api/categories` | Create category |
| POST | `/api/items` | Create item |
| PATCH | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Get order |
| PATCH | `/api/orders/:id/status` | Update status |
| POST | `/api/orders/:id/payment` | Initiate payment |
| POST | `/api/orders/:id/verify` | Verify payment |
| POST | `/api/offers` | Create offer |
| GET | `/api/offers` | List offers |
| GET | `/api/analytics` | Analytics |
| GET | `/api/scans` | Scan events |

## QR Types

| Type | Description |
|------|-------------|
| `menu` | Digital menu |
| `table` | Table ordering |
| `payment` | Payment link |
| `info` | Info page |
| `verify` | Product verification |
| `creator` | Creator profile |
| `ads` | Ad tracking |

## WebSocket Events

```javascript
// Connect
const socket = io('http://localhost:4300');

// Subscribe
socket.emit('subscribe:orders', { merchantId });
socket.emit('subscribe:scans', { merchantId });

// Listen
socket.on('order:new', (data) => { /* new order */ });
socket.on('order:statusChanged', (data) => { /* status update */ });
socket.on('scan:new', (data) => { /* new scan */ });
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## License

MIT
