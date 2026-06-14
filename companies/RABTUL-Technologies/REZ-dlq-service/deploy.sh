#!/bin/bash
# Deploy REZ-dlq-service to Render
# Usage: RENDER_API_KEY=xxx RENDER_SERVICE_ID=xxx ./deploy.sh

set -e

REPO="imrejaul007/REZ-dlq-service"
BRANCH="main"

if [ -z "$RENDER_API_KEY" ]; then
  echo "Error: RENDER_API_KEY environment variable not set"
  echo "Get your API key from: https://dashboard.render.com/api-keys"
  exit 1
fi

if [ -z "$RENDER_SERVICE_ID" ]; then
  echo "Error: RENDER_SERVICE_ID environment variable not set"
  echo "Get your service ID from: https://dashboard.render.com/"
  exit 1
fi

# Trigger workflow dispatch via GitHub API
echo "Triggering GitHub Actions workflow..."
curl -s -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/$REPO/actions/workflows/deploy.yml/dispatches \
  -d '{"ref":"'$BRANCH'","inputs":{"environment":"production"}}'

echo ""
echo "Workflow triggered! Check status at: https://github.com/$REPO/actions"
