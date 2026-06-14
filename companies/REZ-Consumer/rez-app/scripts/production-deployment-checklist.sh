#!/bin/bash
# =============================================================================
# REZ App - Production Deployment Checklist
# =============================================================================
# Usage: ./scripts/production-deployment-checklist.sh
#
# This script runs all pre-production checks before deploying to production.
# Exit code 0 = all checks passed, non-zero = failures found.
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_section() {
    echo ""
    echo "=============================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================="
}

# =============================================================================
# Environment Checks
# =============================================================================

check_environment() {
    log_section "Environment Configuration"

    # Check if production environment
    if [ "$EXPO_PUBLIC_ENVIRONMENT" = "production" ]; then
        log_success "Environment is set to production"
    else
        log_warn "Environment is NOT production: $EXPO_PUBLIC_ENVIRONMENT"
    fi

    # Check required environment variables
    local required_vars=(
        "EXPO_PUBLIC_API_BASE_URL"
        "EXPO_PUBLIC_RAZORPAY_KEY_ID"
        "EXPO_PUBLIC_SENTRY_DSN"
    )

    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            log_success "$var is set"
        else
            log_fail "$var is NOT set"
        fi
    done

    # Check for debug flags
    if [ "$EXPO_PUBLIC_DEBUG_MODE" = "true" ]; then
        log_fail "DEBUG MODE is ENABLED in production!"
    else
        log_success "Debug mode is disabled"
    fi
}

# =============================================================================
# Security Checks
# =============================================================================

check_security() {
    log_section "Security Checks"

    # Check for .env in git
    if git ls-files --error-unmatch .env 2>/dev/null; then
        log_fail ".env file is tracked in git!"
    else
        log_success ".env is not in git"
    fi

    # Check for exposed secrets in code
    local secrets=$(grep -r "password.*=.*['\"][^'\"]*['\"]" --include="*.ts" --include="*.tsx" src/ app/ 2>/dev/null || true)
    if [ -n "$secrets" ]; then
        log_warn "Potential hardcoded secrets found"
    else
        log_success "No hardcoded secrets found"
    fi

    # Check Sentry is configured
    if grep -q "SENTRY_DSN" .env.example 2>/dev/null; then
        log_success "Sentry DSN documented in .env.example"
    fi
}

# =============================================================================
# Dependency Checks
# =============================================================================

check_dependencies() {
    log_section "Dependency Checks"

    # Check for outdated packages
    log_info "Checking for outdated packages..."
    npm outdated 2>/dev/null | head -20 || true

    # Check for known vulnerabilities
    log_info "Checking for security vulnerabilities..."
    npm audit --audit-level=high 2>/dev/null || true

    # Check node_modules exists
    if [ -d "node_modules" ]; then
        log_success "node_modules installed"
    else
        log_fail "node_modules not found - run npm install"
    fi
}

# =============================================================================
# TypeScript Checks
# =============================================================================

check_typescript() {
    log_section "TypeScript Checks"

    log_info "Running TypeScript compiler..."

    if npx tsc --noEmit 2>&1 | tee /tmp/ts_output.txt; then
        log_success "TypeScript compilation passed"
    else
        log_fail "TypeScript compilation failed"
        log_info "See /tmp/ts_output.txt for details"
    fi
}

# =============================================================================
# Bundle Size Checks
# =============================================================================

check_bundle_size() {
    log_section "Bundle Size Analysis"

    log_info "Analyzing bundle size..."

    # Check if bundle-visualizer exists
    if command -v npx &> /dev/null; then
        log_info "Bundle analysis available via: npx expo-bundle-visualizer"
    fi

    # Check for large files
    log_info "Checking for large files..."
    find . -name "*.js" -size +5M 2>/dev/null | while read -r file; do
        log_warn "Large file: $file"
    done
}

# =============================================================================
# iOS Specific Checks
# =============================================================================

check_ios() {
    log_section "iOS Configuration"

    # Check for required iOS files
    if [ -f "GoogleService-Info.plist" ]; then
        log_success "GoogleService-Info.plist exists"
    else
        log_warn "GoogleService-Info.plist not found - FCM disabled"
    fi

    # Check Podfile
    if [ -f "ios/Podfile" ]; then
        log_success "Podfile exists"
    else
        log_fail "Podfile not found"
    fi
}

# =============================================================================
# Android Specific Checks
# =============================================================================

