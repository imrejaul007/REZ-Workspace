#!/bin/bash

# LEDGERAI Startup Script
# Accounting AI Operating System

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║     LEDGERAI v1.0.0 - Accounting AI Operating System          ║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
    fi
fi

# Check for NODE_ENV
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=development
    echo -e "${YELLOW}NODE_ENV not set, defaulting to: development${NC}"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
fi

# Build TypeScript if not in development
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${BLUE}Building TypeScript...${NC}"
    npm run build
fi

# Create logs directory
mkdir -p logs

# Start the server
echo -e "${GREEN}Starting LEDGERAI server...${NC}"
echo ""

# Run in background if --daemon flag passed
if [ "$1" = "--daemon" ]; then
    npm start > logs/server.log 2>&1 &
    echo -e "${GREEN}Server started in background. Check logs/server.log${NC}"
    exit 0
fi

# Run with npm start
npm start