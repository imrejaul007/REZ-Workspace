# 🚴 RiderCircle

> The Operating System for Adventure Mobility

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-development-green.svg)
![Platform](https://img.shields.io/badge/platform-React%20Native-61dafb.svg)

---

## 🎯 Overview

**RiderCircle** is a complete rider ecosystem combining:

- 🛡️ **SafeQR** - Emergency ID for riders (accidents, breakdowns)
- 📡 **Live Tracking** - Real-time GPS presence
- 🤖 **AI Genie** - Route planning, maintenance advice
- 🔧 **Bike Digital Twin** - Health tracking, predictions
- ⭐ **Trust Score** - Reputation system
- 🪙 **REZ Coins** - Rewards for rides

---

## 🏗️ Architecture

```
rider-circle/
├── rider-circle-api/           # Express + MongoDB (Port 4200)
├── rider-circle-graph/         # Neo4j Knowledge Graph (Port 4300)
├── rider-circle-intelligence/  # Python AI Engine (Port 4400)
├── rider-circle-app/           # Expo Mobile App
└── rider-circle-shared/       # Shared TypeScript SDK
```

### Services

| Service | Port | Tech | Purpose |
|---------|------|------|---------|
| **rider-circle-api** | 4200 | Express + MongoDB | REST API |
| **rider-circle-graph** | 4300 | Node + Neo4j | Knowledge Graph |
| **rider-circle-intelligence** | 4400 | Python FastAPI | AI Engine |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Redis 7.0+
- Neo4j 5.0+ (optional)

### 1. Start Backend API

```bash
cd rider-circle-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start server
npm run dev
```

API will be available at `http://localhost:4200`

### 2. Start Mobile App

```bash
cd rider-circle-app

# Install dependencies
npm install

# Start Expo
npm start
```

### 3. (Optional) Start Intelligence Service

```bash
cd rider-circle-intelligence

# Install Python dependencies
pip install -r requirements.txt

# Start server
python src/main.py
```

Intelligence API will be available at `http://localhost:4400`

---

## 🐳 Docker Deployment

```bash
# Clone the repository
cd rider-circle

# Copy environment file
cp .env.example .env

# Edit .env with your values

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

---

## 📱 Mobile App Screens

| Screen | File | Description |
|--------|------|-------------|
| Landing | `app/index.tsx` | Logo, features, CTA |
| Login | `app/auth/login.tsx` | Phone OTP |
| Signup | `app/auth/signup.tsx` | 2-step wizard |
| Home | `app/(tabs)/index.tsx` | Dashboard |
| Ride | `app/(tabs)/ride.tsx` | GPS tracking |
| Community | `app/(tabs)/community.tsx` | Feed |
| Discover | `app/(tabs)/discover.tsx` | Routes |
| Profile | `app/(tabs)/profile.tsx` | Menu |

---

## 🔌 API Reference

### Health Check

```bash
curl http://localhost:4200/api/health
```

### Riders

```bash
# Create rider
curl -X POST http://localhost:4200/api/riders \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Test Rider", "phone": "+919876543210"}'

# Get profile
curl http://localhost:4200/api/riders/me \
  -H "Authorization: Bearer <token>"
```

### Bikes

```bash
# Add bike
curl -X POST http://localhost:4200/api/bikes \
  -H "Content-Type: application/json" \
  -d '{"nickname": "The Beast", "make": "Royal Enfield", "model": "Himalayan 450"}'

# Get bike health
curl http://localhost:4200/api/bikes/<id>/health
```

### Rides

```bash
# Start ride
curl -X POST http://localhost:4200/api/rides \
  -H "Content-Type: application/json" \
  -d '{"title": "Morning Ride", "bikeId": "<bike_id>"}'

# Add GPS point
curl -X POST http://localhost:4200/api/rides/<id>/track \
  -H "Content-Type: application/json" \
  -d '{"coordinates": [77.5946, 12.9716], "speed": 45}'

# Complete ride
curl -X POST http://localhost:4200/api/rides/<id>/complete
```

### SOS

```bash
# Trigger SOS
curl -X POST http://localhost:4200/api/sos \
  -H "Content-Type: application/json" \
  -d '{"type": "breakdown", "location": {"coordinates": [77.5946, 12.9716]}}'

# Get nearby SOS
curl http://localhost:4200/api/sos/nearby/list?lat=12.9716&lng=77.5946
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

---

## 📊 Database Models

### RiderProfile

```javascript
{
  userId: String,           // RABTUL user ID
  displayName: String,
  phone: String,
  safeQRCode: String,      // Emergency QR
  bloodGroup: String,
  emergencyContacts: Array,
  ridingStyle: String,      // commuter, tourer, adventure, sport
  trustScore: Number,      // 0-100
  totalRides: Number,
  totalDistance: Number
}
```

### BikeDigitalTwin

```javascript
{
  riderId: ObjectId,
  nickname: String,
  make: String,
  model: String,
  registrationNumber: String,
  odometer: Number,
  overallHealth: Number,    // 0-100
  tireHealth: { front: Number, rear: Number },
  chainCondition: Number,
  brakeHealth: { front: Number, rear: Number }
}
```

### Ride

```javascript
{
  riderId: ObjectId,
  bikeId: ObjectId,
  title: String,
  status: String,           // active, paused, completed
  route: {
    distance: Number,
    track: Array<{ coordinates: [lng, lat], timestamp }>,
    waypoints: Array<{ name, type, coordinates }>
  },
  stats: { distance, avgSpeed, maxSpeed, duration }
}
```

---

## 🔗 Integrations

### RABTUL (Financial Infrastructure)

| Service | Port | Purpose |
|---------|------|---------|
| Auth | 4002 | JWT verification |
| Wallet | 4004 | REZ Coins rewards |
| Notifications | 4011 | SOS alerts, push |

### HOJAI (AI Intelligence)

| Service | Port | Purpose |
|---------|------|---------|
| Genie | 4700 | AI assistant |
| Memory | 4015 | Ride memories |
| Knowledge Graph | 4786 | Entity relationships |

---

## 🧪 Testing

```bash
cd rider-circle-api

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

---

## 📁 Project Structure

```
rider-circle/
├── rider-circle-api/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/      # Business logic
│   │   ├── events/        # Socket.io
│   │   ├── middleware/    # Auth, validation
│   │   └── utils/         # Helpers
│   └── tests/             # Unit tests
├── rider-circle-app/
│   ├── app/              # Expo Router screens
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom hooks
│   ├── services/         # API client
│   └── stores/           # Zustand stores
├── rider-circle-graph/    # Neo4j service
├── rider-circle-intelligence/  # Python AI
└── docker-compose.yml    # Docker deployment
```

---

## 📄 License

Proprietary - REZ Ecosystem

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- Documentation: `/api/docs`
- Health Check: `/api/health`
- Swagger: `http://localhost:4200/api/docs`

---

**Built with ❤️ by REZ Ecosystem**
**Version:** 1.0.0 | **Date:** June 7, 2026