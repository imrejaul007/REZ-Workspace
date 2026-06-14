#!/bin/bash
# RisaCare - Quick Start Script
# Starts key services with Node.js

echo "=============================================="
echo "  RisaCare Healthcare Platform - Quick Start"
echo "=============================================="
echo ""

# Check MongoDB
if ! pgrep -fl mongod > /dev/null 2>&1; then
    echo "⚠️  MongoDB not running. Starting MongoDB..."
    brew services start mongodb-community 2>/dev/null || sudo systemctl start mongod 2>/dev/null || echo "Please start MongoDB manually"
fi

echo "✅ MongoDB: Running"
echo ""

# Start key services
echo "🚀 Starting RisaCare Services..."
echo ""

# Core Platform Services (4700-4707)
echo "📦 Starting Core Platform (4700-4707)..."
cd "/Users/rejaulkarim/Documents/ReZ Full App/RisaCare"

# Start services in background
services=(
    "risa-care-api-gateway:4700"
    "risa-care-profile-service:4701"
    "risa-care-records-service:4702"
    "risa-care-wellness-service:4703"
    "risa-care-visit-service:4704"
    "risa-care-consent-service:4705"
    "risa-care-care-circle-service:4706"
    "risa-care-medication-service:4707"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    if [ -d "$service" ]; then
        echo "  ⏳ Starting $service on port $port..."
        cd "$service"
        npm run dev > /dev/null 2>&1 &
        cd ..
    else
        echo "  ⚠️  Service not found: $service"
    fi
done

# B2C Healthcare Services (4720-4729)
echo ""
echo "📦 Starting B2C Healthcare (4720-4729)..."
healthcare_services=(
    "risa-care-chronic-care-service:4720"
    "risa-care-elderly-service:4721"
    "risa-care-mental-health-service:4722"
    "risa-care-teleconsult-service:4723"
    "risa-care-insurance-service:4724"
    "risa-care-nutrition-service:4725"
    "risa-care-second-opinion-service:4726"
    "risa-care-vaccination-service:4727"
    "risa-care-home-healthcare-service:4728"
    "risa-care-sleep-service:4729"
)

for service_info in "${healthcare_services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    if [ -d "$service" ]; then
        echo "  ⏳ Starting $service on port $port..."
        cd "$service"
        npm run dev > /dev/null 2>&1 &
        cd ..
    fi
done

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "=============================================="
echo "  ✅ RisaCare Services Started!"
echo "=============================================="
echo ""
echo "Health Checks:"
echo "  curl http://localhost:4700/health  # API Gateway"
echo "  curl http://localhost:4721/health  # Elderly Care"
echo "  curl http://localhost:4726/health  # Second Opinion"
echo ""
echo "All ports: 4700-4707, 4720-4729, 4740-4743"
echo ""
echo "To stop: pkill -f 'risa-care'"
echo "=============================================="