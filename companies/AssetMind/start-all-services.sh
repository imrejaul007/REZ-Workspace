#!/bin/bash
# AssetMind - Start All Services
# Run all 82 services locally for development

set -e

echo "=========================================="
echo "AssetMind - Starting All Services"
echo "=========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODEBASE_DIR="$BASE_DIR/codebase"

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    local dir="$CODEBASE_DIR/$service"

    if [ -d "$dir" ]; then
        echo -e "${GREEN}[$service]${NC} Starting on port $port..."
        cd "$dir"

        # Check if requirements.txt exists
        if [ -f "requirements.txt" ]; then
            # Start Python service
            nohup python -m uvicorn src:app --host 0.0.0.0 --port $port > /tmp/assetmind-$service.log 2>&1 &
        fi

        echo $! > /tmp/assetmind-$service.pid
    fi
}

# Clean up function
cleanup() {
    echo -e "${YELLOW}Shutting down all services...${NC}"
    for pidfile in /tmp/assetmind-*.pid; do
        if [ -f "$pidfile" ]; then
            kill $(cat "$pidfile") 2>/dev/null || true
            rm "$pidfile"
        fi
    done
    echo -e "${GREEN}All services stopped${NC}"
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Start Core Services
echo -e "\n${YELLOW}Starting Core Twin Platform...${NC}"
start_service "assetmind-twin-hub" 5252
start_service "assetmind-decision-twin" 5250
start_service "assetmind-reaction-engine" 5255
start_service "assetmind-voice-bridge" 5265

# Start Asset Twins
echo -e "\n${YELLOW}Starting Asset Twins...${NC}"
start_service "assetmind-asset-twin" 5002
start_service "assetmind-portfolio-twin" 5004
start_service "assetmind-investor-twin" 5005
start_service "assetmind-economic-twin" 5041
start_service "assetmind-competitor-twin" 5258
start_service "assetmind-analyst-twin" 5260

# Start Intelligence
echo -e "\n${YELLOW}Starting Intelligence Services...${NC}"
start_service "assetmind-intelligence" 5160
start_service "assetmind-kronos" 5165
start_service "assetmind-reasoning" 5055
start_service "assetmind-copilot" 5295
start_service "assetmind-multiagent" 5195

# Start Data & Infrastructure
echo -e "\n${YELLOW}Starting Infrastructure...${NC}"
start_service "assetmind-knowledge-graph" 5040
start_service "assetmind-financial-memory" 5031
start_service "assetmind-event-intelligence" 5052
start_service "assetmind-api" 5010

# Start F2.ai Suite
echo -e "\n${YELLOW}Starting Private Market Suite...${NC}"
start_service "assetmind-deal-room" 5280
start_service "assetmind-underwriting" 5281
start_service "assetmind-covenant" 5282
start_service "assetmind-excel-engine" 5283
start_service "assetmind-diligence" 5284
start_service "assetmind-memo-writer" 5285

# Start Trading & Analytics
echo -e "\n${YELLOW}Starting Trading & Analytics...${NC}"
start_service "assetmind-trading-engine" 5303
start_service "assetmind-portfolio-analytics" 5301
start_service "assetmind-broker-api" 5270

# Start Market Intelligence
echo -e "\n${YELLOW}Starting Market Intelligence...${NC}"
start_service "assetmind-market-intelligence" 5304
start_service "assetmind-news" 5030
start_service "assetmind-yfinance" 5011

# Start UI
echo -e "\n${YELLOW}Starting UI Services...${NC}"
start_service "assetmind-report-generator" 5302
start_service "assetmind-dashboard" 5290

# Start Security
echo -e "\n${YELLOW}Starting Security...${NC}"
start_service "assetmind-security" 5305

# Wait for services to start
echo -e "\n${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# Print status
echo ""
echo "=========================================="
echo -e "${GREEN}AssetMind Services Started Successfully!${NC}"
echo "=========================================="
echo ""
echo "Core Services:"
echo "  Twin Hub:        http://localhost:5252"
echo "  Decision Twin:   http://localhost:5250"
echo "  Voice Bridge:    http://localhost:5265"
echo ""
echo "Twin Engines:"
echo "  Asset Twin:      http://localhost:5002"
echo "  Portfolio Twin:  http://localhost:5004"
echo "  Investor Twin:   http://localhost:5005"
echo ""
echo "Intelligence:"
echo "  Kronos:          http://localhost:5165"
echo "  Copilot:         http://localhost:5295"
echo "  Reasoning:       http://localhost:5055"
echo ""
echo "F2.ai Suite:"
echo "  Deal Room:       http://localhost:5280"
echo "  Underwriting:    http://localhost:5281"
echo "  Covenant:        http://localhost:5282"
echo "  Excel Engine:    http://localhost:5283"
echo "  Diligence:       http://localhost:5284"
echo "  Memo Writer:     http://localhost:5285"
echo ""
echo "Trading:"
echo "  Trading Engine:  http://localhost:5303"
echo "  Broker API:      http://localhost:5270"
echo "  Analytics:       http://localhost:5301"
echo ""
echo "UI:"
echo "  Dashboard:       http://localhost:5290"
echo "  Report Gen:      http://localhost:5302"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="

# Keep script running
wait
