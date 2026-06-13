#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Hotel OS Deployment Script${NC}"
echo "================================"

# Environment
ENV=${1:-staging}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR/.."

echo -e "\n${YELLOW}Step 1: Building Docker images...${NC}"

# Build Guest Twin Service
echo "Building Guest Twin Service..."
docker build -t hotel-guest-twin:$ENV ./services/guest-twin-service

# Build Room Twin Service
echo "Building Room Twin Service..."
docker build -t hotel-room-twin:$ENV ./services/room-twin-service

# Build Property Twin Service
echo "Building Property Twin Service..."
docker build -t hotel-property-twin:$ENV ./services/property-twin-service

# Build TwinOS Gateway
echo "Building TwinOS Gateway..."
docker build -t hotel-twinos-gateway:$ENV ./services/twinos-gateway

echo -e "${GREEN}✅ Docker images built successfully${NC}"

echo -e "\n${YELLOW}Step 2: Starting infrastructure...${NC}"

# Start MongoDB and Redis
docker compose -f docker-compose.staging.yml up -d mongodb redis

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
sleep 10

# Run migrations
echo -e "\n${YELLOW}Step 3: Running migrations...${NC}"
docker compose -f docker-compose.staging.yml run --rm guest-twin npm run migrate

echo -e "${GREEN}✅ Migrations complete${NC}"

echo -e "\n${YELLOW}Step 4: Starting all services...${NC}"

# Start all services
docker compose -f docker-compose.staging.yml up -d

echo -e "${GREEN}✅ All services started${NC}"

echo -e "\n${YELLOW}Step 5: Health checks...${NC}"

# Health check function
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo -n "Checking $service... "
        if curl -sf "$url/health" > /dev/null 2>&1; then
            echo -e "${GREEN}OK${NC}"
            return 0
        else
            echo "Attempt $attempt/$max_attempts failed"
            sleep 2
            attempt=$((attempt + 1))
        fi
    done

    echo -e "${RED}❌ $service health check failed${NC}"
    return 1
}

# Check all services
check_health "TwinOS Gateway" "http://localhost:4200" || exit 1
check_health "Guest Twin" "http://localhost:4201" || exit 1
check_health "Room Twin" "http://localhost:4202" || exit 1
check_health "Property Twin" "http://localhost:4203" || exit 1

echo -e "${GREEN}✅ All health checks passed${NC}"

echo -e "\n${YELLOW}Step 6: Running smoke tests...${NC}"

# Run smoke tests
npm run test:smoke

echo -e "${GREEN}✅ Smoke tests passed${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "================================${NC}"
echo ""
echo "Services:"
echo "  - TwinOS Gateway: http://localhost:4200"
echo "  - Guest Twin:     http://localhost:4201"
echo "  - Room Twin:      http://localhost:4202"
echo "  - Property Twin:  http://localhost:4203"
echo "  - Prometheus:      http://localhost:9090"
echo "  - Grafana:        http://localhost:3000"
echo ""
