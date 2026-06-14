#!/bin/bash
# REZ Revenue AI - Complete Start Script
# Starts all 13 microservices

set -e

echo "🚀 Starting REZ Revenue AI Platform..."
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Services to start
SERVICES=(
  "revenue-ai-gateway:4300"
  "pricing-engine:4301"
  "demand-forecast:4302"
  "offer-optimizer:4303"
  "cashback-optimizer:4304"
  "merchant-advisor:4305"
  "cross-merchant-intelligence:4306"
  "revenue-copilot:4307"
  "simulation-engine:4308"
  "benchmark-score:4309"
  "segment-brain:4310"
  "campaign-generator:4311"
  "merchant-gpt:4312"
)

# Check if a port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Install dependencies for a service
install_deps() {
  local service=$1
  echo -e "${BLUE}Installing dependencies for $service...${NC}"

  if [ ! -d "$service/node_modules" ]; then
    cd "$service"
    npm install 2>&1 | tail -5
    cd "$BASE_DIR"
  fi
}

# Start a service in background
start_service() {
  local service=$1
  local port=$2

  echo -e "${YELLOW}Starting $service (Port $port)...${NC}"

  cd "$service"

  # Check if already running
  if check_port $port; then
    echo -e "${GREEN}✓ $service already running on port $port${NC}"
    cd "$BASE_DIR"
    return 0
  fi

  # Install deps if needed
  if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install 2>&1 | tail -3
  fi

  # Start in background
  PORT=$port npm run dev > "$BASE_DIR/logs/$service.log" 2>&1 &
  local pid=$!

  cd "$BASE_DIR"
  echo -e "${GREEN}✓ $service started (PID: $pid)${NC}"
}

# Create logs directory
mkdir -p "$BASE_DIR/logs"

echo ""
echo "Checking ports and starting services..."
echo ""

# Start all services
for item in "${SERVICES[@]}"; do
  service="${item%%:*}"
  port="${item##*:}"
  start_service "$service" "$port"
done

echo ""
echo "=========================================="
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Waiting for services to be ready..."
sleep 5

echo ""
echo "Service Status:"
echo "---------------"
for item in "${SERVICES[@]}"; do
  service="${item%%:*}"
  port="${item##*:}"
  if check_port $port; then
    echo -e "  ${GREEN}✓${NC} $service (Port $port)"
  else
    echo -e "  ${RED}✗${NC} $service (Port $port) - Not ready"
  fi
done

echo ""
echo "=========================================="
echo "REZ Revenue AI Platform"
echo "=========================================="
echo ""
echo "Gateway:      http://localhost:4300"
echo "API Docs:     http://localhost:4300/api/docs"
echo ""
echo "Services:"
echo "  4301 - Pricing Engine"
echo "  4302 - Demand Forecast"
echo "  4303 - Offer Optimizer"
echo "  4304 - Cashback Optimizer"
echo "  4305 - Merchant Advisor"
echo "  4306 - Cross-Merchant"
echo "  4307 - Revenue Copilot"
echo "  4308 - Simulation Engine"
echo "  4309 - Benchmark Score"
echo "  4310 - Segment Brain"
echo "  4311 - Campaign Generator"
echo "  4312 - MerchantGPT"
echo ""
echo "Dashboard:     http://localhost:5173"
echo "Logs:          $BASE_DIR/logs/"
echo ""
echo "To stop all services:"
echo "  pkill -f 'tsx watch'"
echo ""
