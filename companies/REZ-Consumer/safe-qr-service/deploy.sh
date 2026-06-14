#!/bin/bash
# Deploy Safe QR Service to Render

set -e

echo "=========================================="
echo "Safe QR Service - Render Deployment"
echo "=========================================="

# Check if logged in
echo ""
echo "1. Checking Render login..."
if ! render whoami &>/dev/null; then
    echo "❌ Not logged in to Render"
    echo ""
    echo "Please login first:"
    echo "  render login"
    exit 1
fi
echo "✅ Logged in to Render"

# Check for existing service
echo ""
echo "2. Checking for existing service..."
SERVICE_ID=$(render services list --name rez-safe-qr-service 2>/dev/null | grep -o 'srv-[a-zA-Z0-9]*' | head -1 || echo "")

if [ -n "$SERVICE_ID" ]; then
    echo "✅ Service exists: $SERVICE_ID"
    echo ""
    echo "3. Deploying updates..."
    render deploy --service=$SERVICE_ID
else
    echo "📦 Creating new service..."
    echo ""
    echo "Please create the service manually:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click 'New +' → 'Web Service'"
    echo "3. Connect GitHub: imrejaul007/REZ-Commerce"
    echo "4. Set Root Directory: REZ-Commerce/rez-safe-qr-service"
    echo "5. Name: rez-safe-qr-service"
    echo "6. Add environment variables (see DEPLOY.md)"
    echo "7. Click 'Create Web Service'"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Deployment complete!"
echo "=========================================="
echo ""
echo "Your service should be live at:"
echo "  https://rez-safe-qr-service.onrender.com"
echo ""
echo "Test with:"
echo "  curl https://rez-safe-qr-service.onrender.com/api/health"
