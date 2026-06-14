#!/bin/bash

# ================================================
# MyRisa - Start All Services
# ================================================
# "Your Health. Understood."
# ================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ███╗   ███╗███████╗██╗ ██████╗ ███╗   ██╗        ║"
echo "║   ████╗ ████║██╔════╝╚██╗██╔═══██╗████╗  ██║        ║"
echo "║   ██╔████╔██║█████╗   ██║██║   ██║██╔██╗ ██║        ║"
echo "║   ██║╚██╔╝██║██╔══╝   ██║██║   ██║██║╚██╗██║        ║"
echo "║   ██║ ╚═╝ ██║███████╗██╔╝╚██████╔╝██║ ╚████║        ║"
echo "║   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═════╝ ╚═╝  ╚═══╝        ║"
echo "║                                                           ║"
echo "║   Your Health. Understood.                                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Starting MyRisa Services...${NC}"
echo ""

# Check if running from correct directory
if [ ! -d "myrisa-app" ]; then
    echo -e "${RED}Error: Please run from RisaCare directory${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
}

# Function to start a service
start_service() {
    local name=$1
    local port=$2
    local dir=$3
    local desc=$4

    echo -e "Starting ${BLUE}$name${NC} (Port $port)..."

    if check_port $port; then
        echo -e "  ${YELLOW}⚠ Port $port already in use - skipping${NC}"
        return
    fi

    cd $dir 2>/dev/null || {
        echo -e "  ${RED}⚠ Directory $dir not found - skipping${NC}"
        return
    }

    npm run dev > /dev/null 2>&1 &
    cd ..
    sleep 1
}

# Kill existing MyRisa services
echo -e "${YELLOW}Cleaning up existing services...${NC}"
pkill -f "myrisa-" 2>/dev/null || true
sleep 1

echo ""
echo -e "${GREEN}Starting MyRisa Core Services...${NC}"
echo ""

# Start MyRisa Core Services
start_service "MyRisa Universal Memory" "4800" "myrisa-universal-memory" "All domains memory"
start_service "MyRisa Women's Health" "4820" "myrisa-womens-health-service" "Cycle, fertility, pregnancy"
start_service "MyRisa Sexual Wellness" "4821" "myrisa-sexual-wellness-service" "Libido, contraception"
start_service "MyRisa Work-Life" "4822" "myrisa-worklife-service" "Burnout, energy, PTO"
start_service "MyRisa Relationships" "4823" "myrisa-relationships-service" "Partner, quality time"
start_service "MyRisa Human Twin" "4824" "myrisa-human-twin-service" "Unified health twin"
start_service "MyRisa Consultation Copilot" "4825" "myrisa-consultation-copilot" "Pre/post-visit"

echo ""
echo -e "${GREEN}Starting MyRisa Extended Services...${NC}"
echo ""

# Start MyRisa Extended Services
start_service "MyRisa App" "4900" "myrisa-app" "Consumer interface"
start_service "MyRisa Auth" "4910" "myrisa-auth-service" "RABTUL integration"
start_service "MyRisa Genie Health" "4920" "myrisa-genie-health" "AI health assistant"
start_service "MyRisa Family" "4930" "myrisa-family-service" "Shab AI integration"

echo ""
echo -e "${GREEN}All MyRisa Services Started!${NC}"
echo ""

# Wait for services to start
sleep 3

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
echo ""

SERVICES=(
    "4900:MyRisa App"
    "4820:Women's Health"
    "4821:Sexual Wellness"
    "4822:Work-Life"
    "4823:Relationships"
    "4824:Human Twin"
    "4825:Consultation Copilot"
    "4800:Universal Memory"
    "4910:Auth"
    "4920:Genie Health"
    "4930:Family"
)

for service in "${SERVICES[@]}"; do
    port="${service%%:*}"
    name="${service##*:}"

    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ $name (Port $port)${NC}"
    else
        echo -e "  ${YELLOW}○ $name (Port $port) - starting...${NC}"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MyRisa is ready!${NC}"
echo -e "${BLUE}  Open: http://localhost:4900${NC}"
echo -e "${BLUE}  Health: http://localhost:4900/health${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Show commands
echo -e "${YELLOW}Quick Commands:${NC}"
echo "  curl http://localhost:4900/api/dashboard/test-user"
echo "  curl http://localhost:4820/api/cycles/test-user"
echo "  curl http://localhost:4824/api/v1/twin/test-user"
echo "  curl http://localhost:4920/genie/briefing/test-user"
echo ""

# Keep script running
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for interrupt
wait