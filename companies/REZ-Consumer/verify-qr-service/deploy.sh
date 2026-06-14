#!/bin/bash

# REZ Verify QR - Quick Start
# One-command setup for development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  _____ _______  _____  "
echo " |__   _|__   __|/ ____|"
echo "    | |  | |  | | (___  "
echo "    | |  | |  |  \___ \ "
echo "   _| |_ | |  | |____) |"
echo "  |_____||_|  |_|_____/ "
echo ""
echo -e "  Verify QR Service v2.0${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "  Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"

# Start services
echo ""
echo -e "${BLUE}Starting services with Docker Compose...${NC}"

docker compose up -d

# Wait for services
echo ""
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for MongoDB
for i in {1..30}; do
    if docker compose exec mongo mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB ready${NC}"
        break
    fi
    sleep 1
done

# Wait for API
for i in {1..30}; do
    if curl -s http://localhost:4003/health &> /dev/null; then
        echo -e "${GREEN}✓ API ready${NC}"
        break
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Services:"
echo -e "  ${BLUE}API:${NC}       http://localhost:4003"
echo -e "  ${BLUE}Dashboard:${NC}  http://localhost:3000 (run separately)"
echo -e "  ${BLUE}Health:${NC}      http://localhost:4003/health"
echo -e "  ${BLUE}MongoDB:${NC}    localhost:27017"
echo -e "  ${BLUE}Redis:${NC}      localhost:6379"
echo ""
echo -e "Quick commands:"
echo -e "  ${GREEN}docker compose logs -f${NC}    # View logs"
echo -e "  ${GREEN}docker compose down${NC}        # Stop services"
echo -e "  ${GREEN}docker compose restart${NC}      # Restart services"
echo ""
echo -e "For Dashboard:"
echo -e "  ${YELLOW}cd ../verify-qr-dashboard && npm install && npm run dev${NC}"
echo ""
