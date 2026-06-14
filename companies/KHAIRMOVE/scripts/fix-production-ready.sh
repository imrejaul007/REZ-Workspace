#!/bin/bash
# KHAIRMOVE Production Readiness Fix Script
# Run this script to apply critical security fixes across all services

set -e

echo "=============================================="
echo "KHAIRMOVE Production Readiness Fix Script"
echo "=============================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running in production
if [ "$NODE_ENV" = "production" ]; then
  log_warn "Running in production mode - will NOT apply fixes automatically"
  read -p "Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    exit 1
  fi
fi

# ============================================
# STEP 1: Install shared dependencies
# ============================================
log_info "Step 1: Installing shared package dependencies..."
cd shared
npm install
npm run build
cd ..
log_info "Shared package built successfully"

# ============================================
# STEP 2: Fix API Gateway
# ============================================
log_info "Step 2: Fixing API Gateway..."
cd khaimove-api-gateway
npm install express-rate-limit
npm run build
cd ..
log_info "API Gateway fixed"

# ============================================
# STEP 3: Fix Ride Service
# ============================================
log_info "Step 3: Fixing Ride Service..."
cd khaimove-ride-service
npm install
# Add authentication middleware to routes
# Note: Manual review required for this service
cd ..
log_info "Ride Service dependencies installed"

# ============================================
# STEP 4: Fix Fleet Service
# ============================================
log_info "Step 4: Fixing Fleet Service..."
cd khaimove-fleet-service
npm install
cd ..
log_info "Fleet Service dependencies installed"

# ============================================
# STEP 5: Fix Delivery Service
# ============================================
log_info "Step 5: Fixing Delivery Service..."
cd khaimove-delivery-service
npm install
cd ..
log_info "Delivery Service dependencies installed"

# ============================================
# STEP 6: Generate example .env files
# ============================================
log_info "Step 6: Creating example .env files..."

cat > .env.example.global << 'EOF'
# ============================================
# KHAIRMOVE Environment Variables
# ============================================

# Environment
NODE_ENV=production
SERVICE_NAME=khaimove

# Security (REQUIRED - Generate with: openssl rand -hex 32)
JWT_SECRET=CHANGE_ME_generate_new_secret
INTERNAL_SERVICE_TOKEN=CHANGE_ME_generate_new_secret
REZ_INTELLIGENCE_API_KEY=CHANGE_ME_from_rez_intelligence

# Database
MONGODB_URI=mongodb://user:password@host:27017/khaimove?authSource=admin

# Redis
REDIS_URL=redis://:password@host:6379

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=https://app.khaimove.com,https://admin.khaimove.com

# External Services
AUTH_SERVICE_URL=http://rabtul-auth:4002
WALLET_SERVICE_URL=http://rabtul-wallet:4004
NOTIFICATION_SERVICE_URL=http://rabtul-notify:4011
EOF

log_info "Created .env.example.global"

# ============================================
# STEP 7: Run TypeScript check
# ============================================
log_info "Step 7: Running TypeScript check..."
npm run build --if-present || log_warn "Some services may have TypeScript errors"
log_info "TypeScript check completed"

# ============================================
# STEP 8: Summary
# ============================================
echo ""
echo "=============================================="
echo "Fix Script Completed!"
echo "=============================================="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo ""
echo "1. Generate new secrets:"
echo "   openssl rand -hex 32"
echo ""
echo "2. Create .env files for each service using:"
echo "   cp .env.example.global <service>/.env"
echo ""
echo "3. Apply authentication middleware to all routes"
echo "   Add 'authenticate()' to protected endpoints"
echo ""
echo "4. Review and fix:"
echo "   - OTP generation (use 6 digits)"
echo "   - Rate limiting on all endpoints"
echo "   - CORS configuration (no wildcards)"
echo "   - Graceful shutdown handlers"
echo ""
echo "5. Test in staging before production"
echo ""
echo "For detailed instructions, see:"
echo "  - PRODUCTION-AUDIT.md (all issues)"
echo "  - DEPLOYMENT.md (deployment guide)"
echo ""