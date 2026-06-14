#!/bin/bash
# ReZ Ride - Setup Script
# Run: ./scripts/setup.sh

set -e

echo "========================================"
echo "ReZ Ride Setup"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed."
    exit 1
fi

echo -e "${GREEN}Node.js found: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "npm is required but not installed."
    exit 1
fi

echo -e "${GREEN}npm found: $(npm --version)${NC}"

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd "$(dirname "$0")/.."
npm install

# Install user app dependencies
echo ""
echo "Installing user app dependencies..."
cd apps/user-app
npm install

# Install driver app dependencies
echo ""
echo "Installing driver app dependencies..."
cd ../driver-app
npm install

# Go back to root
cd ../..

# Copy .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}.env not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please fill in your API keys in .env${NC}"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo ""
    echo "Docker found. Starting services..."
    docker-compose up -d mongo redis || echo "Docker not running, skipping..."
fi

# Generate icons
echo ""
echo "Checking icons..."
if [ ! -f apps/user-app/assets/icon.png ]; then
    echo "Generating placeholder icons..."
    node scripts/generate-icons.js 2>/dev/null || echo "Icon generation skipped"
fi

echo ""
echo "========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Fill in API keys in .env"
echo "2. Get MongoDB URI from cloud.mongodb.com"
echo "3. Start backend: npm run dev"
echo "4. Start user app: cd apps/user-app && npx expo start"
echo ""
