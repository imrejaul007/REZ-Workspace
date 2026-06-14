#!/bin/bash

# RisnaEstate Development Startup Script

set -e

echo "=================================="
echo "Starting RisnaEstate Services..."
echo "=================================="

# Check if MongoDB and Redis are running
echo ""
echo "Checking dependencies..."
command -v mongod >/dev/null 2>&1 && echo "✓ MongoDB available" || echo "⚠ MongoDB not found locally (using docker-compose)"
command -v redis-server >/dev/null 2>&1 && echo "✓ Redis available" || echo "⚠ Redis not found locally (using docker-compose)"

# Generate a random internal token if not set
if [ -z "$INTERNAL_SERVICE_TOKEN" ]; then
  export INTERNAL_SERVICE_TOKEN="risna-dev-$(openssl rand -hex 16)"
  echo ""
  echo "Generated internal token: $INTERNAL_SERVICE_TOKEN"
fi

# Create .env files for each service
echo ""
echo "Setting up environment files..."

for service in property lead visa referral broker crm media; do
  env_file="services/risna-${service}-service/.env"
  if [ ! -f "$env_file" ]; then
    cp "$env_file.example" "$env_file" 2>/dev/null || true
    # Update with dynamic token
    sed -i.bak "s/INTERNAL_SERVICE_TOKEN=.*/INTERNAL_SERVICE_TOKEN=$INTERNAL_SERVICE_TOKEN/" "$env_file" 2>/dev/null || true
    rm -f "$env_file.bak"
  fi
done

# Install dependencies
echo ""
echo "Installing dependencies..."
npm run install:all

# Start all services
echo ""
echo "Starting all services..."
echo "=================================="
echo ""
echo "Services will be available at:"
echo "  Property Service:  http://localhost:4100"
echo "  Lead Service:     http://localhost:4101"
echo "  Visa Service:    http://localhost:4102"
echo "  Referral Service: http://localhost:4103"
echo "  Broker Service:  http://localhost:4104"
echo "  CRM Service:      http://localhost:4105"
echo "  Media Service:    http://localhost:4106"
echo ""
echo "=================================="
echo ""

# Run all services in parallel
npm run dev

