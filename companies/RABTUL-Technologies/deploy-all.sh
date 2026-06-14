#!/bin/bash
# Deploy all new services to Render.com
# Usage: ./deploy-all.sh

set -e

echo "=========================================="
echo "RABTUL-Technologies - Deploy All Services"
echo "=========================================="
echo ""

SERVICES=(
  "rez-articles-service"
  "rez-bill-payments-service"
  "rez-cashback-service"
  "rez-gamification-service"
  "rez-creator-earnings-service"
)

echo "Services to deploy:"
for service in "${SERVICES[@]}"; do
  echo "  - $service"
done
echo ""

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
  echo "Installing render CLI..."
  npm install -g @render/terraform-provider-render || npm install -g render-cli
fi

# Deploy each service
for service in "${SERVICES[@]}"; do
  echo "----------------------------------------"
  echo "Deploying: $service"
  echo "----------------------------------------"

  if [ -f "$service/render.yaml" ]; then
    cd "$service"
    # render deploy --service="$service" || echo "Manual deploy needed for $service"
    echo "✓ render.yaml found - deploy via Render dashboard or CI/CD"
    cd ..
  else
    echo "✗ render.yaml not found"
  fi
  echo ""
done

echo "=========================================="
echo "Deployment preparation complete!"
echo "=========================================="
echo ""
echo "To deploy via Render Dashboard:"
echo "1. Go to https://dashboard.render.com"
echo "2. Create new Web Service for each service"
echo "3. Connect GitHub repository"
echo "4. Set environment variables"
echo ""
echo "To deploy via CLI:"
for service in "${SERVICES[@]}"; do
  echo "  render deploy --service=$service --path=$service"
done
