#!/bin/bash

# Resturistan Infrastructure Startup Script
set -e

echo "🚀 Starting Resturistan Infrastructure"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "⏳ Waiting for $service on port $port..."
    while ! nc -z localhost $port 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED} Failed!${NC}"
            return 1
        fi
        sleep 1
        echo -n "."
    done
    echo -e "${GREEN} Ready!${NC}"
    return 0
}

# Step 1: Check Docker
echo "1️⃣ Checking Docker installation..."
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please run: ./setup-docker.sh"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running${NC}"
docker --version

# Step 2: Check docker-compose
echo ""
echo "2️⃣ Checking Docker Compose..."
if ! command_exists docker-compose; then
    if docker compose version >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose (plugin) is available${NC}"
        COMPOSE_CMD="docker compose"
    else
        echo -e "${RED}❌ Docker Compose is not available!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
    COMPOSE_CMD="docker-compose"
fi

# Step 3: Create necessary directories
echo ""
echo "3️⃣ Creating necessary directories..."
mkdir -p ./data/postgres
mkdir -p ./data/redis
mkdir -p ./logs
echo -e "${GREEN}✅ Directories created${NC}"

# Step 4: Check environment files
echo ""
echo "4️⃣ Checking environment configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found, copying from example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Step 5: Start infrastructure services
echo ""
echo "5️⃣ Starting infrastructure services..."
echo "This includes: PostgreSQL, Redis, and other services"

# Stop any existing containers
echo "Stopping any existing containers..."
$COMPOSE_CMD down 2>/dev/null || true

# Start services
echo "Starting services..."
$COMPOSE_CMD up -d

# Step 6: Wait for services to be ready
echo ""
echo "6️⃣ Waiting for services to be ready..."

# Wait for PostgreSQL
wait_for_service "PostgreSQL" 5432

# Wait for Redis
wait_for_service "Redis" 6379

# Step 7: Run database migrations
echo ""
echo "7️⃣ Running database migrations..."
cd apps/api
npm run prisma:generate
npm run prisma:push
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Step 8: Seed initial data
echo ""
echo "8️⃣ Seeding initial data..."
npm run prisma:seed || echo -e "${YELLOW}⚠️  Seed might already exist${NC}"
cd ../..

# Step 9: Display service status
echo ""
echo "9️⃣ Service Status:"
echo "=================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${GREEN}🎉 Infrastructure is ready!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Start the development servers:"
echo "     npm run dev"
echo ""
echo "  2. Access the services:"
echo "     - Web App: http://localhost:3002"
echo "     - API: http://localhost:3001"
echo "     - Database: localhost:5432"
echo ""
echo "  3. Default credentials:"
echo "     - Admin: admin@resturistan.com / Admin@123"
echo "     - Vendor: vendor@resturistan.com / Vendor@123"
echo "     - Customer: customer@resturistan.com / Customer@123"
echo ""
echo "To stop all services: $COMPOSE_CMD down"
echo "To view logs: $COMPOSE_CMD logs -f"