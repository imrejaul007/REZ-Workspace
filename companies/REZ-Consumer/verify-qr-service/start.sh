#!/bin/bash

# REZ Verify QR - Quick Start Script
# Usage: ./start.sh [dev|prod|stop|logs]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_logo() {
    echo -e "${GREEN}"
    echo "  _____ _______  _____  "
    echo " |__   _|__   __|/ ____|"
    echo "    | |  | |  | | (___  "
    echo "    | |  | |  |  \___ \ "
    echo "   _| |_ | |  | |____) |"
    echo "  |_____||_|  |_|_____/ "
    echo ""
    echo -e "  Verify QR Service v2.0${NC}"
    echo "  Product Trust & Warranty Infrastructure"
    echo ""
}

# Commands
DEV_MODE=false
if [ "$1" = "dev" ]; then
    DEV_MODE=true
fi

start_services() {
    echo -e "${BLUE}Starting services...${NC}"

    # Check if docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi

    # Create network if not exists
    docker network create verify-qr-network 2>/dev/null || true

    # Start with docker-compose
    docker-compose up -d

    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    echo -e "Services:"
    echo -e "  ${BLUE}API:${NC}     http://localhost:4003"
    echo -e "  ${BLUE}Health:${NC}   http://localhost:4003/health"
    echo -e "  ${BLUE}Dashboard:${NC} http://localhost:3000"
    echo -e "  ${BLUE}MongoDB:${NC}  localhost:27017"
    echo -e "  ${BLUE}Redis:${NC}    localhost:6379"
    echo ""
    echo -e "View logs: ${GREEN}./start.sh logs${NC}"
    echo -e "Stop: ${GREEN}./start.sh stop${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

view_logs() {
    docker-compose logs -f
}

run_dev() {
    echo -e "${BLUE}Starting in development mode...${NC}"

    # Start dependencies only
    docker-compose up -d mongo redis

    # Wait for MongoDB
    echo -e "${YELLOW}Waiting for MongoDB...${NC}"
    sleep 5

    # Install and run locally
    npm install
    npm run dev

    echo -e "${GREEN}✓ API running on http://localhost:4003${NC}"
}

# Parse command
case "${1:-start}" in
    start)
        echo_logo
        start_services
        ;;
    dev)
        echo_logo
        run_dev
        ;;
    stop)
        stop_services
        ;;
    logs)
        view_logs
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    *)
        echo "Usage: ./start.sh [start|dev|stop|restart|logs]"
        exit 1
        ;;
esac
