# CLAUDE.md - Adbazaar Hojai Gateway

## Project Overview

**Name:** Adbazaar Hojai Gateway
**Company:** AdBazaar
**Type:** HOJAI AI
**Port:** 4870

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB
- Redis

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Service port (default: 4870) |
| MONGODB_URI | Yes | MongoDB connection |
| JWT_SECRET | Yes | JWT signing |
| REDIS_URL | No | Redis connection |

## Integration

- RABTUL Auth (4002)
- RABTUL Payment (4001)
- RABTUL Wallet (4004)
- RABTUL Notification (4005)

---

**Last Updated:** 2026-06-12
