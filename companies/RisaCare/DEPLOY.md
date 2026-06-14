# RisaCare Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB 7+ (included in Docker)
- Redis 7+ (included in Docker)

---

## Quick Start (Docker)

```bash
# Clone and start
git clone https://github.com/RTNM-Group/RisaCare.git
cd RisaCare

# Start all services
docker-compose up -d

# Check status
curl http://localhost:4700/health/v1/health
```

---

## Development Mode

```bash
# Install dependencies
npm install

# Start all services in dev mode
npm run dev

# Or start individual services
cd risa-care-api-gateway && npm run dev
cd risa-care-records-service && npm run dev
# etc.
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | API Gateway port | 4700 |
| `MONGODB_URI` | MongoDB connection | localhost:27017 |
| `REZ_INTELLIGENCE_URL` | REZ AI endpoint | localhost:4018 |
| `AUTH_SERVICE_URL` | RABTUL Auth | localhost:4002 |

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 4700 | http://localhost:4700 |
| Records | 4702 | http://localhost:4702 |
| AI | 4703 | http://localhost:4703 |
| Profile | 4704 | http://localhost:4704 |
| Booking | 4705 | http://localhost:4705 |
| Marketplace | 4706 | http://localhost:4706 |
| Wellness | 4707 | http://localhost:4707 |
| Corporate | 4708 | http://localhost:4708 |

---

## Monitoring

| Tool | Port | URL |
|------|------|-----|
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |

---

## Mobile App

```bash
cd risa-care-mobile
npm install
npm start
```

---

## Troubleshooting

### Services not starting
```bash
docker-compose logs <service-name>
```

### MongoDB connection issues
```bash
docker-compose exec mongo mongosh
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d
```
