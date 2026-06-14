#!/bin/bash

# ============================================
# AdBazaar Ecosystem Integration - Start Script
# Starts all 8 new integration services
# ============================================

set -e

echo "🚀 Starting AdBazaar Ecosystem Integrations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
  lsof -i :$1 > /dev/null 2>&1
}

# Function to start a service
start_service() {
  local name=$1
  local dir=$2
  local port=$3

  if [ -d "$dir" ]; then
    echo -e "${YELLOW}Starting $name (Port $port)...${NC}"
    cd "$dir"

    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
      echo "  Installing dependencies..."
      npm install 2>/dev/null || true
    fi

    # Start in background
    npm run dev > /dev/null 2>&1 &
    echo -e "${GREEN}✓ $name started on port $port${NC}"
  else
    echo -e "${RED}✗ $name directory not found: $dir${NC}"
  fi
}

# Create logs directory
mkdir -p logs

echo ""
echo "=========================================="
echo "  ADBAZAAR ECOSYSTEM INTEGRATIONS"
echo "=========================================="
echo ""

# Start all integration services
echo "Starting Integration Services..."
echo ""

# 1. HOJAI AI Gateway (Port 4870)
start_service "HOJAI AI Gateway" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/adbazaar-hojai-gateway" 4870

# 2. REZ Ride Integration (Port 4950)
start_service "REZ Ride Integration" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/rez-ride-integration" 4530

# 3. Airzy Travel Integration (Port 4951)
start_service "Airzy Travel Integration" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/airzy-travel-integration" 4951

# 4. StayOwn Hotel Integration (Port 4952)
start_service "StayOwn Hotel Integration" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/stayown-hotel-integration" 4952

# 5. BuzzLocal Social Integration (Port 4953)
start_service "BuzzLocal Social Integration" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/buzzlocal-social-integration" 4953

# 6. CorpPerks HR Integration (Port 4954)
start_service "CorpPerks HR Integration" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/corpperks-hr-integration" 4954

# 7. Ecosystem Integration Hub (Port 4955)
start_service "Ecosystem Integration Hub" "/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar/ecosystem-integration-hub" 4955

echo ""
echo "=========================================="
echo "  HEALTH CHECKS"
echo "=========================================="
echo ""

# Wait for services to start
sleep 5

# Check health of all services
services=(
  "4870:HOJAI AI Gateway"
  "4530:REZ Ride Integration"
  "4951:Airzy Travel Integration"
  "4952:StayOwn Hotel Integration"
  "4953:BuzzLocal Social Integration"
  "4954:CorpPerks HR Integration"
  "4955:Ecosystem Integration Hub"
)

for item in "${services[@]}"; do
  port="${item%%:*}"
  name="${item##*:}"

  if check_port $port; then
    echo -e "${GREEN}✓ $name (Port $port) - Running${NC}"
  else
    echo -e "${RED}✗ $name (Port $port) - Not running${NC}"
  fi
done

echo ""
echo "=========================================="
echo "  INTEGRATION SUMMARY"
echo "=========================================="
echo ""
echo "Services Started:"
echo "  • HOJAI AI Gateway        → Port 4870"
echo "  • REZ Ride Integration    → Port 4530"
echo "  • Airzy Travel Integration → Port 4951"
echo "  • StayOwn Hotel Integration → Port 4952"
echo "  • BuzzLocal Social Integration → Port 4953"
echo "  • CorpPerks HR Integration → Port 4954"
echo "  • Ecosystem Integration Hub → Port 4955"
echo ""
echo "Ecosystem Connections:"
echo "  → HOJAI AI (Intelligence)"
echo "  → REZ Ride (Mobility)"
echo "  → Airzy (Travel)"
echo "  → StayOwn (Hospitality)"
echo "  → BuzzLocal (Community)"
echo "  → CorpPerks (HR/B2B)"
echo "  → Intent Signal Aggregator"
echo ""
echo "Run 'curl http://localhost:4955/health' for full status"
echo ""
echo -e "${GREEN}✅ All ecosystem integrations started!${NC}"