#!/bin/bash

# Local Development Setup (Without Docker)
set -e

echo "🚀 Resturistan Local Development Setup"
echo "======================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if PostgreSQL is installed locally
echo "📝 Local Development Requirements:"
echo ""

# Option 1: Use Docker for services only
echo "Option 1: Minimal Docker Setup (Recommended)"
echo "-------------------------------------------"
echo "We'll use Docker only for PostgreSQL and Redis"
echo ""

# Check for docker
if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is available${NC}"
    
    # Start only database services
    echo ""
    echo "Starting database services..."
    docker compose up -d postgres redis
    
    echo ""
    echo -e "${GREEN}✅ Database services started${NC}"
    echo ""
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Run migrations
    echo "Running database setup..."
    cd apps/api
    npm run prisma:generate
    npm run prisma:push
    npm run prisma:seed || echo "Seed data might already exist"
    cd ../..
    
    echo ""
    echo -e "${GREEN}🎉 Local development environment ready!${NC}"
    echo ""
    echo "To start the development servers, run:"
    echo "  npm run dev"
    echo ""
else
    echo -e "${YELLOW}⚠️  Docker not found${NC}"
    echo ""
    echo "Option 2: Manual PostgreSQL Setup"
    echo "---------------------------------"
    echo "1. Install PostgreSQL locally:"
    echo "   brew install postgresql@15"
    echo "   brew services start postgresql@15"
    echo ""
    echo "2. Create database and user:"
    echo "   createdb restauranthub"
    echo "   psql -d restauranthub -c \"CREATE USER restauranthub WITH PASSWORD 'restauranthub_secret';\""
    echo "   psql -d restauranthub -c \"GRANT ALL PRIVILEGES ON DATABASE restauranthub TO restauranthub;\""
    echo ""
    echo "3. Install Redis:"
    echo "   brew install redis"
    echo "   brew services start redis"
    echo ""
    echo "4. Update .env file with local connection strings"
    echo ""
    echo "5. Run database migrations:"
    echo "   cd apps/api"
    echo "   npm run prisma:generate"
    echo "   npm run prisma:push"
    echo "   npm run prisma:seed"
    echo ""
fi