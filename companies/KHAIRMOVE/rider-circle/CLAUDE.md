# RiderCircle - CLAUDE.md

**Version:** 1.0.0
**Date:** June 7, 2026
**Status:** DEVELOPMENT COMPLETE - Ready for Testing

---

## 🎯 Project Overview

**RiderCircle** is the Operating System for Adventure Mobility — a complete rider ecosystem combining community, safety, AI intelligence, commerce, and travel.

### The Moat
**Rider Intelligence Graph** connects Riders → Bikes → Routes → Groups → Events → Destinations → Merchants

This creates the recommendation engine, trust engine, and commerce engine — much harder to replicate than QR codes.

### Key Features
- **SafeQR** - Emergency ID for riders (accidents, breakdowns)
- **Live Tracking** - Real-time GPS presence
- **AI Genie** - Route planning, maintenance advice
- **Bike Digital Twin** - Health tracking, predictions
- **Trust Score** - Reputation system
- **REZ Coins** - Rewards for rides

---

## 🏗️ Architecture

```
rider-circle/
├── rider-circle-api/           # Express + MongoDB (Port 4200)
├── rider-circle-graph/         # Neo4j Knowledge Graph (Port 4300)
├── rider-circle-intelligence/   # Python AI Engine (Port 4400)
├── rider-circle-app/           # Expo Mobile (React Native)
└── rider-circle-shared/        # Shared TypeScript SDK
```

---

## 📦 Services

### RiderCircle API (Port 4200)

**Express + MongoDB Backend**

| Route | Purpose |
|-------|---------|
| `/api/riders` | Rider profiles, SafeQR, trust score |
| `/api/bikes` | Bike Digital Twin, health tracking |
| `/api/rides` | Ride tracking, GPS, waypoints |
| `/api/groups` | Clubs, chapters, crews |
| `/api/events` | Rides, meets, rallies |
| `/api/sos` | Emergency response |
| `/api/presence` | Live location tracking |
| `/api/memories` | AI-generated ride stories |

**Key Files:**
- `src/models/` - 7 Mongoose models
- `src/routes/` - 7 API route modules
- `src/services/` - Presence, Memory, HOJAI, RABTUL integration

### RiderCircle Graph (Port 4300)

**Neo4j Knowledge Graph**

- Rider connections (follow, rides together)
- Route similarity (popular routes, recommendations)
- Group relationships (similar groups)
- Destination mapping

### RiderCircle Intelligence (Port 4400)

**Python FastAPI**

- Bike health calculations
- Ride memory generation
- Trust score calculations
- Route recommendations

---

## 📱 Mobile App (Expo)

### Screen Structure

```
app/
├── index.tsx                    # Landing page
├── auth/
│   ├── login.tsx              # Phone OTP login
│   └── signup.tsx             # 2-step signup
├── (tabs)/
│   ├── index.tsx              # Home dashboard
│   ├── ride.tsx              # Start/stop tracking
│   ├── community.tsx          # Feed, groups, events
│   ├── discover.tsx           # Routes, places
│   └── profile.tsx            # Menu, stats
├── ride/
│   ├── history.tsx           # Past rides
│   └── [id].tsx              # Ride details
├── profile/
│   ├── bikes.tsx             # Bike list
│   ├── add-bike.tsx          # Add bike wizard
│   └── settings.tsx           # App settings
└── community/
    ├── groups.tsx             # Browse groups
    └── events.tsx             # Browse events
```

### State Management (Zustand)

| Store | Purpose |
|-------|---------|
| `auth.ts` | User authentication |
| `ride.ts` | Active ride tracking |
| `presence.ts` | Live location |

### Hooks

| Hook | Purpose |
|------|---------|
| `useLocation` | GPS tracking with expo-location |
| `useNearbyRiders` | Live nearby riders |
| `useLiveStats` | Global presence stats |

---

## 🔗 Integration Points

### RABTUL (Financial Infrastructure)

| Service | Port | Purpose |
|---------|------|---------|
| Auth | 4002 | JWT verification |
| Wallet | 4004 | REZ Coins rewards |
| Notifications | 4011 | SOS alerts, push |

**File:** `rider-circle-api/src/services/rabtul.integration.ts`

### HOJAI (AI Intelligence)

| Service | Port | Purpose |
|---------|------|---------|
| Genie | 4700 | AI assistant |
| Memory | 4015 | Ride memories |
| Knowledge Graph | 4786 | Entity relationships |
| Vector | 4720 | Semantic search |

**File:** `rider-circle-api/src/services/hojai.integration.ts`

---

## 🚀 Quick Start

### Backend

```bash
# RiderCircle API
cd rider-circle-api
npm install
npm run dev  # Port 4200

# RiderCircle Graph (requires Neo4j)
cd rider-circle-graph
npm install
npm run dev  # Port 4300

# RiderCircle Intelligence (requires Python)
cd rider-circle-intelligence
pip install -r requirements.txt
python src/main.py  # Port 4400
```

