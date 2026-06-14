#!/bin/bash

# ============================================================
# REZ AdBazaar - Services Stop Script
# ============================================================

set -e

cd "$(dirname "$0")"

echo "🛑 Stopping REZ AdBazaar Intelligence Services..."
echo "=================================================="

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop and remove containers
$DOCKER_COMPOSE -f docker-compose.adbazaar-services.yml down

echo ""
echo "✅ All services stopped successfully!"
echo ""
echo "💡 Data persisted in volumes will be retained."
echo "   To completely remove all data: docker volume rm adbazaar-mongodb_data adbazaar-redis_data"
