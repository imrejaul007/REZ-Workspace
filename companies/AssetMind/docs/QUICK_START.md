# AssetMind Quick Start Guide

**Version:** 1.0  
**Date:** June 5, 2026

---

## Prerequisites

Before getting started, ensure you have:

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for services)
- **Docker** 20.10+ and Docker Compose
- **Git** for cloning repositories
- **API Key** (get one at https://app.assetmind.ai)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/assetmind/assetmind.git
cd assetmind
```

### 2. Environment Setup

Create a `.env` file in the `codebase/` directory:

```bash
# API Configuration
API_KEY=your-api-key
API_URL=http://localhost:5260

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=assetmind
POSTGRES_PASSWORD=assetmind
POSTGRES_DB=assetmind

TIMESCALE_HOST=localhost
TIMESCALE_PORT=5433
TIMESCALE_USER=assetmind
TIMESCALE_PASSWORD=assetmind
TIMESCALE_DB=assetmind

NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=assetmind

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5260
NEXT_PUBLIC_WS_URL=ws://localhost:5261
```

### 3. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd codebase/assetmind-frontend
npm install
```

---

## Running with Docker Compose

The easiest way to run all services locally is with Docker Compose.

### Start All Services

```bash
cd codebase
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- TimescaleDB (port 5433)
- Neo4j (ports 7474, 7687)
- Redis (port 6379)
- API Gateway (port 5260)
- WebSocket Gateway (port 5261)
- Frontend (port 3000)
- All microservices

### Check Service Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Recent logs only
docker-compose logs --tail=100
```

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

---

## Running Services Individually

### Database Services

#### PostgreSQL

```bash
docker run -d \
  --name assetmind-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=assetmind \
  -e POSTGRES_PASSWORD=assetmind \
  -e POSTGRES_DB=assetmind \
  postgres:16
```

#### TimescaleDB

```bash
docker run -d \
  --name assetmind-timescale \
  -p 5433:5432 \
  -e POSTGRES_USER=assetmind \
  -e POSTGRES_PASSWORD=assetmind \
  -e POSTGRES_DB=assetmind \
  timescale/timescaledb:latest-pg16
```

#### Neo4j

```bash
docker run -d \
  --name assetmind-neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/assetmind \
  neo4j:5
```

#### Redis

```bash
docker run -d \
  --name assetmind-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Initialize Databases

```bash
# PostgreSQL schema
psql postgresql://assetmind:assetmind@localhost:5432/assetmind -f codebase/assetmind-db/schema/postgresql_schema.sql

# TimescaleDB schema
psql postgresql://assetmind:assetmind@localhost:5433/assetmind -f codebase/assetmind-db/schema/timeseries_schema.sql

# Neo4j schema
cypher-shell -u neo4j -p assetmind < codebase/assetmind-db/schema/neo4j_schema.cypher
```

### Start Backend Services

```bash
# API Gateway
cd codebase/assetmind-api
python -m uvicorn src.main:app --host 0.0.0.0 --port 5260

# WebSocket Gateway
cd codebase/assetmind-gateway
python -m uvicorn src.main:app --host 0.0.0.0 --port 5261

# Asset Universe Service
cd codebase/assetmind-asset-universe
python -m uvicorn src.main:app --host 0.0.0.0 --port 5001

# Asset Twin Service
cd codebase/assetmind-twin-engine
python -m uvicorn src.main:app --host 0.0.0.0 --port 5002

# Market Twin Service
cd codebase/assetmind-twin-engine
python -m uvicorn src.main:app --host 0.0.0.0 --port 5003

# Intelligence Services
cd codebase/assetmind-intelligence
python -m uvicorn src.main:app --host 0.0.0.0 --port 5050

# Agent Orchestrator
cd codebase/assetmind-agents
python -m uvicorn src.main:app --host 0.0.0.0 --port 5090

# Prediction Service
cd codebase/assetmind-predictions
python -m uvicorn src.main:app --host 0.0.0.0 --port 5160

# Daily Briefing Service
cd codebase/assetmind-daily
python -m uvicorn src.main:app --host 0.0.0.0 --port 5170
```

### Start Frontend

```bash
cd codebase/assetmind-frontend
npm run dev
```

---

## Verify Installation

### Health Checks

```bash
# API Gateway
curl http://localhost:5260/health

# WebSocket Gateway
curl http://localhost:5261/health

# Asset Universe
curl http://localhost:5001/health

# Frontend
curl http://localhost:3000
```

### Test API

```bash
# Get assets
curl -H "X-API-Key: your-api-key" http://localhost:5260/api/v1/assets

# Get specific asset
curl -H "X-API-Key: your-api-key" http://localhost:5260/api/v1/assets/AAPL

# Get scores
curl -H "X-API-Key: your-api-key" http://localhost:5260/api/v1/scores/NVDA

# Get prediction
curl -H "X-API-Key: your-api-key" http://localhost:5260/api/v1/predictions/NVDA
```

### Database Connections

```bash
# PostgreSQL
pg_isready -h localhost -p 5432

# TimescaleDB
pg_isready -h localhost -p 5433

# Neo4j
curl -s http://localhost:7474 bolt/ -u neo4j:assetmind
```

---

## Local Development

### Development with Hot Reload

```bash
# Start databases
docker-compose up -d postgres timescale neo4j redis

# Start services with hot reload
cd codebase/assetmind-api
npm run dev

# In another terminal
cd codebase/assetmind-frontend
npm run dev
```

### Using the SDK

#### Python SDK

```bash
pip install assetmind
```

```python
from assetmind import AssetMindClient

client = AssetMindClient(api_key="your-api-key")

# Get asset
asset = client.assets.get("AAPL")
print(f"{asset.name}: ${asset.price}")

# Get scores
scores = client.scores.get("NVDA")
print(f"Health: {scores.health}")
```

#### TypeScript SDK

```bash
npm install @assetmind/sdk
```

```typescript
import { AssetMindClient } from '@assetmind/sdk';

const client = new AssetMindClient({ apiKey: 'your-api-key' });

const asset = await client.assets.get('AAPL');
console.log(`${asset.name}: $${asset.price}`);

const scores = await client.scores.get('NVDA');
console.log(`Health: ${scores.health}`);
```

---

## Testing

### Run All Tests

```bash
# Backend tests
cd codebase
pytest

# Frontend tests
cd codebase/assetmind-frontend
npm run test
```

### Specific Service Tests

```bash
# Test API Gateway
cd codebase/assetmind-api
pytest tests/

# Test Agent services
cd codebase/assetmind-agents
pytest tests/
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5260

# Kill process
kill -9<PID>
```

### Database Connection Issues

```bash
# Check if containers are running
docker-compose ps

# Restart databases
docker-compose restart postgres timescale neo4j redis

# Check logs
docker-compose logs postgres
```

### Out of Memory

```bash
# Increase Docker memory to 8GB
# Restart Docker Desktop

# Or run fewer services
docker-compose up -d postgres redis api-gateway frontend
```

### Slow Startup

```bash
# Use pre-built images
docker-compose pull

# Or build with more cores
docker-compose build --parallel
```

---

## Next Steps

1. **Read the Architecture** - Understand the20-layer system
2. **Explore the API** - Full API specification in docs/API_SPECIFICATION.md
3. **Build with SDK** - Python and TypeScript SDKs available
4. **Deploy to Production** - See docs/DEPLOYMENT.md for Kubernetes deployment

---

## Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend |3000 | http://localhost:3000 |
| API Gateway | 5260 | http://localhost:5260 |
| WebSocket | 5261 | ws://localhost:5261 |
| PostgreSQL | 5432 | postgresql://localhost:5432 |
| TimescaleDB | 5433 | postgresql://localhost:5433 |
| Neo4j Browser | 7474 | http://localhost:7474 |
| Neo4j Bolt | 7687 | bolt://localhost:7687 |
| Redis | 6379 | redis://localhost:6379 |

---

## Support

- Documentation: https://docs.assetmind.ai
- GitHub Issues: https://github.com/assetmind/assetmind/issues
- Email: support@assetmind.ai