#!/bin/bash
# Deploy All RABTUL Services to Render
# Usage: ./deploy-all.sh

set -e

echo "=========================================="
echo "RABTUL - Deploy All Services"
echo "=========================================="

# Check login
if ! command -v render &> /dev/null; then
  echo "⚠️  Render CLI not found. Install: npm i -g @render/cli"
  echo "   Or deploy manually via dashboard.render.com"
fi

# New Services (P1/P2/P3)
SERVICES=(
  "REZ-cod-intelligence:4044"
  "REZ-workflow-builder:4045"
  "REZ-ai-agent-studio:4046"
  "REZ-privacy-layer:4047"
  "REZ-checkout-optimization:4050"
  "REZ-woocommerce-connector:4051"
  "REZ-logistics-aggregator:4052"
  "REZ-rfm-plus:4055"
  "REZ-data-aggregator:4058"
  "REZ-developer-platform:4036"
  "REZ-developer-portal:4037"
  "REZ-policy-engine:4034"
  "REZ-observability-platform:4025"
)

echo ""
echo "📦 Services to deploy: ${#SERVICES[@]}"
echo ""

# Check each service
for svc in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$svc"
  echo "----------------------------------------"
  echo "📦 $name (port $port)"
  echo "----------------------------------------"

  if [ -d "$name" ]; then
    if [ -f "$name/package.json" ]; then
      echo "   ✅ package.json found"
    else
      echo "   ❌ package.json missing"
    fi
    if [ -f "$name/src/index.ts" ]; then
      echo "   ✅ source found"
    else
      echo "   ❌ source missing"
    fi
    if [ -f "$name/render.yaml" ]; then
      echo "   ✅ render.yaml found"
    else
      echo "   ⚠️  render.yaml missing"
    fi
  else
    echo "   ❌ directory not found"
  fi
done

echo ""
echo "=========================================="
echo "To deploy via Render CLI:"
echo "=========================================="
echo ""
for svc in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$svc"
  if [ -d "$name" ]; then
    echo "cd $name && render deploy --service-type=web --name=rez-$name --port=$port"
  fi
done

echo ""
echo "Or deploy via dashboard.render.com"
echo "GitHub: github.com/imrejaul007/RABTUL-Technologies"
