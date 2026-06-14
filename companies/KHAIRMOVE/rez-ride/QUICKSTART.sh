#!/bin/bash
# ReZ Ride - Quick Start Script

echo "============================================"
echo "ReZ Ride - Quick Start"
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm --version)"

echo ""
echo "============================================"
echo "STEP 1: Install Dependencies"
echo "============================================"
npm install

echo ""
echo "============================================"
echo "STEP 2: Configure Environment"
echo "============================================"
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
    echo "⚠️  Please edit .env and add your API keys!"
else
    echo "✅ .env already exists"
fi

echo ""
echo "============================================"
echo "STEP 3: Start Backend"
echo "============================================"
echo "Options:"
echo "  1. Docker (requires Docker installed)"
echo "  2. Local MongoDB + Redis"
echo ""
read -p "Choose option (1/2): " choice

if [ "$choice" = "1" ]; then
    if command -v docker &> /dev/null; then
        echo "Starting with Docker..."
        docker-compose up -d
        echo "✅ Backend started at http://localhost:4000"
    else
        echo "❌ Docker not found. Please install Docker or choose option 2."
    fi
else
    echo "Make sure MongoDB and Redis are running locally, then:"
    echo "  npm run dev"
fi

echo ""
echo "============================================"
echo "STEP 4: Start User App"
echo "============================================"
echo "cd apps/user-app && npx expo start"

echo ""
echo "============================================"
echo "STEP 5: Start Driver App"
echo "============================================"
echo "cd apps/driver-app && npx expo start"

echo ""
echo "============================================"
echo "🚀 Ready to Go!"
echo "============================================"
echo ""
echo "API: http://localhost:4000"
echo "Health: http://localhost:4000/health"
echo ""
