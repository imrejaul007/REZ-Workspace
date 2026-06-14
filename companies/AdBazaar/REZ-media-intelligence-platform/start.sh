#!/bin/bash
# =============================================================================
# REZ Media Intelligence - Start All Services
# ==============================================================================

set -e

echo "🚀 Starting REZ Media Intelligence Platform..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create logs directory
mkdir -p logs

# Service function
start_service() {
    local name=$1
    local port=$2
    local desc=$3

    if lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠ $name already running on port $port${NC}"
        return 0
    fi

    echo -e "${BLUE}Starting $name (Port $port)...${NC}"

    # Run in background
    npm run dev > logs/${name}.log 2>&1 &
    local pid=$!

    sleep 2

    if ps -p $pid &> /dev/null; then
        echo -e "${GREEN}✓ $name started (PID: $pid)${NC}"
    else
        echo -e "${RED}✗ $name failed to start${NC}"
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     REZ MEDIA INTELLIGENCE PLATFORM       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
fi

# Start services
echo -e "${BLUE}[1/3] Starting Main Platform (Port 5000)...${NC}"
start_service "media-intel" 5000 "Main - Content, Analytics, Attribution"

echo ""
echo -e "${BLUE}[2/3] Starting REZ Services Bridge (Port 5001)...${NC}"
start_service "rez-services" 5001 "CRM, WhatsApp, Loyalty, Notifications"

echo ""
echo -e "${BLUE}[3/3] Starting Platform Integrations (Port 5002)...${NC}"
start_service "platform-integrations" 5002 "Instagram, Facebook, WhatsApp, Google"

echo ""
echo -e "${BLUE}Waiting for services to initialize...${NC}"
sleep 5

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}         HEALTH CHECKS                   ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

check_health() {
    local port=$1
    local name=$2
    local status=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$status" = "healthy" ]; then
        echo -e "  ${GREEN}✓${NC} Port $port - $name: ${GREEN}HEALTHY${NC}"
    else
        echo -e "  ${YELLOW}⚠${NC} Port $port - $name: ${YELLOW}STARTING${NC}"
    fi
}

check_health 5000 "Media Intelligence"
check_health 5001 "REZ Services"
check_health 5002 "Platform Integrations"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ ALL SERVICES STARTED                 ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "Services:"
echo -e "  ${BLUE}Port 5000${NC} - Main Platform (Merchant Twin, Content, Analytics)"
echo -e "  ${BLUE}Port 5001${NC} - REZ Services (CRM, WhatsApp, Loyalty)"
echo -e "  ${BLUE}Port 5002${NC} - Platform APIs (Instagram, Facebook, WhatsApp)"
echo ""
echo -e "Quick Commands:"
echo -e "  ${CYAN}curl localhost:5000/health${NC}    - Health check"
echo -e "  ${CYAN}tail -f logs/media-intel.log${NC}   - View logs"
echo -e "  ${CYAN}./stop.sh${NC}                      - Stop all"
echo ""