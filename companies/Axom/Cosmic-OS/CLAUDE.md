# Cosmic-OS - Developer Guide

**Version:** 1.0.0
**Updated:** June 12, 2026
**Status:** Production Ready

---

## OVERVIEW

Cosmic-OS is a futuristic mobile operating system interface concept designed for the REZ ecosystem. It reimagines the mobile experience with a cosmic, space-inspired design language and cutting-edge user interactions.

## COMPONENTS

| Component | Description | Status |
|-----------|------------|--------|
| cosmic-mobile | React Native Expo mobile app | Production Ready |
| src/services/cosmic-os-api | Express.js REST API | Production Ready |
| README.md | Full documentation | Complete |
| .env.example | Environment configuration | Complete |

## PROJECT STRUCTURE

```
Cosmic-OS/
├── README.md                          # Full documentation
├── CLAUDE.md                          # This developer guide
├── .env.example                       # Environment template
├── Dockerfile                         # Root Dockerfile reference
├── cosmic-mobile/                     # React Native Expo app
│   ├── package.json                   # Mobile dependencies
│   ├── app.json                       # Expo configuration
│   ├── tsconfig.json                  # TypeScript config
│   ├── babel.config.js # Babel config
│   └── app/                           # App screens
│       ├── _layout.tsx                # Root layout
│       └── index.tsx                  # Home screen
└── src/services/                      # Backend services
    └── cosmic-os-api/                 # Express API
        ├── package.json # API dependencies
        ├── tsconfig.json              # TypeScript config
        ├── Dockerfile                 # Container config
        └── src/
            └── index.ts               # Express server
```

## QUICK START

### API Service

```bash
cd src/services/cosmic-os-api
npm install
npm run dev          # Development with hot reload
npm run build        # Production build
npm start            # Run production build
```

### Mobile App

```bash
cd cosmic-mobile
npm install
npm start            # Start Expo dev server
npm run android      # Android
npm run ios          # iOS
npm run web          # Web
```

### Docker Deployment

```bash
cd src/services/cosmic-os-api
docker build -t cosmic-os-api .
docker run -p 4070:4070 cosmic-os-api
```

## API ENDPOINTS

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check with status info |
| /api/status | GET | OS status and features |
| /api/system | GET | System metrics (memory, CPU) |
| /api/apps | GET | Registered apps registry |

## PORT ALLOCATION

| Service | Port | Description |
|---------|------|-------------|
| cosmic-os-api | 4070 | Main API service |
| cosmic-mobile | 19006 | Expo dev server (default) |

## ENVIRONMENT VARIABLES

```bash
PORT=4070                  # API server port
NODE_ENV=development       # Environment mode
API_HOST=localhost         # API host
API_PORT=4070              # API port
ALLOWED_ORIGINS=...        # CORS origins
HELMET_CSP=true            # Security headers
LOG_LEVEL=info             # Logging level
EXPO_SCHEME=cosmic-os      # Mobile deep link scheme
```

## TECHNOLOGY STACK

**Mobile:**
- React Native 0.76.9
- Expo SDK 53
- expo-router 5.0.0
- TypeScript

**Backend:**
- Node.js 20+
- Express.js 4.18.2
- TypeScript 5.3.3
- Helmet (security)
- CORS

## FEATURES

### Mobile App
- Cosmic-themed home screen
- Launch button with glow effects
- System status indicator
- Dark mode optimized display
- Safe area support

### API Service
- Health check endpoint
- Status monitoring
- System metrics collection
- App registry
- CORS-enabled
- Security headers via Helmet

## RELATED PROJECTS

- REZ-trust-os (4050) - Trust infrastructure
- REZ-cosmic-twin (4055) - Digital twin

## DEVELOPMENT NOTES

- ES Modules (type: "module") in API
- Strict TypeScript mode enabled
- Multi-stage Docker builds for optimization
- Non-root container user for security
- Health checks in Docker

---

**Last Updated:** June 12, 2026