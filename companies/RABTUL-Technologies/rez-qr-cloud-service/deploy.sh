#!/bin/bash
# QR Cloud Service - Deploy Script
# Usage: ./deploy.sh

set -e

echo "=========================================="
echo "QR Cloud Service - Deploy"
echo "=========================================="
echo ""

SERVICE_NAME="rez-qr-cloud"
PORT=4300
REGION="singapore"

echo "Service: $SERVICE_NAME"
echo "Port: $PORT"
echo ""

# Check if logged in
if ! render whoami &> /dev/null; then
  echo "Not logged in to Render"
  echo "Run: render login"
  exit 1
fi

echo "Logged in to Render"
echo ""

# Deploy to Render
echo "Deploying to Render..."
render deploy \
  --name="$SERVICE_NAME" \
  --port="$PORT" \
  --region="$REGION" \
  --env=node

echo ""
echo "=========================================="
echo "Deployment initiated!"
echo "=========================================="
echo ""
echo "Check status: https://dashboard.render.com"
echo ""

cat << 'MANUAL'
MANUAL DEPLOYMENT STEPS:
======================

1. Go to https://dashboard.render.com

2. Click "New +" → "Web Service"

3. Connect your GitHub repo:
   https://github.com/imrejaul007/RABTUL-Technologies

4. Settings:
   - Name: rez-qr-cloud
   - Region: Singapore
   - Branch: main
   - Root Directory: rez-qr-cloud-service
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start

5. Environment Variables:
   - NODE_ENV=production
   - PORT=4300
   - MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
   - QR_CLOUD_URL=https://qr.rez.money
   - INTERNAL_SERVICE_TOKEN=YOUR_GENERATED_TOKEN
   - LOG_LEVEL=info

6. Click "Create Web Service"

MANUAL

echo "=========================================="
