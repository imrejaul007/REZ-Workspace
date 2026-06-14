#!/bin/bash

# RestaurantHub Database Setup Script
# This script sets up PostgreSQL database with Docker and runs Prisma migrations

set -e

echo "🗄️  Setting up RestaurantHub Database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load environment variables safely (only specific, non-sensitive variables)
if [ -f .env ]; then
    set -a
    source <(grep -v '^#' .env | grep -v '^$' | sed 's/=.*$//' | sed 's/^/export /')
    set +a
fi

# Set default values
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/restauranthub"}
POSTGRES_DB=${POSTGRES_DB:-"restauranthub"}
POSTGRES_USER=${POSTGRES_USER:-"restauranthub"}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"restauranthub_secret"}

echo "📦 Starting PostgreSQL and Redis containers..."

# Start database services
docker compose -f docker-compose.database.yml up -d

echo "⏳ Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
timeout=60
counter=0
until docker exec restauranthub-postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -gt $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        exit 1
    fi
    echo "⏳ Waiting for database... ($counter/$timeout)"
done

echo "✅ Database is ready!"

# Check if packages/db exists and navigate to it
if [ -d "packages/db" ]; then
    cd packages/db
    echo "📍 Working from packages/db directory"
elif [ -d "../packages/db" ]; then
    cd ../packages/db
    echo "📍 Working from ../packages/db directory"
else
    echo "❌ Could not find packages/db directory"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name "initial-setup"

# Optional: Seed the database
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database with initial data..."
    npx prisma db seed
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Connection details:"
echo "   Database URL: $DATABASE_URL"
echo "   Database: $POSTGRES_DB"
echo "   User: $POSTGRES_USER"
echo ""
echo "🔗 Useful commands:"
echo "   View database: npx prisma studio"
echo "   Reset database: npx prisma migrate reset"
echo "   Generate client: npx prisma generate"
echo ""
echo "🐳 Docker commands:"
echo "   Stop services: docker compose -f docker-compose.database.yml down"
echo "   View logs: docker compose -f docker-compose.database.yml logs -f"
echo "   Remove volumes: docker compose -f docker-compose.database.yml down -v"