#!/bin/bash
# ============================================
# REZ QR Cloud - One-Click Deploy
# ============================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   REZ QR Cloud - Deployment Script                       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo "ℹ️ $1"; }

# Check prerequisites
check_prerequisites() {
    echo ""
    info "Checking prerequisites..."
    echo ""

    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js $(node --version)"

    if ! command -v git &> /dev/null; then
        error "git is not installed"
        exit 1
    fi
    success "git $(git --version | cut -d' ' -f3)"

    echo ""
}

# Deploy service
deploy_service() {
    echo ""
    info "Deploying QR Cloud Service..."
    echo ""

    cd rez-qr-cloud-service

    info "Installing dependencies..."
    npm install
    success "Dependencies installed"

    info "Building..."
    npm run build
    success "Build complete"

    echo ""
    warn "Next steps:"
    echo "  1. Go to https://dashboard.render.com"
    echo "  2. Create new Web Service"
    echo "  3. Connect GitHub repository"
    echo "  4. Set Root Directory: rez-qr-cloud-service"
    echo "  5. Add environment variables"
    echo "  6. Deploy!"

    cd ..
}

# Deploy app
deploy_app() {
    echo ""
    info "Deploying Customer App..."
    echo ""
    warn "Steps:"
    echo "  1. Go to https://vercel.com"
    echo "  2. Import project"
    echo "  3. Select rez-qr-cloud-app folder"
    echo "  4. Deploy!"
}

# Main
main() {
    check_prerequisites

    echo ""
    echo "=========================================="
    echo "  Select deployment option:"
    echo "=========================================="
    echo ""
    echo "  [1] Deploy Service only"
    echo "  [2] Deploy App only"
    echo "  [3] Deploy both"
    echo "  [4] Full setup (Git + Service + App)"
    echo ""
    read -p "  Enter choice [1-4]: " choice

    case $choice in
        1) deploy_service ;;
        2) deploy_app ;;
        3) deploy_service && deploy_app ;;
        4)
            info "Setting up Git..."
            git add rez-qr-cloud-service/ rez-qr-cloud-app/
            success "Git staged"
            deploy_service && deploy_app
            ;;
        *) error "Invalid option" ;;
    esac

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║   Deployment preparation complete!                       ║"
    echo "║                                                            ║"
    echo "║   Follow the steps above to complete deployment.          ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
}

main "$@"
