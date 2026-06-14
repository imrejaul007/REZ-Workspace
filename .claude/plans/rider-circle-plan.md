# RiderCircle Implementation Plan

**Version:** 1.0  
**Date:** June 7, 2026  
**Status:** PLANNING PHASE  
**Company:** RTMN Digital (under REZ-Consumer)  
**Competitor:** REVER, RISER, EatSleepRIDE, Strava  

---

## 1. Concept & Vision

### What is RiderCircle?
**"The Operating System for Adventure Mobility"**

RiderCircle is the world's first intelligent rider safety and adventure network — combining community, safety, AI intelligence, commerce, and travel into a single platform.

### Core Pillars
1. **Identity** — SafeQR Rider ID + Bike Digital Twin
2. **Community** — Groups, rides, events, live presence
3. **Safety** — SOS, live tracking, emergency response
4. **Intelligence** — Rider Graph, Genie AI, Route Discovery
5. **Commerce** — Gear marketplace, merchant network, tours
6. **Memory** — Ride history, stories, photo albums
7. **Travel** — Routes, destinations, trip planning

### The Moat: Rider Intelligence Graph
A graph database connecting Riders, Bikes, Routes, Groups, Events, Destinations, Service Centers, Gear, and Merchants.

---

## 2. Architecture Overview

```
RTMN Digital
│
├── REZ-Consumer (Parent)
│   ├── safe-qr/                    (exists - Identity Layer)
│   ├── rider-circle/                (NEW - Adventure OS)
│   │   ├── rider-circle-app/        (Expo Mobile App)
│   │   ├── rider-circle-api/        (Express Backend)
│   │   ├── rider-circle-graph/      (Rider Intelligence Graph)
│   │   ├── rider-circle-intelligence/ (AI Layer)
│   │   └── rider-circle-shared/    (Shared types, SDK)
│   │
│   └── verify-qr-service/          (exists - Verification)
│
├── KHAIRMOVE (Services Provider)
│   ├── khaimove-ride-service/       (GPS, tracking)
│   └── khaimove-fleet-service/      (Fleet management)
│
└── HOJAI-AI (Intelligence Provider)
    ├── genie-memory-service/        (Ride memory)
    ├── hojai-agent-runtime/         (AI assistant)
    ├── workforce-knowledge-graph/    (Graph reference)
    └── employee-digital-twin-service/ (Digital Twin reference)
```

---

## 3. Service Breakdown

### 3.1 RiderCircle App (Expo Mobile)
**Location:** `REZ-Consumer/rider-circle/rider-circle-app/`  
**Port:** 3001 (Development)  
**Stack:** Expo SDK 53, React Native, TypeScript, Expo Router

### 3.2 RiderCircle API (Backend)
**Location:** `REZ-Consumer/rider-circle/rider-circle-api/`  
**Port:** 4200  

**Sub-services:**
| Service | Port | Purpose |
|---------|------|---------|
| rider-circle-api | 4200 | Main gateway |
| rider-profile-service | 4201 | Rider profiles, SafeQR |
| ride-tracking-service | 4202 | GPS tracking, ride recording |
| community-service | 4203 | Groups, events, feed |
| safety-service | 4204 | SOS, emergency, live tracking |
| presence-service | 4205 | Live ride presence |
| commerce-service | 4206 | Marketplace, merchants |
| memory-service | 4207 | Ride memories, stories |

### 3.3 Rider Intelligence Graph
**Location:** `REZ-Consumer/rider-circle/rider-circle-graph/`  
**Port:** 4300  
**Stack:** Neo4j, Express, TypeScript

**Graph Nodes:** Rider, Bike, Route, Group, Event, Destination, ServiceCenter, Gear, Merchant

### 3.4 Rider Intelligence Engine
**Location:** `REZ-Consumer/rider-circle/rider-circle-intelligence/`  
**Port:** 4400  
**Stack:** Python, FastAPI

---

## 4. Phase 1 MVP Scope

### Core Features
1. ✅ Rider Profiles with SafeQR
2. ✅ Bike Digital Twin
3. ✅ Ride Tracking (GPS)
4. ✅ Live Location Sharing
5. ✅ SOS System
6. ✅ Community Feed
7. ✅ Groups & Events
8. ✅ Ride Presence (Live)
9. ✅ Genie AI Assistant
10. ✅ Ride Memory

---

## 5. Data Models

