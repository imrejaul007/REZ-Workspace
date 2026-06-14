#!/bin/bash

# RTMN Core Services Start Script
# Starts all 14 core services in background

echo "🚀 Starting RTMN Core Services..."
echo "================================"
echo ""

SERVICES=(
  "capability-matrix:3013"
  "unified-twin-os:3014"
  "memory-network:3015"
  "boa-council:3016"
  "economic-graph:3017"
  "simulation-os:3018"
  "marketing-os:3020"
  "workforce-os:3021"
  "commerce-os:3022"
  "finance-os:3023"
  "industry-ai-company:3030"
  "marketplace-network:3031"
  "revenue-network:3032"
  "developer-cloud:3040"
)

for service in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$service"
  echo "Starting $name on port $port..."
  cd "/Users/rejaulkarim/Documents/RTMN/core/$name" 2>/dev/null

  if [ -f "src/index.js" ]; then
    node src/index.js > /tmp/rtmn-$name.log 2>&1 &
    echo "  ✅ $name started (PID: $!)"
  else
    echo "  ❌ $name not found"
  fi
done

echo ""
echo "================================"
echo "✅ All services started!"
echo ""
echo "To check status:"
echo "  node test-services.js"
echo ""
echo "To view logs:"
echo "  tail -f /tmp/rtmn-<service-name>.log"
echo ""
echo "To stop all services:"
echo "  pkill -f 'node src/index.js'"
