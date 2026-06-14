#!/bin/bash
# AdBazaar - Health Check Script
# Usage: ./health-check.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICES=(
  "4007:REZ-ads-service"
  "4085:adBazaar-backend"
  "4000:REZ-marketing"
  "4018:REZ-dooh-service"
  "4800:intent-signal-aggregator"
  "4801:intent-prediction-engine"
  "4802:intent-marketplace"
  "4803:intent-attribution"
  "4870:adbazaar-hojai-gateway"
  "4961:adbazaar-cdp"
  "4962:adbazaar-pixel"
  "4965:adbazaar-marketing-agent"
)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        AdBazaar - Health Check                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

total=0
healthy=0
unhealthy=0

for item in "${SERVICES[@]}"; do
  IFS=':' read -r port name <<< "$item"
  total=$((total + 1))
  
  printf "%-30s " "$name (port $port)..."
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/healthz" 2>/dev/null || echo "000")
  
  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ HEALTHY${NC}"
    healthy=$((healthy + 1))
  else
    echo -e "${RED}✗ DOWN (HTTP $response)${NC}"
    unhealthy=$((unhealthy + 1))
  fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo -e "║  Total: $total | ${GREEN}Healthy: $healthy${NC} | ${RED}Unhealthy: $unhealthy${NC}           ║"
echo "╚════════════════════════════════════════════════════════════╝"

if [ $unhealthy -gt 0 ]; then
  exit 1
fi