### Rider Model
- userId, displayName, phone, email, avatar
- SafeQR data (bloodGroup, allergies, emergencyContacts)
- bikes[], ridingStyle, experience
- trustScore, verifiedRides, badges
- totalRides, totalDistance

### Bike Digital Twin Model
- nickname, make, model, year, vin, registration
- odometer, fuelType, specs (engineCC, hp, torque)
- serviceHistory[], tireHealth, chainCondition, brakeHealth
- documents (registration, insurance, PUC)
- overallHealth (0-100), predictions

### Ride Model
- riderId, bikeId, title, type (solo/group/event)
- route (track, waypoints, distance, difficulty)
- startTime, endTime, duration
- stats (avgSpeed, maxSpeed, elevation)
- companions, groupId
- liveTracking, sosEnabled
- expenses (fuel, tolls, food, total)
- memory (story, highlights, photos)

### Group Model
- name, slug, description, avatar, coverImage
- type (club/chapter/crew/community), focus[]
- location (city, state, country)
- ownerId, admins[], members[], memberCount
- isPrivate, requiresApproval, minTrustScore

### Event Model
- groupId, organizerId, title, description, type
- route (start, end, waypoints, distance)
- startTime, endTime, duration
- maxParticipants, rsvps[], checkIns[]
- minTrustScore, requiredGear[], difficulty

### SOS Event Model
- riderId, rideId, type, severity
- location (coordinates, address, altitude)
- description, photos[], voiceNote
- responders[], status
- triggeredAt, acknowledgedAt, resolvedAt

---

## 6. API Endpoints

### Rider Profile APIs
```
POST   /api/riders                    # Create rider profile
GET    /api/riders/:id                # Get rider profile
PUT    /api/riders/:id                # Update rider profile
GET    /api/riders/:id/safeqr         # Get SafeQR
GET    /api/riders/:id/bikes          # Get rider's bikes
GET    /api/riders/:id/stats          # Get rider stats
GET    /api/riders/:id/trust-score    # Get trust score
```

### Bike Digital Twin APIs
```
POST   /api/bikes                     # Create bike twin
GET    /api/bikes/:id                 # Get bike twin
PUT    /api/bikes/:id                 # Update bike twin
GET    /api/bikes/:id/health          # Get health score
GET    /api/bikes/:id/service-history # Get service history
POST   /api/bikes/:id/service-record  # Add service record
GET    /api/bikes/:id/predictions      # Get AI predictions
```

### Ride Tracking APIs
```
POST   /api/rides                     # Start ride
GET    /api/rides/:id                 # Get ride
PUT    /api/rides/:id                 # Update ride
DELETE /api/rides/:id                 # End/cancel ride
POST   /api/rides/:id/track           # Add GPS point
GET    /api/rides/:id/stats           # Get ride stats
POST   /api/rides/:id/complete        # Complete ride
GET    /api/rides/:id/export          # Export GPX
GET    /api/rides/history             # Get ride history
```

### Safety APIs
```
POST   /api/sos                       # Trigger SOS
GET    /api/sos/:id                   # Get SOS event
PUT    /api/sos/:id                   # Update SOS status
POST   /api/sos/:id/respond           # Respond to SOS
POST   /api/sos/:id/resolve          # Resolve SOS
GET    /api/safety/live/:riderId      # Get live location
POST   /api/safety/live               # Update live location
POST   /api/safety/convoy             # Start convoy
POST   /api/safety/convoy/:id/join    # Join convoy
```

### Community APIs
```
POST   /api/groups                    # Create group
GET    /api/groups                    # List groups
GET    /api/groups/:id                # Get group
POST   /api/groups/:id/join           # Join group
POST   /api/groups/:id/leave          # Leave group

POST   /api/events                    # Create event
GET    /api/events                    # List events
GET    /api/events/:id                # Get event
POST   /api/events/:id/rsvp           # RSVP
POST   /api/events/:id/checkin        # Check-in

GET    /api/feed                      # Get community feed
POST   /api/feed                      # Create post
```

### Presence APIs
```
GET    /api/presence                  # Get all active riders
GET    /api/presence/nearby           # Get nearby riders
GET    /api/presence/groups           # Get active groups
POST   /api/presence/update           # Update own presence
```

### Memory APIs
```
GET    /api/memories                  # Get all memories
GET    /api/memories/:id              # Get memory
POST   /api/memories/:id/generate     # Generate AI story
POST   /api/memories/:id/photos       # Link photos
POST   /api/memories/:id/expenses     # Add expenses
```

