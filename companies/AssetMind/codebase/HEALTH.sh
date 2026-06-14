#!/bin/bash
# AssetMind - Health Check All Services

echo "=========================================="
echo "AssetMind - Health Check"
echo "=========================================="

SERVICES=(
    "API Gateway:http://localhost:8000/health"
    "RexMind:http://localhost:5160/health"
    "Council:http://localhost:5195/health"
    "Hub:http://localhost:5298/health"
    "Real-Time:http://localhost:5299/health"
    "Yahoo Finance:http://localhost:5010/health"
    "Dashboard:http://localhost:3000/health"
    "Production:http://localhost:5000/health"
)

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

healthy=0
unhealthy=0

for service in "${SERVICES[@]}"; do
    name="${service%%:*}"
    url="${service##*:}"

    echo -n "Checking $name... "

    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        ((healthy++))
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        ((unhealthy++))
    fi
done

echo ""
echo "=========================================="
echo -e "Results: ${GREEN}$healthy healthy${NC}, ${RED}$unhealthy unhealthy${NC}"
echo "=========================================="

if [ $unhealthy -eq 0 ]; then
    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some services need attention${NC}"
    exit 1
fi