### Mobile App

```bash
cd rider-circle-app
npm install
npm start  # Expo
```

### Docker (Production)

```bash
cd rider-circle
cp .env.example .env
docker-compose up -d
```

---

## 📋 Environment Variables

```env
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rider_circle

# Redis
REDIS_URL=redis://localhost:6379

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=ridercircle

# RABTUL
REZ_AUTH_URL=http://localhost:4002
REZ_WALLET_URL=http://localhost:4004
REZ_NOTIFICATION_URL=http://localhost:4011

# HOJAI
HOJAI_AGENT_URL=http://localhost:4700
HOJAI_MEMORY_URL=http://localhost:4015
HOJAI_KG_URL=http://localhost:4786
```

---

## 🎨 Design System

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#e94560` | Buttons, highlights |
| Background | `#16213e` | Main background |
| Surface | `#1a1a2e` | Cards, modals |
| Text | `#ffffff` | Primary text |
| Muted | `#888888` | Secondary text |

### Typography

- Headings: Bold, 18-28px
- Body: Regular, 14-16px
- Captions: 12px

### Spacing

- Base unit: 8px
- Padding: 16-24px
- Border radius: 12-16px

---

## 📊 Database Models

### RiderProfile
```typescript
{
  userId: string           // RABTUL user ID
  displayName: string
  phone: string
  safeQRCode: string      // Emergency QR
  bloodGroup?: string
  emergencyContacts: Array
  ridingStyle: 'commuter' | 'tourer' | 'adventure' | 'sport'
  trustScore: number      // 0-100
  totalRides: number
  totalDistance: number
}
```

### BikeDigitalTwin
```typescript
{
  riderId: ObjectId
  nickname: string
  make: string
  model: string
  registrationNumber: string
  odometer: number
  overallHealth: number    // 0-100
  tireHealth: { front: number, rear: number }
  chainCondition: number
  brakeHealth: { front: number, rear: number }
}
```

### Ride
```typescript
{
  riderId: ObjectId
  bikeId: ObjectId
  title: string
  status: 'active' | 'paused' | 'completed'
  route: {
    distance: number
    track: Array<{ coordinates: [lng, lat], timestamp }>
    waypoints: Array<{ name, type, coordinates }>
  }
  stats: { distance, avgSpeed, maxSpeed, duration }
}
```

---

## 🔌 API Endpoints

### Riders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/riders` | Create rider profile |
| GET | `/api/riders/me` | Get own profile |
| GET | `/api/riders/:id` | Get rider by ID |
| GET | `/api/riders/:id/safeqr` | Get SafeQR code |
| GET | `/api/riders/:id/stats` | Get rider stats |
| GET | `/api/riders/:id/trust-score` | Get trust score |
| POST | `/api/riders/:id/follow` | Follow rider |

### Bikes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bikes` | Add bike |
| GET | `/api/bikes` | List bikes |
| GET | `/api/bikes/:id` | Get bike details |
| PUT | `/api/bikes/:id` | Update bike |
| GET | `/api/bikes/:id/health` | Get health score |

### Rides

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides` | Start ride |
| GET | `/api/rides/active` | Get active ride |
| POST | `/api/rides/:id/track` | Add GPS point |
| POST | `/api/rides/:id/waypoint` | Add waypoint |
| POST | `/api/rides/:id/pause` | Pause ride |
| POST | `/api/rides/:id/resume` | Resume ride |
| POST | `/api/rides/:id/complete` | End ride |

### SOS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sos` | Trigger SOS |
| GET | `/api/sos/:id` | Get SOS status |
| POST | `/api/sos/:id/respond` | Respond to SOS |
| GET | `/api/sos/nearby` | Get nearby SOS |

---

## 🎯 Features in Development

### P0 - Critical
- [x] SafeQR emergency ID
- [x] Live GPS tracking
- [x] SOS system
- [x] Bike health tracking

### P1 - Important
- [x] Ride history
- [x] Groups & events
- [x] AI Genie assistant
- [x] Trust score

### P2 - Nice to Have
- [ ] Route planning
- [ ] Ride memories (AI stories)
- [ ] Marketplace
- [ ] Achievements & badges

---

## 🐛 Debugging

### Check API Health
```bash
curl http://localhost:4200/api/health
curl http://localhost:4200/api/health/ready
```

### Check MongoDB
```javascript
// In mongo shell
db.riderprofiles.findOne()
db.rides.find().sort({startTime: -1}).limit(1)
```

### Check Socket.io
```javascript
// Connect to ws://localhost:4200
// Events: presence:join, ride:start, sos:triggered
```

---

## 📞 Support

For issues or questions, refer to:
- API Documentation: `/api/docs`
- Health Check: `/api/health`
- Swagger: `http://localhost:4200/api/docs`

---

**Last Updated:** June 7, 2026
**Version:** 1.0.0