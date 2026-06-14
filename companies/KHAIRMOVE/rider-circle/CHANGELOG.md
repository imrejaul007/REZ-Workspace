# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-07

### Added

#### Backend API (rider-circle-api)
- **Express + MongoDB** backend with REST API
- **7 Database Models**: Rider, Bike, Ride, Group, Event, SOS, Memory
- **7 API Routes**: riders, bikes, rides, groups, events, sos, presence
- **Socket.io** real-time presence tracking
- **RABTUL Integration** (Auth, Wallet, Notifications)
- **HOJAI Integration** (Genie AI, Memory, Knowledge Graph)
- **JWT Authentication** middleware
- **Health check endpoints**
- **Unit tests** with Jest

#### Mobile App (rider-circle-app)
- **Expo SDK 53** React Native app
- **17 Screens**: Landing, Login, Signup, Home, Ride, Community, Discover, Profile, etc.
- **5 Tabs**: Home, Ride, Community, Discover, Profile
- **Zustand** state management
- **Location tracking** with expo-location
- **Push notifications** with expo-notifications
- **Reusable UI components**: Button, Card, Input, Loading, Map
- **API client** with all endpoints

#### Services
- **rider-circle-graph**: Neo4j knowledge graph
- **rider-circle-intelligence**: Python FastAPI AI engine
- **rider-circle-shared**: TypeScript SDK

#### Deployment
- **Docker** configuration
- **Railway** deployment config
- **GitHub Actions** CI/CD workflow

#### Documentation
- **CLAUDE.md**: Developer reference
- **README.md**: Quick start guide
- **DEPLOYMENT.md**: Full deployment guide
- **CHANGELOG.md**: Version history

### Features

#### SafeQR
- Emergency ID for riders
- Blood group, allergies, medical notes
- Emergency contacts
- QR code generation

#### Live Tracking
- Real-time GPS presence
- Socket.io WebSocket
- Nearby riders
- Live stats

#### Bike Digital Twin
- Health tracking (tires, chain, brakes)
- Service history
- Document management (registration, insurance)
- Predictions (service due, replacement)

#### SOS System
- Emergency triggers (accident, breakdown, assistance)
- Nearby rider notifications
- Response tracking
- Emergency contact alerts

#### Trust Score
- Reputation system (0-100)
- Based on verified rides
- Badges and achievements

#### REZ Coins
- Rewards for ride completion
- RABTUL Wallet integration
- Spending on services

---

## [Unreleased]

### Planned Features
- [ ] Route planning with AI recommendations
- [ ] Ride memories with AI-generated stories
- [ ] Marketplace for gear and services
- [ ] Achievements and badges system
- [ ] Social feed with posts and comments
- [ ] Ride challenges and competitions
- [ ] Weather integration
- [ ] Offline maps

### Technical Improvements
- [ ] GraphQL API
- [ ] WebSocket authentication
- [ ] Redis caching
- [ ] Kubernetes deployment
- [ ] Performance monitoring
- [ ] E2E tests

---

## [0.0.1] - 2026-06-07

### Added
- Initial project structure
- Basic API endpoints
- Mobile app scaffold
- Documentation

---

[1.0.0]: https://github.com/your-org/rider-circle/releases/tag/v1.0.0
[Unreleased]: https://github.com/your-org/rider-circle/compare/v1.0.0...HEAD
[0.0.1]: https://github.com/your-org/rider-circle/releases/tag/v0.0.1