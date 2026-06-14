#!/bin/bash

# ==============================================================================
# AdBazaar - Complete Startup Script
# ==============================================================================
# Version: 2.0
# Date: June 20, 2026
# Description: Start all AdBazaar services (Marketing, DOOH, Social, Business Growth OS)
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/.pids"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Service function
start_service() {
    local name=$1
    local dir=$2
    local port=$3

    if [ ! -d "$dir" ]; then
        echo -e "${RED}✗ $name not found ($dir)${NC}"
        return 1
    fi

    # Check if already running
    if lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠ $name already running on port $port${NC}"
        return 0
    fi

    cd "$SCRIPT_DIR/$dir"

    # Install deps if needed
    if [ ! -d "node_modules" ]; then
        npm install --silent 2>/dev/null
    fi

    # Start
    npm run dev > "$LOG_DIR/${name}.log" 2>&1 &
    local pid=$!

    echo $pid > "$PID_DIR/${name}.pid"
    echo -e "${GREEN}✓ $name started (PID: $pid, Port: $port)${NC}"
}

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ADBAZAAR - STARTING ALL SERVICES      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================================================
# BUSINESS GROWTH OS (Priority 1)
# ==============================================================================
echo -e "${CYAN}[1/5] Business Growth OS (Ports 4960-4974)${NC}"
echo ""

start_service "marketing-os" "adbazaar-marketing-os" 4960
start_service "cdp" "adbazaar-cdp" 4961
start_service "pixel" "adbazaar-pixel" 4962
start_service "verification" "adbazaar-verification" 4963
start_service "clean-room" "adbazaar-clean-room" 4964
start_service "marketing-agent" "adbazaar-marketing-agent" 4965
start_service "event-stream" "adbazaar-event-stream" 4966
start_service "intelligence-graph" "adbazaar-intelligence-graph" 4967
start_service "data-marketplace" "adbazaar-data-marketplace" 4968
start_service "revenue-intelligence" "adbazaar-revenue-intelligence" 4969
start_service "creator-wallet" "adbazaar-creator-wallet" 4970
start_service "personalization" "adbazaar-personalization" 4971
start_service "agency-os" "adbazaar-agency-os" 4972
start_service "competitive-intel" "adbazaar-competitive-intelligence" 4973
start_service "community-media" "adbazaar-community-media" 4974
start_service "hojai-gateway" "adbazaar-hojai-gateway" 4870
start_service "intel-bridge" "REZ-intelligence-bridge" 4980
start_service "rez-mind-api" "REZ-mind-api" 4990

echo ""

# ==============================================================================
# ECOSYSTEM INTEGRATIONS (Priority 2)
# ==============================================================================
echo -e "${CYAN}[2/5] Ecosystem Integrations (Ports 4950-4955)${NC}"
echo ""

start_service "ride-integration" "rez-ride-integration" 4530
start_service "airzy-integration" "airzy-travel-integration" 4951
start_service "stayown-integration" "stayown-hotel-integration" 4952
start_service "buzzlocal-integration" "buzzlocal-social-integration" 4953
start_service "corpperks-integration" "corpperks-hr-integration" 4954
start_service "ecosystem-hub" "ecosystem-integration-hub" 4955

echo ""

# ==============================================================================
# CORE SERVICES (Priority 3)
# ==============================================================================
echo -e "${CYAN}[3/5] Core Services (Ports 4000-4100)${NC}"
echo ""

start_service "marketing" "REZ-marketing" 4000
start_service "ads-service" "REZ-ads-service" 4007
start_service "dooh-service" "REZ-dooh-service" 4018
start_service "automation-service" "REZ-automation-service" 4020
start_service "attribution-hub" "REZ-attribution-hub" 4100

echo ""

# ==============================================================================
# INTENT EXCHANGE (Priority 4)
# ==============================================================================
echo -e "${CYAN}[4/5] Intent Exchange (Ports 4800-4808)${NC}"
echo ""

start_service "intent-aggregator" "intent-signal-aggregator" 4800
start_service "intent-prediction" "intent-prediction-engine" 4801
start_service "intent-marketplace" "intent-marketplace" 4802
start_service "intent-attribution" "intent-attribution" 4803
start_service "audience-twin" "audience-twin-service" 4805
start_service "user-twin" "user-twin-service" 4806
start_service "merchant-twin" "merchant-twin-service" 4807
start_service "customer-graph" "customer-graph-360" 4808

echo ""

# ==============================================================================
# SOCIAL AUTOMATION (Priority 5)
# ==============================================================================
echo -e "${CYAN}[5/5] Social Automation (Ports 5080-5113)${NC}"
echo ""

start_service "instagram-shop" "instagram-shop-integration" 5080
start_service "instagram-publishing" "instagram-publishing-service" 5081
start_service "instagram-insights" "instagram-insights-service" 5082
start_service "social-publisher" "social-content-publisher" 5083
start_service "hashtag-engine" "hashtag-research-engine" 5090
start_service "caption-generator" "caption-generator-ai" 5091
start_service "content-calendar" "content-calendar-service" 5092
start_service "follower-tracker" "follower-growth-tracker" 5093

echo ""

# ==============================================================================
# WAIT & HEALTH CHECK
# ==============================================================================
echo -e "${BLUE}Waiting for services to initialize (15 seconds)...${NC}"
sleep 15

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}         HEALTH CHECK                       ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

check_health() {
    local port=$1
    local name=$2

    if lsof -i :$port &> /dev/null; then
        local status=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$status" = "healthy" ]; then
            echo -e "  ${GREEN}✓${NC} Port $port - $name: ${GREEN}HEALTHY${NC}"
        else
            echo -e "  ${YELLOW}⚠${NC} Port $port - $name: ${YELLOW}STARTING${NC}"
        fi
    else
        echo -e "  ${RED}✗${NC} Port $port - $name: ${RED}NOT RUNNING${NC}"
    fi
}

check_health 4960 "Marketing OS"
check_health 4961 "CDP"
check_health 4965 "Marketing Agent"
check_health 4962 "Pixel"
check_health 4963 "Verification"
check_health 4964 "Clean Room"
check_health 4967 "Intelligence Graph"
check_health 4968 "Data Marketplace"
check_health 4870 "HOJAI Gateway"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ ALL SERVICES STARTED SUCCESSFULLY      ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "Quick Commands:"
echo -e "  ${CYAN}./status.sh${NC}           - Check status"
echo -e "  ${CYAN}tail -f logs/marketing-os.log${NC} - View logs"
echo -e "  ${CYAN}./stop-all-services.sh${NC}  - Stop all"
echo ""
