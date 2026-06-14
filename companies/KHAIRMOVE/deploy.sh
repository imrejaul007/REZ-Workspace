#!/bin/bash

# ============================================
# KHAIRMOVE - Deployment Script
# ============================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "============================================"
echo "  KHAIRMOVE Deployment Script"
echo "============================================"
echo -e "${NC}"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed.${NC}"
    exit 1
fi

# Parse command
COMMAND=${1:-"start"}

case $COMMAND in
  start)
    echo -e "${GREEN}Starting KHAIRMOVE services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started!${NC}"
    echo ""
    echo "Services:"
    echo "  - API Gateway:       http://localhost:4600"
    echo "  - Ride Service:       http://localhost:4601"
    echo "  - Fleet Service:      http://localhost:4602"
    echo "  - Delivery Service:   http://localhost:4603"
    echo "  - Logistics:          http://localhost:4604"
    echo "  - Rental Service:     http://localhost:4605"
    echo "  - BuzzLocal:         http://localhost:4606"
    echo "  - Admin Dashboard:   http://localhost:4607"
    ;;

  stop)
    echo -e "${YELLOW}Stopping KHAIRMOVE services...${NC}"
    docker-compose down
    echo -e "${GREEN}Services stopped!${NC}"
    ;;

  restart)
    echo -e "${YELLOW}Restarting KHAIRMOVE services...${NC}"
    docker-compose restart
    echo -e "${GREEN}Services restarted!${NC}"
    ;;

  logs)
    echo -e "${CYAN}Showing logs...${NC}"
    docker-compose logs -f
    ;;

  status)
    echo -e "${CYAN}Checking service status...${NC}"
    docker-compose ps
    ;;

  build)
    echo -e "${CYAN}Building Docker images...${NC}"
    docker-compose build
    echo -e "${GREEN}Build complete!${NC}"
    ;;

  clean)
    echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}Cleanup complete!${NC}"
    ;;

  *)
    echo -e "${RED}Unknown command: $COMMAND${NC}"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show logs"
    echo "  status   - Check status"
    echo "  build    - Build Docker images"
    echo "  clean    - Stop and remove volumes"
    exit 1
    ;;
esac
