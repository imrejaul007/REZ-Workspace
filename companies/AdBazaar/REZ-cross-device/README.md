# REZ Cross-Device

Cross-device user stitching and identity resolution service.

## Service Purpose

Resolves user identity across multiple devices, browsers, and platforms. Maintains unified user profiles by stitching behavioral signals from web, mobile, and connected devices.

## Port

```
3003
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List user profiles |
| POST | `/api/profiles` | Create user profile |
| GET | `/api/profiles/:id` | Get profile by ID |
| PUT | `/api/profiles/:id` | Update profile |
| POST | `/api/profiles/:id/link` | Link device to profile |
| POST | `/api/profiles/:id/unlink` | Unlink device from profile |
| GET | `/api/profiles/device/:deviceId` | Get profile by device ID |
| POST | `/api/resolve` | Resolve user across devices |

## Configuration

Environment variables:

```env
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-cross-device
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
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

# Run tests
npm test
npm run test:run
npm run test:coverage
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- Winston (logging)
- CORS
- Helmet (security headers)
- Vitest (testing)
