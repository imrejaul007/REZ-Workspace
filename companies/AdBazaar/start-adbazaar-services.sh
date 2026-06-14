#!/bin/bash

# ============================================================
# REZ AdBazaar - New Services Startup Script
# ============================================================
# Starts all 15 new intelligence services
# ============================================================

set -e

echo "🚀 Starting REZ AdBazaar Intelligence Services..."
echo "=================================================="

# Change to script directory
cd "$(dirname "$0")"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if services are already running
echo "📋 Checking existing containers..."
EXISTING=$($DOCKER_COMPOSE -f docker-compose.adbazaar-services.yml ps --services --filter "status=running" 2>/dev/null || echo "")

if [ -n "$EXISTING" ]; then
    echo "⚠️  Some services are already running:"
    echo "$EXISTING"
    read -p "Do you want to restart all services? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "👍 Keeping existing services running."
        exit 0
    fi
fi

# Pull latest images and build
echo "📦 Pulling base images..."
docker pull node:20-alpine

# Build and start services
echo "🔨 Building and starting services..."
$DOCKER_COMPOSE -f docker-compose.adbazaar-services.yml up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "📊 Service Status:"
echo "=================="
$DOCKER_COMPOSE -f docker-compose.adbazaar-services.yml ps

echo ""
echo "🎉 Services started successfully!"
echo ""
echo "Service Endpoints:"
echo "=================="
echo "  Email Validator:    http://localhost:4810"
echo "  Fraud Detection:   http://localhost:4811"
echo "  Creative A/B Test:  http://localhost:4812"
echo "  Brand Safety:       http://localhost:4813"
echo "  Viewability:       http://localhost:4814"
echo "  Attribution:       http://localhost:4815"
echo "  Audience Sync:     http://localhost:4816"
echo "  Creative Rotation: http://localhost:4817"
echo "  Frequency Capping: http://localhost:4818"
echo "  Budget Allocator:  http://localhost:4819"
echo "  Churn Predictor:   http://localhost:4900"
echo "  LTV Calculator:    http://localhost:4901"
echo "  Next Best Action:  http://localhost:4902"
echo "  Sentiment Analyzer: http://localhost:4903"
echo "  Competitor Monitor: http://localhost:4904"
echo ""
echo "💡 Use './stop-adbazaar-services.sh' to stop all services"
