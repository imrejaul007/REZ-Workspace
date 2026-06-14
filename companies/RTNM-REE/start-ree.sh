#!/bin/bash

# REE Ecosystem Start Script
# Starts all 12 REE microservices

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting REE Ecosystem...${NC}"

# Check for Docker
if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Using Docker Compose to start all services...${NC}"
    docker compose up -d

    echo ""
    echo -e "${GREEN}✅ All REE services started!${NC}"
    echo ""
    echo "Services:"
    echo "  • ops-center:         http://localhost:3000"
    echo "  • trust-platform:     http://localhost:3001"
    echo "  • growth-engine:      http://localhost:3002"
    echo "  • logistics-engine:   http://localhost:3003"
    echo "  • attribution-engine: http://localhost:3004"
    echo "  • creative-studio:     http://localhost:3005"
    echo "  • franchise-mode:     http://localhost:3006"
    echo "  • ai-marketplace:     http://localhost:3007"
    echo "  • mind-grocery:       http://localhost:3008"
    echo "  • mind-retail:        http://localhost:3009"
    echo "  • rto-fraud:          http://localhost:3010"
    echo "  • voice-ai:           http://localhost:3011"
    echo ""
    echo "Run 'docker compose logs -f' to view logs"
else
    echo -e "${YELLOW}Docker not found. Starting services with tsx...${NC}"

    for service in ops-center trust-platform growth-engine logistics-engine \
                   attribution-engine creative-studio franchise-mode \
                   ai-marketplace mind-grocery mind-retail rto-fraud voice-ai; do
        port_file="$service/.port"
        if [ -f "$port_file" ]; then
            port=$(cat "$port_file")
        else
            # Default ports
            case $service in
                ops-center) port=3000 ;;
                trust-platform) port=3001 ;;
                growth-engine) port=3002 ;;
                logistics-engine) port=3003 ;;
                attribution-engine) port=3004 ;;
                creative-studio) port=3005 ;;
                franchise-mode) port=3006 ;;
                ai-marketplace) port=3007 ;;
                mind-grocery) port=3008 ;;
                mind-retail) port=3009 ;;
                rto-fraud) port=3010 ;;
                voice-ai) port=3011 ;;
            esac
        fi

        echo "Starting $service on port $port..."
        cd "$service"
        PORT=$port npx tsx src/index.ts &
        cd "$SCRIPT_DIR"
    done

    echo ""
    echo -e "${GREEN}✅ All REE services started!${NC}"
fi