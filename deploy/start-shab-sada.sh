#!/bin/bash

# RTNM Ecosystem - SADA & Shab AI Startup Script
# SADA (4190): Trust, Governance & Risk Platform
# Shab AI (4970): Family Intelligence Platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           RTNM Ecosystem - SADA & Shab AI Services         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if MongoDB is running
check_mongodb() {
    echo -e "${YELLOW}Checking MongoDB...${NC}"
    if command -v mongosh &> /dev/null; then
        mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null && echo -e "${GREEN}✓ MongoDB is running${NC}" || {
            echo -e "${RED}✗ MongoDB is not running. Please start MongoDB first.${NC}"
            exit 1
        }
    elif command -v mongo &> /dev/null; then
        mongo --eval "db.adminCommand('ping')" --quiet 2>/dev/null && echo -e "${GREEN}✓ MongoDB is running${NC}" || {
            echo -e "${RED}✗ MongoDB is not running. Please start MongoDB first.${NC}"
            exit 1
        }
    else
        echo -e "${YELLOW}⚠ MongoDB client not found. Assuming MongoDB is running.${NC}"
    fi
}

# Check if port is in use
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Port $port ($name) is already in use${NC}"
        return 1
    fi
    return 0
}

# Start SADA OS
start_sada() {
    echo -e "\n${YELLOW}Starting SADA OS (Trust, Governance & Risk Platform)...${NC}"

    SADA_DIR="$ROOT_DIR/Sada-os"
    if [ ! -d "$SADA_DIR" ]; then
        echo -e "${RED}✗ SADA directory not found at $SADA_DIR${NC}"
        return 1
    fi

    cd "$SADA_DIR"

    if [ ! -f "package.json" ]; then
        echo -e "${RED}✗ package.json not found in SADA directory${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Starting SADA on port 4190...${NC}"
    PORT=4190 npx tsx src/index.ts &
    SADA_PID=$!

    sleep 3

    if ps -p $SADA_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ SADA OS started (PID: $SADA_PID)${NC}"
    else
        echo -e "${RED}✗ SADA OS failed to start${NC}"
        return 1
    fi
}

# Start Shab AI
start_shab() {
    echo -e "\n${YELLOW}Starting Shab AI (Family Intelligence Platform)...${NC}"

    SHAB_DIR="$ROOT_DIR/Shab-os"
    if [ ! -d "$SHAB_DIR" ]; then
        echo -e "${RED}✗ Shab AI directory not found at $SHAB_DIR${NC}"
        return 1
    fi

    cd "$SHAB_DIR"

    if [ ! -f "package.json" ]; then
        echo -e "${RED}✗ package.json not found in Shab AI directory${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Starting Shab AI on port 4970...${NC}"
    PORT=4970 npx tsx src/index.ts &
    SHAB_PID=$!

    sleep 3

    if ps -p $SHAB_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Shab AI started (PID: $SHAB_PID)${NC}"
    else
        echo -e "${RED}✗ Shab AI failed to start${NC}"
        return 1
    fi
}

# Check services health
check_health() {
    echo -e "\n${YELLOW}Checking services health...${NC}"

    sleep 2

    echo -e "\nSADA OS (port 4190):"
    curl -s http://localhost:4190/health 2>/dev/null | head -c 200 || echo -e "${RED}✗ Not responding${NC}"

    echo -e "\n\nShab AI (port 4970):"
    curl -s http://localhost:4970/health 2>/dev/null | head -c 200 || echo -e "${RED}✗ Not responding${NC}"
}

# Stop services
stop_services() {
    echo -e "\n${YELLOW}Stopping services...${NC}"

    for port in 4190 4970; do
        PID=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
        if [ -n "$PID" ]; then
            echo -e "${GREEN}✓ Stopping process on port $port (PID: $PID)${NC}"
            kill $PID 2>/dev/null || true
        fi
    done
}

# Show status
show_status() {
    echo -e "\n${YELLOW}Service Status:${NC}\n"
    printf "%-20s %-10s %-s\n" "Service" "Port" "Status"
    printf "%-20s %-10s %-s\n" "----------------" "--------" "------"

    for port in 4190 4970; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            if [ "$port" = "4190" ]; then
                printf "%-20s %-10s ${GREEN}Running${NC}\n" "SADA OS" "$port"
            else
                printf "%-20s %-10s ${GREEN}Running${NC}\n" "Shab AI" "$port"
            fi
        else
            if [ "$port" = "4190" ]; then
                printf "%-20s %-10s ${RED}Stopped${NC}\n" "SADA OS" "$port"
            else
                printf "%-20s %-10s ${RED}Stopped${NC}\n" "Shab AI" "$port"
            fi
        fi
    done
}

# Main
case "${1:-start}" in
    start)
        check_mongodb
        start_sada
        start_shab
        check_health
        echo -e "\n${GREEN}✓ All services started!${NC}"
        echo -e "\nService URLs:"
        echo -e "  • SADA OS:  http://localhost:4190"
        echo -e "  • Shab AI:  http://localhost:4970"
        ;;
    stop)
        stop_services
        echo -e "\n${GREEN}✓ Services stopped${NC}"
        ;;
    restart)
        stop_services
        sleep 2
        check_mongodb
        start_sada
        start_shab
        check_health
        echo -e "\n${GREEN}✓ Services restarted!${NC}"
        ;;
    status)
        show_status
        ;;
    health)
        check_health
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|health}"
        echo ""
        echo "Commands:"
        echo "  start   - Start SADA and Shab AI services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        echo "  health  - Check service health"
        exit 1
        ;;
esac