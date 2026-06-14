#!/bin/bash
# REZ Atlas - Start All Services
# The Merchant Intelligence Network for the Physical World

set -e

ATLAS_DIR="/Users/rejaulkarim/Documents/ReZ Full App/REZ-Merchant/REZ-atlas"
NODE_BIN="node node_modules/tsx/dist/cli.cjs"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║ REZ ATLAS - MERCHANT INTELLIGENCE NETWORK           ║"
echo "╠═══════════════════════════════════════════════════════════════╣"

# Function to start a service
start_service() {
  local name=$1
  local dir=$2
  local port=$3

  echo "║  Starting $name (Port $port)..."
  cd "$dir"
  $NODE_BIN src/index.ts &
  sleep 1
}

# Start backend services
echo "║  Starting Backend Services..."
echo "╠═══════════════════════════════════════════════════════════════╣"

start_service "Gateway" "$ATLAS_DIR/REZ-atlas-gateway" "5150"
start_service "Discover" "$ATLAS_DIR/REZ-atlas-discover" "5151"
start_service "Maps" "$ATLAS_DIR/REZ-atlas-maps" "5152"
start_service "Twin" "$ATLAS_DIR/REZ-atlas-twin" "5153"
start_service "Score" "$ATLAS_DIR/REZ-atlas-score" "5154"
start_service "Signals" "$ATLAS_DIR/REZ-atlas-signals" "5155"
start_service "Territory" "$ATLAS_DIR/REZ-atlas-territory" "5170"
start_service "Routes" "$ATLAS_DIR/REZ-atlas-routes" "5171"
start_service "Copilot" "$ATLAS_DIR/REZ-atlas-copilot" "5172"
start_service "Graph" "$ATLAS_DIR/REZ-atlas-graph" "5173"

echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Waiting for services to be ready..."
echo "╚═══════════════════════════════════════════════════════════════╝"

sleep 3

# Check health
echo ""
echo "=== Service Health Check ==="
for port in 5150 5151 5152 5153 5154 5155 5170 5171 5172 5173; do
  result=$(curl -s --connect-timeout 2 http://localhost:$port/health 2>/dev/null)
  if [ $? -eq 0 ]; then
    service=$(echo $result | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
    echo "✅ :$port - $service"
  else
    echo "❌ :$port - Not running"
  fi
done

echo ""
echo "=== All Services Ready ==="
echo "Gateway:    http://localhost:5150"
echo "Dashboard:  http://localhost:5190 (run 'npm run dev' in REZ-atlas-dashboard)"
echo ""
