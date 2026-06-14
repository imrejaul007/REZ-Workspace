#!/bin/bash

# ============================================
# KHAIRMOVE - Local Development Start Script
# ============================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "============================================"
echo "  KHAIRMOVE Local Development"
echo "============================================"
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to start a service
start_service() {
  local service=$1
  local port=$2
  echo -e "${YELLOW}Starting $service on port $port...${NC}"

  if [ -d "$SCRIPT_DIR/$service" ]; then
    cd "$SCRIPT_DIR/$service"

    # Install deps if needed
    if [ ! -d "node_modules" ]; then
      echo "  Installing dependencies..."
      npm install 2>/dev/null || true
    fi

    # Start in background
    npm run dev > /dev/null 2>&1 &
    echo -e "${GREEN}  ✓ $service started${NC}"

    cd "$SCRIPT_DIR"
  else
    echo -e "${YELLOW}  ⚠ $service not found${NC}"
  fi
}

# Parse command
COMMAND=${1:-"all"}

case $COMMAND in
  all)
    echo -e "\n${GREEN}Starting all services...${NC}\n"

    start_service "khaimove-api-gateway" "4600"
    start_service "khaimove-ride-service" "4601"
    start_service "khaimove-fleet-service" "4602"
    start_service "khaimove-delivery-service" "4603"
    start_service "khaimove-logistics-aggregator" "4604"
    start_service "khaimove-rental-service" "4605"
    start_service "buzzlocal-rides-integration" "4606"

    echo -e "\n${GREEN}============================================${NC}"
    echo -e "${GREEN}All services started!${NC}"
    echo -e "${GREEN}============================================${NC}\n"
    echo "Services:"
    echo "  • API Gateway:      http://localhost:4600"
    echo "  • Ride Service:     http://localhost:4601"
    echo "  • Fleet Service:    http://localhost:4602"
    echo "  • Delivery Service:  http://localhost:4603"
    echo "  • Logistics:       http://localhost:4604"
    echo "  • Rental Service:   http://localhost:4605"
    echo "  • BuzzLocal:       http://localhost:4606"
    echo ""
    echo "Mobile Apps:"
    echo "  • User App:   cd khaimove-user-app && npm start"
    echo "  • Driver App: cd khaimove-driver-app && npm start"
    echo ""
    echo "Admin Dashboard:"
    echo "  • cd khaimove-admin-dashboard && npm run dev"
    echo ""
    echo "View logs:"
    echo "  tail -f /tmp/khaimove-*.log"
    ;;

  ride|1)
    start_service "khaimove-ride-service" "4601"
    ;;

  fleet|2)
    start_service "khaimove-fleet-service" "4602"
    ;;

  delivery|3)
    start_service "khaimove-delivery-service" "4603"
    ;;

  logistics|4)
    start_service "khaimove-logistics-aggregator" "4604"
    ;;

  gateway|0)
    start_service "khaimove-api-gateway" "4600"
    ;;

  admin|a)
    if [ -d "$SCRIPT_DIR/khaimove-admin-dashboard" ]; then
      cd "$SCRIPT_DIR/khaimove-admin-dashboard"
      if [ ! -d "node_modules" ]; then
        npm install
      fi
      npm run dev
    fi
    ;;

  mobile|m)
    echo -e "\n${GREEN}Starting Mobile Apps...${NC}\n"
    echo "User App:"
    echo "  cd khaimove-user-app && npm start"
    echo ""
    echo "Driver App:"
    echo "  cd khaimove-driver-app && npm start"
    ;;

  test|t)
    echo -e "\n${GREEN}Running tests...${NC}\n"
    npm test --workspaces --if-present
    ;;

  build|b)
    echo -e "\n${GREEN}Building all services...${NC}\n"
    for svc in khaimove-*/; do
      if [ -f "$svc/package.json" ]; then
        echo "Building $svc..."
        cd "$svc"
        npm run build 2>/dev/null || echo "  No build script"
        cd "$SCRIPT_DIR"
      fi
    done
    echo -e "\n${GREEN}Build complete!${NC}"
    ;;

  *)
    echo -e "${YELLOW}Usage: ./start-dev.sh [command]${NC}"
    echo ""
    echo "Commands:"
    echo "  all       - Start all services (default)"
    echo "  0/gateway - Start API Gateway"
    echo "  1/ride    - Start Ride Service"
    echo "  2/fleet   - Start Fleet Service"
    echo "  3/delivery - Start Delivery Service"
    echo "  4/logistics - Start Logistics"
    echo "  admin/a   - Start Admin Dashboard"
    echo "  mobile/m  - Show mobile app commands"
    echo "  test/t    - Run all tests"
    echo "  build/b   - Build all services"
    ;;
esac
