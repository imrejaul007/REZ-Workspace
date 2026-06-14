#!/bin/bash
# ============================================================================
# AdBazaar - Complete Deployment Script
# ============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              ADBAZAAR - COMPLETE DEPLOYMENT                  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# CONFIGURATION
# ============================================================================

# All services with ports
SERVICES=(
  "adbazaar-api-gateway:4000"
  "REZ-ads-service:4007"
  "adsqr:4068"
  "adbazaar-backend:4085"
  "adbazaar-service:4080"
  "unified-campaign-service:4500"
  "tenant-registry:4510"
  "inventory-classifier:4515"
  "attribution-hub-enhanced:4520"
  "REZ-dooh-service:4018"
  "flywheel-analytics:4550"
  "hojai-ai-gateway-v2:4560"
  "integration-hub:4570"
  "society-media-service:4580"
  "closed-loop-attribution-service:4590"
  "hyperlocal-demand-service:4600"
  "incentive-ads-service:4610"
  "commerce-recommendation-service:4620"
  "creator-commerce-service:4630"
  "whatsapp-ads-service:4640"
  "community-media-service:4650"
  "event-commerce-service:4660"
  "REZ-alerting:4670"
)

# ============================================================================
# FUNCTIONS
# ============================================================================

check_service() {
  local name=$1
  local dir="$SCRIPT_DIR/$name"

  if [ ! -d "$dir" ]; then
    echo -e "  ${YELLOW}✗ $name not found${NC}"
    return 1
  fi

  if [ ! -f "$dir/package.json" ]; then
    echo -e "  ${YELLOW}✗ $name missing package.json${NC}"
    return 1
  fi

  echo -e "  ${GREEN}✓ $name found${NC}"
  return 0
}

install_service() {
  local name=$1
  local dir="$SCRIPT_DIR/$name"

  cd "$dir"

  if [ ! -d "node_modules" ]; then
    echo -e "    Installing dependencies..."
    npm install --silent 2>/dev/null || npm install
  fi

  if [ -f "tsconfig.json" ]; then
    if [ ! -d "dist" ]; then
      echo -e "    Building..."
      npm run build 2>/dev/null || echo "    (build skipped)"
    fi
  fi
}

start_service() {
  local name=$1
  local port=$2
  local dir="$SCRIPT_DIR/$name"

  # Check if already running
  if lsof -i :$port > /dev/null 2>&1; then
    echo -e "    ${YELLOW}Port $port already in use${NC}"
    return 0
  fi

  cd "$dir"

  # Start in background
  if [ -f "dist/index.js" ]; then
    PORT=$port npm start &> /dev/null &
  elif [ -f "src/index.ts" ]; then
    PORT=$port npx ts-node src/index.ts &> /dev/null &
  elif [ -f "index.js" ]; then
    PORT=$port node index.js &> /dev/null &
    else
    echo -e "    ${YELLOW}No entry point found${NC}"
    return 1
  fi

  sleep 1
  echo -e "    ${GREEN}✓ Started on port $port${NC}"
}

test_service() {
  local port=$1
  local name=$2

  if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
    echo -e "    ${GREEN}✓ Health check passed${NC}"
    return 0
  else
    echo -e "    ${RED}✗ Health check failed${NC}"
    return 1
  fi
}

# ============================================================================
# MAIN
# ============================================================================

ACTION=${1:-start}

case $ACTION in
  check)
    echo -e "\n${YELLOW}[1/4] Checking services...${NC}"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      echo -e "\n  Checking $name..."
      check_service "$name"
    done
    ;;

  install)
    echo -e "\n${YELLOW}[2/4] Installing dependencies...${NC}"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      echo -e "\n  Installing $name..."
      install_service "$name"
    done
    ;;

  start)
    echo -e "\n${YELLOW}[1/4] Checking services...${NC}"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      echo -e "\n  Checking $name..."
      check_service "$name"
    done

    echo -e "\n${YELLOW}[2/4] Installing dependencies...${NC}"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      install_service "$name"
    done

    echo -e "\n${YELLOW}[3/4] Starting services...${NC}"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      port="${svc##*:}"
      echo -e "\n  Starting $name ($port)..."
      start_service "$name" "$port"
    done
    ;;

  stop)
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    for svc in "${SERVICES[@]}"; do
      port="${svc##*:}"
      if lsof -i :$port > /dev/null 2>&1; then
        pid=$(lsof -t -i :$port)
        kill $pid 2>/dev/null
        echo -e "  ${GREEN}✓ Stopped port $port${NC}"
      fi
    done
    ;;

  test)
    echo -e "\n${YELLOW}[4/4] Testing services...${NC}"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      port="${svc##*:}"
      echo -e "\n  Testing $name ($port)..."
      test_service "$port" "$name"
    done
    ;;

  status)
    echo -e "\n${YELLOW}Service Status:${NC}"
    echo ""
    printf "%-35s %-8s %s\n" "Service" "Port" "Status"
    printf "%-35s %-8s %s\n" "-------" "----" "------"
    for svc in "${SERVICES[@]}"; do
      name="${svc%%:*}"
      port="${svc##*:}"
      if lsof -i :$port > /dev/null 2>&1; then
        printf "%-35s %-8s ${GREEN}%s${NC}\n" "$name" "$port" "UP"
      else
        printf "%-35s %-8s ${RED}%s${NC}\n" "$name" "$port" "DOWN"
      fi
    done
    ;;

  *)
    echo -e "${RED}Usage: $0 {check|install|start|stop|test|status}${NC}"
    echo ""
    echo "  check    - Check all services exist"
    echo "  install  - Install dependencies"
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  test    - Test all services"
    echo "  status  - Show service status"
    exit 1
    ;;
esac

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗"
echo "║                         DONE                                     ║"
echo "╚══════════════════════════════════════════════════════════════════════╝${NC}"
