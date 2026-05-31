#!/bin/bash

# Hojai Unified Platform - Quick Start Script
# Usage: ./START.sh

set -e

echo "🚀 Starting Hojai Unified Platform..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check MongoDB
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo -e "${YELLOW}MongoDB not found. Please install MongoDB${NC}"
    exit 1
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Copy env if not exists
if [ ! -f .env ]; then
    echo -e "${GREEN}📝 Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️ Please edit .env with your credentials${NC}"
fi

# Start the server
echo -e "${GREEN}✨ Starting server on port 4850...${NC}"
npm run dev
