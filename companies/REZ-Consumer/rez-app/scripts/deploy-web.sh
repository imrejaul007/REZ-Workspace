#!/bin/bash
# Deploy REZ App Web to production

set -e

echo "🚀 Deploying REZ App Web..."

# Build
echo "📦 Building web bundle..."
npx expo export --platform web

# Check dist exists
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist folder not found"
  exit 1
fi

echo "✅ Build complete (35MB)"

# Deploy options
echo ""
echo "Deploy to:"
echo "1. Render.com (recommended)"
echo "2. Vercel"
echo "3. Netlify"
echo "4. Local preview"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
  1)
    echo "📤 Deploying to Render..."
    # Install render CLI if needed
    npm install -g @render/deploy
    render deploy --service-id=$RENDER_SERVICE_ID --owner=$RENDER_OWNER_ID
    ;;
  2)
    echo "📤 Deploying to Vercel..."
    npx vercel --prod
    ;;
  3)
    echo "📤 Deploying to Netlify..."
    npx netlify deploy --prod --dir=dist
    ;;
  4)
    echo "🔍 Starting local preview..."
    npx serve dist -p 3000
    ;;
  *)
    echo "❌ Invalid option"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
