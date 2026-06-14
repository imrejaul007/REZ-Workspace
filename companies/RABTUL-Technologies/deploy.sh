#!/bin/bash
# RABTUL-Technologies Deploy Script
# Deploy all services to Render.com

set -e

echo "========================================"
echo "RABTUL-Technologies Deployment"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Services to deploy
SERVICES=(
  "rez-auth-service:4001"
  "rez-payment-service:4003"
  "rez-wallet-service:4002"
  "rez-order-service:4004"
  "rez-notifications-service:4005"
  "rez-analytics-service:4006"
  "rez-articles-service:4010"
  "rez-bill-payments-service:4030"
  "rez-cashback-service:4040"
  "rez-gamification-service:4050"
  "rez-creator-earnings-service:4060"
)

deploy_service() {
  local service=$1
  local port=$2

  echo -e "${YELLOW}Deploying $service on port $port...${NC}"

  # Check if service directory exists
  if [ ! -d "$service" ]; then
    echo -e "${RED}Service $service not found!${NC}"
    return 1
  fi

  cd "$service"

  # Create render.yaml if not exists
  if [ ! -f "render.yaml" ]; then
    cat > render.yaml << EOF
services:
  - type: web
    name: $service
    env: node
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: $port
      - key: MONGODB_URI
        sync: false
      - key: REDIS_URL
        sync: false
      - key: SENTRY_DSN
        sync: false
EOF
    echo "Created render.yaml for $service"
  fi

  cd ..
  echo -e "${GREEN}✓ $service ready for deployment${NC}"
}

# Deploy all services
for svc in "${SERVICES[@]}"; do
  IFS=':' read -r service port <<< "$svc"
  deploy_service "$service" "$port"
done

echo ""
echo -e "${GREEN}========================================"
echo "Deployment Configuration Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Connect services to Render.com"
echo "3. Set environment variables in Render dashboard"
echo "4. Monitor at: https://dashboard.render.com"
