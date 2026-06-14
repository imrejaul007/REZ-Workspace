#!/bin/bash
# Quick Deploy Script for New Services
# Usage: ./quick-deploy.sh

set -e

echo "=========================================="
echo "RABTUL-Technologies - Quick Deploy"
echo "=========================================="
echo ""

# Check if logged in
if ! render whoami &> /dev/null; then
  echo "❌ Not logged in to Render"
  echo "Run: render login"
  exit 1
fi

echo "✅ Logged in to Render"
echo ""

SERVICES=(
  "rez-articles-service:4010"
  "rez-bill-payments-service:4030"
  "rez-cashback-service:4040"
  "rez-gamification-service:4050"
  "rez-creator-earnings-service:4060"
)

for service_info in "${SERVICES[@]}"; do
  IFS=':' read -r service port <<< "$service_info"
  echo "----------------------------------------"
  echo "📦 Deploying: $service (port $port)"
  echo "----------------------------------------"

  if [ -d "$service" ]; then
    cd "$service"

    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install

    # Check if service is running (optional health check)
    echo "✅ Dependencies installed"
    echo "⏳ To complete deployment:"
    echo "   1. Go to https://dashboard.render.com"
    echo "   2. Create new Web Service for $service"
    echo "   3. Connect GitHub repository"
    echo "   4. Set PORT=$port"
    echo "   5. Deploy"

    cd ..
  else
    echo "❌ Service directory not found: $service"
  fi
  echo ""
done

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Deploy each service via Render Dashboard"
echo "2. Update API Gateway with new service URLs"
echo "3. Update consumer app .env file"
echo "4. Run integration tests"
echo ""
echo "See DEPLOY_INSTRUCTIONS.md for detailed steps"
