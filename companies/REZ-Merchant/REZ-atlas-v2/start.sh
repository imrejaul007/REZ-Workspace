#!/bin/bash
# Start all REZ Atlas v2 services

echo "============================================"
echo "Starting REZ Atlas v2 Services"
echo "============================================"

# Base directory
BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App/REZ-Merchant/REZ-atlas-v2"

# Workforce Suite
echo "Starting AI Workforce Suite..."
(cd "$BASE_DIR/atlas-workforce-core" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-workforce-agent" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-workforce-scheduler" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-workforce-talent" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-workforce-training" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-workforce-analytics" && npm install && npm run dev) &

# Engage Suite
echo "Starting Customer Engagement Suite..."
(cd "$BASE_DIR/atlas-engage-core" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-engage-campaign" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-engage-conversation" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-engage-content" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-engage-automation" && npm install && npm run dev) &

# Intelligence Suite
echo "Starting Intelligence Suite..."
(cd "$BASE_DIR/atlas-intelligence-core" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-forecast" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-competitor" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-market" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-customer" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-pricing" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-signal" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-opportunity" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-assistant" && npm install && npm run dev) &
(cd "$BASE_DIR/atlas-intelligence-predictive" && npm install && npm run dev) &

# Revenue Suite
echo "Starting Revenue Suite..."
(cd "$BASE_DIR/atlas-revenue-core" && npm install && npm run dev) &

echo ""
echo "============================================"
echo "All services starting..."
echo ""
echo "Health checks:"
echo "  Workforce: http://localhost:5200/health"
echo "  Engage: http://localhost:5250/health"
echo "  Intelligence: http://localhost:5300/health"
echo "  Revenue: http://localhost:5350/health"
echo "============================================"