check_android() {
    log_section "Android Configuration"

    # Check for required Android files
    if [ -f "android/app/google-services.json" ]; then
        log_success "google-services.json exists"
    else
        log_warn "google-services.json not found - FCM disabled"
    fi

    # Check build.gradle
    if [ -f "android/app/build.gradle" ]; then
        log_success "build.gradle exists"
    else
        log_fail "build.gradle not found"
    fi
}

# =============================================================================
# EAS Build Checks
# =============================================================================

check_eas_build() {
    log_section "EAS Build Configuration"

    if [ -f "eas.json" ]; then
        log_success "eas.json exists"
    else
        log_fail "eas.json not found"
    fi

    # Check for EAS project ID
    if grep -q "EXPO_PUBLIC_EAS_PROJECT_ID" .env 2>/dev/null; then
        log_success "EAS Project ID configured"
    else
        log_fail "EAS Project ID not configured"
    fi
}

# =============================================================================
# Performance Checks
# =============================================================================

check_performance() {
    log_section "Performance Configuration"

    # Check Hermes enabled
    if grep -q "hermesEnabled.*true" app.config.js 2>/dev/null; then
        log_success "Hermes enabled"
    else
        log_warn "Hermes may not be enabled"
    fi

    # Check for performance monitoring
    if [ -f "src/utils/performanceMonitor.ts" ] || [ -f "hooks/usePerformanceMonitoring.ts" ]; then
        log_success "Performance monitoring available"
    else
        log_warn "Consider adding performance monitoring"
    fi
}

# =============================================================================
# Test Checks
# =============================================================================

check_tests() {
    log_section "Test Suite"

    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        log_info "Running tests..."
        npm test -- --passWithNoTests 2>&1 | head -50 || log_warn "Tests had failures"
    else
        log_warn "No test script configured"
    fi
}

# =============================================================================
# Lint Checks
# =============================================================================

check_lint() {
    log_section "Code Quality"

    if [ -f ".eslintrc.js" ]; then
        log_info "Running ESLint..."
        npm run lint 2>&1 | head -50 || log_warn "Lint errors found"
    else
        log_warn "No ESLint configuration"
    fi
}

# =============================================================================
# Deep Link Verification
# =============================================================================

check_deep_links() {
    log_section "Deep Link Configuration"

    # Check app.config.js for deep link schemes
    if grep -q "scheme.*rezapp" app.config.js 2>/dev/null; then
        log_success "Custom scheme (rezapp) configured"
    else
        log_warn "Custom scheme not configured"
    fi

    # Check intent filters
    if grep -q "intentFilters" app.config.js 2>/dev/null; then
        log_success "Intent filters configured"
    else
        log_warn "Intent filters not configured"
    fi
}

# =============================================================================
# Crash Reporting
# =============================================================================

check_crash_reporting() {
    log_section "Crash Reporting"

    if [ -f "config/sentry.ts" ]; then
        log_success "Sentry configured"
    else
        log_fail "Sentry not configured"
    fi
}

# =============================================================================
# OTA Update Configuration
# =============================================================================

check_ota() {
    log_section "OTA Update Configuration"

    if grep -q "expo-updates" app.config.js 2>/dev/null; then
        log_success "expo-updates configured"
    else
        log_fail "expo-updates not configured"
    fi

    if grep -q "runtimeVersion" app.config.js 2>/dev/null; then
        log_success "Runtime version set"
    else
        log_warn "Runtime version not set"
    fi
}

# =============================================================================
# Summary
# =============================================================================

print_summary() {
    log_section "Deployment Checklist Summary"

    echo ""
    echo "-----------------------------------------------"
    echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo "-----------------------------------------------"
    echo ""

    if [ $CHECKS_FAILED -gt 0 ]; then
        echo -e "${RED}DEPLOYMENT BLOCKED - Fix all failures before deploying${NC}"
        return 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Warnings found - Review before deploying${NC}"
        return 0
    else
        echo -e "${GREEN}All checks passed - Ready for deployment!${NC}"
        return 0
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo -e "${BLUE}REZ App - Production Deployment Checklist${NC}"
    echo "=============================================="
    echo ""

    # Run all checks
    check_environment
    check_security
    check_dependencies
    check_typescript
    check_bundle_size
    check_ios
    check_android
    check_eas_build
    check_performance
    check_tests
    check_lint
    check_deep_links
    check_crash_reporting
    check_ota

    # Print summary
    print_summary
}

main "$@"
