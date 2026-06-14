#!/bin/bash

# KHAIRMOVE Complete Setup Script
# Run this once to set up everything

set -e

echo "========================================"
echo "KHAIRMOVE Setup"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Create .env from example
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your API keys${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install service dependencies
echo "Installing service dependencies..."
for dir in khaimove-api-gateway khaimove-ride-service khaimove-fleet-service khaimove-delivery-service khaimove-logistics-aggregator khaimove-rental-service buzzlocal-rides-integration shared; do
    if [ -d "$dir" ]; then
        echo "Installing $dir..."
        cd "$dir"
        npm install
        cd ..
    fi
done

# Make deploy script executable
chmod +x deploy.sh

echo ""
echo "========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys"
echo "2. Start MongoDB: docker-compose up -d mongodb"
echo "3. Start services:"
echo "   - Development: docker-compose up -d"
echo "   - Or: npm run dev"
echo ""
echo "Services:"
echo "  API Gateway:    http://localhost:4600"
echo "  Ride Service:   http://localhost:4601"
echo "  Fleet Service:  http://localhost:4602"
echo "  Delivery:       http://localhost:4603"
echo "  Logistics:      http://localhost:4604"
echo "  Rental:         http://localhost:4605"
echo "  BuzzLocal:      http://localhost:4606"
echo ""
