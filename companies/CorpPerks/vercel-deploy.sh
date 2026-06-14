#!/bin/bash

# =============================================================================
# CorpPerks Vercel Deployment Script
# Deploys Next.js apps to Vercel
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# =============================================================================
# Deploy Functions
# =============================================================================

deploy_app() {
    local app_name=$1
    local app_dir=$2
    local vercel_project=$3

    log_header "Deploying ${app_name}"

    if [ ! -d "${app_dir}" ]; then
        log_error "${app_dir} not found, skipping..."
        return 1
    fi

    cd "${app_dir}"

    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        log "Creating vercel.json for ${app_name}..."
        cat > vercel.json << 'EOF'
{
  "name": "APP_NAME",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
EOF
        # Replace APP_NAME with actual name
        sed -i.bak "s/APP_NAME/${vercel_project}/g" vercel.json
    fi

    # Deploy
    log "Running vercel --prod..."
    if command -v vercel &> /dev/null; then
        vercel --prod --yes
        log_success "${app_name} deployed!"
    else
        log_error "Vercel CLI not found. Install with: npm i -g vercel"
        return 1
    fi

    cd "${SCRIPT_DIR}"
}

# =============================================================================
# Main
# =============================================================================

main() {
    log_header "CorpPerks Vercel Deployment"

    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log "Installing Vercel CLI..."
        npm install -g vercel
    fi

    # Deploy apps
    deploy_app "PeopleOS" "peopleos" "peopleos"
    deploy_app "TalentAI" "talentai" "talentai"
    deploy_app "Insight Campus" "insight-campus" "insight-campus"
    deploy_app "CorpPerks Landing" "corpperks-landing" "corpperks"

    log_header "Deployment Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Add domains if needed"
    echo "3. Test all apps"
    echo ""
}

main "$@"
