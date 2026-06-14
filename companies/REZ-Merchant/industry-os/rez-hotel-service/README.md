# ReZ Hotel Service

Hotel management and booking integration service.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache/Queue:** Redis, BullMQ
- **HTTP Client:** Axios
- **Validation:** Zod
- **Auth:** JWT

## Environment Variables

```env
# Server
PORT=4015
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rez_hotel

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
MAKKORPS_API_URL=https://api.makcorps.com
MAKKORPS_API_KEY=your_api_key
STAYOWN_API_URL=https://api.stayown.com
STAYOWN_API_KEY=your_api_key

# Authentication
INTERNAL_SERVICE_TOKEN=your_internal_token
```

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |

### Hotels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hotels` | List hotels |
| POST | `/api/hotels` | Create hotel |
| GET | `/api/hotels/:id` | Get hotel details |
| PUT | `/api/hotels/:id` | Update hotel |
| DELETE | `/api/hotels/:id` | Delete hotel |
| GET | `/api/hotels/:id/rooms` | List hotel rooms |
| GET | `/api/hotels/search` | Search hotels |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Get booking details |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync` | Sync hotel data |
| GET | `/api/sync/status` | Sync status |

## Local Setup

### Prerequisites
- Node.js 20+
- MongoDB
- Redis

### Installation

```bash
cd rez-hotel-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment
```

### Running Locally

```bash
# Development mode
npm run dev

# Production
npm run build
npm start
```

### Testing

```bash
npm test
```

## Project Structure

```
src/
  index.ts           # Main entry point
  db.ts             # Database connection
  routes/
    hotels.ts      # Hotel CRUD operations
    bookings.ts     # Booking management
    sync.ts        # Data synchronization
    health.ts       # Health check routes
```

## License

MIT
