# Rider Twin Service

Digital Twin service for rider profiles, preferences, loyalty, and activity tracking. Part of the Transport OS integration with TwinOS.

## Overview

The Rider Twin Service maintains a comprehensive digital representation of each rider in the transport ecosystem. It handles:

- **Profile Management**: Rider personal information, contact details
- **Payment Methods**: Saved cards, default payment, cash settings
- **Preferences**: Vehicle type, smoking policy, music, AC, special assistance
- **Addresses**: Home, work, and favorite locations
- **Loyalty Program**: Points, tiers, redemption
- **Activity Tracking**: Trip history, spend, favorite routes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Rider Twin Service                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  REST API   │  │  WebSocket  │  │    Event Bus        │ │
│  │  (Express)  │  │   Server    │  │  (Pub/Sub)          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│           │                │                   │             │
│           └────────────────┼───────────────────┘             │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              RiderTwinService                            ││
│  │  - CRUD Operations                                      ││
│  │  - Payment Management                                   ││
│  │  - Loyalty & Points                                      ││
│  │  - Activity Tracking                                     ││
│  │  - Analytics                                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Rider Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders` | List all riders |
| POST | `/api/v1/riders` | Create new rider |
| GET | `/api/v1/riders/:riderId` | Get rider by ID |
| PATCH | `/api/v1/riders/:riderId` | Update rider |
| DELETE | `/api/v1/riders/:riderId` | Delete rider |
| GET | `/api/v1/riders/search?q=` | Search riders |

### TwinOS Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/twin` | Get TwinOS entity ID |

### Payment Methods
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/payment` | Get payment methods |
| POST | `/api/v1/riders/:riderId/payment` | Add payment method |
| DELETE | `/api/v1/riders/:riderId/payment/:cardId` | Remove payment |
| PATCH | `/api/v1/riders/:riderId/payment/default` | Set default |

### Addresses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/addresses` | Get addresses |
| POST | `/api/v1/riders/:riderId/addresses` | Add address |
| DELETE | `/api/v1/riders/:riderId/addresses/:type` | Remove address |

### Loyalty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/loyalty` | Get loyalty status |
| POST | `/api/v1/riders/:riderId/loyalty/points` | Add points |
| POST | `/api/v1/riders/:riderId/loyalty/redeem` | Redeem points |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/preferences` | Get preferences |
| PATCH | `/api/v1/riders/:riderId/preferences` | Update preferences |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/routes` | Get favorite routes |
| POST | `/api/v1/riders/:riderId/routes` | Add favorite route |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/riders/:riderId/analytics` | Get rider analytics |
| GET | `/api/v1/riders/:riderId/stats` | Get rider statistics |

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Run with dependencies
npm run docker:compose
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 9050 |
| NODE_ENV | Environment | development |
| CORS_ORIGINS | Allowed CORS origins | * |
| LOG_LEVEL | Logging level | info |
| EVENT_BUS_URL | Event bus URL | http://localhost:4025 |
| TWINOS_URL | TwinOS URL | http://localhost:4142 |

## Events

### Published Events
- `transport.order.created` - New order by rider
- `transport.journey.completed` - Journey completed

### Subscribed Events
- `transport.order.created`
- `transport.journey.completed`

## Loyalty Tiers

| Tier | Minimum Points | Points Multiplier |
|------|----------------|-------------------|
| Basic | 0 | 1.0x |
| Silver | 1,000 | 1.25x |
| Gold | 5,000 | 1.5x |
| Platinum | 15,000 | 2.0x |

## License

MIT
