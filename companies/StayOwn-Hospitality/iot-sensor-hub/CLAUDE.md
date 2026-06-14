# CLAUDE.md - IoT Sensor Hub

## Project Overview

**Name:** IoT Sensor Hub
**Company:** StayOwn-Hospitality
**Type:** IoT Platform
**Port:** 4903
**Status:** ✅ Built (June 14, 2026)

## Description

Real-time equipment monitoring with predictive maintenance integration.

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- Axios

## Equipment Types

| Type | Sensors |
|------|---------|
| AC | vibration, temp, pressure, noise |
| Elevator | speed, weight, door |
| Plumbing | pressure, flow, leak |
| Electrical | current, voltage, heat |
| Kitchen | temp, smoke |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server (port 4903) |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4903 | Service port |
| MAINTENANCE_AGENT_URL | No | http://localhost:4849 | Maintenance Agent |

## API Endpoints

### Equipment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/equipment` | Register equipment |
| GET | `/api/equipment` | List equipment |
| GET | `/api/equipment/:id` | Get equipment |

### Sensors
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensors/:id/readings` | Submit readings |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get alerts |
| GET | `/api/alerts/critical` | Critical alerts |
| GET | `/api/analytics/predict/:id` | Get prediction |
| GET | `/api/analytics/high-risk` | High-risk list |

## File Structure

```
iot-sensor-hub/
├── src/
│   └── index.ts           # Main server
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 14 | AC vibration detection | ✅ Working |

---

**Last Updated:** June 14, 2026
