#!/bin/bash
# Deploy Restaurant AI to Render

cd "$(dirname "$0")"

echo "🍽️ Deploying Restaurant AI to Render..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "Installing Render CLI..."
    npm install -g render-cli
fi

# Build
echo "Building Restaurant AI..."
npm run build

# Create render.yaml if not exists
if [ ! -f "render.yaml" ]; then
    cat > render.yaml << 'EOF'
services:
  - type: worker
    name: restaurant-ai
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: INTENT_GRAPH_URL
        value: http://localhost:3007
      - key: INTELLIGENCE_URL
        value: http://localhost:4020
      - key: MONGODB_URI
        sync: false
EOF
fi

# Deploy
echo "Deploying to Render..."
render deploy --service=restaurant-ai --yes

echo ""
echo "✅ Restaurant AI deployed!"
echo "Check: https://dashboard.render.com"
