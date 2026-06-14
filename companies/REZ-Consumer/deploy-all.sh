#!/bin/bash
# Deploy All REZ-Consumer Services
# Usage: ./deploy-all.sh

echo "=========================================="
echo "REZ-Consumer - Deploy All Services"
echo "=========================================="

# Services to deploy
SERVICES=(
  "creator-qr-service"
  "safe-qr-service"
  "rez-creator-qr"
  "do-app"
  "rez-now"
  "rez-app-consumer"
  "rez-driver"
)

echo "Services to deploy: ${#SERVICES[@]}"
echo ""

for svc in "${SERVICES[@]}"; do
  echo "----------------------------------------"
  echo "📦 $svc"
  echo "----------------------------------------"

  if [ -d "$svc" ]; then
    [ -f "$svc/package.json" ] && echo "  ✅ package.json"
    [ -f "$svc/src/index.ts" ] && echo "  ✅ source"
    [ -f "$svc/render.yaml" ] && echo "  ✅ render.yaml"
    [ -f "$svc/vercel.json" ] && echo "  ✅ vercel.json"
  else
    echo "  ⚠️  Directory not found"
  fi
done

echo ""
echo "=========================================="
echo "Deploy via:"
echo "  - Vercel (Next.js apps)"
echo "  - Render (Node services)"
echo "=========================================="
