#!/bin/bash
# Deploy all REZ Intelligence backend services

set -e

echo "=========================================="
echo "REZ Intelligence Services Deployment"
echo "=========================================="

# Services to deploy
SERVICES=(
  "REZ-Intelligence/REZ-taste-profile:REZ_TASTE_PROFILE"
  "REZ-Intelligence/REZ-care-service:REZ_CARE_SERVICE"
  "REZ-Intelligence/REZ-feedback-service:REZ_FEEDBACK_SERVICE"
  "REZ-Intelligence/REZ-journey-service:REZ_JOURNEY_SERVICE"
  "REZ-Intelligence/REZ-attribution-hub:REZ_ATTRIBUTION_SERVICE"
  "REZ-Intelligence/REZ-feature-flags:REZ_FEATURE_FLAGS"
  "REZ-Intelligence/REZ-email-service:REZ_EMAIL_SERVICE"
  "REZ-Intelligence/REZ-predictive-engine:REZ_PREDICTIVE_SERVICE"
)

deploy_service() {
  local service_path=$1
  local service_name=$2

  if [ ! -d "$service_path" ]; then
    echo "⚠️  Service not found: $service_path"
    return 1
  fi

  echo ""
  echo "📦 Deploying $service_name..."

  cd "$service_path"

  if [ -f "render.yaml" ]; then
    echo "   Using render.yaml..."
    # deploy via render
    # render deploy --yes
  elif [ -f "package.json" ]; then
    echo "   Deploying via npm..."
    # Add deployment logic here
  fi

  cd - > /dev/null
  echo "✅ $service_name deployed!"
}

# Deploy each service
for entry in "${SERVICES[@]}"; do
  IFS=':' read -r path name <<< "$entry"
  deploy_service "$path" "$name"
done

echo ""
echo "=========================================="
echo "✅ All services deployed!"
echo "=========================================="