---

## 7. Port Registry
```
4200  rider-circle-api
4201  rider-profile-service
4202  ride-tracking-service
4203  community-service
4204  safety-service
4205  presence-service
4206  commerce-service
4207  memory-service
4300  rider-circle-graph
4400  rider-intelligence-engine
3001  rider-circle-app (dev)
```

---

## 8. Integration Points

### RABTUL Services
| Service | Port | Integration |
|---------|------|-------------|
| REZ Auth | 4002 | JWT verification |
| REZ Wallet | 4004 | REZ Coins for rewards |
| REZ Notifications | 4011 | Push for SOS, ride updates |

### HOJAI Services
| Service | Port | Integration |
|---------|------|-------------|
| Genie Memory | 4015 | Ride memory storage |
| Agent Runtime | 4700 | Genie ride assistant |
| Knowledge Graph | 4786 | Entity relationships |

### KHAIRMOVE Services
| Service | Port | Integration |
|---------|------|-------------|
| Ride Service | 4600 | GPS tracking patterns |
| Fleet Service | 4601 | Group management |

---

## 9. File Structure

```
REZ-Consumer/rider-circle/
├── rider-circle-api/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── config/
│   │   ├── models/
│   │   │   ├── rider.ts
│   │   │   ├── bike.ts
│   │   │   ├── ride.ts
│   │   │   ├── group.ts
│   │   │   ├── event.ts
│   │   │   └── sos.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── rider-circle-graph/
│   ├── src/
│   │   ├── index.ts
│   │   ├── nodes/
│   │   ├── relationships/
│   │   └── services/
│   └── package.json
├── rider-circle-intelligence/
│   ├── src/
│   │   ├── agents/
│   │   ├── engines/
│   │   └── models/
│   ├── requirements.txt
│   └── Dockerfile
├── rider-circle-app/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── package.json
├── rider-circle-shared/
│   └── package.json
└── docs/
```

---

## 10. Implementation Steps

### Step 1: Project Setup (Day 1)
- Create folder structure
- Initialize packages
- Set up TypeScript configs
- Configure MongoDB connections

### Step 2: Rider Profile Service (Day 1-2)
- Rider model (Mongoose schema)
- SafeQR generation
- Profile CRUD APIs
- Trust score system

### Step 3: Bike Digital Twin Service (Day 2-3)
- Bike model
- Service history tracking
- Document storage
- Health score calculation

### Step 4: Ride Tracking Service (Day 3-4)
- GPS tracking endpoints
- Ride recording
- Real-time updates (Socket.io)
- Waypoint management

### Step 5: Safety Service (Day 4-5)
- SOS trigger
- Emergency contacts
- Live location broadcast
- Convoy mode

### Step 6: Community Service (Day 5-6)
- Groups CRUD
- Events CRUD
- Community feed
- RSVP system

### Step 7: Ride Presence Service (Day 6-7)
- Live presence tracking
- Nearby riders
- Active groups

### Step 8: Genie AI Integration (Day 7-8)
- HOJAI Genie integration
- Ride planning commands
- Route suggestions

### Step 9: Ride Memory Service (Day 8-9)
- Ride history
- AI story generation
- Photo linking
- Shareable cards

### Step 10: Mobile App (Day 10-14)
- Expo project setup
- Authentication screens
- Ride tracking UI
- SOS button
- Genie chat UI

---

## 11. Dependencies

### Node.js
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "ioredis": "^5.3.2",
  "neo4j-driver": "^5.15.0",
  "socket.io": "^4.6.1",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.22.4",
  "qrcode": "^1.5.3",
  "uuid": "^9.0.0",
  "winston": "^3.11.0"
}
```

### Python Intelligence
```txt
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
neo4j==5.15.0
numpy==1.26.0
openai==1.3.0
```

---

## 12. Success Metrics

### Phase 1 (3 months)
- 10,000 registered riders
- 50,000 rides recorded
- 1,000 groups created
- 500 events hosted
- 100 SOS events (with response)
- 500 ride memories generated

### KPIs
- DAU/MAU ratio > 30%
- Average ride distance > 50km
- Group retention > 60%
- SOS response time < 5 minutes
- NPS score > 40

---

**Plan Status:** Ready for Implementation  
**Estimated Time:** 2-3 weeks for Phase 1 MVP
